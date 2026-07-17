/**
 * src/theme/shadow.ts
 * 阴影规范 — 使用 cool dark rgba(15,23,42,...) 而非纯黑，与冷色主系协调
 * 15,23,42 = neutral-900 (#0F172A) 的 RGB 分量
 */
export const shadow = {
  none: 'none',
  xs: '0 1px 2px rgba(15,23,42,0.06)',
  sm: '0 1px 3px rgba(15,23,42,0.08), 0 1px 2px rgba(15,23,42,0.06)',
  md: '0 4px 6px rgba(15,23,42,0.07), 0 2px 4px rgba(15,23,42,0.06)',
  lg: '0 10px 15px rgba(15,23,42,0.08), 0 4px 6px rgba(15,23,42,0.05)',
  xl: '0 20px 25px rgba(15,23,42,0.10), 0 8px 10px rgba(15,23,42,0.06)',
  '2xl': '0 25px 50px rgba(15,23,42,0.15)',
  inner: 'inset 0 2px 4px rgba(15,23,42,0.06)',
  focusRing: '0 0 0 2px #ffffff, 0 0 0 4px #3B82F6',
} as const;

export type ShadowKey = keyof typeof shadow;

export const glowRing = {
  highlight: '0 0 0 2px #60A5FA',
  mastered:  '0 0 0 2px #10B981',
  activeStep:'0 0 0 2px #3B82F6',
  error:     '0 0 0 2px #EF4444',
} as const;
