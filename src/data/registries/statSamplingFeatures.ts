import type { ParamMeta } from "../types";
import { MATH_COLORS } from "@/theme";
import type { ScenarioSpec } from "@/types/scenario";
import type { StatSamplingMode } from "@/math/statSamplingFeatures";

export const defaultParams = {
  N1: 120,
  N2: 180,
  N3: 300,
  sampleN: 30,
  scaleA: 2,
  shiftB: 5,
  outlierVal: 16,
} as const;

export type StatSamplingParams = {
  N1: number;
  N2: number;
  N3: number;
  sampleN: number;
  scaleA: number;
  shiftB: number;
  outlierVal: number;
};

export const BASE_SAMPLE_DATA = [4, 5, 6, 7, 7, 8, 9, 10];

export const STAT_SAMPLING_SCENARIOS: Record<
  StatSamplingMode,
  Record<string, ScenarioSpec<StatSamplingParams>>
> = {
  sampling: {
    free: {
      id: "free",
      name: "自由探索",
      badge: "分层抽样 · 等比例抽取",
      background:
        "某校拟抽样调查全校学生视力健康状况，需在各年级按比例分配样本名额。",
      condition:
        "三个年级人数分别为 $N_1, N_2, N_3$，总体规模 $N = N_1+N_2+N_3$，拟抽样本容量为 $n$。",
      question:
        "求抽样比 $k = n/N$ 及各层应抽取的样本个数，对比简单随机抽样的适用场景。",
      variant: "primary",
    },
    schoolSurvey: {
      id: "schoolSurvey",
      name: "三层比例抽样",
      badge: "课标母题 · 等比例分配",
      background: "某中学高一至高三进行体质测试分层抽样。",
      condition: "各年级人数分别为 $120, 180, 300$，共抽取 $n = 30$ 名学生。",
      question: "计算抽样比与每层抽取的人数，检验个体被抽到的等概率性。",
      presetParams: { N1: 120, N2: 180, N3: 300, sampleN: 30 },
      variant: "primary",
    },
    remainderAlloc: {
      id: "remainderAlloc",
      name: "非整除余数分配",
      badge: "实操细节 · 最大余数法",
      background: "工业质检从三条产线抽取总计 $25$ 件样品。",
      condition: "三条产线产量 $N_1=100, N_2=150, N_3=200$，抽样容量 $n=25$。",
      question:
        "分析理论配额非整数时的按最大余数凑整原则，确保各层和严格等于 $n$。",
      presetParams: { N1: 100, N2: 150, N3: 200, sampleN: 25 },
      variant: "accent",
    },
  },
  linearTransform: {
    free: {
      id: "free",
      name: "自由探索",
      badge: "数字特征线性变换",
      background:
        "竞赛评卷或单位换算中常将原始成绩统一乘常数 $a$ 再加偏移量 $b$ 赋分。",
      condition: "样本 $x_1, \\dots, x_n$ 经变换 $y_i = ax_i + b$ 生成新样本。",
      question:
        "定量对比变换前后箱线图五数与点分布，证明 $\\bar{y}, s_y^2, s_y, M_{e,y}$ 的代数换算公式。",
      variant: "primary",
    },
    scaleShift: {
      id: "scaleShift",
      name: "双倍加分变换",
      badge: "高考多选高频 · y=2x+10",
      background: "模拟考折算赋分：将原标准分翻倍并全体加 $10$ 分。",
      condition: "设定缩放系数 $a = 2$，平移常数 $b = 10$。",
      question:
        "说明平移常数 $b$ 为何只影响均值与分位数而不改变方差、标准差和极差。",
      presetParams: { scaleA: 2, shiftB: 10 },
      variant: "primary",
    },
    negativeScale: {
      id: "negativeScale",
      name: "负系数翻转",
      badge: "易错细节 · a<0 取绝对值",
      background: "误差反向标定：取变换 $y_i = -1.5 x_i + 20$。",
      condition: "设定负数缩放系数 $a = -1.5$，平移量 $b = 20$。",
      question:
        "验证标准差公式为何必须带绝对值 $|a|s_x$，并定量求解原 $Q_1, Q_3$ 的翻转映射。",
      presetParams: { scaleA: -1.5, shiftB: 20 },
      variant: "danger",
    },
  },
  outlierImpact: {
    free: {
      id: "free",
      name: "自由探索",
      badge: "稳健性辨析 · 异常值与添项",
      background:
        "班级月考成绩统计中，探讨个别超高/超低极端分或补录新成绩对指标的影响。",
      condition:
        "在基准样本上方拖移末位样本值 $x_{\\text{max}}$ 或启用“补入原均值样本”开关。",
      question:
        "比较均值、方差与中位数、四分位距 $IQR$ 对极端值的抗干扰能力差异。",
      variant: "primary",
    },
    extremeSpike: {
      id: "extremeSpike",
      name: "极端高分拉扯",
      badge: "中位数抗极端值",
      background: "收入或成绩分布出现明显右偏极端样本点。",
      condition: "将末位样本由 $10$ 拖高至极端值 $22$。",
      question:
        "定量对比箱线图中位数与四分位数的稳定性，求均值与方差的绝对增量。",
      presetParams: { outlierVal: 22 },
      variant: "warning",
    },
    addMeanCheck: {
      id: "addMeanCheck",
      name: "添入均值样本",
      badge: "新高考多选必考 · 添均值降方差",
      background: "调查问卷补录一名恰好等于当前样本均值的受访者数据。",
      condition: "开启“补入均值新样本”，将样本容量由 $8$ 扩至 $9$。",
      question:
        "证明新均值保持不变且新方差严格按 $\\frac{n}{n+1}$ 比例缩小的代数原因。",
      presetParams: { outlierVal: 10 },
      variant: "primary",
    },
  },
};

export const paramMeta: Record<string, ParamMeta> = {
  N1: {
    key: "N1",
    label: "一层总体 N1",
    labelFormula: `\\text{第一层 } \\color{${MATH_COLORS.paramPrimary}}{N_1}`,
    min: 40,
    max: 300,
    step: 20,
    defaultValue: 120,
    group: "各层总体规模",
    importance: "core",
  },
  N2: {
    key: "N2",
    label: "二层总体 N2",
    labelFormula: `\\text{第二层 } \\color{${MATH_COLORS.paramSecondary}}{N_2}`,
    min: 40,
    max: 300,
    step: 20,
    defaultValue: 180,
    group: "各层总体规模",
    importance: "core",
  },
  N3: {
    key: "N3",
    label: "三层总体 N3",
    labelFormula: `\\text{第三层 } \\color{${MATH_COLORS.paramTertiary}}{N_3}`,
    min: 40,
    max: 400,
    step: 20,
    defaultValue: 300,
    group: "各层总体规模",
    importance: "core",
  },
  sampleN: {
    key: "sampleN",
    label: "抽样总容量 n",
    labelFormula: `\\text{抽样容量 } \\color{${MATH_COLORS.function}}{n}`,
    min: 10,
    max: 60,
    step: 5,
    defaultValue: 30,
    group: "抽样配额控制",
    importance: "core",
  },
  scaleA: {
    key: "scaleA",
    label: "比例系数 a",
    labelFormula: `\\text{比例系数 } \\color{${MATH_COLORS.paramPrimary}}{a}`,
    min: -2.5,
    max: 3.0,
    step: 0.5,
    defaultValue: 2,
    group: "线性变换参数",
    importance: "core",
    marks: [{ value: 0, label: "0(退化)", variant: "critical" }],
  },
  shiftB: {
    key: "shiftB",
    label: "平移常数 b",
    labelFormula: `\\text{平移常数 } \\color{${MATH_COLORS.paramSecondary}}{b}`,
    min: -10,
    max: 15,
    step: 1,
    defaultValue: 5,
    group: "线性变换参数",
    importance: "core",
  },
  outlierVal: {
    key: "outlierVal",
    label: "极端样本值",
    labelFormula: `\\text{变动样本 } \\color{${MATH_COLORS.paramPrimary}}{x_n}`,
    min: 1,
    max: 24,
    step: 1,
    defaultValue: 16,
    group: "样本扰动控制",
    importance: "core",
  },
};
