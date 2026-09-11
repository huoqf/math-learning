/**
 * PropertiesScene 共享类型
 * 父级分发器与各 mode 子场景之间的公共契约
 */
import type { SceneScale } from "@/hooks/useSceneScale";
import type { ViewportInfo } from "@/utils/useViewport";

/** 函数类型（奇偶/对称/定义域演示母函数） */
export type PropertiesFnType =
  "cubic" | "quadratic" | "root" | "abs" | "reciprocal" | "sin";

/** 三大教学模式：定义域 / 奇偶性 / 对称性 */
export type PropertiesMode = "domain" | "parity" | "symmetry";

/** 对称性子模式：单轴对称 / 中心对称 / 高考三大周期导出 */
export type PropertiesSubMode =
  | "axis"
  | "center"
  | "period-dual-axis"
  | "period-dual-center"
  | "period-axis-center";

/** 各子场景通用依赖（父级注入） */
export interface PropertiesCommonProps {
  scale: SceneScale;
  vp: ViewportInfo;
  onParamChange: (key: string, value: number) => void;
  fontScale: (v: number) => number;
  getFn: (x: number) => number;
}

/** evalPeriodicityModel 返回结构（对称性周期子场景与父级共用） */
export interface PeriodModelRes {
  dist: number;
  period: number;
  valid: boolean;
  formulaLatex: string;
  theoremText: string;
  waveFn: (x: number) => number;
}
