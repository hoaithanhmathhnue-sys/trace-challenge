import { useEffect, useState } from 'react';

export interface Route {
  parts: string[];
  query: URLSearchParams;
}

function parse(): Route {
  const h = window.location.hash.replace(/^#\/?/, '');
  const [path, qs = ''] = h.split('?');
  return {
    parts: path.split('/').filter(Boolean).map((s) => safeDecode(s)),
    query: new URLSearchParams(qs),
  };
}

function safeDecode(s: string): string {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}

export function useRoute(): Route {
  const [r, setR] = useState<Route>(parse);
  useEffect(() => {
    const on = () => setR(parse());
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return r;
}

export function go(path: string): void {
  window.location.hash = path.startsWith('/') ? path : '/' + path;
}
