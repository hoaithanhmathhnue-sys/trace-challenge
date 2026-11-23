import {
  Challenge,
  LIMITS,
  SessionPhase,
  Workspace,
  countCorrectSteps,
  detectActualFirstWrongStepId,
  isOutputCorrect,
  sanChallenge,
  sanWorkspace,
} from './model';
import { sumScores } from './rubric';
import { slug, uid } from './text';

const P = 'tc.v1.';
export const K = {
  index: P + 'index',
  challenges: P + 'challenges',
  prefs: P + 'prefs',
  ws: (id: string) => P + 'ws.' + id,
};

export interface KV {
  getItem(k: string): string | null;
  setItem(k: string, v: string): void;
  removeItem(k: string): void;
  key(i: number): string | null;
  readonly length: number;
}

export interface IndexItem {
  id: string;
  studentCode: string;
  classLabel: string;
  phase: SessionPhase;
  challengeId: string;
  challengeTitle: string;
  updatedAt: number;
  predictionLocked: boolean;
  revealedCount: number;
  totalSteps: number;
  correctSteps: number;
  outputCorrect: boolean;
  firstWrongMatched: boolean;
  totalScore: number | null;
}

export interface Prefs {
  teacher: boolean;
  projector: boolean;
  scaffolding: boolean; // Chế độ hỗ trợ nhóm học sinh cần gợi ý khung cột biến
}

export const defaultPrefs: Prefs = {
  teacher: false,
  projector: false,
  scaffolding: true,
};

export type SaveResult =
  | { ok: true; ws: Workspace }
  | { ok: false; reason: 'conflict'; current: Workspace | null }
  | { ok: false; reason: 'quota' | 'error' };

export class MemoryKV implements KV {
  private m = new Map<string, string>();
  get length() {
    return this.m.size;
  }
  getItem(k: string) {
    return this.m.has(k) ? (this.m.get(k) as string) : null;
  }
  setItem(k: string, v: string) {
    this.m.set(k, v);
  }
  removeItem(k: string) {
    this.m.delete(k);
  }
  key(i: number) {
    return Array.from(this.m.keys())[i] ?? null;
  }
}

function probe(): KV | null {
  try {
    const ls = window.localStorage;
    const t = P + 'probe';
    ls.setItem(t, '1');
    ls.removeItem(t);
    return ls;
  } catch {
    return null;
  }
}

function isQuota(e: unknown): boolean {
  const x = e as { name?: string; code?: number };
  return (
    x?.name === 'QuotaExceededError' ||
    x?.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
    x?.code === 22 ||
    x?.code === 1014
  );
}

function readJson(kv: KV, key: string): unknown {
  try {
    const raw = kv.getItem(key);
    return raw === null ? null : JSON.parse(raw);
  } catch {
    return null;
  }
}

export function summarize(ws: Workspace): IndexItem {
  const actualFirstWrong = detectActualFirstWrongStepId(ws);
  const firstWrongMatched = ws.firstWrongStepId !== '' && ws.firstWrongStepId === actualFirstWrong;
  const hasAnyGrade = ws.grading.scores.some((x) => x !== null);
  return {
    id: ws.id,
    studentCode: ws.studentCode,
    classLabel: ws.classLabel,
    phase: ws.phase,
    challengeId: ws.challenge.id,
    challengeTitle: ws.challenge.title,
    updatedAt: ws.updatedAt,
    predictionLocked: ws.predictionLocked,
    revealedCount: ws.revealedCount,
    totalSteps: ws.challenge.steps.length,
    correctSteps: countCorrectSteps(ws),
    outputCorrect: isOutputCorrect(ws),
    firstWrongMatched,
    totalScore: hasAnyGrade ? sumScores(ws.grading.scores) : null,
  };
}

export interface Store {
  persistent: boolean;
  kv: KV;
  loadIndex(): IndexItem[];
  reconcile(): IndexItem[];
  loadWorkspace(id: string): Workspace | null;
  loadAllWorkspaces(): Workspace[];
  saveWorkspace(ws: Workspace, baseRev: number, force?: boolean): SaveResult;
  deleteWorkspace(id: string): void;
  clearAllWorkspaces(): number;
  importWorkspace(ws: Workspace): SaveResult;
  loadChallenges(): Challenge[];
  saveChallenges(list: Challenge[]): boolean;
  loadPrefs(): Prefs;
  savePrefs(p: Prefs): void;
}

export function createStore(kvIn?: KV | null): Store {
  const real = kvIn === undefined ? probe() : kvIn;
  const persistent = real !== null;
  const kv: KV = real ?? new MemoryKV();

  const readIndex = (): IndexItem[] | null => {
    const j = readJson(kv, K.index);
    if (!j || typeof j !== 'object' || !Array.isArray((j as { items?: unknown }).items)) return null;
    const out: IndexItem[] = [];
    for (const it of (j as { items: unknown[] }).items) {
      const o = it as Partial<IndexItem>;
      if (o && typeof o.id === 'string') {
        out.push({
          id: o.id,
          studentCode: String(o.studentCode ?? ''),
          classLabel: String(o.classLabel ?? ''),
          phase: (o.phase === 'pre' || o.phase === 'post' ? o.phase : 'practice') as SessionPhase,
          challengeId: String(o.challengeId ?? ''),
          challengeTitle: String(o.challengeTitle ?? ''),
          updatedAt: Number(o.updatedAt) || 0,
          predictionLocked: o.predictionLocked === true,
          revealedCount: Number(o.revealedCount) || 0,
          totalSteps: Number(o.totalSteps) || 1,
          correctSteps: Number(o.correctSteps) || 0,
          outputCorrect: o.outputCorrect === true,
          firstWrongMatched: o.firstWrongMatched === true,
          totalScore: typeof o.totalScore === 'number' ? o.totalScore : null,
        });
      }
    }
    return out;
  };

  const writeIndex = (items: IndexItem[]): boolean => {
    try {
      kv.setItem(K.index, JSON.stringify({ v: 1, items }));
      return true;
    } catch {
      return false;
    }
  };

  const wsIdsOnDisk = (): string[] => {
    const prefix = K.ws('');
    const ids: string[] = [];
    for (let i = 0; i < kv.length; i++) {
      const k = kv.key(i);
      if (k && k.startsWith(prefix)) ids.push(k.slice(prefix.length));
    }
    return ids;
  };

  const store: Store = {
    persistent,
    kv,

    loadIndex() {
      const idx = readIndex();
      return (idx ?? []).slice().sort((a, b) => b.updatedAt - a.updatedAt);
    },

    reconcile() {
      const idx = readIndex();
      const disk = wsIdsOnDisk();
      const diskSet = new Set(disk);
      const have = new Map((idx ?? []).map((i) => [i.id, i]));
      let changed = idx === null;
      const items: IndexItem[] = [];
      for (const id of disk) {
        const known = have.get(id);
        if (known) {
          items.push(known);
        } else {
          const ws = store.loadWorkspace(id);
          if (ws) {
            items.push(summarize(ws));
            changed = true;
          }
        }
      }
      if (idx && idx.some((i) => !diskSet.has(i.id))) changed = true;
      if (changed) writeIndex(items);
      return items.sort((a, b) => b.updatedAt - a.updatedAt);
    },

    loadWorkspace(id) {
      return sanWorkspace(readJson(kv, K.ws(id)));
    },

    loadAllWorkspaces() {
      const ids = wsIdsOnDisk();
      const res: Workspace[] = [];
      for (const id of ids) {
        const ws = store.loadWorkspace(id);
        if (ws) res.push(ws);
      }
      return res.sort((a, b) => b.updatedAt - a.updatedAt);
    },

    saveWorkspace(ws, baseRev, force = false) {
      const stored = store.loadWorkspace(ws.id);
      if (!force && stored && stored.rev !== baseRev) {
        return { ok: false, reason: 'conflict', current: stored };
      }
      const rev = Math.max(baseRev, stored?.rev ?? 0) + 1;
      const next: Workspace = { ...ws, rev, updatedAt: Date.now() };
      try {
        kv.setItem(K.ws(ws.id), JSON.stringify(next));
      } catch (e) {
        return { ok: false, reason: isQuota(e) ? 'quota' : 'error' };
      }
      const idx = readIndex() ?? [];
      const rest = idx.filter((i) => i.id !== ws.id);
      rest.push(summarize(next));
      writeIndex(rest);
      return { ok: true, ws: next };
    },

    deleteWorkspace(id) {
      try {
        kv.removeItem(K.ws(id));
      } catch {
        /* ignore */
      }
      const idx = readIndex();
      if (idx) writeIndex(idx.filter((i) => i.id !== id));
    },

    clearAllWorkspaces() {
      const ids = wsIdsOnDisk();
      for (const id of ids) {
        try {
          kv.removeItem(K.ws(id));
        } catch {
          /* ignore */
        }
      }
      writeIndex([]);
      return ids.length;
    },

    importWorkspace(ws) {
      const fresh: Workspace = { ...ws, id: uid(), rev: 0, createdAt: Date.now() };
      return store.saveWorkspace(fresh, 0, true);
    },

    loadChallenges() {
      const j = readJson(kv, K.challenges);
      if (!Array.isArray(j)) return [];
      const out: Challenge[] = [];
      for (const c of j.slice(0, LIMITS.challenges)) {
        const s = sanChallenge(c);
        if (s) out.push(s);
      }
      return out;
    },

    saveChallenges(list) {
      try {
        kv.setItem(K.challenges, JSON.stringify(list.slice(0, LIMITS.challenges)));
        return true;
      } catch {
        return false;
      }
    },

    loadPrefs() {
      const j = readJson(kv, K.prefs) as Partial<Prefs> | null;
      if (!j || typeof j !== 'object') return { ...defaultPrefs };
      return {
        teacher: j.teacher === true,
        projector: j.projector === true,
        scaffolding: j.scaffolding !== false,
      };
    },

    savePrefs(p) {
      try {
        kv.setItem(K.prefs, JSON.stringify(p));
      } catch {
        /* ignore */
      }
    },
  };

  return store;
}

// ---------- File sao lưu (.json) ----------

export const APP_TAG = 'trace-challenge';

export function exportJson(ws: Workspace): string {
  return JSON.stringify(
    {
      app: APP_TAG,
      schema: 1,
      exportedAt: new Date().toISOString(),
      workspace: ws,
    },
    null,
    2,
  );
}

export function backupFileName(ws: Workspace): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  const tag = ws.phase === 'pre' ? 'Truoc_' : ws.phase === 'post' ? 'Sau_' : '';
  return `TraceChallenge_${tag}${slug(ws.studentCode || ws.challenge.title)}_${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}.json`;
}

export type ParseResult = { ok: true; workspace: Workspace } | { ok: false; error: string };

export function parseImport(text: string, byteLength = text.length): ParseResult {
  if (byteLength > LIMITS.importBytes) {
    return { ok: false, error: 'File quá lớn (hơn 1 MB). Đây có thể không phải file sao lưu của Trace Challenge.' };
  }
  let j: unknown;
  try {
    j = JSON.parse(text);
  } catch {
    return { ok: false, error: 'Không đọc được file: không phải JSON hợp lệ.' };
  }
  const o = j as { app?: unknown; workspace?: unknown };
  if (!o || typeof o !== 'object' || o.app !== APP_TAG) {
    return { ok: false, error: 'File này không phải file sao lưu của Trace Challenge.' };
  }
  const ws = sanWorkspace(o.workspace);
  if (!ws) {
    return { ok: false, error: 'File sao lưu bị thiếu hoặc hỏng dữ liệu phiếu dự đoán.' };
  }
  return { ok: true, workspace: ws };
}
