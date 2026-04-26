import React from 'react';
import { T } from '../theme';

interface ScreenProps {
  children: React.ReactNode;
  pad?: boolean;
  style?: React.CSSProperties;
  onLeave?: () => void;
}

export function Screen({ children, pad = true, style = {}, onLeave }: ScreenProps) {
  return (
    <div
      style={{
        minHeight: '100%',
        background: T.bg,
        color: T.text,
        fontFamily: T.body,
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
        padding: pad ? '56px 20px 32px' : 0,
        position: 'relative',
        ...style,
      }}
    >
      {onLeave && (
        <button
          onClick={onLeave}
          style={{
            position: 'absolute', top: 16, left: 20,
            background: 'none', border: 'none',
            color: T.muted, fontFamily: T.body, fontSize: 14,
            cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: 4,
          }}
        >
          ← Verlassen
        </button>
      )}
      {children}
    </div>
  );
}
