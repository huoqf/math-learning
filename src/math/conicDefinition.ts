/**
 * src/math/conicDefinition.ts
 * 纯数学函数库，零 React / DOM / Side-effects
 * 严格遵循高中数学课标与新高考规范：
 * 1. 第一定义：
 *    - 椭圆: |PF1| + |PF2| = 2a (2a > 2c > 0)；2a = 2c 退化为线段；2a < 2c 无轨迹
 *    - 双曲线: ||PF1| - |PF2|| = 2a (0 < 2a < 2c)；2a = 2c 退化为两端向外延伸的射线；2a > 2c 无轨迹
 *    - 抛物线: |PF| = d_l (p > 0)
 * 2. 统一定义 (第二定义 / 焦准比法):
 *    - d_F / d_l = e (0 < e < 1 椭圆，e = 1 抛物线，e > 1 包含左右双分支的双曲线)
 * 3. 精准无跳变的反向拖拽算法，彻底杜绝跨支瞬移与坐标乱飞
 */

export interface Point2D {
  x: number;
  y: number;
}

export interface ConicSceneData {
  points: Point2D[]; // 主轨迹曲线采样点 (单支或封闭曲线)
  branches?: Point2D[][]; // 多分支曲线 (如双曲线左右两支、退化两射线)
  asymptotes?: { x1: number; y1: number; x2: number; y2: number }[]; // 渐近线
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

    if (a < c) {
      // 严格无轨迹
      return {
        points: [],
        foci: { f1, f2 },
        pPoint: { x: 0, y: 0 },
        d1: c,
        d2: c,
        isDegenerate: true,
        degenerateReason:
          "2a < 2c：两边之和小于第三边，平面内不存在满足轨迹条件的点",
      };
    }

    if (a === c) {
      // 临界退化: 线段 F1F2
      const segT = (Math.cos(theta) + 1) / 2; // [0, 1]
      const px = -c + 2 * c * segT;
      const py = 0;
      const d1 = Math.abs(px - f1.x);
      const d2 = Math.abs(px - f2.x);

      return {
        points: [f1, f2],
        foci: { f1, f2 },
        pPoint: { x: px, y: py },
        d1,
        d2,
        isDegenerate: true,
        degenerateReason: "2a = 2c：动点轨迹退化为连接两焦点 F₁F₂ 的线段",
      };
    }

    // 正常椭圆 a > c
    const b = Math.sqrt(a * a - c * c);
    const numSamples = 120;
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
    const maxX = 7.5;

    if (a > c) {
      // 严格无轨迹
      return {
        points: [],
        branches: [],
        foci: { f1, f2 },
        pPoint: { x: 0, y: 0 },
        d1: c,
        d2: c,
        isDegenerate: true,
        degenerateReason:
          "2a > 2c：三角形两边之差不能大于第三边，平面内无满足条件的轨迹",
      };
    }

    if (a === c) {
      // 临界退化: 以 F1, F2 为端点向外延伸的两条射线
      const leftRay: Point2D[] = [{ x: -maxX, y: 0 }, f1];
      const rightRay: Point2D[] = [f2, { x: maxX, y: 0 }];

      // theta 决定在左射线还是右射线
      const isRight = theta >= 0 && theta < Math.PI;
      const offset = Math.abs(Math.sin(theta)) * 3.5;
      const px = isRight ? c + offset : -c - offset;
      const py = 0;
      const d1 = Math.abs(px - f1.x);
      const d2 = Math.abs(px - f2.x);

      return {
        points: [],
        branches: [leftRay, rightRay],
        foci: { f1, f2 },
        pPoint: { x: px, y: py },
        d1,
        d2,
        isDegenerate: true,
        degenerateReason:
          "2a = 2c：动点轨迹退化为以 F₁, F₂ 为端点向外延伸的两条反向射线",
      };
    }

    // 正常双曲线 c > a > 0
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
      if (Math.abs(rx) <= maxX && Math.abs(ry) <= 5.5) {
        rightBranch.push({ x: rx, y: ry });
        leftBranch.push({ x: -rx, y: ry });
      }
    }

    // 渐近线 y = ±(b/a)x
    const slope = b / a;
    const asymptotes = [
      { x1: -maxX, y1: -maxX * slope, x2: maxX, y2: maxX * slope },
      { x1: -maxX, y1: maxX * slope, x2: maxX, y2: -maxX * slope },
    ];

    // 动点 P：[0, π) 为右支，[π, 2π) 为左支，中心均为 y = 0
    const normTheta = ((theta % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
    const isRight = normTheta < Math.PI;
    const subAngle = isRight ? normTheta : normTheta - Math.PI;
    // u ∈ [-1, 1]
    const u = (subAngle - Math.PI / 2) / (Math.PI / 2);
    const t = Math.max(-1.2, Math.min(1.2, u * 1.15));
    const secT = 1 / Math.cos(t);
    const tanT = Math.tan(t);

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

  // 抛物线 y^2 = 2px (标准方程，焦点 (p/2, 0)，准线 x = -p/2)
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
 * 2. 求解统一定义 (第二定义 / 焦准比法) 模式下的轨迹数据
 * 焦点 F(p/2, 0)，准线 L: x = -p/2 (焦准距为 p)
 * 几何方程: (x - p/2)^2 + y^2 = e^2 * (x + p/2)^2
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
  const maxX = 7.5;

  const points: Point2D[] = [];
  let branches: Point2D[][] | undefined = undefined;
  let asymptotes:
    { x1: number; y1: number; x2: number; y2: number }[] | undefined =
    undefined;

  let px = 0;
  let py = 0;

  if (validE < 1.0) {
    // 椭圆: 极坐标形式 r = e*p / (1 - e*cos(phi))，中心在 (p/2 + e^2*p/(1-e^2), 0)
    const numSamples = 120;
    for (let i = 0; i <= numSamples; i++) {
      const phi = (i / numSamples) * 2 * Math.PI;
      const r = (validE * dFocusDirectrix) / (1 - validE * Math.cos(phi));
      const x = f.x + r * Math.cos(phi);
      const y = f.y + r * Math.sin(phi);
      points.push({ x, y });
    }

    const rP = (validE * dFocusDirectrix) / (1 - validE * Math.cos(theta));
    px = f.x + rP * Math.cos(theta);
    py = f.y + rP * Math.sin(theta);
  } else if (Math.abs(validE - 1.0) < 1e-4) {
    // 抛物线: e = 1，标准抛物线 y^2 = 2px，顶点在原点 (0, 0)
    const numSamples = 100;
    const maxY = 4.8;
    for (let i = -numSamples; i <= numSamples; i++) {
      const y = (i / numSamples) * maxY;
      const x = (y * y) / (2 * validP);
      points.push({ x, y });
    }

    const normT = Math.max(0, Math.min(2 * Math.PI, theta));
    py = (normT / Math.PI - 1) * 3.8;
    px = (py * py) / (2 * validP);
  } else {
    // 双曲线: e > 1，高中数学标准推导包含左右两支！
    // 中心 x0 = -p*(e^2+1)/(2*(e^2-1))，实半轴 a = e*p/(e^2-1)，虚半轴 b = e*p/sqrt(e^2-1)
    const e2 = validE * validE;
    const x0 = (-validP * (e2 + 1)) / (2 * (e2 - 1));
    const a = (validE * validP) / (e2 - 1);
    const b = (validE * validP) / Math.sqrt(e2 - 1);

    const numSamples = 60;
    const leftBranch: Point2D[] = [];
    const rightBranch: Point2D[] = [];

    for (let i = -numSamples; i <= numSamples; i++) {
      const t = (i / numSamples) * 1.25;
      const secT = 1 / Math.cos(t);
      const tanT = Math.tan(t);
      const rx = x0 + a * secT; // 右支 (靠近右焦点 F)
      const lxPt = x0 - a * secT; // 左支 (在准线左侧)
      const y = b * tanT;

      if (Math.abs(rx) <= maxX && Math.abs(y) <= 5.5) {
        rightBranch.push({ x: rx, y });
      }
      if (Math.abs(lxPt) <= maxX && Math.abs(y) <= 5.5) {
        leftBranch.push({ x: lxPt, y });
      }
    }

    branches = [leftBranch, rightBranch];

    // 渐近线过双曲线中心 (x0, 0)，斜率 k = ±b/a = ±sqrt(e^2-1)
    const slope = b / a;
    asymptotes = [
      {
        x1: x0 - maxX,
        y1: -maxX * slope,
        x2: x0 + maxX,
        y2: maxX * slope,
      },
      {
        x1: x0 - maxX,
        y1: maxX * slope,
        x2: x0 + maxX,
        y2: -maxX * slope,
      },
    ];

    // 动点 P：[0, π) 映射右支，[π, 2π) 映射左支
    const normTheta = ((theta % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
    const isRight = normTheta < Math.PI;
    const subAngle = isRight ? normTheta : normTheta - Math.PI;
    const u = (subAngle - Math.PI / 2) / (Math.PI / 2);
    const t = Math.max(-1.2, Math.min(1.2, u * 1.15));
    const secT = 1 / Math.cos(t);
    const tanT = Math.tan(t);

    px = isRight ? x0 + a * secT : x0 - a * secT;
    py = b * tanT;
  }

  const df = Math.hypot(px - f.x, py - f.y);
  const dl = Math.abs(px - lx);

  return {
    points,
    branches,
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
 * 3. 精准反向拖拽解算函数（零跳变，稳定闭环）
 */
export function solveThetaFromDrag(
  studyMode: "firstDef" | "unifiedDef",
  conicType: "ellipse" | "hyperbola" | "parabola",
  newMathPt: Point2D,
  params: { a: number; c: number; e: number; p: number },
): number {
  const { a, c, p, e } = params;

  if (studyMode === "firstDef") {
    if (conicType === "ellipse") {
      if (a <= c) {
        // 退化线段上拖拽
        const clampedX = Math.max(-c, Math.min(c, newMathPt.x));
        const segT = (clampedX + c) / (2 * c || 1); // [0, 1]
        const angle = Math.acos(Math.max(-1, Math.min(1, segT * 2 - 1)));
        return Number(angle.toFixed(3));
      }
      const b = Math.sqrt(a * a - c * c);
      let angle = Math.atan2(newMathPt.y / b, newMathPt.x / a);
      if (angle < 0) angle += 2 * Math.PI;
      return Number(angle.toFixed(3));
    }

    if (conicType === "hyperbola") {
      if (a >= c) {
        // 退化射线上拖拽
        const isRight = newMathPt.x >= 0;
        const offset = Math.max(0, Math.min(3.5, Math.abs(newMathPt.x) - c));
        const sinVal = Math.min(1, offset / 3.5);
        const delta = Math.asin(sinVal);
        const thetaVal = isRight ? delta : Math.PI + delta;
        return Number(thetaVal.toFixed(3));
      }

      const b = Math.sqrt(c * c - a * a);
      const isRight = newMathPt.x >= 0;
      // 反解 t: y = b * tan(t) => t = atan(y / b)
      const t = Math.atan(newMathPt.y / b);
      const u = Math.max(-0.95, Math.min(0.95, t / 1.15));
      // 保证 isRight 时 theta 严格落在 [0.025π, 0.975π]，左支严格落在 [1.025π, 1.975π]
      const angle = isRight
        ? Math.PI / 2 + u * (Math.PI / 2)
        : 1.5 * Math.PI + u * (Math.PI / 2);
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
  if (e < 1.0) {
    const fx = p / 2;
    let angle = Math.atan2(newMathPt.y, newMathPt.x - fx);
    if (angle < 0) angle += 2 * Math.PI;
    return Number(angle.toFixed(3));
  }

  if (Math.abs(e - 1.0) < 1e-4) {
    const clampedY = Math.max(-3.8, Math.min(3.8, newMathPt.y));
    const solvedTheta = (clampedY / 3.8 + 1) * Math.PI;
    return Number(solvedTheta.toFixed(3));
  }

  // 双曲线统一定义 (e > 1)
  const e2 = e * e;
  const x0 = (-p * (e2 + 1)) / (2 * (e2 - 1));
  const b = (e * p) / Math.sqrt(e2 - 1);
  const isRight = newMathPt.x >= x0;
  const t = Math.atan(newMathPt.y / b);
  const u = Math.max(-0.95, Math.min(0.95, t / 1.15));
  const angle = isRight
    ? Math.PI / 2 + u * (Math.PI / 2)
    : 1.5 * Math.PI + u * (Math.PI / 2);
  return Number(
    (((angle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)).toFixed(3),
  );
}
