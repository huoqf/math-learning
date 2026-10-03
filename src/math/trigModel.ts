/**
 * 三角函数模型应用 —— 纯数学计算逻辑
 * 满足铁律 6：零副作用、零 DOM / React / window 依赖
 *
 * 课标依据（人教A版必修一 5.7 三角函数的应用）：
 *   1. 简谐运动（弹簧振子、摩天轮、潮汐等周期现象）的位移可写成
 *      $h = A\sin(\omega t + \varphi) + k$，其中
 *        振幅 $A$、角频率 $\omega = \frac{2\pi}{T}$、初相 $\varphi$、平衡位置 $k$。
 *   2. 周期 $T = \frac{2\pi}{\omega}$，频率 $f = \frac{1}{T} = \frac{\omega}{2\pi}$。
 *   3. 由图象求解析式的标准三步：最值定 $A$ 与 $k$ → 周期定 $\omega$ → 最高点定 $\varphi$。
 *
 * 本页刻意**以周期 T 作为自变量**（而非 5.6 图象变换页的 ω）：
 * 实际情境题给出的条件几乎都是「转一圈用 12 分钟」「半日潮周期约 12.5 小时」这类周期，
 * 直接拖动周期即可建模，$\omega$ 则由 $\omega = 2\pi/T$ 派生，避免学生二次换算出错。
 */

/** 一周对应的弧度数 */
export const MODEL_TAU = Math.PI * 2;

/** 简谐运动模型 $h(t) = A\sin(\omega t + \varphi) + k$ 的全部导出量 */
export interface HarmonicModel {
  /** 振幅 $A$（取绝对值，恒非负） */
  amplitude: number;
  /** 周期 $T$（沿横轴完成一次完整振动所需的自变量增量） */
  period: number;
  /** 角频率 $\omega = \frac{2\pi}{T}$（恒为正） */
  omega: number;
  /** 初相 $\varphi$（已折算到 $(-\pi, \pi]$） */
  phi: number;
  /** 平衡位置 $k$（振动中心） */
  balance: number;
  /** 频率 $f = \frac{1}{T}$ */
  frequency: number;
  /** 最大值 $k + A$ */
  maxValue: number;
  /** 最小值 $k - A$ */
  minValue: number;
  /** 第一个最高点（波峰）的横坐标，满足 $t \ge 0$ */
  maxTime: number;
  /** 第一个最低点（波谷）的横坐标，满足 $t \ge 0$ */
  minTime: number;
}

/**
 * 把任意角折算到 $(-\pi, \pi]$。
 *
 * 为什么必须归一化：初相 $\varphi$ 与 $\varphi + 2k\pi$ 表示同一条曲线，
 * 若不在入口处统一，左右屏会出现「$\varphi = 7\pi/2$」这类无意义读数，
 * 由图象反解时也无法与给定区间的解集对上。
 */
export function normalizeAngle(rad: number): number {
  if (!Number.isFinite(rad)) return 0;
  let a = rad % MODEL_TAU;
  if (a > Math.PI) a -= MODEL_TAU;
  if (a <= -Math.PI) a += MODEL_TAU;
  return a;
}

/** 写出 $\omega t + \varphi \equiv target \pmod{2\pi}$ 的最小非负解 $t$ */
function firstTimeForPhase(phi: number, target: number, omega: number): number {
  const delta = target - phi;
  const cycles = Math.ceil(-delta / MODEL_TAU);
  return (delta + MODEL_TAU * cycles) / omega;
}

/**
 * 由四个实际参数组装完整的简谐运动模型（单一真源）。
 *
 * Scene（中屏）、Animation（悬浮公式）与 builder（右屏看板）都必须调用它，
 * 严禁任何一处自己再算一遍 $T$、$\omega$ 或波峰横坐标。
 */
export function buildHarmonicModel(
  A: number,
  period: number,
  phi: number,
  k: number,
): HarmonicModel {
  const amplitude = Math.abs(A);
  // 周期必须严格为正：0 或负数会让 ω 无穷大 / 反向，属非法输入，兜底取 1
  const safePeriod = period > 1e-6 ? period : 1;
  const omega = MODEL_TAU / safePeriod;
  const normalizedPhi = normalizeAngle(phi);

  return {
    amplitude,
    period: safePeriod,
    omega,
    phi: normalizedPhi,
    balance: k,
    frequency: 1 / safePeriod,
    maxValue: k + amplitude,
    minValue: k - amplitude,
    maxTime: firstTimeForPhase(normalizedPhi, Math.PI / 2, omega),
    minTime: firstTimeForPhase(normalizedPhi, -Math.PI / 2, omega),
  };
}

/** 模型在自变量 $t$ 处的取值 $h(t) = A\sin(\omega t + \varphi) + k$ */
export function harmonicValue(model: HarmonicModel, t: number): number {
  return (
    model.amplitude * Math.sin(model.omega * t + model.phi) + model.balance
  );
}

/** 模型在自变量 $t$ 处的相位 $\omega t + \varphi$ */
export function harmonicPhase(model: HarmonicModel, t: number): number {
  return model.omega * t + model.phi;
}

/**
 * 从图象上读出的四项要素（由图象求解析式的题面前提）。
 * 单位与坐标轴一致，均为纯数。
 */
export interface GraphReading {
  /** 图象最高点的纵坐标 */
  maxValue: number;
  /** 图象最低点的纵坐标 */
  minValue: number;
  /** 图象最高点的横坐标（取一个便于观察的波峰） */
  maxTime: number;
  /** 图象的周期（相邻两个波峰之间的横向距离） */
  period: number;
}

/** 由图象反解出的解析式参数，附合法性判定 */
export interface SolvedModel {
  isValid: boolean;
  warning?: string;
  amplitude: number;
  balance: number;
  omega: number;
  phi: number;
  /** 反解结果与题面（最高点）的自洽性校验量：$h(t_{max})$ 与给定最高点纵坐标之差 */
  residual: number;
}

/**
 * 由图象求解析式：最值定 $A$ 与 $k$，周期定 $\omega$，最高点定 $\varphi$。
 *
 * 反解链条（与右屏推演三步一一对应）：
 *   $A = \frac{h_{max} - h_{min}}{2}$，$k = \frac{h_{max} + h_{min}}{2}$，
 *   $\omega = \frac{2\pi}{T}$，$\varphi = \frac{\pi}{2} - \omega t_{max}$（再折算到 $(-\pi, \pi]$）。
 *
 * 校验：把反解结果代回 $t_{max}$ 应当恰好取到 $h_{max}$，残差即 `residual`。
 * 若图象要素自相矛盾（最值倒置、周期非正、波峰落在 [0, T] 之外），返回 invalid 并给出原因，
 * 由右屏显示「题面不合法」而不泄漏 NaN。
 */
export function solveModelFromGraph(reading: GraphReading): SolvedModel {
  const { maxValue, minValue, maxTime, period } = reading;

  const invalid = (warning: string): SolvedModel => ({
    isValid: false,
    warning,
    amplitude: 0,
    balance: 0,
    omega: 0,
    phi: 0,
    residual: Number.NaN,
  });

  if (!Number.isFinite(maxValue) || !Number.isFinite(minValue)) {
    return invalid("图象的最高点或最低点纵坐标无效，无法读出最值。");
  }
  if (maxValue <= minValue) {
    return invalid(
      `图象最高点 ${maxValue.toFixed(2)} 不高于最低点 ${minValue.toFixed(2)}，最值读数自相矛盾。`,
    );
  }
  if (!Number.isFinite(period) || period <= 0) {
    return invalid("周期必须为正数，请先在图象上量出相邻两个波峰的横向距离。");
  }
  if (!Number.isFinite(maxTime) || maxTime < 0 || maxTime > period + 1e-9) {
    return invalid(
      `所取波峰横坐标 ${maxTime.toFixed(2)} 应落在区间 [0, ${period.toFixed(2)}] 内。`,
    );
  }

  const amplitude = (maxValue - minValue) / 2;
  const balance = (maxValue + minValue) / 2;
  const omega = MODEL_TAU / period;
  const phi = normalizeAngle(Math.PI / 2 - omega * maxTime);

  const model = buildHarmonicModel(amplitude, period, phi, balance);
  const residual = Math.abs(harmonicValue(model, maxTime) - maxValue);

  return { isValid: true, amplitude, balance, omega, phi, residual };
}

/** 实际情境：用三角函数刻画的一类周期现象 */
export interface TrigScenario {
  key: string;
  /** 情境名称（左屏选项与右屏标题） */
  name: string;
  /** 竖直方向被刻画的量（如「离地高度」） */
  quantity: string;
  /** 横轴时间量的名称与单位说明 */
  timeAxis: string;
  /** 真实背景（建模第一步的依据来源） */
  background: string;
  /** 需要预测的关键时刻 */
  probeTime: number;
  /** 针对该时刻的设问 */
  probeQuestion: string;
  /** 建模得到的四个参数（与左屏滑块同域同步长） */
  params: { A: number; period: number; phi: number; k: number };
}

/**
 * 三个典型实际情境（教材 5.7 例题与习题的同类背景）。
 *
 * 约束（由 `trigModel.test.ts` 逐条断言）：
 *   ① `params` 的每个取值都必须落在 `registries/trigModel.ts` 声明的 min / max 内
 *      且恰在 step 网格上，否则「点预设 → 滑块跳到边界」会造成图形与读数脱节；
 *   ② `probeTime` 必须落在 $[0, T]$ 内 —— 中屏横向视口固定为 $t \\in [-0.7, 13.7]$，
 *      而观测点横坐标由 `tRatio`（上限 1）乘以 $T$ 得到，越界即点飞出画布。
 */
export const TRIG_SCENARIOS: readonly TrigScenario[] = [
  {
    key: "spring",
    name: "弹簧振子",
    quantity: "竖直位移",
    timeAxis: "时间 t（与周期同单位）",
    background:
      "小球在竖直方向做简谐运动，平衡位置在原点，振幅 2，每隔 2 个单位时间完成一次全振动，且 t = 0 时小球恰在最高点。",
    probeTime: 1,
    probeQuestion:
      "小球从最高点出发经过 1 个单位时间后位于什么位置？距平衡位置多远？可用相位判断。",
    params: { A: 2, period: 2, phi: Math.PI / 2, k: 0 },
  },
  {
    key: "ferris",
    name: "摩天轮",
    quantity: "离地高度",
    timeAxis: "时间 t（分钟）",
    background:
      "摩天轮最低点离地 1，最高点离地 4，匀速转动一周用 12 分钟，且 t = 0 时座舱恰在最低点。",
    probeTime: 3,
    probeQuestion:
      "t = 3（恰好转过四分之一周）时座舱离地多高？此时是在上升还是下降？",
    params: { A: 1.5, period: 12, phi: -Math.PI / 2, k: 2.5 },
  },
  {
    key: "tide",
    name: "潮汐水深",
    quantity: "水深",
    timeAxis: "时间 t（小时）",
    background:
      "某港口半日潮的水深随时间周期变化，平均水深 2.5，涨落幅度 1.2，周期约 12.5 小时，且 t = 0 时恰为平均水深且在上涨。",
    probeTime: 4,
    probeQuestion: "t = 4 时的水深是多少？比平均水深高出还是低多少？",
    params: { A: 1.2, period: 12.5, phi: 0, k: 2.5 },
  },
];

/** 按 key 取情境（不存在返回 null，由调用方兜底） */
export function getScenario(key: string): TrigScenario | null {
  return TRIG_SCENARIOS.find((s) => s.key === key) ?? null;
}
