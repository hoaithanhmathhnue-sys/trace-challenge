import { useCallback, useEffect, useRef, useState } from 'react';
import { Workspace, sanWorkspace } from './model';
import { store } from './ctx';
import { K } from './storage';

export type SaveState = 'saved' | 'dirty' | 'conflict' | 'quota' | 'error';

const DEBOUNCE_MS = 450;

export function useWorkspace(id: string) {
  const [ws, setWs] = useState<Workspace | null>(() => store.loadWorkspace(id));
  const wsRef = useRef<Workspace | null>(ws);
  const baseRev = useRef<number>(ws?.rev ?? 0);
  const dirty = useRef(false);
  const timer = useRef<number | undefined>(undefined);
  const statusRef = useRef<SaveState>('saved');
  const [status, setStatusState] = useState<SaveState>('saved');
  const [other, setOther] = useState<Workspace | null>(null);
  const [savedAt, setSavedAt] = useState<number>(ws?.updatedAt ?? 0);

  const setStatus = useCallback((s: SaveState) => {
    statusRef.current = s;
    setStatusState(s);
  }, []);

  const flush = useCallback(() => {
    window.clearTimeout(timer.current);
    const cur = wsRef.current;
    if (!dirty.current || !cur || statusRef.current === 'conflict') return;
    const res = store.saveWorkspace(cur, baseRev.current);
    if (res.ok) {
      baseRev.current = res.ws.rev;
      wsRef.current = { ...cur, rev: res.ws.rev, updatedAt: res.ws.updatedAt };
      dirty.current = false;
      setSavedAt(res.ws.updatedAt);
      setStatus('saved');
    } else if (res.reason === 'conflict') {
      setOther(res.current);
      setStatus('conflict');
    } else {
      setStatus(res.reason);
    }
  }, [setStatus]);

  const schedule = useCallback(() => {
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(flush, DEBOUNCE_MS);
  }, [flush]);

  const update = useCallback(
    (fn: (w: Workspace) => Workspace) => {
      const cur = wsRef.current;
      if (!cur) return;
      const next = fn(cur);
      if (next === cur) return;
      wsRef.current = next;
      dirty.current = true;
      setWs(next);
      if (statusRef.current === 'conflict') return;
      if (statusRef.current === 'saved') setStatus('dirty');
      schedule();
    },
    [schedule, setStatus],
  );

  useEffect(() => {
    const onHide = () => flush();
    const onVis = () => {
      if (document.visibilityState === 'hidden') flush();
    };
    const onStorage = (e: StorageEvent) => {
      if (e.key !== K.ws(id) || e.newValue === null) return;
      let theirs: Workspace | null = null;
      try {
        theirs = sanWorkspace(JSON.parse(e.newValue));
      } catch {
        theirs = null;
      }
      if (!theirs || theirs.rev === baseRev.current) return;
      if (dirty.current) {
        setOther(theirs);
        setStatus('conflict');
      } else {
        wsRef.current = theirs;
        baseRev.current = theirs.rev;
        setWs(theirs);
        setSavedAt(theirs.updatedAt);
      }
    };
    window.addEventListener('pagehide', onHide);
    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener('pagehide', onHide);
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('storage', onStorage);
      window.clearTimeout(timer.current);
      flush();
    };
  }, [id, flush, setStatus]);

  const useTheirs = useCallback(() => {
    const t = other ?? store.loadWorkspace(id);
    if (!t) return;
    wsRef.current = t;
    baseRev.current = t.rev;
    dirty.current = false;
    setWs(t);
    setOther(null);
    setSavedAt(t.updatedAt);
    setStatus('saved');
  }, [other, id, setStatus]);

  const keepMine = useCallback(() => {
    const cur = wsRef.current;
    if (!cur) return;
    const res = store.saveWorkspace(cur, baseRev.current, true);
    if (res.ok) {
      baseRev.current = res.ws.rev;
      wsRef.current = { ...cur, rev: res.ws.rev, updatedAt: res.ws.updatedAt };
      dirty.current = false;
      setOther(null);
      setSavedAt(res.ws.updatedAt);
      setStatus('saved');
    } else if (res.reason !== 'conflict') {
      setOther(null);
      setStatus(res.reason);
    }
  }, [setStatus]);

  const retry = useCallback(() => {
    if (statusRef.current === 'quota' || statusRef.current === 'error') setStatus('dirty');
    flush();
  }, [flush, setStatus]);

  return { ws, update, status, savedAt, flush, useTheirs, keepMine, retry, conflictWith: other };
}
