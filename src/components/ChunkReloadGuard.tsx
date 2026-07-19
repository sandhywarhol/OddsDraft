'use client';

import { useEffect } from 'react';

// Auto-recover from ChunkLoadError.
//
// When a new version is deployed, the JS/CSS chunk filenames change. A user who is
// mid-session (or navigating client-side, e.g. lineup → router.push('/live')) can request
// a chunk from the build that just got replaced; it 404s and the browser shows a dead
// "This page couldn't load" page. This listens for that specific failure and reloads the
// page ONCE to pull the fresh HTML + chunk set. A short sessionStorage cooldown prevents
// a reload loop if the failure is something else.
export default function ChunkReloadGuard() {
  useEffect(() => {
    const COOLDOWN_KEY = 'od_chunk_reload_at';
    const isChunkError = (msg?: string | null) =>
      !!msg && /ChunkLoadError|Loading chunk\s+[\w-]+\s+failed|Loading CSS chunk|dynamically imported module|importing a module script failed|error loading dynamically imported module/i.test(msg);

    const reloadOnce = () => {
      try {
        const last = Number(sessionStorage.getItem(COOLDOWN_KEY) || '0');
        if (Date.now() - last < 15000) return; // already reloaded recently — don't loop
        sessionStorage.setItem(COOLDOWN_KEY, String(Date.now()));
      } catch { /* sessionStorage unavailable — still attempt one reload */ }
      window.location.reload();
    };

    const onError = (e: ErrorEvent) => {
      if (isChunkError(e?.message) || isChunkError((e as any)?.error?.message)) reloadOnce();
    };
    const onRejection = (e: PromiseRejectionEvent) => {
      const reason: any = e?.reason;
      const msg = typeof reason === 'string' ? reason : reason?.message;
      if (isChunkError(msg) || reason?.name === 'ChunkLoadError') reloadOnce();
    };

    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onRejection);
    return () => {
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onRejection);
    };
  }, []);

  return null;
}
