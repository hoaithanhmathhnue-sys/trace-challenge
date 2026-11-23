import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Prefs, Store, createStore } from './storage';

export const store: Store = createStore();

interface Toast {
  id: number;
  msg: string;
  undo?: () => void;
}

interface Ctx {
  prefs: Prefs;
  setPrefs: (p: Partial<Prefs>) => void;
  toast: (msg: string, undo?: () => void) => void;
  needRefresh: boolean;
  applyUpdate: () => void;
  registerUpdate: (apply: () => void) => void;
}

const C = createContext<Ctx | null>(null);

export function useApp(): Ctx {
  const c = useContext(C);
  if (!c) throw new Error('useApp ngoài AppProvider');
  return c;
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [prefs, setPrefsState] = useState<Prefs>(() => store.loadPrefs());
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [needRefresh, setNeedRefresh] = useState(false);
  const applyRef = useRef<(() => void) | null>(null);
  const seq = useRef(0);

  const setPrefs = useCallback((p: Partial<Prefs>) => {
    setPrefsState((old) => {
      const next = { ...old, ...p };
      store.savePrefs(next);
      return next;
    });
  }, []);

  const dismiss = useCallback((id: number) => setToasts((t) => t.filter((x) => x.id !== id)), []);

  const toast = useCallback(
    (msg: string, undo?: () => void) => {
      const id = ++seq.current;
      setToasts((t) => [...t.slice(-2), { id, msg, undo }]);
      window.setTimeout(() => dismiss(id), undo ? 8000 : 4000);
    },
    [dismiss],
  );

  const registerUpdate = useCallback((apply: () => void) => {
    applyRef.current = apply;
    setNeedRefresh(true);
  }, []);

  const applyUpdate = useCallback(() => {
    applyRef.current?.();
  }, []);

  useEffect(() => {
    document.documentElement.dataset.projector = prefs.projector ? '1' : '0';
  }, [prefs.projector]);

  const value = useMemo(
    () => ({ prefs, setPrefs, toast, needRefresh, applyUpdate, registerUpdate }),
    [prefs, setPrefs, toast, needRefresh, applyUpdate, registerUpdate],
  );

  return (
    <C.Provider value={value}>
      {children}
      <div className="toasts" role="status" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className="toast">
            <span>{t.msg}</span>
            {t.undo && (
              <button
                className="btn small"
                onClick={() => {
                  t.undo?.();
                  dismiss(t.id);
                }}
              >
                Hoàn tác
              </button>
            )}
            <button className="btn small ghost" aria-label="Đóng thông báo" onClick={() => dismiss(t.id)}>
              ✕
            </button>
          </div>
        ))}
      </div>
    </C.Provider>
  );
}
