export { CoordinateGrid } from "./CoordinateGrid";
export { FunctionGraph } from "./FunctionGraph";
export { VectorArrow } from "./VectorArrow";
export { PolarGrid } from "./PolarGrid";
export { InteractivePoint } from "./InteractivePoint";
export { INTERACTIVE_POINT_GEOMETRY } from "./pointGeometry";
export { MathPoint } from "./MathPoint";
export type {
  MathPointProps,
  MathPointVariant,
  LabelPosition,
} from "./MathPoint";
export { IntervalShadow } from "./IntervalShadow";
export type { ShadowBaseline } from "./IntervalShadow";
export { TangentLine } from "./TangentLine";
export { SecantLine } from "./SecantLine";
export { Asymptote } from "./Asymptote";
export { TrackPath } from "./TrackPath";
export { SceneLegend } from "./SceneLegend";
export type {
  SceneLegendItem,
  SceneLegendItem as LegendItem,
} from "./SceneLegend";
export { SceneLabelGroup } from "./SceneLabelGroup";
export type { SceneLabelGroupProps } from "./SceneLabelGroup";

/* 注意：调色板辅助（buildLegendItems / dashArrayOf / scenePalette 类型等）**不从本 barrel 转出**。
   本 barrel 会被各页面测试整体 vi.mock（页面测试只需挂载、不需要真渲染 SVG），
   而调色板辅助是纯数据函数、与渲染无关，挂在 barrel 上会在测试里被一并 mock 掉。
   因此统一从 "@/components/Math/scenePalette" 直接引入。 */
