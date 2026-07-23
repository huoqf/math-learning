/**
 * UI 组件库
 *
 * 提供项目中所有通用 UI 组件，包括按钮、滑块、卡片、表单控件等。
 * 所有组件遵循统一的设计规范，支持主题定制和响应式布局。
 *
 * @example
 * ```tsx
 * import { Button, Slider, SelectGrid } from '@/components/UI'
 *
 * // 使用 UI 组件
 * <SelectGrid items={items} value={value} onChange={setValue} />
 * <Slider value={50} min={0} max={100} onChange={(v) => console.log(v)} />
 * ```
 */
// ============================================================================
// 基础控件 (Basic Controls)
// ============================================================================
export { Button } from "./Button";
export { Slider } from "./Slider";

// ============================================================================
// 表单与数据 (Forms & Data)
// ============================================================================
export { ParamControl } from "./ParamControl";
export type { ParamConfig } from "./ParamControl";
export { TabSwitcher } from "./TabSwitcher";
export { SelectGrid } from "./SelectGrid";

// ============================================================================
// 面板与布局 (Panels & Layout)
// ============================================================================
export { LeftPanel, LeftPanelSection } from "./LeftPanel";
export { MathPanel } from "./MathPanel";
export type {
  MathQuantity,
  Theorem,
  GaokaoPoint,
  WarningItem,
} from "./MathPanel";

// ============================================================================
// 反馈与展示 (Feedback & Display)
// ============================================================================
export { TipCard } from "./TipCard";
export { KatexFormula } from "./KatexFormula";
