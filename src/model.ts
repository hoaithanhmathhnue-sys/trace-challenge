import { clampStr, isValueMatch, uid } from './text';

export type TopicCategory = 'tin10_loop' | 'tin10_branch' | 'tin11_search' | 'tin11_sort';

export const TOPIC_CATEGORIES: Record<TopicCategory, string> = {
  tin10_loop: 'Tin 10 · Vòng lặp (Bài 20–21)',
  tin10_branch: 'Tin 10 · Rẽ nhánh (Bài 19)',
  tin11_search: 'Tin 11 CS · Thuật toán tìm kiếm',
  tin11_sort: 'Tin 11 CS · Thuật toán sắp xếp',
};

export type SessionPhase = 'practice' | 'pre' | 'post';

export const SESSION_PHASES: Record<SessionPhase, string> = {
  practice: 'Luyện tập trên lớp (45 phút)',
  pre: 'Đánh giá Trước tác động (Đề trước)',
  post: 'Đánh giá Sau tác động (Đề sau)',
};

export interface VarColumnSpec {
  key: string;
  label: string;
  hint: string;
}

export interface TraceStepSpec {
  id: string;
  label: string;
  lineNo: number;
  expected: Record<string, string>;
  guidingQuestion: string;
  explanation: string;
}

export interface Challenge {
  id: string;
  builtIn: boolean;
  title: string;
  category: TopicCategory;
  lessonRef: string;
  purpose: string;
  measureRule: string;
  code: string;
  columns: VarColumnSpec[];
  steps: TraceStepSpec[];
  expectedOutput: string;
  outputGuidingQuestion: string;
  outputExplanation: string;
  variantPrompt: string;
  variantCode: string;
  variantExpectedTrace: string;
  variantExpectedOutput: string;
  variantExplanation: string;
  teacherNotes: string;
}

export interface StudentStepPrediction {
  stepId: string;
  values: Record<string, string>;
  reason: string;
  pairDiff: boolean;
  pairNote: string;
  correctedValues: Record<string, string>;
}

export interface Grading {
  scores: (number | null)[]; // 4 tiêu chí của Rubric 10 điểm
  note: string;
}

export interface Workspace {
  v: 1;
  id: string;
  rev: number;
  createdAt: number;
  updatedAt: number;
  studentCode: string;
  partnerCode: string;
  classLabel: string;
  phase: SessionPhase;
  challenge: Challenge;
  predictions: StudentStepPrediction[];
  predictedOutput: string;
  trickyStepId: string;
  orderExplanation: string;
  predictionLocked: boolean;
  lockedAt: number;
  revealedCount: number;
  outputRevealed: boolean;
  firstWrongStepId: string; // stepId hoặc 'none' (nếu dự đoán đúng toàn bộ) hoặc '' (chưa chọn)
  wrongCauseExplanation: string;
  variantPredictedTrace: string;
  variantPredictedOutput: string;
  variantExplanation: string;
  variantRevealed: boolean;
  grading: Grading;
}

export const LIMITS = {
  workspaces: 250,
  challenges: 60,
  columns: 6,
  steps: 10,
  short: 120,
  mid: 400,
  long: 3000,
  code: 2500,
  importBytes: 1_048_576, // 1 MB
};

export function emptyPredictionForStep(step: TraceStepSpec, cols: VarColumnSpec[]): StudentStepPrediction {
  const values: Record<string, string> = {};
  const correctedValues: Record<string, string> = {};
  for (const col of cols) {
    values[col.key] = '';
    correctedValues[col.key] = '';
  }
  return {
    stepId: step.id,
    values,
    reason: '',
    pairDiff: false,
    pairNote: '',
    correctedValues,
  };
}

export function newWorkspace(challenge: Challenge, phase: SessionPhase = 'practice'): Workspace {
  const now = Date.now();
  const snap = sanChallenge(challenge) ?? challenge;
  return {
    v: 1,
    id: uid(),
    rev: 0,
    createdAt: now,
    updatedAt: now,
    studentCode: '',
    partnerCode: '',
    classLabel: '',
    phase,
    challenge: snap,
    predictions: snap.steps.map((st) => emptyPredictionForStep(st, snap.columns)),
    predictedOutput: '',
    trickyStepId: '',
    orderExplanation: '',
    predictionLocked: false,
    lockedAt: 0,
    revealedCount: 0,
    outputRevealed: false,
    firstWrongStepId: '',
    wrongCauseExplanation: '',
    variantPredictedTrace: '',
    variantPredictedOutput: '',
    variantExplanation: '',
    variantRevealed: false,
    grading: {
      scores: [null, null, null, null],
      note: '',
    },
  };
}

// ---------- Các hàm đối chiếu bảng vết ----------

/** Kiểm tra một mốc trạng thái xem tất cả các cột biến học sinh dự đoán có khớp với bảng vết chuẩn không. */
export function isStepCorrect(step: TraceStepSpec, pred: StudentStepPrediction | undefined, cols: VarColumnSpec[]): boolean {
  if (!pred) return false;
  return cols.every((c) => isValueMatch(pred.values[c.key] ?? '', step.expected[c.key] ?? ''));
}

/** Kiểm tra một mốc đã được điền đủ tất cả các cột biến chưa. */
export function isStepFilled(pred: StudentStepPrediction | undefined, cols: VarColumnSpec[]): boolean {
  if (!pred) return false;
  return cols.every((c) => (pred.values[c.key] ?? '').trim().length > 0);
}

/**
 * Tìm mốc đầu tiên có sai lệch giữa dự đoán ban đầu của học sinh và bảng vết chuẩn.
 * Trả về `step.id` của bước sai đầu tiên, hoặc `'none'` nếu mọi bước đều khớp.
 */
export function detectActualFirstWrongStepId(ws: Workspace): string {
  for (let i = 0; i < ws.challenge.steps.length; i++) {
    const step = ws.challenge.steps[i];
    const pred = ws.predictions[i];
    if (!isStepCorrect(step, pred, ws.challenge.columns)) {
      return step.id;
    }
  }
  return 'none';
}

/** Đếm số mốc trạng thái mà học sinh dự đoán đúng toàn bộ các cột biến. */
export function countCorrectSteps(ws: Workspace): number {
  let count = 0;
  for (let i = 0; i < ws.challenge.steps.length; i++) {
    if (isStepCorrect(ws.challenge.steps[i], ws.predictions[i], ws.challenge.columns)) {
      count++;
    }
  }
  return count;
}

/** Kiểm tra dự đoán đầu ra ban đầu có khớp với đầu ra chuẩn không. */
export function isOutputCorrect(ws: Workspace): boolean {
  return isValueMatch(ws.predictedOutput, ws.challenge.expectedOutput);
}

/** Kiểm tra dự đoán đầu ra ở phần Vận dụng có khớp không. */
export function isVariantOutputCorrect(ws: Workspace): boolean {
  return isValueMatch(ws.variantPredictedOutput, ws.challenge.variantExpectedOutput);
}

// ---------- Làm sạch & Chuẩn hóa khi đọc từ localStorage hoặc nhập file JSON ----------

export function sanColumn(raw: unknown, idx: number): VarColumnSpec | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Partial<VarColumnSpec>;
  const label = clampStr(o.label, 60).trim() || `Biến ${idx + 1}`;
  const rawKey = clampStr(o.key, 40).trim().replace(/[^a-zA-Z0-9_]/g, '_');
  const key = rawKey || `col_${idx + 1}`;
  return {
    key,
    label,
    hint: clampStr(o.hint, LIMITS.short),
  };
}

export function sanStep(raw: unknown, idx: number, cols: VarColumnSpec[]): TraceStepSpec | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Partial<TraceStepSpec>;
  const expected: Record<string, string> = {};
  const srcExp = o.expected && typeof o.expected === 'object' ? (o.expected as Record<string, unknown>) : {};
  for (const col of cols) {
    expected[col.key] = clampStr(srcExp[col.key], LIMITS.short);
  }
  return {
    id: clampStr(o.id, 60).trim() || `step-${idx}`,
    label: clampStr(o.label, LIMITS.short).trim() || `Mốc ${idx}`,
    lineNo: Math.max(1, Math.min(50, Number(o.lineNo) || 1)),
    expected,
    guidingQuestion: clampStr(o.guidingQuestion, LIMITS.mid),
    explanation: clampStr(o.explanation, LIMITS.mid),
  };
}

export function sanChallenge(raw: unknown): Challenge | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Partial<Challenge>;
  const rawCols = Array.isArray(o.columns) ? o.columns.slice(0, LIMITS.columns) : [];
  const columns: VarColumnSpec[] = [];
  rawCols.forEach((c, i) => {
    const sc = sanColumn(c, i);
    if (sc) columns.push(sc);
  });
  if (columns.length === 0) {
    columns.push({ key: 'i', label: 'i', hint: 'Biến lặp' }, { key: 'val', label: 'Giá trị biến', hint: 'Giá trị sau lệnh' });
  }
  const rawSteps = Array.isArray(o.steps) ? o.steps.slice(0, LIMITS.steps) : [];
  const steps: TraceStepSpec[] = [];
  rawSteps.forEach((s, i) => {
    const ss = sanStep(s, i, columns);
    if (ss) steps.push(ss);
  });
  if (steps.length === 0) return null;

  const cat = (o.category && o.category in TOPIC_CATEGORIES ? o.category : 'tin10_loop') as TopicCategory;
  return {
    id: clampStr(o.id, 80).trim() || uid(),
    builtIn: o.builtIn === true,
    title: clampStr(o.title, LIMITS.short).trim() || 'Bài tập dự đoán vết',
    category: cat,
    lessonRef: clampStr(o.lessonRef, LIMITS.short).trim() || 'Tin học THPT',
    purpose: clampStr(o.purpose, LIMITS.mid),
    measureRule: clampStr(o.measureRule, LIMITS.mid),
    code: clampStr(o.code, LIMITS.code),
    columns,
    steps,
    expectedOutput: clampStr(o.expectedOutput, LIMITS.short),
    outputGuidingQuestion: clampStr(o.outputGuidingQuestion, LIMITS.mid),
    outputExplanation: clampStr(o.outputExplanation, LIMITS.mid),
    variantPrompt: clampStr(o.variantPrompt, LIMITS.mid),
    variantCode: clampStr(o.variantCode, LIMITS.code),
    variantExpectedTrace: clampStr(o.variantExpectedTrace, LIMITS.short),
    variantExpectedOutput: clampStr(o.variantExpectedOutput, LIMITS.short),
    variantExplanation: clampStr(o.variantExplanation, LIMITS.mid),
    teacherNotes: clampStr(o.teacherNotes, LIMITS.long),
  };
}

export function sanWorkspace(raw: unknown): Workspace | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Partial<Workspace>;
  const challenge = sanChallenge(o.challenge);
  if (!challenge) return null;

  const rawPreds = Array.isArray(o.predictions) ? o.predictions : [];
  const predictions: StudentStepPrediction[] = challenge.steps.map((st, idx) => {
    const found =
      rawPreds.find((p) => p && typeof p === 'object' && (p as StudentStepPrediction).stepId === st.id) ??
      rawPreds[idx];
    const base = emptyPredictionForStep(st, challenge.columns);
    if (!found || typeof found !== 'object') return base;
    const f = found as Partial<StudentStepPrediction>;
    const srcVals = f.values && typeof f.values === 'object' ? (f.values as Record<string, unknown>) : {};
    const srcCorr = f.correctedValues && typeof f.correctedValues === 'object' ? (f.correctedValues as Record<string, unknown>) : {};
    for (const col of challenge.columns) {
      base.values[col.key] = clampStr(srcVals[col.key], LIMITS.short);
      base.correctedValues[col.key] = clampStr(srcCorr[col.key], LIMITS.short);
    }
    base.reason = clampStr(f.reason, LIMITS.mid);
    base.pairDiff = f.pairDiff === true;
    base.pairNote = clampStr(f.pairNote, LIMITS.mid);
    return base;
  });

  const phase: SessionPhase = o.phase && o.phase in SESSION_PHASES ? o.phase : 'practice';
  const predictionLocked = o.predictionLocked === true;
  const maxReveal = predictionLocked ? challenge.steps.length : 0;
  const revealedCount = Math.max(0, Math.min(maxReveal, Number(o.revealedCount) || 0));
  const outputRevealed = predictionLocked && revealedCount >= challenge.steps.length && o.outputRevealed === true;

  const maxRubric = [4, 2, 2, 2];
  const rawScores = o.grading && Array.isArray(o.grading.scores) ? o.grading.scores : [];
  const scores = maxRubric.map((m, i) => {
    const v = rawScores[i];
    if (v === null || v === undefined || typeof v !== 'number' || Number.isNaN(v)) return null;
    return Math.max(0, Math.min(m, Math.round(v * 2) / 2)); // Cho phép chấm điểm lẻ 0.5
  });

  return {
    v: 1,
    id: clampStr(o.id, 80).trim() || uid(),
    rev: Math.max(0, Number(o.rev) || 0),
    createdAt: Number(o.createdAt) || Date.now(),
    updatedAt: Number(o.updatedAt) || Date.now(),
    studentCode: clampStr(o.studentCode, 80),
    partnerCode: clampStr(o.partnerCode, 80),
    classLabel: clampStr(o.classLabel, 40),
    phase,
    challenge,
    predictions,
    predictedOutput: clampStr(o.predictedOutput, LIMITS.short),
    trickyStepId: clampStr(o.trickyStepId, 80),
    orderExplanation: clampStr(o.orderExplanation, LIMITS.long),
    predictionLocked,
    lockedAt: Number(o.lockedAt) || 0,
    revealedCount,
    outputRevealed,
    firstWrongStepId: clampStr(o.firstWrongStepId, 80),
    wrongCauseExplanation: clampStr(o.wrongCauseExplanation, LIMITS.long),
    variantPredictedTrace: clampStr(o.variantPredictedTrace, LIMITS.short),
    variantPredictedOutput: clampStr(o.variantPredictedOutput, LIMITS.short),
    variantExplanation: clampStr(o.variantExplanation, LIMITS.long),
    variantRevealed: o.variantRevealed === true,
    grading: {
      scores,
      note: clampStr(o.grading?.note, LIMITS.long),
    },
  };
}
