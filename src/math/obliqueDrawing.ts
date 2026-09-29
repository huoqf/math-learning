/**
 * 斜二测画法 (Oblique Oblique-Drawing) 纯数学模型
 * 依据：2019 人教 A 版必修第二册 8.2 节《立体图形的直观图》
 *
 * 核心规则：
 * 1. 原平面图形中 x 轴与 y 轴垂直，在直观图中 x' 轴与 y' 轴夹角为 45° (或 135°)；
 * 2. 平行于 x 轴的线段在直观图中平行于 x' 轴且长度保持不变；
 * 3. 平行于 y 轴的线段在直观图中平行于 y' 轴且长度折半 (乘以 1/2)；
 * 4. 空间几何体中平行于 z 轴的线段在直观图中垂直于 x' 轴且长度保持不变；
 * 5. 面积变换恒等式：S_直观 = (√2 / 4) * S_原，即 S_原 = 2√2 * S_直观。
 */

export interface Point2D {
  x: number;
  y: number;
}

export interface ObliquePolygon {
  name: string;
  originalPoints: Point2D[];
  obliquePoints: Point2D[];
  originalArea: number;
  obliqueArea: number;
  areaRatio: number;
}

export type PolygonPresetKey =
  | "square"
  | "rectangle"
  | "rightTriangle"
  | "isoscelesTrapezoid"
  | "regularHexagon";

/**
 * 2D 平面点经斜二测变换得到直观图坐标 (x', y')
 * @param pt 原始坐标 (x, y)
 * @param alphaDeg 斜轴夹角（标准为 45°）
 * @param ratioY y 轴收缩比例（标准为 0.5）
 */
export function transformToOblique(
  pt: Point2D,
  alphaDeg = 45,
  ratioY = 0.5,
): Point2D {
  const alphaRad = (alphaDeg * Math.PI) / 180;
  // x' = x + y * cos(alpha) * ratioY
  // y' = y * sin(alpha) * ratioY
  return {
    x: pt.x + pt.y * Math.cos(alphaRad) * ratioY,
    y: pt.y * Math.sin(alphaRad) * ratioY,
  };
}

/**
 * 斜二测直观图坐标反向还原为原始坐标 (x, y)
 */
export function restoreFromOblique(
  ptPrime: Point2D,
  alphaDeg = 45,
  ratioY = 0.5,
): Point2D {
  const alphaRad = (alphaDeg * Math.PI) / 180;
  const sinAlpha = Math.sin(alphaRad);
  if (Math.abs(sinAlpha) < 1e-6 || Math.abs(ratioY) < 1e-6) {
    return { x: ptPrime.x, y: 0 };
  }
  const y = ptPrime.y / (sinAlpha * ratioY);
  const x = ptPrime.x - y * Math.cos(alphaRad) * ratioY;
  return { x, y };
}

/**
 * 多边形鞋带公式求面积 (Shoelace formula)
 */
export function calculatePolygonArea(points: Point2D[]): number {
  const n = points.length;
  if (n < 3) return 0;
  let sum = 0;
  for (let i = 0; i < n; i++) {
    const next = (i + 1) % n;
    sum += points[i].x * points[next].y - points[next].x * points[i].y;
  }
  return Math.abs(sum) / 2;
}

/**
 * 依据预设类型与特征尺寸构建标准平面多边形
 */
export function buildPresetPolygon(
  type: PolygonPresetKey,
  params: { a: number; b: number; h?: number },
  alphaDeg = 45,
  ratioY = 0.5,
): ObliquePolygon {
  const { a, b } = params;
  const h = params.h ?? b;
  let originalPoints: Point2D[] = [];
  let name = "";

  switch (type) {
    case "square":
      name = "正方形";
      originalPoints = [
        { x: 0, y: 0 },
        { x: a, y: 0 },
        { x: a, y: a },
        { x: 0, y: a },
      ];
      break;

    case "rectangle":
      name = "矩形";
      originalPoints = [
        { x: 0, y: 0 },
        { x: a, y: 0 },
        { x: a, y: b },
        { x: 0, y: b },
      ];
      break;

    case "rightTriangle":
      name = "直角三角形";
      originalPoints = [
        { x: 0, y: 0 },
        { x: a, y: 0 },
        { x: 0, y: b },
      ];
      break;

    case "isoscelesTrapezoid": {
      name = "等腰梯形";
      // 下底 a, 上底 b (a >= b), 高 h
      const offset = Math.max(0, (a - b) / 2);
      originalPoints = [
        { x: 0, y: 0 },
        { x: a, y: 0 },
        { x: a - offset, y: h },
        { x: offset, y: h },
      ];
      break;
    }

    case "regularHexagon": {
      name = "正六边形";
      const r = a / 2;
      const pts: Point2D[] = [];
      for (let i = 0; i < 6; i++) {
        const rad = (i * Math.PI) / 3;
        pts.push({
          x: r + r * Math.cos(rad),
          y: r + r * Math.sin(rad),
        });
      }
      originalPoints = pts;
      break;
    }
  }

  const obliquePoints = originalPoints.map((p) =>
    transformToOblique(p, alphaDeg, ratioY),
  );
  const originalArea = calculatePolygonArea(originalPoints);
  const obliqueArea = calculatePolygonArea(obliquePoints);
  const areaRatio = originalArea > 1e-6 ? obliqueArea / originalArea : 0;

  return {
    name,
    originalPoints,
    obliquePoints,
    originalArea,
    obliqueArea,
    areaRatio,
  };
}

/**
 * 高考典型真题逆向还原计算（已知直观图为等腰梯形/三角形，求原图形面积与周长）
 */
export interface GaokaoInverseProblem {
  title: string;
  obliqueShape: string;
  obliqueArea: number;
  calculatedOriginalArea: number;
  theoreticalFactor: number; // 2 * √2 ≈ 2.8284
  explanation: string;
}

export function solveGaokaoInverse(
  obliqueArea: number,
  alphaDeg = 45,
  ratioY = 0.5,
): GaokaoInverseProblem {
  const alphaRad = (alphaDeg * Math.PI) / 180;
  // S_直观 = S_原 * ratioY * sin(alpha)
  // 当 ratioY = 0.5, alpha = 45° 时，ratioY * sin(45°) = 0.5 * (√2/2) = √2/4
  const factor = ratioY * Math.sin(alphaRad);
  const calculatedOriginalArea = factor > 1e-6 ? obliqueArea / factor : 0;
  const theoreticalFactor = factor > 1e-6 ? 1 / factor : 0;

  return {
    title: "已知直观图面积反求原平面图形面积",
    obliqueShape: "水平放置的多边形直观图",
    obliqueArea,
    calculatedOriginalArea,
    theoreticalFactor,
    explanation: `依据斜二测面积公式 S_直观 = (√2/4) S_原，原平面图形面积 S_原 = 2√2 * S_直观 ≈ ${calculatedOriginalArea.toFixed(2)}。`,
  };
}
