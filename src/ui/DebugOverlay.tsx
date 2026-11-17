import { useEffect, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { renderStats } from '../state/settings';

export interface DebugStats {
  fps: number;
  frameTime: number;
  ramUsed: number;
  ramLimit: number;
}

const debugGlobal = {
  stats: { fps: 0, frameTime: 0, ramUsed: 0, ramLimit: 0 } as DebugStats,
  listeners: new Set<() => void>(),
  subscribe(cb: () => void) {
    this.listeners.add(cb);
    return () => {
      this.listeners.delete(cb);
    };
  },
  notify() {
    this.listeners.forEach((cb) => cb());
  },
};

export function DebugTracker() {
  const frameCountRef = useRef(0);
  const lastTimeRef = useRef(Date.now());
  const fpsRef = useRef(0);

  const getRamUsage = () => {
    if (!(performance as any).memory) {
      return { used: 0, limit: 0 };
    }
    const mem = (performance as any).memory;
    return {
      used: Math.round(mem.usedJSHeapSize / 1024 / 1024),
      limit: Math.round(mem.jsHeapSizeLimit / 1024 / 1024),
    };
  };

  useFrame(() => {
    const now = Date.now();
    const elapsed = now - lastTimeRef.current;

    if (elapsed >= 1000) {
      fpsRef.current = Math.round(((renderStats.frames - frameCountRef.current) * 1000) / elapsed);
      frameCountRef.current = renderStats.frames;
      lastTimeRef.current = now;
    }

    const ram = getRamUsage();
    debugGlobal.stats = {
      fps: fpsRef.current,
      frameTime: fpsRef.current > 0 ? Math.round(1000 / fpsRef.current) : 0,
      ramUsed: ram.used,
      ramLimit: ram.limit,
    };
    debugGlobal.notify();
  });

  return null;
}

export function DebugDisplay() {
  const [visible, setVisible] = useState(false);
  const [stats, setStats] = useState<DebugStats>(debugGlobal.stats);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'd') {
        setVisible((v) => !v);
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  useEffect(() => {
    const unsubscribe = debugGlobal.subscribe(() => {
      setStats({ ...debugGlobal.stats });
    });
    return unsubscribe;
  }, []);

  if (!visible) return null;

  return (
    <div
      className="debug-overlay"
      style={{
        position: 'fixed',
        bottom: '10px',
        left: '10px',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        color: '#fff',
        fontFamily: 'monospace',
        fontSize: '12px',
        padding: '8px 12px',
        borderRadius: '4px',
        zIndex: 9999,
        userSelect: 'none',
        pointerEvents: 'none',
        lineHeight: '1.4',
      }}
    >
      <div style={{ marginBottom: '4px', fontSize: '11px', opacity: 0.7 }}>Debug (D to toggle)</div>
      <div style={{ color: stats.fps < 30 ? '#ff4444' : '#44ff44', fontWeight: 'bold' }}>
        FPS: {stats.fps} ({stats.frameTime}ms)
      </div>
      <div style={{ color: stats.fps < 30 ? '#ff4444' : '#fff' }}>
        RAM: {stats.ramUsed} / {stats.ramLimit} MB
      </div>
    </div>
  );
}
