import type { ParamMeta } from "../types";
import { MATH_COLORS } from "@/theme";
import type { ScenarioSpec } from "@/types/scenario";
import type { SolidDynamicLocusMode } from "@/math3d/solidDynamicLocus";

export const defaultParams = {
  a: 3,
  t: 0.25,
  rFactor: 1.25,
  tiltDeg: 35,
} as const;

export type SolidDynamicLocusParams = {
  a: number;
  t: number;
  rFactor: number;
  tiltDeg: number;
};

export const SOLID_DYNAMIC_LOCUS_SCENARIOS: Record<
  SolidDynamicLocusMode,
  Record<string, ScenarioSpec<SolidDynamicLocusParams>>
> = {
  perpLineLocus: {
    standardPerp: {
      id: "standardPerp",
      name: "过顶点作垂面",
      badge: "线面垂直定轨 · 正方体经典母题",
      background:
        "在棱长为 $a$ 的正方体 $ABCD-A_1B_1C_1D_1$ 框体结构中，研究与体对角线 $BD_1$ 垂直的动点轨迹边界。",
      condition:
        "正方体棱长 $a = 3$，动点 $P$ 满足 $AP \\perp BD_1$，并在过 $A$、$B_1$、$C$ 的正方体表面截线边界上连续滑动。",
      question:
        "求证 $BD_1 \\perp \\text{平面 } AB_1C$，计算垂足 $H$ 到顶点 $B$ 的距离 $BH$、截面正三角形周长与面积。",
      presetParams: { a: 3, t: 0.25, rFactor: 1.25, tiltDeg: 35 },
      variant: "primary",
    },
    vertexMaxDist: {
      id: "vertexMaxDist",
      name: "高倍棱长对照",
      badge: "等比放缩 · 截面尺度演变",
      background:
        "正方体零件加工检验中，需要确定与主对角轴线 $BD_1$ 垂直且过顶点的最大合法截面周长与中心垂距。",
      condition:
        "调整正方体棱长至 $a = 4$，动点 $P$ 位于截面 $\\triangle AB_1C$ 边 $B_1C$ 中点附近。",
      question:
        "求解垂线段 $BH$、截面三角形边长与面积随棱长 $a$ 放大后的精确数值关系。",
      presetParams: { a: 4, t: 0.5, rFactor: 1.25, tiltDeg: 35 },
      variant: "primary",
    },
  },
  constDistCircle: {
    quarterArc: {
      id: "quarterArc",
      name: "底面定距圆弧",
      badge: "球面截底面 · 高频选填压轴",
      background:
        "空间机械臂端点 $P$ 只能在正方体工作台底面 $ABCD$ 内活动，且与上顶角悬点 $A_1$ 保持固定连接杆长 $R$。",
      condition:
        "正方体棱长 $a = 3$，定长 $R = 1.25a$，动点 $P$ 在底面正方形 $ABCD$ 区域内且 $A_1P = R$。",
      question:
        "判定动点 $P$ 在底面内的几何轨迹形状，并求出底面轨迹圆弧半径 $r$ 与圆弧总长度 $L$。",
      presetParams: { a: 3, t: 0.4, rFactor: 1.25, tiltDeg: 35 },
      variant: "primary",
    },
    nearBoundary: {
      id: "nearBoundary",
      name: "趋近侧棱端点",
      badge: "边界临界 · 半径逼近棱长",
      background:
        "当悬点连接杆长 $R$ 接近正方体面对角线长度 $\\sqrt{2}a$ 时，底面活动轨迹会逼近相邻顶点 $B$ 与 $D$。",
      condition:
        "正方体棱长 $a = 2.6$，设杆长比例 $R/a = 1.35$，动点 $P$ 沿底面圆弧运动。",
      question:
        "计算此时轨迹圆半径 $r$ 与底面内所截四分之一圆弧弧长 $L$，分析 $R$ 的合法取值范围。",
      presetParams: { a: 2.6, t: 0.75, rFactor: 1.35, tiltDeg: 35 },
      variant: "primary",
    },
  },
  constAngleConic: {
    ellipseCut: {
      id: "ellipseCut",
      name: "斜截椭圆轨迹",
      badge: "线线定角圆锥 · 椭圆截面",
      background:
        "在正方体 $ABCD-A_1B_1C_1D_1$ 中，射线 $A_1P$ 与侧棱 $A_1A$ 所成夹角恒为 $\\theta = 35^\\circ$，同时 $P$ 落在倾角为 $\\beta$ 的平面上。",
      condition:
        "正方体棱长 $a = 3$，截平面与底面所成二面角 $\\beta = 35^\\circ < 90^\\circ - \\theta$。",
      question:
        "判断截交线 $P$ 的曲线类型并说明综合判定依据，计算此时截面圆锥曲线离心率 $e$。",
      presetParams: { a: 3, t: 0.3, rFactor: 1.25, tiltDeg: 35 },
      variant: "primary",
    },
    parabolaCut: {
      id: "parabolaCut",
      name: "平行母线抛物线",
      badge: "临界截交 · 二面角互余",
      background:
        "调节截面绕直线倾转，当截面恰好平行于圆锥面上某一条母线时，封闭交线打开为无界分支。",
      condition:
        "正方体棱长 $a = 3$，半顶角 $\\theta = 35^\\circ$，截平面与底面夹角取临界值 $\\beta = 55^\\circ$。",
      question:
        "论证 $\\theta + \\beta = 90^\\circ$ 时截交线为何化为抛物线，并求此时对应的离心率数值。",
      presetParams: { a: 3, t: 0.5, rFactor: 1.25, tiltDeg: 55 },
      variant: "primary",
    },
    hyperbolaCut: {
      id: "hyperbolaCut",
      name: "陡倾角双曲线",
      badge: "陡倾截面 · 离心率大于一",
      background:
        "继续加大截平面相对底面的倾角 $\\beta$，使得平面与圆锥轴线夹角小于半顶角 $\\theta$。",
      condition:
        "正方体棱长 $a = 3$，半顶角 $\\theta = 35^\\circ$，截平面倾角增大至 $\\beta = 74^\\circ > 55^\\circ$。",
      question:
        "说明此时截交线为双曲线的立体几何充要条件，并求解此时曲线离心率及曲线特征参数。",
      presetParams: { a: 3, t: 0.45, rFactor: 1.25, tiltDeg: 74 },
      variant: "primary",
    },
  },
};

export const SOLID_DYNAMIC_LOCUS_META: Record<string, ParamMeta> = {
  a: {
    key: "a",
    label: "正方体棱长 a",
    labelFormula: `\\text{正方体棱长 } \\color{${MATH_COLORS.paramPrimary}}{a}`,
    min: 2,
    max: 4,
    step: 0.2,
    defaultValue: 3,
    group: "正方体主体尺寸",
    importance: "core",
    description: "控制正方体 ABCD-A1B1C1D1 的棱长尺度",
  },
  t: {
    key: "t",
    label: "动点轨迹进度 t",
    labelFormula: `\\text{动点位置 } \\color{${MATH_COLORS.paramTertiary}}{t}`,
    min: 0,
    max: 1,
    step: 0.02,
    defaultValue: 0.25,
    group: "动点播放位置",
    importance: "core",
    description: "控制动点 P 沿当前空间轨迹曲线连续运动的比例参数",
  },
  rFactor: {
    key: "rFactor",
    label: "定距比例 R/a",
    labelFormula: `\\text{定距比 } \\color{${MATH_COLORS.paramSecondary}}{R/a}`,
    min: 1.05,
    max: 1.38,
    step: 0.01,
    defaultValue: 1.25,
    group: "定距与截角控制",
    importance: "core",
    description: "控制定距模型中 A1P = R 与棱长 a 的比值，满足 1 < R/a < √2",
  },
  tiltDeg: {
    key: "tiltDeg",
    label: "截平面倾角 β(°)",
    labelFormula: `\\text{截面倾角 } \\color{${MATH_COLORS.paramSecondary}}{\\beta}`,
    min: 0,
    max: 80,
    step: 1,
    defaultValue: 35,
    group: "定距与截角控制",
    importance: "core",
    description: "截平面与底面所成二面角 β，与半顶角 θ=35° 共同决定截线类型",
  },
};
