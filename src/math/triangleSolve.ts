/**
 * 解三角形核心数学模型与几何计算
 * 纯函数逻辑，无 React / DOM 依赖
 */

export interface Point2D {
  x: number;
  y: number;
}

export interface TriangleSolveResult {
  /** 顶点 A, B, C 的坐标 */
  points: { A: Point2D; B: Point2D; C: Point2D };
  /** 三边长 a (对BC), b (对AC), c (对AB) */
  sides: { a: number; b: number; c: number };
  /** 三内角 A, B, C (弧度) */
  anglesRad: { A: number; B: number; C: number };
  /** 三内角 A, B, C (角度) */
  anglesDeg: { A: number; B: number; C: number };
  /** 正弦比值 a/sinA = b/sinB = c/sinC */
  sineRatios: { ratioA: number; ratioB: number; ratioC: number };
  /** 面积 S */
  area: number;
  /** 外接圆半径 R 与外心 O */
  circumcircle: { radius: number; center: Point2D };
  /** 外接圆直径推导点 A' (过 B 且经过外心 O 的直径另一端点) */
  diameterPointA: Point2D;
  /** 内切圆半径 r 与内心 I */
  incircle: { radius: number; center: Point2D };
  /** 顶点 A 向 BC 所作高 FootD 坐标与高长度 ha */
  altitudeA: { foot: Point2D; length: number };
  /** 投影定理数值: c*cosB 与 b*cosC 以及垂足划分在 BC 上的分段 */
  projections: { cCosB: number; bCosC: number; footOnBC: Point2D };
}

/**
 * SSA 解个数的判据分支（唯一真源 —— 右屏文案直接渲染它，杜绝「数值与说明打架」）。
 *
 * 关键：A < 90° 与 A ≥ 90° 的判据**完全不同**。A ≥ 90° 时 A 已是最大角，
 * 由「大角对大边」必须有 a > b 才存在唯一解，a ≤ b（含 a = h 的退化）一律无解；
 * 此时若仍套用锐角的四分支判据，会出现「0 个解 (h < a < b 双解)」这类自相矛盾的说明。
 */
export type SSACaseKind =
  | "acute_no_solution" // A < 90° 且 a < h
  | "acute_right_single" // A < 90° 且 a = h（恰为直角三角形，∠B = 90°）
  | "acute_double" // A < 90° 且 h < a < b（两解）
  | "acute_single" // A < 90° 且 a ≥ b
  | "nonacute_single" // A ≥ 90° 且 a > b
  | "nonacute_no_solution"; // A ≥ 90° 且 a ≤ b（含 a = h 的退化）

export interface SSASolveResult {
  /** 解的个数: 0 | 1 | 2 */
  solutionCount: 0 | 1 | 2;
  /** 解个数判据所落的分支 */
  caseKind: SSACaseKind;
  /** 临界高 h = b * sin(A) */
  h: number;
  /** 顶点 A, C 坐标 */
  A: Point2D;
  C: Point2D;
  /** 顶点 B 的可能解坐标数组 (B1, B2) */
  solutions: Point2D[];
  /** 解对应的边角详情 */
  details: Array<{
    a: number;
    b: number;
    c: number;
    angleA: number;
    angleB: number;
    angleC: number;
  }>;
}

/**
 * 根据已知两边 b, c 和夹角 A(度数) 解三角形并构建坐标
 */
export function solveTriangleFromSAS(
  b: number,
  c: number,
  angleADeg: number,
): TriangleSolveResult {
  const radA = (angleADeg * Math.PI) / 180;

  // 余弦定理求第三边 a
  const aSq = b * b + c * c - 2 * b * c * Math.cos(radA);
  const a = Math.sqrt(Math.max(1e-6, aSq));

  // 余弦定理求内角 B, C
  const cosB = Math.max(-1, Math.min(1, (a * a + c * c - b * b) / (2 * a * c)));
  const radB = Math.acos(cosB);

  const cosC = Math.max(-1, Math.min(1, (a * a + b * b - c * c) / (2 * a * b)));
  const radC = Math.acos(cosC);

  const degA = angleADeg;
  const degB = (radB * 180) / Math.PI;
  const degC = (radC * 180) / Math.PI;

  // 面积 S = 0.5 * b * c * sinA
  const sinA = Math.sin(radA);
  const area = 0.5 * b * c * sinA;

  // 正弦比值 2R
  const ratioA = sinA > 1e-6 ? a / sinA : 0;
  const ratioB = Math.sin(radB) > 1e-6 ? b / Math.sin(radB) : 0;
  const ratioC = Math.sin(radC) > 1e-6 ? c / Math.sin(radC) : 0;

  // 外接圆半径 R = a / (2 sinA)
  const R = ratioA / 2;

  // 内切圆半径 r = S / p (p = (a+b+c)/2)
  const p = (a + b + c) / 2;
  const r = area / p;

  // ── 标准高中数学几何系：以底边 BC 为水平基准，顶点 A 在上方 ──
  // 1. 底边 BC 水平居中: B 在左 (-a/2, 0), C 在右 (a/2, 0)
  const rawBx = -a / 2;
  const rawBy = 0;
  const rawCx = a / 2;
  const rawCy = 0;

  // 2. 顶点 A (通过角 B 与边 c 确定):
  // A.x = B.x + c * cos(B) = -a/2 + c * cosB
  // A.y = c * sin(B) = ha (高线长)
  const ha = (2 * area) / a;
  const rawAx = rawBx + c * Math.cos(radB);
  const rawAy = ha;

  // 3. 计算形心 G 并平移至坐标系中心 (0, 0)
  const centroidX = (rawAx + rawBx + rawCx) / 3;
  const centroidY = (rawAy + rawBy + rawCy) / 3;

  const A: Point2D = { x: rawAx - centroidX, y: rawAy - centroidY };
  const B: Point2D = { x: rawBx - centroidX, y: rawBy - centroidY };
  const C: Point2D = { x: rawCx - centroidX, y: rawCy - centroidY };

  // 4. 外心 O 坐标计算 (到 B, C 距离相等，且到 B 距离为 R)
  // O.x = (B.x + C.x) / 2 = -centroidX
  // O.y = B.y + R * cos(A)
  const circumcenter: Point2D = {
    x: (B.x + C.x) / 2,
    y: B.y + R * Math.cos(radA),
  };

  // 外接圆直径辅助点 A': 过 C 点且经过外心 O 的直径对径点 (C' = 2*O - C)，满足 C-C' 为直径
  // 在 Rt△BC C' 中，∠C'BC = 90°，由同弧所对圆周角相等有 ∠C C' B = ∠A，故 sin A = sin C' = a / (2R)
  const diameterPointA: Point2D = {
    x: 2 * circumcenter.x - C.x,
    y: 2 * circumcenter.y - C.y,
  };

  // 5. 内心 I 坐标计算 (三顶点受边长加权平均)
  const incenterX = (a * A.x + b * B.x + c * C.x) / (a + b + c);
  const incenterY = (a * A.y + b * B.y + c * C.y) / (a + b + c);
  const incenter: Point2D = { x: incenterX, y: incenterY };

  // 6. 顶点 A 向水平底边 BC 所引垂线 FootD (垂直竖直向下)
  const footD: Point2D = {
    x: A.x,
    y: B.y,
  };

  // 投影定理分量: 底边分段 BD = c*cosB, DC = b*cosC
  const cCosB = c * Math.cos(radB);
  const bCosC = b * Math.cos(radC);

  return {
    points: { A, B, C },
    sides: { a, b, c },
    anglesRad: { A: radA, B: radB, C: radC },
    anglesDeg: { A: degA, B: degB, C: degC },
    sineRatios: { ratioA, ratioB, ratioC },
    area,
    circumcircle: { radius: R, center: circumcenter },
    diameterPointA,
    incircle: { radius: r, center: incenter },
    altitudeA: { foot: footD, length: ha },
    projections: { cCosB, bCosC, footOnBC: footD },
  };
}

export interface SSSSolveResult {
  /** 三边是否满足三角不等式（严格） */
  isValid: boolean;
  /** 不满足时的说明文案 */
  warning?: string;
  /** 有效时复用 SAS 的完整几何结果（坐标、外接圆、内切圆、投影…） */
  full?: TriangleSolveResult;
}

/**
 * SSS：已知三边 a, b, c 解三角形（三边确定唯一三角形）。
 *
 * 实现策略 —— **先求角、再委托 SAS**：由余弦定理反解出角 A
 *   cos A = (b² + c² − a²) / (2bc)
 * 然后交给 solveTriangleFromSAS(b, c, A) 产出全部几何量。因为
 *   √(b² + c² − 2bc·cos A) ≡ a
 * 两条路径给出的是**同一个三角形**，故坐标、外接圆、内切圆、投影等内容无需重复实现。
 *
 * 边界：三角不等式必须**严格**成立（取等号即三点共线退化，不构成三角形）。
 */
export function solveTriangleFromSSS(
  a: number,
  b: number,
  c: number,
): SSSSolveResult {
  if (a <= 0 || b <= 0 || c <= 0) {
    return { isValid: false, warning: "三边长必须为正数。" };
  }
  const EPS = 1e-9;
  if (a + b <= c + EPS || a + c <= b + EPS || b + c <= a + EPS) {
    return {
      isValid: false,
      warning: `三边 a = ${a.toFixed(2)}、b = ${b.toFixed(2)}、c = ${c.toFixed(2)} 不满足三角不等式：任意两边之和必须大于第三边（取等号时为三点共线退化，不构成三角形）。`,
    };
  }
  const cosA = Math.max(-1, Math.min(1, (b * b + c * c - a * a) / (2 * b * c)));
  const angleADeg = (Math.acos(cosA) * 180) / Math.PI;
  return { isValid: true, full: solveTriangleFromSAS(b, c, angleADeg) };
}

/**
 * SSA 探究模式：已知对角 A(deg)、已知边 b、已知对边 a
 */
export function solveSSA(
  a: number,
  b: number,
  angleADeg: number,
): SSASolveResult {
  const radA = (angleADeg * Math.PI) / 180;
  const sinA = Math.sin(radA);
  const h = b * sinA;

  // A ≥ 90°（含直角）时判据必须与锐角情形分流
  const isNonAcute = Math.cos(radA) <= 1e-9;

  const C: Point2D = { x: 0, y: 0 };
  const A: Point2D = { x: -b, y: 0 };

  const solutions: Point2D[] = [];
  const details: SSASolveResult["details"] = [];

  const diff = a * a - h * h;

  let solutionCount: 0 | 1 | 2 = 0;
  let caseKind: SSACaseKind;

  if (diff < -1e-5) {
    solutionCount = 0;
    caseKind = isNonAcute ? "nonacute_no_solution" : "acute_no_solution";
  } else if (Math.abs(diff) <= 1e-5) {
    const t = b * Math.cos(radA);
    if (t > 1e-6) {
      solutionCount = 1;
      caseKind = "acute_right_single";
      const B1 = { x: -b + t * Math.cos(radA), y: t * sinA };
      solutions.push(B1);

      const angleB = Math.PI / 2;
      const angleC = Math.PI / 2 - radA;
      details.push({
        a,
        b,
        c: t,
        angleA: radA,
        angleB,
        angleC,
      });
    } else {
      // A ≥ 90° 且 a = h：此时 t = b·cosA ≤ 0，不构成三角形 → 无解
      caseKind = "nonacute_no_solution";
    }
  } else {
    const sqrtDiff = Math.sqrt(diff);
    const cosA = Math.cos(radA);
    const t1 = b * cosA + sqrtDiff;
    const t2 = b * cosA - sqrtDiff;

    const validTs = [t1, t2].filter((t) => t > 1e-6);

    if (validTs.length === 2) {
      solutionCount = 2;
      caseKind = "acute_double";
      for (const t of validTs) {
        const B = { x: -b + t * Math.cos(radA), y: t * sinA };
        solutions.push(B);

        const cVal = t;
        const radB_calc = Math.acos(
          Math.max(
            -1,
            Math.min(1, (cVal * cVal + a * a - b * b) / (2 * cVal * a)),
          ),
        );
        const radC_calc = Math.PI - radA - radB_calc;
        details.push({
          a,
          b,
          c: cVal,
          angleA: radA,
          angleB: radB_calc,
          angleC: radC_calc,
        });
      }
    } else if (validTs.length === 1) {
      solutionCount = 1;
      // A < 90° 时必为 a ≥ b 分支；A ≥ 90° 时必为 a > b 分支
      caseKind = isNonAcute ? "nonacute_single" : "acute_single";
      const t = validTs[0];
      const B = { x: -b + t * Math.cos(radA), y: t * sinA };
      solutions.push(B);

      const cVal = t;
      const radB_calc = Math.acos(
        Math.max(
          -1,
          Math.min(1, (cVal * cVal + a * a - b * b) / (2 * cVal * a)),
        ),
      );
      const radC_calc = Math.PI - radA - radB_calc;
      details.push({
        a,
        b,
        c: cVal,
        angleA: radA,
        angleB: radB_calc,
        angleC: radC_calc,
      });
    } else {
      // 两个根都不合法 → 无解（A ≥ 90° 且 a ≤ b 即为此情形）
      caseKind = "nonacute_no_solution";
    }
  }

  return {
    solutionCount,
    caseKind,
    h,
    A,
    C,
    solutions,
    details,
  };
}

export interface BisectorMedianResult {
  base: TriangleSolveResult;
  /** 内角平分线交点 D 坐标 */
  pointD: Point2D;
  /** 底边中点 M 坐标 */
  pointM: Point2D;
  /** 角平分线长 ta */
  bisectorLength: number;
  /** 中线长 ma */
  medianLength: number;
  /** 边 BD 长度 */
  sideBD: number;
  /** 边 DC 长度 */
  sideDC: number;
  /** 分三角形 ABD 面积 */
  areaABD: number;
  /** 分三角形 ACD 面积 */
  areaACD: number;
  /** 向量基底分解系数: AD = lambda * AB + mu * AC */
  vectorWeights: { lambda: number; mu: number };
}

export function solveBisectorAndMedian(
  b: number,
  c: number,
  angleADeg: number,
): BisectorMedianResult {
  const base = solveTriangleFromSAS(b, c, angleADeg);
  const { points, sides, area, anglesRad } = base;
  const { B, C } = points;
  const { a } = sides;

  // 角平分线交点 D: 由 BD / DC = c / b 分点公式 => D = (b * B + c * C) / (b + c)
  const sumBC = b + c;
  const lambda = b / sumBC;
  const mu = c / sumBC;

  const pointD: Point2D = {
    x: (b * B.x + c * C.x) / sumBC,
    y: (b * B.y + c * C.y) / sumBC,
  };

  // 底边中点 M
  const pointM: Point2D = {
    x: (B.x + C.x) / 2,
    y: (B.y + C.y) / 2,
  };

  // 角平分线长 ta = 2bc cos(A/2) / (b + c)
  const radA = anglesRad.A;
  const bisectorLength = (2 * b * c * Math.cos(radA / 2)) / sumBC;

  // 中线长 ma = 0.5 * sqrt(2b^2 + 2c^2 - a^2)
  const medianLength =
    0.5 * Math.sqrt(Math.max(0, 2 * b * b + 2 * c * c - a * a));

  const sideBD = (c / sumBC) * a;
  const sideDC = (b / sumBC) * a;

  const areaABD = (c / sumBC) * area;
  const areaACD = (b / sumBC) * area;

  return {
    base,
    pointD,
    pointM,
    bisectorLength,
    medianLength,
    sideBD,
    sideDC,
    areaABD,
    areaACD,
    vectorWeights: { lambda, mu },
  };
}

/**
 * 由顶点 A 的拖拽数学位置及顶点 B, C 坐标反解内角 A (角度制)
 * 几何本质：向量 AB 与 AC 的夹角 arccos((AB · AC) / (|AB| * |AC|))
 * 当拖拽点位于理论点时，反解角精准等于原角 A，握点跳变严格为 0
 *
 * 注意：**中屏顶点 A 的拖拽已改用 solveAngleAFromVertexPosition（轨迹最近点投影）**。
 * 本函数把光标位置当作 A 直接代入夹角公式，而 A 的竖直坐标对角度非单调，
 * 在 A ≲ 32° 区间会导致手柄逆光标；横坐标也只是相对单调（b > c 反向、b = c 恒为 0）。
 * 故本函数保留作为通用「由三点求内角」几何工具，不再承担拖拽映射职责。
 */
export function solveAngleAFromVertices(
  posA: Point2D,
  posB: Point2D,
  posC: Point2D,
  fallbackAngle: number = 60,
): number {
  const vAB = { x: posB.x - posA.x, y: posB.y - posA.y };
  const vAC = { x: posC.x - posA.x, y: posC.y - posA.y };
  const modAB = Math.hypot(vAB.x, vAB.y);
  const modAC = Math.hypot(vAC.x, vAC.y);
  if (modAB < 1e-5 || modAC < 1e-5) {
    return fallbackAngle;
  }
  const dot = vAB.x * vAC.x + vAB.y * vAC.y;
  const cosA = Math.max(-1, Math.min(1, dot / (modAB * modAC)));
  return (Math.acos(cosA) * 180) / Math.PI;
}

/** 顶点 A 在给定内角下的数学坐标（含形心平移），与 solveTriangleFromSAS 的几何约定完全一致 */
function vertexPositionAt(angleADeg: number, b: number, c: number): Point2D {
  return solveTriangleFromSAS(b, c, angleADeg).points.A;
}

/**
 * 由**拖拽光标的数学位置**反解内角 A —— 顶点 A 拖拽映射的唯一真源。
 *
 * 为什么不沿用「光标相对 B、C 的夹角」反解（solveAngleAFromVertices，旧实现）：
 * 顶点 A 的**竖直**坐标对角度 A° 并非单调（b = 5, c = 6 时 A.y 在 ≈ 32° 处取极大），
 * 于是 A ≲ 32° 的区间里手柄会逆着光标方向运动；而 A 的**横坐标**也只是相对单调
 * （实测 b < c 时严格递减、b > c 时严格递增、b = c 时恒为 0 完全退化），
 * 任何「单分量反解」都必然在某个参数区间失效。
 *
 * 因此这里改用对任意 (b, c) 都成立的**轨迹最近点投影**：在 [minA, maxA] 上粗采样
 * 定位离光标最近的轨迹点，再在该点邻域内用黄金分割细化。返回角度所对应的 A
 * 一定落在真实轨迹上，且随光标连续变化 —— 拖拽方向不再逆光标，也不会震荡。
 *
 * @param px,py 拖拽光标的数学坐标
 * @param b,c   已知两边（A 的两条邻边，a 为对边 BC）
 * @param minA,maxA 角度搜索域（度）
 * @returns 反解出的内角 A（度）
 */
export function solveAngleAFromVertexPosition(
  px: number,
  py: number,
  b: number,
  c: number,
  minA = 1,
  maxA = 179,
): number {
  const sqDistAt = (angleADeg: number): number => {
    const p = vertexPositionAt(angleADeg, b, c);
    const dx = p.x - px;
    const dy = p.y - py;
    return dx * dx + dy * dy;
  };

  // 1. 粗采样定位全局极小（步长 ≈ 0.75°，足以把极小锁定在单峰邻域内）
  const SAMPLES = 240;
  const step = (maxA - minA) / SAMPLES;
  let bestA = minA;
  let bestD = Infinity;
  for (let i = 0; i <= SAMPLES; i++) {
    const angle = minA + step * i;
    const d = sqDistAt(angle);
    if (d < bestD) {
      bestD = d;
      bestA = angle;
    }
  }

  // 2. 在极小点邻域内黄金分割细化（距离函数在极小附近单峰）
  const INV_PHI = (Math.sqrt(5) - 1) / 2;
  let lo = Math.max(minA, bestA - step);
  let hi = Math.min(maxA, bestA + step);
  let x1 = hi - INV_PHI * (hi - lo);
  let x2 = lo + INV_PHI * (hi - lo);
  for (let i = 0; i < 60; i++) {
    if (sqDistAt(x1) < sqDistAt(x2)) {
      hi = x2;
      x2 = x1;
      x1 = hi - INV_PHI * (hi - lo);
    } else {
      lo = x1;
      x1 = x2;
      x2 = lo + INV_PHI * (hi - lo);
    }
  }
  return (lo + hi) / 2;
}
