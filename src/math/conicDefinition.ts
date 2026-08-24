/**
 * src/math/conicDefinition.ts
 * 纯数学函数库，零 React / DOM / Side-effects
 * 提供圆锥曲线第一定义、统一定义(第二定义)、动圆切线几何生成法的数据求解与精准反向拖拽解算。
 */

export interface Point2D {
  x: number;
  y: number;
}

export interface AuxiliaryCircle {
  center: Point2D;
  r: number;
  label?: string;
  isFixed?: boolean;
}

export interface AuxiliarySegment {
  p1: Point2D;
  p2: Point2D;
  dashed?: boolean;
  colorKey?: string;
  label?: string;
}

export interface ConicSceneData {
  points: Point2D[]; // 主轨迹曲线采样点
  branches?: Point2D[][]; // 多分支曲线 (如双曲线左右两支)
  asymptotes?: { x1: number; y1: number; x2: number; y2: number }[]; // 双曲线渐近线
  foci: { f1: Point2D; f2?: Point2D };
  directrix?: { x: number }; // 准线方程 x = const
  pPoint: Point2D; // 动点 P 或 动圆心 M
  d1: number; // |PF1| 或 d_F
  d2?: number; // |PF2|
  dl?: number; // 到准线距离 d_l
  isDegenerate: boolean;
  degenerateReason?: string;
  // 动圆法 / 几何生成特有图元
  auxiliaryCircles?: AuxiliaryCircle[];
  auxiliarySegments?: AuxiliarySegment[];
  qPoint?: Point2D; // 定圆上的动点 Q
  nPoint?: Point2D; // F2Q 的中点 N
  bisectorLine?: { x1: number; y1: number; x2: number; y2: number }; // 垂直平分线
  rightAngleMarks?: {
    vertex: Point2D;
    dirA: Point2D;
    dirB: Point2D;
  }[];
}

/**
 * 1. 求解第一定义模式下的轨迹数据
 */
export function getFirstDefData(
  conicType: "ellipse" | "hyperbola" | "parabola",
  a: number,
  c: number,
  p: number,
  theta: number,
): ConicSceneData {
  if (conicType === "ellipse") {
    const f1: Point2D = { x: -c, y: 0 };
    const f2: Point2D = { x: c, y: 0 };

    if (a <= c) {
      const px = Math.max(-c, Math.min(c, a * Math.cos(theta)));
      return {
        points: [
          { x: -c, y: 0 },
          { x: c, y: 0 },
        ],
        foci: { f1, f2 },
        pPoint: { x: px, y: 0 },
        d1: Math.abs(px - f1.x),
        d2: Math.abs(px - f2.x),
        isDegenerate: true,
        degenerateReason:
          a === c
            ? "2a = 2c 退化为线段 F₁F₂"
            : "2a < 2c 无轨迹 (不满足两边之和大于第三边)",
      };
    }

    const b = Math.sqrt(a * a - c * c);
    const numSamples = 120;
    const points: Point2D[] = [];
    for (let i = 0; i <= numSamples; i++) {
      const t = (i / numSamples) * 2 * Math.PI;
      points.push({ x: a * Math.cos(t), y: b * Math.sin(t) });
    }

    const px = a * Math.cos(theta);
    const py = b * Math.sin(theta);
    const d1 = Math.hypot(px - f1.x, py - f1.y);
    const d2 = Math.hypot(px - f2.x, py - f2.y);

    return {
      points,
      foci: { f1, f2 },
      pPoint: { x: px, y: py },
      d1,
      d2,
      isDegenerate: false,
    };
  }

  if (conicType === "hyperbola") {
    const f1: Point2D = { x: -c, y: 0 };
    const f2: Point2D = { x: c, y: 0 };

    if (a >= c) {
      return {
        points: [],
        branches: [],
        foci: { f1, f2 },
        pPoint: { x: c, y: 0 },
        d1: 2 * c,
        d2: 0,
        isDegenerate: true,
        degenerateReason:
          a === c
            ? "2a = 2c 退化为以 F₁, F₂ 为端点的两条反向射线"
            : "2a > 2c 无轨迹 (三角形两边之差不能大于第三边)",
      };
    }

    const b = Math.sqrt(c * c - a * a);
    const numSamples = 80;
    const rightBranch: Point2D[] = [];
    const leftBranch: Point2D[] = [];
    const maxT = 1.35; // 限制参数范围在显示窗口内

    for (let i = -numSamples; i <= numSamples; i++) {
      const t = (i / numSamples) * maxT;
      const secT = 1 / Math.cos(t);
      const tanT = Math.tan(t);
      const rx = a * secT;
      const ry = b * tanT;
      if (Math.abs(rx) <= 8 && Math.abs(ry) <= 6) {
        rightBranch.push({ x: rx, y: ry });
        leftBranch.push({ x: -rx, y: ry });
      }
    }

    // 渐近线: y = ±(b/a)x
    const slope = b / a;
    const asymptotes = [
      { x1: -7, y1: -7 * slope, x2: 7, y2: 7 * slope },
      { x1: -7, y1: 7 * slope, x2: 7, y2: -7 * slope },
    ];

    // 将 theta 映射为双曲参数
    // theta ∈ [0, π) 在右支，[π, 2π) 在左支
    const normalizedTheta =
      ((theta % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
    const isRightBranch = normalizedTheta < Math.PI;
    const subParam = isRightBranch
      ? (normalizedTheta - Math.PI / 2) / (Math.PI / 2)
      : (normalizedTheta - 1.5 * Math.PI) / (Math.PI / 2);
    const subT = Math.sin(subParam * Math.PI * 0.5) * 1.25;

    const secT = 1 / Math.cos(subT);
    const tanT = Math.tan(subT);
    const px = (isRightBranch ? a : -a) * secT;
    const py = b * tanT;

    const d1 = Math.hypot(px - f1.x, py - f1.y);
    const d2 = Math.hypot(px - f2.x, py - f2.y);

    return {
      points: rightBranch,
      branches: [leftBranch, rightBranch],
      asymptotes,
      foci: { f1, f2 },
      pPoint: { x: px, y: py },
      d1,
      d2,
      isDegenerate: false,
    };
  }

  // 抛物线 y^2 = 2px (标准方程，焦点在 x 轴正半轴)
  const validP = Math.max(0.1, p);
  const numSamples = 100;
  const points: Point2D[] = [];
  const maxY = 4.8;
  for (let i = -numSamples; i <= numSamples; i++) {
    const y = (i / numSamples) * maxY;
    const x = (y * y) / (2 * validP);
    points.push({ x, y });
  }

  // theta 线性单调映射到动点 y 坐标 ∈ [-4.0, 4.0]
  const normT = Math.max(0, Math.min(2 * Math.PI, theta));
  const py = (normT / Math.PI - 1) * 3.8;
  const px = (py * py) / (2 * validP);
  const f: Point2D = { x: validP / 2, y: 0 };
  const lx = -validP / 2;

  const d1 = Math.hypot(px - f.x, py);
  const dl = px - lx;

  return {
    points,
    foci: { f1: f },
    directrix: { x: lx },
    pPoint: { x: px, y: py },
    d1,
    dl,
    isDegenerate: false,
  };
}

/**
 * 2. 求解统一定义 (离心率 e 与焦准距 p) 下的轨迹数据
 * 设定统一标准：焦点 F(p/2, 0)，准线 L: x = -p/2，焦准距 d0 = p
 * 极坐标方程 (以 F 为极点，极轴向右): r = e * p / (1 - e * cos(θ_F))
 * 其中动点到准线距离 dl = x - lx = r * cos(θ_F) + p
 * 验算: r / dl = r / (r * cos(θ_F) + p) = e
 */
export function getUnifiedDefData(
  e: number,
  p: number,
  theta: number,
): ConicSceneData {
  const validE = Math.max(0.05, e);
  const validP = Math.max(0.5, p);
  const fx = validP / 2;
  const lx = -validP / 2;
  const f: Point2D = { x: fx, y: 0 };

  const points: Point2D[] = [];
  let asymptotes:
    { x1: number; y1: number; x2: number; y2: number }[] | undefined =
    undefined;

  if (validE < 1.0) {
    // 椭圆 (闭合光滑)
    const numSamples = 120;
    for (let i = 0; i <= numSamples; i++) {
      const t = (i / numSamples) * 2 * Math.PI;
      const r = (validE * validP) / (1 - validE * Math.cos(t));
      const x = fx + r * Math.cos(t);
      const y = r * Math.sin(t);
      points.push({ x, y });
    }
  } else if (Math.abs(validE - 1.0) < 1e-4) {
    // 抛物线 (顶点在 θ = π，向右开弧)
    const numSamples = 100;
    const maxT = 2.45;
    for (let i = -numSamples; i <= numSamples; i++) {
      const t = (i / numSamples) * maxT;
      const ang = Math.PI + t;
      const r = validP / (1 - Math.cos(ang) + 1e-5);
      const x = fx + r * Math.cos(ang);
      const y = r * Math.sin(ang);
      if (Math.abs(x) <= 8 && Math.abs(y) <= 6) {
        points.push({ x, y });
      }
    }
  } else {
    // 双曲线 (e > 1)，围绕焦点 F 的右支，顶点在 θ = π
    const numSamples = 80;
    const maxT = Math.PI - Math.acos(1 / validE) - 0.08;
    for (let i = -numSamples; i <= numSamples; i++) {
      const t = (i / numSamples) * maxT;
      const ang = Math.PI + t;
      const r = (validE * validP) / (1 - validE * Math.cos(ang));
      const x = fx + r * Math.cos(ang);
      const y = r * Math.sin(ang);
      if (Math.abs(x) <= 8 && Math.abs(y) <= 6) {
        points.push({ x, y });
      }
    }

    // 渐近线: 中心在 x0 = fx - (e^2*p)/(e^2-1)
    const x0 = fx - (validE * validE * validP) / (validE * validE - 1);
    const slope = Math.sqrt(validE * validE - 1);
    asymptotes = [
      { x1: x0 - 6, y1: -6 * slope, x2: x0 + 6, y2: 6 * slope },
      { x1: x0 - 6, y1: 6 * slope, x2: x0 + 6, y2: -6 * slope },
    ];
  }

  // 动点 P 真实解算
  let angle = ((theta % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
  if (validE >= 1.0) {
    const maxSafeT =
      validE === 1.0 ? 2.4 : Math.PI - Math.acos(1 / validE) - 0.12;
    const t = Math.sin(theta) * maxSafeT;
    angle = Math.PI + t;
  }
  const rP = (validE * validP) / (1 - validE * Math.cos(angle));
  const px = fx + rP * Math.cos(angle);
  const py = rP * Math.sin(angle);

  const df = Math.hypot(px - fx, py);
  const dl = Math.abs(px - lx);

  return {
    points,
    asymptotes,
    foci: { f1: f },
    directrix: { x: lx },
    pPoint: { x: px, y: py },
    d1: df,
    dl,
    isDegenerate: false,
  };
}

/**
 * 3. 求解动圆切线几何生成法 (以定圆为基准生成椭圆/双曲线)
 * 定圆 C1: 圆心 F1(-c, 0)，半径 R = 2a
 * 定点 F2: (c, 0)
 * 动点 Q: 在定圆 C1 上运动
 * 垂直平分线: 线段 F2Q 的中垂线
 * 动圆圆心 M: 射线 F1Q 与中垂线的交点
 * 动圆半径 r_M = |MF2| = |MQ|
 * 轨迹:
 *   c < a (F2在圆内) => |MF1| + |MF2| = |MF1| + |MQ| = R = 2a (椭圆)
 *   c > a (F2在圆外) => ||MF1| - |MF2|| = ||MF1| - |MQ|| = R = 2a (双曲线)
 */
export function getLocusGenData(
  conicType: "ellipse" | "hyperbola",
  a: number,
  c: number,
  theta: number,
): ConicSceneData {
  const f1: Point2D = { x: -c, y: 0 };
  const f2: Point2D = { x: c, y: 0 };
  const R = 2 * a;

  // 定圆
  const auxiliaryCircles: AuxiliaryCircle[] = [
    { center: f1, r: R, label: "定圆 C₁ (R=2a)", isFixed: true },
  ];

  // 定圆上动点 Q
  const qx = f1.x + R * Math.cos(theta);
  const qy = f1.y + R * Math.sin(theta);
  const qPoint: Point2D = { x: qx, y: qy };

  // F2Q 中点 N
  const nx = (f2.x + qx) / 2;
  const ny = (f2.y + qy) / 2;
  const nPoint: Point2D = { x: nx, y: ny };

  // F2Q 的垂直平分线
  const dxQ = qx - f1.x; // R * cosθ
  const dyQ = qy - f1.y; // R * sinθ
  const dxF2Q = qx - f2.x;
  const dyF2Q = qy - f2.y;

  const denom = dxF2Q * dxQ + dyF2Q * dyQ;
  let mx = 0;
  let my = 0;
  let isDegenerate = false;
  let degenerateReason: string | undefined = undefined;

  if (Math.abs(denom) < 1e-4) {
    isDegenerate = true;
    degenerateReason = "中垂线与半径平行，交点在无穷远 (渐近线方向)";
    mx = nx;
    my = ny;
  } else {
    const numer = dxF2Q * (nx - f1.x) + dyF2Q * (ny - f1.y);
    const t = numer / denom;
    mx = f1.x + t * dxQ;
    my = f1.y + t * dyQ;
  }

  const d1 = Math.hypot(mx - f1.x, my - f1.y);
  const d2 = Math.hypot(mx - f2.x, my - f2.y);

  // 动圆 (圆心 M，半径 d2)，做视口越界保护
  if (!isDegenerate && Math.abs(mx) < 10 && Math.abs(my) < 8 && d2 < 15) {
    auxiliaryCircles.push({
      center: { x: mx, y: my },
      r: d2,
      label: "动圆 M",
      isFixed: false,
    });
  }

  // 垂直平分线可视化线段
  const perpDir = { x: -dyF2Q, y: dxF2Q };
  const perpLen = Math.hypot(perpDir.x, perpDir.y);
  let bisectorLine:
    { x1: number; y1: number; x2: number; y2: number } | undefined = undefined;
  if (perpLen > 1e-4) {
    const unitPerp = { x: perpDir.x / perpLen, y: perpDir.y / perpLen };
    bisectorLine = {
      x1: nx - unitPerp.x * 6,
      y1: ny - unitPerp.y * 6,
      x2: nx + unitPerp.x * 6,
      y2: ny + unitPerp.y * 6,
    };
  }

  // 辅助连线
  const auxiliarySegments: AuxiliarySegment[] = [
    {
      p1: f1,
      p2: qPoint,
      dashed: true,
      colorKey: "paramPrimary",
      label: "F₁Q",
    },
    {
      p1: f2,
      p2: qPoint,
      dashed: true,
      colorKey: "paramSecondary",
      label: "F₂Q",
    },
    {
      p1: { x: mx, y: my },
      p2: f2,
      dashed: false,
      colorKey: "paramSecondary",
      label: "MF₂",
    },
  ];

  // 生成理论轨迹曲线与渐近线
  const locusPoints: Point2D[] = [];
  let locusBranches: Point2D[][] | undefined = undefined;
  let asymptotes:
    { x1: number; y1: number; x2: number; y2: number }[] | undefined =
    undefined;

  if (conicType === "ellipse" && a > c) {
    const b = Math.sqrt(a * a - c * c);
    const numSamples = 100;
    for (let i = 0; i <= numSamples; i++) {
      const ang = (i / numSamples) * 2 * Math.PI;
      locusPoints.push({ x: a * Math.cos(ang), y: b * Math.sin(ang) });
    }
  } else if (conicType === "hyperbola" && c > a) {
    const b = Math.sqrt(c * c - a * a);
    const numSamples = 60;
    const leftBr: Point2D[] = [];
    const rightBr: Point2D[] = [];
    for (let i = -numSamples; i <= numSamples; i++) {
      const tParam = (i / numSamples) * 1.25;
      const secT = 1 / Math.cos(tParam);
      const tanT = Math.tan(tParam);
      const rx = a * secT;
      const ry = b * tanT;
      if (Math.abs(rx) <= 8 && Math.abs(ry) <= 6) {
        rightBr.push({ x: rx, y: ry });
        leftBr.push({ x: -rx, y: ry });
      }
    }
    locusBranches = [leftBr, rightBr];

    const slope = b / a;
    asymptotes = [
      { x1: -7, y1: -7 * slope, x2: 7, y2: 7 * slope },
      { x1: -7, y1: 7 * slope, x2: 7, y2: -7 * slope },
    ];
  }

  return {
    points: locusPoints,
    branches: locusBranches,
    asymptotes,
    foci: { f1, f2 },
    pPoint: { x: mx, y: my },
    d1,
    d2,
    isDegenerate,
    degenerateReason,
    auxiliaryCircles,
    auxiliarySegments,
    qPoint,
    nPoint,
    bisectorLine,
    rightAngleMarks: [
      {
        vertex: nPoint,
        dirA: { x: qx - f2.x, y: qy - f2.y },
        dirB: { x: perpDir.x, y: perpDir.y },
      },
    ],
  };
}

/**
 * 4. 精准反向拖拽解算函数
 */
export function solveThetaFromDrag(
  studyMode: "firstDef" | "unifiedDef" | "locusGen",
  conicType: "ellipse" | "hyperbola" | "parabola",
  newMathPt: Point2D,
  params: { a: number; c: number; e: number; p: number },
): number {
  const { a, c, p } = params;

  if (studyMode === "firstDef") {
    if (conicType === "ellipse") {
      const b = a > c ? Math.sqrt(a * a - c * c) : 1;
      let angle = Math.atan2(newMathPt.y / b, newMathPt.x / a);
      if (angle < 0) angle += 2 * Math.PI;
      return Number(angle.toFixed(3));
    }
    if (conicType === "hyperbola") {
      const b = c > a ? Math.sqrt(c * c - a * a) : 1;
      const isRight = newMathPt.x >= 0;
      const t = Math.atan(newMathPt.y / b);
      const normalizedSubParam = Math.max(-0.95, Math.min(0.95, t / 1.25));
      const angle = isRight
        ? normalizedSubParam * (Math.PI / 2) + Math.PI / 2
        : normalizedSubParam * (Math.PI / 2) + 1.5 * Math.PI;
      return Number(
        (((angle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)).toFixed(3),
      );
    }
    if (conicType === "parabola") {
      const clampedY = Math.max(-3.8, Math.min(3.8, newMathPt.y));
      const solvedTheta = (clampedY / 3.8 + 1) * Math.PI;
      return Number(solvedTheta.toFixed(3));
    }
  }

  if (studyMode === "unifiedDef") {
    const fx = p / 2;
    let angle = Math.atan2(newMathPt.y, newMathPt.x - fx);
    if (angle < 0) angle += 2 * Math.PI;
    if (params.e < 1.0) {
      return Number(angle.toFixed(3));
    }
    let t = angle - Math.PI;
    if (t > Math.PI) t -= 2 * Math.PI;
    if (t < -Math.PI) t += 2 * Math.PI;
    const maxT =
      params.e === 1.0 ? 2.4 : Math.PI - Math.acos(1 / params.e) - 0.12;
    const clampedT = Math.max(-maxT, Math.min(maxT, t));
    const asinVal = Math.asin(clampedT / maxT);
    return Number((asinVal >= 0 ? asinVal : asinVal + 2 * Math.PI).toFixed(3));
  }

  // 动圆法：从 Q 点极角反求
  const f1 = { x: -c, y: 0 };
  let angle = Math.atan2(newMathPt.y - f1.y, newMathPt.x - f1.x);
  if (angle < 0) angle += 2 * Math.PI;
  return Number(angle.toFixed(3));
}
