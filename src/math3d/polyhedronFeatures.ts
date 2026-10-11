/**
 * 多面体的结构特征与台体体积推导、等体积法 纯数学层
 * 涵盖：
 * 1. 棱柱与正棱锥的结构特征（底面、高、斜高、侧棱、侧面积与体积）
 * 2. 棱台结构特征与台体体积公式推导（大锥减小锥，相似比截割推导）
 * 3. 三棱锥等体积法（换底法）计算点到平面的垂直距离与体积分配
 * 纯数学函数，零 DOM / React 依赖。
 */

import type { Vec3 } from "./vector3";
import { boundsOf, type Bounds3D } from "./sceneBounds";

export interface PrismFeatureResult {
  /** 边数 (如 3 或 4) */
  sides: number;
  /** 底边长 a */
  a: number;
  /** 棱柱高 h */
  h: number;
  /** 底面积 S_底 */
  baseArea: number;
  /** 侧面积 S_侧 */
  lateralArea: number;
  /** 全面积 S_全 */
  totalArea: number;
  /** 体积 V */
  volume: number;
  /** 顶点坐标列表 (下底面 + 上底面) */
  bottomVertices: Vec3[];
  topVertices: Vec3[];
}

export interface RegularPyramidResult {
  /** 边数 (如 3 或 4) */
  sides: number;
  /** 底边长 a */
  a: number;
  /** 棱锥高 h */
  h: number;
  /** 底面外心到顶点外接半径 R */
  baseCircumRadius: number;
  /** 底面内切圆半径 r */
  baseInRadius: number;
  /** 斜高 h_slant (侧面等腰三角形的高) */
  slantHeight: number;
  /** 侧棱长 l */
  sideEdgeLength: number;
  /** 侧棱与底面所成角 (度) */
  edgeBottomAngleDeg: number;
  /** 侧面与底面二面角 (度) */
  dihedralDeg: number;
  /** 底面积 */
  baseArea: number;
  /** 侧面积 */
  lateralArea: number;
  /** 全面积 */
  totalArea: number;
  /** 体积 V = 1/3 * S_底 * h */
  volume: number;
  /** 顶点 P 与底面顶点 */
  apex: Vec3;
  baseVertices: Vec3[];
}

export interface FrustumDerivationResult {
  /** 下底边长 a2 与面积 S2 */
  a2: number;
  S2: number;
  /** 上底边长 a1 与面积 S1 */
  a1: number;
  S1: number;
  /** 台体高 h */
  h: number;
  /** 相似比 k = a1 / a2 */
  k: number;
  /** 恢复原大棱锥高 H */
  bigHeight: number;
  /** 顶部切除小棱锥高 H' = H - h */
  smallHeight: number;
  /** 大棱锥体积 V_大 */
  bigVolume: number;
  /** 小棱锥体积 V_小 */
  smallVolume: number;
  /** 台体体积 V = V_大 - V_小 = 1/3 * h * (S1 + sqrt(S1*S2) + S2) */
  frustumVolume: number;
  /** 代数公式算得体积 (用于严格一致性核验) */
  formulaVolume: number;
  /** 相对误差 */
  diffError: number;
}

export interface EqualVolumeResult {
  /** 底面边长 a, b 与夹角 90° (直角三角形 ABC) */
  a: number;
  b: number;
  /** 侧棱 PA = h 垂直于底面 ABC */
  h: number;
  /** 底面 △ABC 面积 */
  areaABC: number;
  /** 侧面 △PAC 面积 */
  areaPAC: number;
  /** 三棱锥体积 V = 1/3 * S_ABC * h */
  volume: number;
  /** 点 B 到侧面 PAC 的垂直距离 h_B (等体积法反解) */
  distBToPAC: number;
  /** 几何法射影高线理论解 (直角三角形斜边上的高) */
  geometricDist: number;
  /** 两法误差 */
  error: number;
}

/**
 * 1. 棱柱结构特征计算 (以正四棱柱/直三棱柱为例)
 */
export function calculatePrismFeatures(
  sides: number = 4,
  a: number = 3,
  h: number = 4,
): PrismFeatureResult {
  const safeA = Math.max(0.5, a);
  const safeH = Math.max(0.5, h);

  let baseArea = 0;
  const bottomVertices: Vec3[] = [];
  const topVertices: Vec3[] = [];

  if (sides === 3) {
    // 正三棱柱
    baseArea = (Math.sqrt(3) / 4) * safeA * safeA;
    const r = safeA / Math.sqrt(3);
    for (let i = 0; i < 3; i++) {
      const angle = (i * 2 * Math.PI) / 3 - Math.PI / 6;
      const x = r * Math.cos(angle);
      const y = r * Math.sin(angle);
      bottomVertices.push({ x, y, z: 0 });
      topVertices.push({ x, y, z: safeH });
    }
  } else {
    // 正四棱柱 (长方体特例)
    baseArea = safeA * safeA;
    const half = safeA / 2;
    bottomVertices.push(
      { x: -half, y: -half, z: 0 },
      { x: half, y: -half, z: 0 },
      { x: half, y: half, z: 0 },
      { x: -half, y: half, z: 0 },
    );
    topVertices.push(
      { x: -half, y: -half, z: safeH },
      { x: half, y: -half, z: safeH },
      { x: half, y: half, z: safeH },
      { x: -half, y: half, z: safeH },
    );
  }

  const lateralArea = sides * safeA * safeH;
  const totalArea = 2 * baseArea + lateralArea;
  const volume = baseArea * safeH;

  return {
    sides,
    a: safeA,
    h: safeH,
    baseArea,
    lateralArea,
    totalArea,
    volume,
    bottomVertices,
    topVertices,
  };
}

/**
 * 2. 正四棱锥结构特征与空间角计算
 */
export function calculateRegularPyramidFeatures(
  a: number = 3,
  h: number = 4,
): RegularPyramidResult {
  const safeA = Math.max(0.5, a);
  const safeH = Math.max(0.5, h);

  const baseArea = safeA * safeA;
  const halfA = safeA / 2;
  const baseInRadius = halfA; // 内切圆半径
  const baseCircumRadius = (Math.sqrt(2) / 2) * safeA; // 外接圆半径

  // 斜高 h' = sqrt(h^2 + r^2)
  const slantHeight = Math.sqrt(safeH * safeH + baseInRadius * baseInRadius);
  // 侧棱 l = sqrt(h^2 + R^2)
  const sideEdgeLength = Math.sqrt(
    safeH * safeH + baseCircumRadius * baseCircumRadius,
  );

  // 侧棱与底面角 tan theta = h / R
  const edgeBottomAngleDeg =
    (Math.atan2(safeH, baseCircumRadius) * 180) / Math.PI;
  // 侧面与底面二面角 tan alpha = h / r
  const dihedralDeg = (Math.atan2(safeH, baseInRadius) * 180) / Math.PI;

  const lateralArea = 4 * (0.5 * safeA * slantHeight);
  const totalArea = baseArea + lateralArea;
  const volume = (1 / 3) * baseArea * safeH;

  const apex: Vec3 = { x: 0, y: 0, z: safeH };
  const baseVertices: Vec3[] = [
    { x: -halfA, y: -halfA, z: 0 },
    { x: halfA, y: -halfA, z: 0 },
    { x: halfA, y: halfA, z: 0 },
    { x: -halfA, y: halfA, z: 0 },
  ];

  return {
    sides: 4,
    a: safeA,
    h: safeH,
    baseCircumRadius,
    baseInRadius,
    slantHeight,
    sideEdgeLength,
    edgeBottomAngleDeg,
    dihedralDeg,
    baseArea,
    lateralArea,
    totalArea,
    volume,
    apex,
    baseVertices,
  };
}

/**
 * 3. 棱台体积推导：大锥减小锥与通用台体体积公式
 */
export function calculateFrustumDerivation(
  a2: number = 4,
  a1: number = 2,
  h: number = 3,
): FrustumDerivationResult {
  const safeA2 = Math.max(1.0, a2);
  const safeA1 = Math.max(0.2, Math.min(safeA2 - 0.2, a1));
  const safeH = Math.max(0.5, h);

  const S2 = safeA2 * safeA2;
  const S1 = safeA1 * safeA1;
  const k = safeA1 / safeA2;

  // 恢复大锥高 H = h / (1 - k)
  const bigHeight = safeH / (1 - k);
  const smallHeight = bigHeight - safeH;

  const bigVolume = (1 / 3) * S2 * bigHeight;
  const smallVolume = (1 / 3) * S1 * smallHeight;
  const frustumVolume = bigVolume - smallVolume;

  // 通用公式 V = 1/3 * h * (S1 + sqrt(S1*S2) + S2)
  const formulaVolume = (1 / 3) * safeH * (S1 + Math.sqrt(S1 * S2) + S2);
  const diffError = Math.abs(frustumVolume - formulaVolume);

  return {
    a2: safeA2,
    S2,
    a1: safeA1,
    S1,
    h: safeH,
    k,
    bigHeight,
    smallHeight,
    bigVolume,
    smallVolume,
    frustumVolume,
    formulaVolume,
    diffError,
  };
}

/**
 * 4. 三棱锥等体积法（换底法求点面距）
 * 四面体 P-ABC: PA ⊥ 底面 ABC, ∠BAC = 90°
 * PA = h, AB = a, AC = b
 */
export function calculateEqualVolumeMethod(
  a: number = 3,
  b: number = 4,
  h: number = 3,
): EqualVolumeResult {
  const safeA = Math.max(0.5, a);
  const safeB = Math.max(0.5, b);
  const safeH = Math.max(0.5, h);

  // 底面 ABC: 直角边 a, b => S_ABC = 1/2 * a * b
  const areaABC = 0.5 * safeA * safeB;
  // 体积 V = 1/3 * S_ABC * h
  const volume = (1 / 3) * areaABC * safeH;

  // 侧面 PAC: 直角边 b, h => S_PAC = 1/2 * b * h
  const areaPAC = 0.5 * safeB * safeH;

  // 等体积法: V = 1/3 * S_PAC * h_B => h_B = 3V / S_PAC = (S_ABC * h) / S_PAC
  const distBToPAC = (3 * volume) / areaPAC;

  // 几何法验证：因为 PA ⊥ 面 ABC，面 PAC 包含垂线 PA，所以面 PAC ⊥ 面 ABC，
  // 从 B 向交线 AC 作垂线（AB ⊥ AC），垂足为 A，长度即为 AB = a
  const geometricDist = safeA;
  const error = Math.abs(distBToPAC - geometricDist);

  return {
    a: safeA,
    b: safeB,
    h: safeH,
    areaABC,
    areaPAC,
    volume,
    distBToPAC,
    geometricDist,
    error,
  };
}

// ============================================================================
// 中屏绘制几何：顶点与"补全大棱锥"延长线（页面与包围盒共用同源，避免两处各写一套端点）
// ============================================================================

/** 棱台上下底顶点顺序：(−,−) → (+,−) → (+,+) → (−,+) */
export interface FrustumVertices {
  bottom: Vec3[];
  top: Vec3[];
}

export function frustumVertices(a2 = 4, a1 = 2, h = 3): FrustumVertices {
  const res = calculateFrustumDerivation(a2, a1, h);
  const half2 = res.a2 / 2;
  const half1 = res.a1 / 2;
  return {
    bottom: [
      { x: -half2, y: -half2, z: 0 },
      { x: half2, y: -half2, z: 0 },
      { x: half2, y: half2, z: 0 },
      { x: -half2, y: half2, z: 0 },
    ],
    top: [
      { x: -half1, y: -half1, z: res.h },
      { x: half1, y: -half1, z: res.h },
      { x: half1, y: half1, z: res.h },
      { x: -half1, y: half1, z: res.h },
    ],
  };
}

/** 四面体 P-ABC 顶点（等体积法模式的中屏几何） */
export interface EqualVolumeVertices {
  A: Vec3;
  B: Vec3;
  C: Vec3;
  P: Vec3;
}

export function equalVolumeVertices(
  res: EqualVolumeResult,
): EqualVolumeVertices {
  return {
    A: { x: 0, y: 0, z: 0 },
    B: { x: res.a, y: 0, z: 0 },
    C: { x: 0, y: res.b, z: 0 },
    P: { x: 0, y: 0, z: res.h },
  };
}

/**
 * "补全大棱锥"最多额外延伸的高度（数学单位）。
 *
 * 为什么必须有：`H = h/(1-k)` 在相似比 k→1 时发散（a2=5、a1=4.5 时 H = 50），
 * 若照实画到顶点，补形虚线会变成贯穿画面的长线且顶点必然出框。
 * 这是一个**与 h 无关的固定设计上界**，保证补形在视觉上始终是"可读的一段延长线"。
 */
export const FRUSTUM_APEX_MAX_EXTEND = 3;

/**
 * 棱台上底边长 a₁ 必须比下底边长 a₂ 小的最小间隙。
 * 它是 `k = a₁/a₂ → 1 ⇒ H = h/(1−k) 发散` 这条数学事实的参数域体现。
 */
export const FRUSTUM_A1_MARGIN = 0.5;

/**
 * 棱台上底边长 a₁ 的动态硬上界。
 *
 * 为什么必须动态：registry 声明域里 `a₁.max = 3.5`、`a₂.min = 2.5`，
 * 二者**静态上允许 a₁ > a₂**，于是 k > 1 或 k = 1，补全大锥高 H 变成负数 / 无穷。
 * 唯一可靠的做法是把上界写成 a₂ 的函数 —— `ParamControl` 的 `snapToStep`
 * 内含 `clamp(…, min, max)`，滑块与数字输入框两条通道都会被同一条上界约束住。
 *
 * 放在数学层而不是页面 JSX 里，是为了让页面与回归测试消费**同一个实现**，
 * 避免"页面算一套、测试断言另一套"。
 */
export const frustumA1UpperBound = (
  a2: number,
  limits: { min: number; max: number },
): number => {
  const derived = (Number.isFinite(a2) ? a2 : limits.max) - FRUSTUM_A1_MARGIN;
  return Math.min(limits.max, Math.max(limits.min, derived));
};

export interface FrustumApexGuide {
  /** 真实补全总高 H */
  trueHeight: number;
  /** 实际绘制到的高度（≤ trueHeight） */
  drawnHeight: number;
  /** 是否因过远而截断显示（此时延长线不画到真实顶点） */
  isTruncated: boolean;
  /**
   * 4 条侧棱延长线在 `drawnHeight` 处的端点。
   * **严格共线**：端点 = `bottom[i] + t·(apex − bottom[i])`，`t = drawnHeight / H`。
   * 未截断时 `t = 1`，四点重合于真实原锥顶点 —— 因此中屏可以无分支地
   * "由 upper[i] 连到 endpoints[i]"，截断与否都保持"延长线"的几何含义。
   */
  endpoints: Vec3[];
  /** 真实原锥顶点 (0, 0, H) */
  trueApex: Vec3;
}

export function frustumApexGuide(a2 = 4, a1 = 2, h = 3): FrustumApexGuide {
  const res = calculateFrustumDerivation(a2, a1, h);
  const { bottom } = frustumVertices(a2, a1, h);
  const trueApex: Vec3 = { x: 0, y: 0, z: res.bigHeight };

  const drawnHeight = Math.min(res.bigHeight, res.h + FRUSTUM_APEX_MAX_EXTEND);
  const t = res.bigHeight > 1e-9 ? drawnHeight / res.bigHeight : 1;

  return {
    trueHeight: res.bigHeight,
    drawnHeight,
    isTruncated: drawnHeight < res.bigHeight - 1e-9,
    endpoints: bottom.map((b) => ({
      x: b.x + (trueApex.x - b.x) * t,
      y: b.y + (trueApex.y - b.y) * t,
      z: b.z + (trueApex.z - b.z) * t,
    })),
    trueApex,
  };
}

export type PolyhedronMode = "prism" | "pyramid" | "frustum" | "equalVolume";

export interface PolyhedronSceneParams {
  a: number;
  b: number;
  h: number;
  a1: number;
  a2: number;
}

/**
 * 中屏内容包围盒（数学坐标）—— 供 `<CameraFit>` 计算"恰好装得下"的机位。
 * 必须与 `PolyhedronFeaturesScene` 实际绘制的图元保持一致（顶点取自同一批函数）。
 */
export function polyhedronSceneBounds(
  mode: PolyhedronMode,
  p: PolyhedronSceneParams,
): Bounds3D {
  if (mode === "prism") {
    const res = calculatePrismFeatures(4, p.a, p.h);
    return boundsOf([...res.bottomVertices, ...res.topVertices]);
  }
  if (mode === "pyramid") {
    const res = calculateRegularPyramidFeatures(p.a, p.h);
    return boundsOf([res.apex, ...res.baseVertices]);
  }
  if (mode === "frustum") {
    const { bottom, top } = frustumVertices(p.a2, p.a1, p.h);
    const guide = frustumApexGuide(p.a2, p.a1, p.h);
    return boundsOf([...bottom, ...top, ...guide.endpoints]);
  }
  const res = calculateEqualVolumeMethod(p.a, p.b, p.h);
  const v = equalVolumeVertices(res);
  return boundsOf([v.A, v.B, v.C, v.P]);
}
