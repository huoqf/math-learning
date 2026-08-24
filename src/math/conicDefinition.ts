/**
 * src/math/conicDefinition.ts
 * 纯数学函数库，零 React / DOM / Side-effects
 * 专注高中数学与新高考两大核心圆锥曲线范式：
 * 1. 第一定义：距离之和 / 距离之差 / 准线距离
 * 2. 统一定义：离心率 e 焦准距比值法 (d_F / d_l = e)
 */

export interface Point2D {
  x: number;
  y: number;
}

export interface ConicSceneData {
  points: Point2D[]; // 主轨迹曲线采样点
  branches?: Point2D[][]; // 多分支曲线 (如双曲线左右两支)
  asymptotes?: { x1: number; y1: number; x2: number; y2: number }[]; // 双曲线渐近线
  foci: { f1: Point2D; f2?: Point2D };
  directrix?: { x: number }; // 准线方程 x = const
  pPoint: Point2D; // 动点 P
  d1: number; // |PF1| 或 d_F
  d2?: number; // |PF2|
  dl?: number; // 到准线距离 d_l
  isDegenerate: boolean;
  degenerateReason?: string;
}

/**
 * 1. 求解第一定义模式下的轨迹数据
 * - 椭圆: |PF1| + |PF2| = 2a (a > c)
 * - 双曲线: ||PF1| - |PF2|| = 2a (c > a)
 * - 抛物线: |PF| = d_l (p > 0)
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
      // 临界退化: 线段 F1F2 (a = c) 或 无轨迹 (a < c)
      return {
        points: [f1, f2],
        foci: { f1, f2 },
        pPoint: {
          x: -c + 2 * c * ((Math.cos(theta) + 1) / 2),
          y: 0,
        },
        d1: c + -c + 2 * c * ((Math.cos(theta) + 1) / 2),
        d2: c - (-c + 2 * c * ((Math.cos(theta) + 1) / 2)),
        isDegenerate: true,
        degenerateReason:
          a === c
            ? "2a = 2c：轨迹退化为连接两焦点 F₁F₂ 的线段"
            : "2a < 2c：两点间线段最短，平面内不存在满足条件的点",
      };
    }

    const b = Math.sqrt(a * a - c * c);
    const numSamples = 100;
    const points: Point2D[] = [];
    for (let i = 0; i <= numSamples; i++) {
      const ang = (i / numSamples) * 2 * Math.PI;
      points.push({
        x: a * Math.cos(ang),
        y: b * Math.sin(ang),
      });
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

    if (c <= a) {
      // 临界退化: 射线 (2a = 2c) 或 无轨迹 (2a > 2c)
      return {
        points: [],
        foci: { f1, f2 },
        pPoint: { x: c, y: 0 },
        d1: 2 * c,
        d2: 0,
        isDegenerate: true,
        degenerateReason:
          a === c
            ? "2a = 2c：轨迹退化为以 F₁, F₂ 为端点向外延伸的两条射线"
            : "2a > 2c：三角形两边之差不能大于第三边，无轨迹",
      };
    }

    const b = Math.sqrt(c * c - a * a);
    const numSamples = 60;
    const leftBranch: Point2D[] = [];
    const rightBranch: Point2D[] = [];

    for (let i = -numSamples; i <= numSamples; i++) {
      const t = (i / numSamples) * 1.25;
      const secT = 1 / Math.cos(t);
      const tanT = Math.tan(t);
      const rx = a * secT;
      const ry = b * tanT;
      if (Math.abs(rx) <= 8 && Math.abs(ry) <= 6) {
        rightBranch.push({ x: rx, y: ry });
        leftBranch.push({ x: -rx, y: ry });
      }
    }

    // 渐近线 y = ±(b/a)x
    const slope = b / a;
    const maxX = 7;
    const asymptotes = [
      { x1: -maxX, y1: -maxX * slope, x2: maxX, y2: maxX * slope },
      { x1: -maxX, y1: maxX * slope, x2: maxX, y2: -maxX * slope },
    ];

    // 动点 P
    const isRight = Math.cos(theta) >= 0;
    const t = (Math.sin(theta) * 1.1).toFixed(3);
    const numT = parseFloat(t);
    const secT = 1 / Math.cos(numT);
    const tanT = Math.tan(numT);
    const px = isRight ? a * secT : -a * secT;
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

  // theta 线性单调映射到动点 y 坐标 ∈ [-3.8, 3.8]
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
 * 2. 求解统一定义 (第二定义) 模式下的轨迹数据
 * 极坐标标准形式: r = e*p / (1 - e*cosθ) (以焦点为极点，准线在 x = -p/2)
 * 笛卡尔坐标: F(p/2, 0), 准线 L: x = -p/2
 */
export function getUnifiedDefData(
  e: number,
  p: number,
  theta: number,
): ConicSceneData {
  const validP = Math.max(0.1, p);
  const validE = Math.max(0.05, e);
  const f: Point2D = { x: validP / 2, y: 0 };
  const lx = -validP / 2;
  const dFocusDirectrix = validP;

  const points: Point2D[] = [];
  let asymptotes:
    { x1: number; y1: number; x2: number; y2: number }[] | undefined =
    undefined;

  if (validE < 1.0) {
    // 椭圆: 离心率 e < 1
    const numSamples = 120;
    for (let i = 0; i <= numSamples; i++) {
      const phi = (i / numSamples) * 2 * Math.PI;
      const r = (validE * dFocusDirectrix) / (1 - validE * Math.cos(phi));
      const x = f.x + r * Math.cos(phi);
      const y = f.y + r * Math.sin(phi);
      points.push({ x, y });
    }
  } else if (Math.abs(validE - 1.0) < 1e-4) {
    // 抛物线: 离心率 e = 1
    const maxPhi = 2.4;
    const numSamples = 100;
    for (let i = -numSamples; i <= numSamples; i++) {
      const phi = (i / numSamples) * maxPhi;
      const r = dFocusDirectrix / (1 - Math.cos(phi));
      const x = f.x + r * Math.cos(phi);
      const y = f.y + r * Math.sin(phi);
      if (Math.abs(x) <= 8 && Math.abs(y) <= 6) {
        points.push({ x, y });
      }
    }
  } else {
    // 双曲线: 离心率 e > 1
    const phiAsymptote = Math.acos(1 / validE);
    const maxOffset = phiAsymptote - 0.12;
    const numSamples = 60;

    for (let i = -numSamples; i <= numSamples; i++) {
      const u = (i / numSamples) * maxOffset;
      const phi = Math.PI + u;
      const r = (validE * dFocusDirectrix) / (1 - validE * Math.cos(phi));
      const x = f.x + r * Math.cos(phi);
      const y = f.y + r * Math.sin(phi);
      if (Math.abs(x) <= 8 && Math.abs(y) <= 6) {
        points.push({ x, y });
      }
    }

    // 渐近线
    const slope = Math.tan(phiAsymptote);
    const cVal = (validE * validE * dFocusDirectrix) / (validE * validE - 1);
    const cx = f.x - cVal;
    const maxX = 7;
    asymptotes = [
      {
        x1: cx - maxX,
        y1: -maxX * slope,
        x2: cx + maxX,
        y2: maxX * slope,
      },
      {
        x1: cx - maxX,
        y1: maxX * slope,
        x2: cx + maxX,
        y2: -maxX * slope,
      },
    ];
  }

  // 计算动点 P
  let actualPhi = theta;
  if (validE >= 1.0) {
    const maxPhi =
      validE === 1.0 ? 2.4 : Math.PI - Math.acos(1 / validE) - 0.12;
    const mapped = Math.sin(theta) * maxPhi;
    actualPhi = Math.PI + mapped;
  }

  const rP = (validE * dFocusDirectrix) / (1 - validE * Math.cos(actualPhi));
  const px = f.x + rP * Math.cos(actualPhi);
  const py = f.y + rP * Math.sin(actualPhi);

  const df = Math.hypot(px - f.x, py - f.y);
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
 * 3. 精准反向拖拽解算函数
 */
export function solveThetaFromDrag(
  studyMode: "firstDef" | "unifiedDef",
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

  // 统一定义
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
