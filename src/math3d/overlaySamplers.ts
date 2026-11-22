/**
 * src/math3d/overlaySamplers.ts
 * 3D 页面右下/左下角 2D 降维截面图与目标函数曲线采样纯函数模块
 * 零 React / DOM 依赖，严格遵循单一事实源 (SSOT)
 */

import {
  calculateConeSphere,
  calculateCuboidSphere,
  calculateCylinderSphere,
  calculatePrismSphere,
  calculatePyramidSphere,
  type ShapeType,
  type SphereType,
} from "./circumInSphere";
import {
  calculateComplementModel,
  calculateCornerModel,
  calculateCylinderModel,
  calculateInSphereModel,
  calculateVerticalEdgeModel,
} from "./polyhedronSphere";
import {
  calculateConcentricSpheres,
  calculatePerpPlanesSphere,
  calculateSphereExtrema,
  calculateTruncatedConeSphere,
} from "./advancedSphereModels";
import {
  calculateDoublePointDistance,
  calculatePyramidVolumeExtrema,
  calculateSinglePointAngle,
  calculateSurfacePath,
} from "./parametricPoint";
import {
  solveCuboidPointLineDistance,
  solveSideEdgeAndFaceDiagonalDistance,
  solveSkewLinesDistance,
} from "./spatialDistance";
import { solvePointToPlaneDistance } from "./spatialAngle";
import { computeSectionProjectionDetails } from "./sectionArea";
import {
  intersectConvexPolyhedronPlane,
  type Polyhedron,
} from "./sectionIntersection";
import { planeFromPoints } from "./plane";
import { lerp, type Vec3 } from "./vector3";

export interface SphereOverlayData {
  title: string;
  R: number;
  r: number;
  d: number;
  modeLabel: string;
  kind?: "circum" | "inscribed";
  inscribedShape?: "triangle" | "rect";
}

export interface CurveSamplePoint {
  x: number;
  y: number;
}

export interface ParamCurveOverlayData {
  title: string;
  xLabel: string;
  yLabel: string;
  samples: CurveSamplePoint[];
  currentX: number;
  currentY: number;
  optimalX?: number;
  optimalY?: number;
  optimalLabel?: string;
}

/**
 * 常规几何体切接球（CircumInSphereAnimation）2D 轴截面直角三角形降维参数
 */
export function getCircumInSphereOverlayData(
  sphereType: SphereType,
  shape: ShapeType,
  params: Record<string, number>,
): SphereOverlayData {
  const a = params.a ?? 3;
  const b = params.b ?? 2;
  const c = params.c ?? 2;
  const h = params.h ?? c;

  let R = 1;
  let r = 0;

  if (shape === "cuboid") {
    const res = calculateCuboidSphere(a, b, c, sphereType);
    R = res.radius;
    r = sphereType === "circum" ? Math.sqrt(a * a + b * b) / 2 : res.radius;
    const d = sphereType === "circum" ? c / 2 : 0;
    return {
      title:
        sphereType === "circum" ? "长方体外接球轴截面" : "长方体内切球轴截面",
      R,
      r,
      d,
      modeLabel:
        sphereType === "circum"
          ? "R² = (√(a²+b²)/2)² + (c/2)²"
          : "2r = min(a, b, c)",
      kind: sphereType,
      inscribedShape: "rect",
    };
  }

  if (shape === "regularPyramid") {
    const res = calculatePyramidSphere(a, c, sphereType);
    R = res.radius;
    if (sphereType === "inscribed") {
      return {
        title: "正四棱锥内切球轴截面",
        R,
        r: R,
        d: 0,
        modeLabel: "等体积法 V = ⅓S·r",
        kind: "inscribed",
        inscribedShape: "triangle",
      };
    }
    r = res.baseCircumRadius ?? a / Math.SQRT2;
    const d = Math.sqrt(Math.max(0, R * R - Math.min(R, r) * Math.min(R, r)));
    return {
      title: "正四棱锥外接球截面",
      R,
      r: Math.min(R, r),
      d: Math.min(R, d),
      modeLabel: "R² = r底² + |h - R|²",
      kind: "circum",
    };
  }

  if (shape === "triangularPrism") {
    const res = calculatePrismSphere(a, b, h, sphereType);
    R = res.radius;
    if (sphereType === "inscribed") {
      return {
        title: "直三棱柱内切球截面",
        R,
        r: R,
        d: 0,
        modeLabel: "2r = min(h, 2r底)",
        kind: "inscribed",
        inscribedShape: "rect",
      };
    }
    r = res.baseCircumRadius ?? a / Math.sqrt(3);
    const d = Math.sqrt(Math.max(0, R * R - Math.min(R, r) * Math.min(R, r)));
    return {
      title: "直三棱柱外接球截面",
      R,
      r: Math.min(R, r),
      d: Math.min(R, d),
      modeLabel: "R² = r底² + (h/2)²",
      kind: "circum",
    };
  }

  if (shape === "cone") {
    const res = calculateConeSphere(a, h, sphereType);
    R = res.radius;
    if (sphereType === "inscribed") {
      return {
        title: "圆锥内切球轴截面",
        R,
        r: R,
        d: 0,
        modeLabel: "r = Rh / (R + l)",
        kind: "inscribed",
        inscribedShape: "triangle",
      };
    }
    const d = Math.sqrt(Math.max(0, R * R - Math.min(R, a) * Math.min(R, a)));
    return {
      title: "圆锥外接球轴截面",
      R,
      r: Math.min(R, a),
      d,
      modeLabel: "R² = r² + |h - R|²",
      kind: "circum",
    };
  }

  const res = calculateCylinderSphere(a, h, sphereType);
  R = res.radius;
  if (sphereType === "inscribed") {
    return {
      title: "圆柱内切球轴截面",
      R,
      r: R,
      d: 0,
      modeLabel: "r = min(R柱, h/2)",
      kind: "inscribed",
      inscribedShape: "rect",
    };
  }
  const d = Math.sqrt(Math.max(0, R * R - Math.min(R, a) * Math.min(R, a)));
  return {
    title: "圆柱外接球轴截面",
    R,
    r: Math.min(R, a),
    d,
    modeLabel: "R² = r² + (h/2)²",
    kind: "circum",
  };
}

/**
 * 多面体通用切接球五大模型 2D 截面降维参数
 */
export function getPolyhedronSphereOverlayData(
  modelType: "corner" | "cylinder" | "complement" | "verticalEdge" | "inSphere",
  params: Record<string, number>,
): SphereOverlayData {
  const a = params.a ?? 3;
  const b = params.b ?? 4;
  const c = params.c ?? 5;
  const h = params.h ?? 4;

  if (modelType === "corner") {
    const res = calculateCornerModel(a, b, c);
    const rBase = Math.sqrt(a * a + b * b) / 2;
    return {
      title: "墙角模型外接球截面",
      R: res.radius,
      r: rBase,
      d: c / 2,
      modeLabel: "2R = √(a² + b² + c²)",
      kind: "circum",
    };
  }
  if (modelType === "cylinder") {
    const res = calculateCylinderModel(a, b, h);
    return {
      title: "柱体套球轴截面",
      R: res.radius,
      r: res.rBase,
      d: h / 2,
      modeLabel: "R² = r底² + (h/2)²",
      kind: "circum",
    };
  }
  if (modelType === "complement") {
    const res = calculateComplementModel(a, b, c);
    const { x, y, z } = res.boxDimensions;
    return {
      title: "对棱补形外接球截面",
      R: res.radius,
      r: Math.sqrt(x * x + y * y) / 2,
      d: z / 2,
      modeLabel: "R = √(a²+b²+c²) / (2√2)",
      kind: "circum",
    };
  }
  if (modelType === "verticalEdge") {
    const res = calculateVerticalEdgeModel(a, b, h);
    return {
      title: "侧棱垂直底面外接球",
      R: res.radius,
      r: res.rBase,
      d: h / 2,
      modeLabel: "R² = r底² + (h/2)²",
      kind: "circum",
    };
  }
  const res = calculateInSphereModel(a, b, c);
  return {
    title: "三棱锥内切球等体积法",
    R: res.inRadius,
    r: res.inRadius,
    d: 0,
    modeLabel: "r = 3V / S表",
    kind: "inscribed",
    inscribedShape: "triangle",
  };
}

/**
 * 进阶切接球压轴模型 2D 轴截面降维参数
 */
export function getAdvancedSphereOverlayData(
  modelType: "perpPlanes" | "concentric" | "truncatedCone" | "extrema",
  params: Record<string, number>,
): SphereOverlayData {
  if (modelType === "perpPlanes") {
    const r1 = params.r1 ?? 3;
    const r2 = params.r2 ?? 3.5;
    const c = params.c ?? 3;
    const res = calculatePerpPlanesSphere(r1, r2, c);
    return {
      title: "双垂直面截面勾股图",
      R: res.radius,
      r: Math.min(res.radius, res.r1),
      d: Math.min(res.radius, res.d2),
      modeLabel: "R² = r₁² + d₂²",
      kind: "circum",
    };
  }
  if (modelType === "concentric") {
    const a = params.a ?? 4;
    const res = calculateConcentricSpheres(a);
    const d = Math.sqrt(
      Math.max(0, res.circumRadius ** 2 - res.edgeRadius ** 2),
    );
    return {
      title: "正四面体同心三球关系",
      R: res.circumRadius,
      r: res.edgeRadius,
      d,
      modeLabel: "R : r棱 : r内 = 3 : √3 : 1",
      kind: "circum",
    };
  }
  if (modelType === "truncatedCone") {
    const r1 = params.r1 ?? 3;
    const r2 = params.r2 ?? 1.5;
    const h = params.h ?? 3;
    const res = calculateTruncatedConeSphere(r1, r2, h);
    const rBase = Math.min(res.circumRadius, Math.max(r1, r2));
    const d = Math.sqrt(Math.max(0, res.circumRadius ** 2 - rBase ** 2));
    return {
      title: "圆台外接球截面勾股",
      R: res.circumRadius,
      r: rBase,
      d,
      modeLabel: "R² = r₁² + d₁² = r₂² + (h-d₁)²",
      kind: "circum",
    };
  }
  const R = params.R ?? 3;
  const shapeType = params.shapeType ?? 0;
  const h = params.h ?? 3.5;
  const res = calculateSphereExtrema(R, shapeType, h);
  const d = shapeType === 0 ? res.h / 2 : Math.abs(res.R - res.h);
  return {
    title: shapeType === 0 ? "球内接圆柱截面降维" : "球内接圆锥截面降维",
    R: res.R,
    r: res.r,
    d: Math.min(res.R, d),
    modeLabel: shapeType === 0 ? "R² = r² + (h/2)²" : "r² = h(2R - h)",
    kind: "circum",
  };
}

/**
 * 空间距离页一维目标函数曲线采样（f(λ) 随 λ 变化规律与理论极值点）
 */
export function sampleSpatialDistanceCurve(
  mode:
    | "skewDistance"
    | "pointLineDistance"
    | "pointPlaneDistance"
    | "volumeExtrema",
  a: number,
  b: number,
  c: number,
  lambda: number,
  mu: number,
  isSideEdgeModel: boolean,
): ParamCurveOverlayData {
  const N = 36;
  const samples: CurveSamplePoint[] = [];

  if (mode === "skewDistance") {
    let optX = 0.5;
    let optY = Infinity;
    for (let i = 0; i <= N; i++) {
      const lam = i / N;
      const d = isSideEdgeModel
        ? solveSideEdgeAndFaceDiagonalDistance(a, b, c, lam, mu)
        : solveSkewLinesDistance(a, b, c, lam, mu);
      samples.push({ x: lam, y: d.distPQ });
      optX = d.optimalLambda;
      optY = d.minDist;
    }
    const cur = isSideEdgeModel
      ? solveSideEdgeAndFaceDiagonalDistance(a, b, c, lambda, mu)
      : solveSkewLinesDistance(a, b, c, lambda, mu);
    return {
      title: "动线段距离函数 |PQ|(λ)",
      xLabel: "λ",
      yLabel: "|PQ|",
      samples,
      currentX: lambda,
      currentY: cur.distPQ,
      optimalX: optX,
      optimalY: optY,
      optimalLabel: "当前 μ 下极小",
    };
  }

  if (mode === "pointLineDistance") {
    let minX = 0;
    let minY = Infinity;
    for (let i = 0; i <= N; i++) {
      const lam = i / N;
      const d = solveCuboidPointLineDistance(a, b, c, lam).distance;
      samples.push({ x: lam, y: d });
      if (d < minY) {
        minY = d;
        minX = lam;
      }
    }
    const cur = solveCuboidPointLineDistance(a, b, c, lambda);
    return {
      title: "点线距离函数 d(λ)",
      xLabel: "λ",
      yLabel: "d",
      samples,
      currentX: lambda,
      currentY: cur.distance,
      optimalX: minX,
      optimalY: minY,
      optimalLabel: "最小值",
    };
  }

  if (mode === "pointPlaneDistance") {
    for (let i = 1; i <= N; i++) {
      const lam = i / N;
      const d = solvePointToPlaneDistance(a, b, c, lam).distance;
      samples.push({ x: lam, y: d });
    }
    const cur = solvePointToPlaneDistance(a, b, c, lambda);
    const maxRes = solvePointToPlaneDistance(a, b, c, 1);
    return {
      title: "点面距递增曲线 d(λ)",
      xLabel: "λ",
      yLabel: "d",
      samples,
      currentX: lambda,
      currentY: cur.distance,
      optimalX: 1,
      optimalY: maxRes.distance,
      optimalLabel: "λ=1 最大",
    };
  }

  // volumeExtrema
  for (let i = 0; i <= N; i++) {
    const lam = Math.max(0.02, i / N);
    const v = solvePointToPlaneDistance(a, b, c, lam).volume;
    samples.push({ x: i / N, y: i === 0 ? 0 : v });
  }
  const cur = solvePointToPlaneDistance(a, b, c, lambda);
  return {
    title: "三棱锥体积线性函数 V(λ)",
    xLabel: "λ",
    yLabel: "V",
    samples,
    currentX: lambda,
    currentY: cur.volume,
    optimalX: 1,
    optimalY: cur.maxVolume,
    optimalLabel: "Vmax",
  };
}

/**
 * 动点存在性与最值页一维目标曲线采样
 */
export function sampleParametricPointCurve(
  mode:
    | "singlePointAngle"
    | "doublePointDistance"
    | "pyramidVolumeExtrema"
    | "surfaceShortestPath",
  a: number,
  b: number,
  c: number,
  lambda: number,
  mu: number,
  targetThetaDeg: number,
): ParamCurveOverlayData {
  const N = 36;
  const samples: CurveSamplePoint[] = [];

  if (mode === "singlePointAngle") {
    for (let i = 0; i <= N; i++) {
      const lam = i / N;
      const r = calculateSinglePointAngle(a, b, c, lam, targetThetaDeg);
      samples.push({ x: lam, y: r.dihedralDeg });
    }
    const cur = calculateSinglePointAngle(a, b, c, lambda, targetThetaDeg);
    return {
      title: "截面二面角单调曲线 θ(λ)",
      xLabel: "λ",
      yLabel: "θ(°)",
      samples,
      currentX: lambda,
      currentY: cur.dihedralDeg,
      optimalX: cur.lambdaTargetDihedral ?? undefined,
      optimalY: cur.lambdaTargetDihedral !== null ? targetThetaDeg : undefined,
      optimalLabel: "目标角",
    };
  }

  if (mode === "doublePointDistance") {
    let minX = 0;
    let minY = Infinity;
    for (let i = 0; i <= N; i++) {
      const lam = i / N;
      const d = calculateDoublePointDistance(a, b, c, lam, mu).distPQ;
      samples.push({ x: lam, y: d });
      if (d < minY) {
        minY = d;
        minX = lam;
      }
    }
    const cur = calculateDoublePointDistance(a, b, c, lambda, mu);
    return {
      title: "动线段长函数 |PQ|(λ)",
      xLabel: "λ",
      yLabel: "|PQ|",
      samples,
      currentX: lambda,
      currentY: cur.distPQ,
      optimalX: minX,
      optimalY: minY,
      optimalLabel: "极小值",
    };
  }

  if (mode === "pyramidVolumeExtrema") {
    for (let i = 0; i <= N; i++) {
      const lam = i / N;
      const v = calculatePyramidVolumeExtrema(a, b, c, lam).volumePACD;
      samples.push({ x: lam, y: v });
    }
    const cur = calculatePyramidVolumeExtrema(a, b, c, lambda);
    return {
      title: "三棱锥体积极值曲线 V(λ)",
      xLabel: "λ",
      yLabel: "V",
      samples,
      currentX: lambda,
      currentY: cur.volumePACD,
      optimalX: 1,
      optimalY: cur.maxVolumePACD,
      optimalLabel: "Vmax",
    };
  }

  // surfaceShortestPath
  for (let i = 0; i <= N; i++) {
    const lam = i / N;
    const len = calculateSurfacePath(a, b, c, lam).currentPathLength;
    samples.push({ x: lam, y: len });
  }
  const cur = calculateSurfacePath(a, b, c, lambda);
  return {
    title: "侧面折线长度 L(λ) = |AP|+|PC₁|",
    xLabel: "λ",
    yLabel: "L",
    samples,
    currentX: lambda,
    currentY: cur.currentPathLength,
    optimalX: cur.optimalLambda1,
    optimalY: cur.path1Length,
    optimalLabel: "最佳折点",
  };
}

/**
 * 截面探秘极值模式 S(t) 截面积变化曲线采样
 */
export function sampleSectionAreaCurve(
  polyhedron: Polyhedron,
  edgeStart: Vec3,
  edgeEnd: Vec3,
  pointQ: Vec3,
  pointR: Vec3,
  currentT: number,
): ParamCurveOverlayData {
  const N = 28;
  const samples: CurveSamplePoint[] = [];
  let minX = 0.05;
  let minY = Infinity;
  let maxX = 0.05;
  let maxY = -Infinity;

  for (let i = 0; i <= N; i++) {
    const t = 0.05 + (0.9 * i) / N;
    const pP = lerp(edgeStart, edgeEnd, t);
    const pl = planeFromPoints(pP, pointQ, pointR);
    const pts = intersectConvexPolyhedronPlane(polyhedron, pl);
    const details = computeSectionProjectionDetails(pts, pl.normal);
    samples.push({ x: t, y: details.area3D });
    if (details.area3D > 0) {
      if (details.area3D < minY) {
        minY = details.area3D;
        minX = t;
      }
      if (details.area3D > maxY) {
        maxY = details.area3D;
        maxX = t;
      }
    }
  }

  const curP = lerp(
    edgeStart,
    edgeEnd,
    Math.max(0.05, Math.min(0.95, currentT)),
  );
  const curPlane = planeFromPoints(curP, pointQ, pointR);
  const curPts = intersectConvexPolyhedronPlane(polyhedron, curPlane);
  const curArea = computeSectionProjectionDetails(
    curPts,
    curPlane.normal,
  ).area3D;

  return {
    title: "截面积变化函数 S(t)",
    xLabel: "t",
    yLabel: "S",
    samples,
    currentX: currentT,
    currentY: curArea,
    optimalX: Number.isFinite(maxY) ? maxX : minX,
    optimalY: Number.isFinite(maxY) ? maxY : undefined,
    optimalLabel: Number.isFinite(maxY) ? "截面极大" : undefined,
  };
}
