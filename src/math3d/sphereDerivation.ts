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

export interface SphereMeshMicroPyramid {
  baseVertices: [number, number, number][]; // 底面四个角点（球面上的微四边形）
  baseArea: number; // 微底面积 ΔS
  height: number; // 锥体高 R
  pyramidVolume: number; // 微锥体体积 ΔV = (1/3) * ΔS * R
  center: [number, number, number]; // 底面几何中心
}

export interface SphereMicroPyramidData {
  radius: number;
  segmentsLat: number; // 纬度细分段数
  segmentsLon: number; // 经度细分段数
  totalMicroPyramids: number; // 微锥体总数
  approximateSurfaceArea: number; // 累加微底面积之和 ∑ΔS
  exactSurfaceArea: number; // 理论表面积 4πR²
  surfaceAreaError: number; // 相对误差率
  approximateVolume: number; // 累加微锥体积之和 ∑ΔV = (1/3)R ∑ΔS
  exactVolume: number; // 理论体积 (4/3)πR³
  volumeError: number; // 相对误差率
  samplePyramid: SphereMeshMicroPyramid; // 代表性采样微锥体（用于高亮抽出演示）
}

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

  let totalArea = 0;
  let samplePyramid: SphereMeshMicroPyramid = {
    baseVertices: [
      [0, 0, safeR],
      [0, 0, safeR],
      [0, 0, safeR],
      [0, 0, safeR],
    ],
    baseArea: 0,
    height: safeR,
    pyramidVolume: 0,
    center: [0, 0, safeR],
  };

  const sampleLatIdx = Math.floor(latSteps / 3);
  const sampleLonIdx = Math.floor(lonSteps / 4);

  for (let i = 0; i < latSteps; i++) {
    const phi1 = (i / latSteps) * Math.PI;
    const phi2 = ((i + 1) / latSteps) * Math.PI;

    for (let j = 0; j < lonSteps; j++) {
      const theta1 = (j / lonSteps) * 2 * Math.PI;
      const theta2 = ((j + 1) / lonSteps) * 2 * Math.PI;

      // 4 个球面顶点 (经纬度参数方程)
      const p1: [number, number, number] = [
        safeR * Math.sin(phi1) * Math.cos(theta1),
        safeR * Math.cos(phi1),
        safeR * Math.sin(phi1) * Math.sin(theta1),
      ];
      const p2: [number, number, number] = [
        safeR * Math.sin(phi1) * Math.cos(theta2),
        safeR * Math.cos(phi1),
        safeR * Math.sin(phi1) * Math.sin(theta2),
      ];
      const p3: [number, number, number] = [
        safeR * Math.sin(phi2) * Math.cos(theta2),
        safeR * Math.cos(phi2),
        safeR * Math.sin(phi2) * Math.sin(theta2),
      ];
      const p4: [number, number, number] = [
        safeR * Math.sin(phi2) * Math.cos(theta1),
        safeR * Math.cos(phi2),
        safeR * Math.sin(phi2) * Math.sin(theta1),
      ];

      // 用对角线拆分成两个空间三角形计算平面微元面积
      const d12x = p2[0] - p1[0],
        d12y = p2[1] - p1[1],
        d12z = p2[2] - p1[2];
      const d14x = p4[0] - p1[0],
        d14y = p4[1] - p1[1],
        d14z = p4[2] - p1[2];
      // cross product (p2-p1) x (p4-p1)
      const cx1 = d12y * d14z - d12z * d14y;
      const cy1 = d12z * d14x - d12x * d14z;
      const cz1 = d12x * d14y - d12y * d14x;
      const area1 = 0.5 * Math.sqrt(cx1 * cx1 + cy1 * cy1 + cz1 * cz1);

      const d32x = p2[0] - p3[0],
        d32y = p2[1] - p3[1],
        d32z = p2[2] - p3[2];
      const d34x = p4[0] - p3[0],
        d34y = p4[1] - p3[1],
        d34z = p4[2] - p3[2];
      const cx2 = d32y * d34z - d32z * d34y;
      const cy2 = d32z * d34x - d32x * d34z;
      const cz2 = d32x * d34y - d32y * d34x;
      const area2 = 0.5 * Math.sqrt(cx2 * cx2 + cy2 * cy2 + cz2 * cz2);

      const patchArea = area1 + area2;
      totalArea += patchArea;

      if (i === sampleLatIdx && j === sampleLonIdx) {
        samplePyramid = {
          baseVertices: [p1, p2, p3, p4],
          baseArea: patchArea,
          height: safeR,
          pyramidVolume: (1 / 3) * patchArea * safeR,
          center: [
            (p1[0] + p2[0] + p3[0] + p4[0]) / 4,
            (p1[1] + p2[1] + p3[1] + p4[1]) / 4,
            (p1[2] + p2[2] + p3[2] + p4[2]) / 4,
          ],
        };
      }
    }
  }

  const exactSurfaceArea = 4 * Math.PI * safeR * safeR;
  const exactVolume = (4 / 3) * Math.PI * safeR * safeR * safeR;
  const approximateVolume = (1 / 3) * safeR * totalArea;

  const surfaceAreaError =
    Math.abs(totalArea - exactSurfaceArea) / exactSurfaceArea;
  const volumeError = Math.abs(approximateVolume - exactVolume) / exactVolume;

  return {
    radius: safeR,
    segmentsLat: latSteps,
    segmentsLon: lonSteps,
    totalMicroPyramids: latSteps * lonSteps,
    approximateSurfaceArea: totalArea,
    exactSurfaceArea,
    surfaceAreaError,
    approximateVolume,
    exactVolume,
    volumeError,
    samplePyramid,
  };
}
