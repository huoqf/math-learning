/**
 * src/math3d/sphereDerivation.ts
 * 球体体积（祖暅原理）与表面积（微元金字塔分割）纯数学计算层
 *
 * 遵循公理 1：纯净领域模型，严禁任何 DOM/React/全局状态依赖
 */

export interface ZuxuanSectionData {
  radius: number; // 半球底半径 R (及圆柱底半径、圆柱高)
  heightCut: number; // 切割面高度 h ∈ [0, R]
  hemisphereCutRadius: number; // 半球截面圆半径 r = √(R² - h²)
  hemisphereCutArea: number; // 半球截面面积 S₁ = π(R² - h²)
  cylinderOuterRadius: number; // 挖锥圆柱外半径 R
  coneInnerRadius: number; // 挖锥圆柱内截面半径 r_inner = h
  cylinderCutArea: number; // 挖锥圆柱截面面积 S₂ = π R² - π h² = π(R² - h²)
  areaDifference: number; // |S₁ - S₂|
  isAreaEqual: boolean; // S₁ ≡ S₂
  hemisphereVolume: number; // 半球体积 V_半 = (2/3)πR³
  cylinderVolume: number; // 圆柱体积 V_柱 = πR³
  invertedConeVolume: number; // 倒圆锥体积 V_锥 = (1/3)πR³
  hollowCylinderVolume: number; // 挖锥柱体体积 V_挖 = (2/3)πR³
  sphereVolume: number; // 整球体积 V_球 = (4/3)πR³
}

/**
 * 计算祖暅原理等高截面各项几何量
 */
export function calculateZuxuanSection(
  R: number,
  h: number,
): ZuxuanSectionData {
  const safeR = Math.max(0.1, R);
  const safeH = Math.max(0, Math.min(safeR, h));

  const hemisphereCutRadius = Math.sqrt(
    Math.max(0, safeR * safeR - safeH * safeH),
  );
  const hemisphereCutArea = Math.PI * (safeR * safeR - safeH * safeH);

  const cylinderOuterRadius = safeR;
  const coneInnerRadius = safeH; // 倒圆锥底面在顶端高 R 处，顶点在底端原点：在高度 h 处半径为 h
  const cylinderCutArea = Math.PI * (safeR * safeR - safeH * safeH);

  const areaDifference = Math.abs(hemisphereCutArea - cylinderCutArea);
  const isAreaEqual = areaDifference < 1e-6;

  const cylinderVolume = Math.PI * safeR * safeR * safeR;
  const invertedConeVolume = (1 / 3) * Math.PI * safeR * safeR * safeR;
  const hollowCylinderVolume = cylinderVolume - invertedConeVolume;
  const hemisphereVolume = hollowCylinderVolume;
  const sphereVolume = 2 * hemisphereVolume;

  return {
    radius: safeR,
    heightCut: safeH,
    hemisphereCutRadius,
    hemisphereCutArea,
    cylinderOuterRadius,
    coneInnerRadius,
    cylinderCutArea,
    areaDifference,
    isAreaEqual,
    hemisphereVolume,
    cylinderVolume,
    invertedConeVolume,
    hollowCylinderVolume,
    sphereVolume,
  };
}

/** 球面经纬网格单元（采样微锥底面所在的那一格） */
export interface SphereGridCell {
  latIdx: number;
  lonIdx: number;
  latSteps: number;
  lonSteps: number;
  /** 单元中心：极角 φ（自 +z 轴量起，rad）与方位角 θ（绕 z 轴，rad） */
  phiCenter: number;
  thetaCenter: number;
  /**
   * 单元 4 个球面顶点（数学坐标，按 p₁→p₂→p₃→p₄ 环绕）。
   *
   * ⚠️ 这是中屏「抽出的那一个微锥」底面的**唯一事实源**：中屏必须消费本字段，
   * 禁止自建抽样再算一遍。历史缺陷正是两边各算一遍（中屏按 φ≈50°/θ≈35° 吸附格、
   * 本层按 ⌊N/3⌋,⌊N/4⌋），导致中屏画出的微锥与右屏报的采样微锥**不是同一个网格单元**
   * （底面面积相差 8.76% ~ 20.88%），而门禁与真渲染契约测试全程都看不出来。
   */
  vertices: [
    [number, number, number],
    [number, number, number],
    [number, number, number],
    [number, number, number],
  ];
}

export interface SphereMeshMicroPyramid {
  baseArea: number; // 微底面积 ΔS（4 顶点的平面多边形面积，即"以平代曲"的平面微元）
  cell: SphereGridCell; // 该微锥对应的球面网格单元（含 4 顶点，中屏的唯一事实源）
  /**
   * 真实几何高 h_i = 球心到「过 4 顶点质心、法向取质心方向」的底面距离（= 质心到球心距离）。
   * N 越大 ⇒ 单元越小 ⇒ h_i 单调趋于 R —— 这就是教材"细分无限加深时微锥体高趋于半径 R"
   * 的可数值化表述（R=2、N=16 时约 0.993R）。中屏那条标注 h_i ≈ R 的虚线画的正是它。
   */
  height: number;
  /**
   * 教材模型的微锥体积 ΔV = (1/3)·R·ΔS。
   *
   * ⚠️ 它把 h_i 取成了近似值 R（教材「h_i ≈ R」那一步），因此**不满足**
   * ΔV = (1/3)·baseArea·height，本字段与本行的 height 不构成锥体体积关系。
   * 正是靠这一步取近似，才有 ∑ΔV = (1/3)R∑ΔS，也才有"体积相对误差率与表面积
   * 相对误差率恒等"（见 surfaceAreaError）。若把这里的 R 换成 height，
   * 该恒等式与右屏全部体积读数会被静默破坏 —— 已有单测钉住此恒等式，勿动。
   */
  pyramidVolume: number;
  center: [number, number, number]; // 底面 4 顶点的质心
}

export interface SphereMicroPyramidData {
  radius: number;
  /** 微锥体总数 N = n × 2n（n 为经纬网格密度；左屏滑块的符号即为小写 n） */
  totalMicroPyramids: number;
  approximateSurfaceArea: number; // 累加微底面积之和 ∑ΔS
  exactSurfaceArea: number; // 理论表面积 4πR²
  /**
   * 表面积相对误差率 |∑ΔS − 4πR²| / 4πR²。
   * 因为 ∑ΔV = (1/3)R·∑ΔS，**体积相对误差率与之恒等**（同一个数），
   * 故不再单列 volumeError，避免误当作两个互相独立的指标。
   */
  surfaceAreaError: number;
  approximateVolume: number; // 累加微锥体积之和 ∑ΔV = (1/3)R ∑ΔS
  exactVolume: number; // 理论体积 (4/3)πR³
  samplePyramid: SphereMeshMicroPyramid; // 代表性采样微锥体（中屏抽出演示的那一个）
}

/** 空间三角形面积 = ½|(b−a) × (c−a)| */
const triangleArea = (
  a: [number, number, number],
  b: [number, number, number],
  c: [number, number, number],
): number => {
  const ux = b[0] - a[0],
    uy = b[1] - a[1],
    uz = b[2] - a[2];
  const vx = c[0] - a[0],
    vy = c[1] - a[1],
    vz = c[2] - a[2];
  return (
    0.5 * Math.hypot(uy * vz - uz * vy, uz * vx - ux * vz, ux * vy - uy * vx)
  );
};

/**
 * 计算球面微元分割金字塔（微锥体）逼近几何数据
 */
export function calculateSphereMicroPyramids(
  R: number,
  subdivisions: number,
): SphereMicroPyramidData {
  const safeR = Math.max(0.1, R);
  const n = Math.max(6, Math.min(48, Math.round(subdivisions)));
  const latSteps = n;
  const lonSteps = 2 * n;

  /**
   * 球面点：极角 φ 自 **+z（向上）** 量起，方位角 θ 绕 z 轴。
   *
   * 这是标准的 z 轴向上球坐标，且与 three.js `SphereGeometry` 的默认经纬网格是
   * **同一套网格**（后者极轴为 three 的 +y，经 `mathToThree` 后恰为数学 +z）。
   * ⟹ 中屏线框与采样单元的底座印记严丝合缝，不会出现"印记跨在两格之间"。
   * 历史实现以数学 +y（向右）为极轴，与中屏线框根本不是同一套网格。
   */
  const spherePoint = (
    phi: number,
    theta: number,
  ): [number, number, number] => [
    safeR * Math.sin(phi) * Math.cos(theta),
    safeR * Math.sin(phi) * Math.sin(theta),
    safeR * Math.cos(phi),
  ];

  let totalArea = 0;
  let samplePyramid: SphereMeshMicroPyramid = {
    baseArea: 0,
    cell: {
      latIdx: 0,
      lonIdx: 0,
      latSteps,
      lonSteps,
      phiCenter: 0,
      thetaCenter: 0,
      vertices: [
        spherePoint(0, 0),
        spherePoint(0, 0),
        spherePoint(0, 0),
        spherePoint(0, 0),
      ],
    },
    height: safeR,
    pyramidVolume: 0,
    center: [0, 0, safeR],
  };

  /**
   * 采样单元选取规则（中屏与右屏**共用**的唯一规则，视图层不得再另立一套）：
   * 取中心方向最接近「极角 50°、方位角 65°」的那一格 —— 位于右前方黄金侧视展开角，
   * 与默认轴测视线夹角约 48°，既能完整侧向舒展微锥的高线与侧棱（避免正对镜头产生的 4.4 倍压扁），
   * 又处于前半球完全可见区域（在 iso/front/side 各预设视角下均不被球体自身遮挡）。
   * 吸附到单元中心而非取任意点，是为了让中屏底座印记与线框网格严丝合缝。
   */
  const sampleLatIdx = Math.min(
    latSteps - 1,
    Math.max(0, Math.round((Math.PI * 50) / 180 / (Math.PI / latSteps) - 0.5)),
  );
  const sampleLonIdx = Math.min(
    lonSteps - 1,
    Math.max(
      0,
      Math.round((Math.PI * 65) / 180 / ((Math.PI * 2) / lonSteps) - 0.5),
    ),
  );

  for (let i = 0; i < latSteps; i++) {
    const phi1 = (i / latSteps) * Math.PI;
    const phi2 = ((i + 1) / latSteps) * Math.PI;

    for (let j = 0; j < lonSteps; j++) {
      const theta1 = (j / lonSteps) * 2 * Math.PI;
      const theta2 = ((j + 1) / lonSteps) * 2 * Math.PI;

      // 4 个球面顶点 (z 轴向上的球坐标参数方程)
      const p1 = spherePoint(phi1, theta1);
      const p2 = spherePoint(phi1, theta2);
      const p3 = spherePoint(phi2, theta2);
      const p4 = spherePoint(phi2, theta1);

      // 用对角线拆分成两个空间三角形计算平面微元面积（以平代曲）
      const patchArea = triangleArea(p1, p2, p4) + triangleArea(p3, p2, p4);
      totalArea += patchArea;

      if (i === sampleLatIdx && j === sampleLonIdx) {
        const center: [number, number, number] = [
          (p1[0] + p2[0] + p3[0] + p4[0]) / 4,
          (p1[1] + p2[1] + p3[1] + p4[1]) / 4,
          (p1[2] + p2[2] + p3[2] + p4[2]) / 4,
        ];
        samplePyramid = {
          baseArea: patchArea,
          cell: {
            latIdx: i,
            lonIdx: j,
            latSteps,
            lonSteps,
            phiCenter: (phi1 + phi2) / 2,
            thetaCenter: (theta1 + theta2) / 2,
            vertices: [p1, p2, p3, p4],
          },
          // 真实几何高 = 球心到「过质心、法向取质心方向」的底面距离 = 质心到球心的距离
          height: Math.hypot(center[0], center[1], center[2]),
          // 模型微锥体积：教材「h_i ≈ R」这一步的近似值参与计算（见接口注释）
          pyramidVolume: (1 / 3) * patchArea * safeR,
          center,
        };
      }
    }
  }

  const exactSurfaceArea = 4 * Math.PI * safeR * safeR;
  const exactVolume = (4 / 3) * Math.PI * safeR * safeR * safeR;
  const approximateVolume = (1 / 3) * safeR * totalArea;

  const surfaceAreaError =
    Math.abs(totalArea - exactSurfaceArea) / exactSurfaceArea;

  return {
    radius: safeR,
    totalMicroPyramids: latSteps * lonSteps,
    approximateSurfaceArea: totalArea,
    exactSurfaceArea,
    surfaceAreaError,
    approximateVolume,
    exactVolume,
    samplePyramid,
  };
}
