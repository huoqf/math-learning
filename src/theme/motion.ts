/**
 * src/theme/motion.ts
 * 动效 token — 所有过渡时长、缓动函数的唯一来源
 */

// ─── 时长（ms） ───────────────────────────────────────────────────────────
export const duration = {
  instant:  100,  // 即时反馈（hover 高亮、focus 边框）
  fast:     200,  // 按钮状态切换、下拉展开
  normal:   300,  // 卡片进场、面板展开（默认）
  slow:     500,  // 页面级过渡、模态弹出
  xslow:        800,
  celebration:  800,
  stateChange:  300,
  feedback:     400,
} as const;

// ─── 缓动函数（CSS cubic-bezier 字符串） ─────────────────────────────────
export const easing = {
  standard:    'cubic-bezier(0.4, 0, 0.2, 1)',   // Material standard — 进出均匀
  decelerate:  'cubic-bezier(0.0, 0.0, 0.2, 1)', // 元素进场（由快到慢）
  accelerate:  'cubic-bezier(0.4, 0.0, 1, 1)',   // 元素退场（由慢到快）
  bounce:      'cubic-bezier(0.34, 1.56, 0.64, 1)', // 轻微回弹（参数拖拽释放）
} as const;

// ─── 预设 transition 对象（CSS transition 属性值）──────────────────────────
export const transition = {
  fade:    { duration: duration.fast   / 1000, ease: easing.standard },
  slide:   { duration: duration.normal / 1000, ease: easing.decelerate },
  reveal:  { duration: duration.slow   / 1000, ease: easing.decelerate },
} as const;

// ─── Canvas 动画节拍（requestAnimationFrame 相关）────────────────────────
export const canvasAnimation = {
  dtBase:        1 / 60,
  dtMax:         1 / 20,
  pauseOpacity:  0.9,
} as const;
