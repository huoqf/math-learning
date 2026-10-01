/** 情景拓扑可视化组件的公共 Props */
export interface ScenarioVisualProps {
  /** 当前步 Aₙ 的概率 */
  pn: number;
  /** 对立概率 1 − pₙ */
  pNotN: number;
  /** 当前步编号 */
  currStep: number;
  /** 状态 1→1 保持率 p₁₁ */
  p11: number;
  /** 状态 2→1 转移率 p₂₁ */
  p21: number;
  /** 公比 λ = p₁₁ − p₂₁ */
  lambda: number;
  /** 平衡稳态值 t */
  tVal: number;
  /** 左视窗宽度（px） */
  leftW: number;
  /** 分步透明度（由外部 regionOpacity(1) 传入） */
  opacity: number;
  fontScale: (v: number) => number;
}
