/**
 * src/features/conicDefinition/math/conicDefinition.ts
 * 纯数学函数库，零 React / DOM / Side-effects
 */

export interface Point2D {
  x: number;
  y: number;
}

export interface ConicSceneData {
  points: Point2D[]; // 主轨迹曲线采样点 (双曲线分多段)
  branches?: Point2D[][]; // 针对双曲线等多分支曲线
  foci: { f1: Point2D; f2?: Point2D };
  directrix?: { x: number } | { y: number };
  pPoint: Point2D;
  d1: number;
  d2?: number;
  dl?: number;
  isDegenerate: boolean;
  degenerateReason?: string;
  auxiliaryCircles?: { center: Point2D; r: number }[]; // 辅助圆 (动圆法)
  stringPolygon?: Point2D[]; // 绳圈法折线
}

/**
 * 求解第一定义模式下的轨迹数据
 */
export function getFirstDefData(
  conicType: "ellipse" | "hyperbola" | "parabola",
  a: number,
  c: number,
  p: number,
  theta: number,
): ConicSceneData {
  if (conicType === "ellipse") {
    if (a <= c) {
      // 退化状态
      return {
        points: [
          { x: -c, y: 0 },
          { x: c, y: 0 },
        ],
        foci: { f1: { x: -c, y: 0 }, f2: { x: c, y: 0 } },
        pPoint: { x: a * Math.cos(theta), y: 0 },
        d1: c + a * Math.cos(theta),
        d2: c - a * Math.cos(theta),
        isDegenerate: true,
        degenerateReason:
          a === c ? "2a = 2c 退化为线段 F₁F₂" : "2a < 2c 无轨迹",
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
    const f1 = { x: -c, y: 0 };
    const f2 = { x: c, y: 0 };
    const d1 = Math.hypot(px - f1.x, py - f1.y);
    const d2 = Math.hypot(px - f2.x, py - f2.y);

    return {
      points,
      foci: { f1, f2 },
      pPoint: { x: px, y: py },
      d1,
      d2,
      isDegenerate: false,
      stringPolygon: [f1, { x: px, y: py }, f2],
    };
  }

  if (conicType === "hyperbola") {
    if (a >= c) {
      return {
        points: [],
        foci: { f1: { x: -c, y: 0 }, f2: { x: c, y: 0 } },
        pPoint: { x: c, y: 0 },
        d1: 2 * c,
        d2: 0,
        isDegenerate: true,
        degenerateReason: a === c ? "2a = 2c 退化为两条射线" : "2a > 2c 无轨迹",
      };
    }
    const b = Math.sqrt(c * c - a * a);
    const numSamples = 80;
    const rightBranch: Point2D[] = [];
    const leftBranch: Point2D[] = [];
    const maxT = 1.3; // t 参数限制

    for (let i = -numSamples; i <= numSamples; i++) {
      const t = (i / numSamples) * maxT;
      const secT = 1 / Math.cos(t);
      const tanT = Math.tan(t);
      rightBranch.push({ x: a * secT, y: b * tanT });
      leftBranch.push({ x: -a * secT, y: b * tanT });
    }

    const clampedTheta = Math.max(
      -1.2,
      Math.min(1.2, (theta % (Math.PI * 2)) - Math.PI / 2),
    );
    const px = a * (1 / Math.cos(clampedTheta));
    const py = b * Math.tan(clampedTheta);
    const f1 = { x: -c, y: 0 };
    const f2 = { x: c, y: 0 };
    const d1 = Math.hypot(px - f1.x, py - f1.y);
    const d2 = Math.hypot(px - f2.x, py - f2.y);

    return {
      points: rightBranch,
      branches: [leftBranch, rightBranch],
      foci: { f1, f2 },
      pPoint: { x: px, y: py },
      d1,
      d2,
      isDegenerate: false,
    };
  }

  // 抛物线 y^2 = 2px
  const numSamples = 100;
  const points: Point2D[] = [];
  const maxY = 5;
  for (let i = -numSamples; i <= numSamples; i++) {
    const y = (i / numSamples) * maxY;
    const x = (y * y) / (2 * p);
    points.push({ x, y });
  }

  const py = ((theta % Math.PI) - Math.PI / 2) * 2.5;
  const px = (py * py) / (2 * p);
  const f = { x: p / 2, y: 0 };
  const d1 = Math.hypot(px - f.x, py);
  const dl = px + p / 2;

  return {
    points,
    foci: { f1: f },
    directrix: { x: -p / 2 },
    pPoint: { x: px, y: py },
    d1,
    dl,
    isDegenerate: false,
  };
}

/**
 * 求解统一定义 (离心率 e) 模式下的轨迹数据
 * 固定焦点 F(2, 0)，准线 L: x = -1
 */
export function getUnifiedDefData(e: number, theta: number): ConicSceneData {
  const fx = 2.0;
  const lx = -1.0;
  const f = { x: fx, y: 0 };

  // 统一定义极坐标方程 (极点在焦点 F，极轴向右): r = e * d_0 / (1 - e * cosθ)
  // 其中 d_0 是焦点到准线的距离 d_0 = fx - lx = 3
  const d0 = fx - lx; // 3.0
  const points: Point2D[] = [];

  if (e < 1) {
    // 椭圆
    const numSamples = 120;
    for (let i = 0; i <= numSamples; i++) {
      const t = (i / numSamples) * 2 * Math.PI;
      const r = (e * d0) / (1 - e * Math.cos(t));
      // 极坐标转换为以原点为中心的直角坐标 (极点在 (fx, 0)，向左方向是 θ=π)
      // 注意准线在左侧，所以动点到准线距离 dl = x - lx
      // 这里极角 θ 是从焦点 F 向右算的角
      const x = fx - r * Math.cos(t);
      const y = r * Math.sin(t);
      points.push({ x, y });
    }
  } else if (Math.abs(e - 1.0) < 1e-4) {
    // 抛物线 y^2 = 2 * d0 * (x - fx + d0/2)
    const numSamples = 100;
    for (let i = -numSamples; i <= numSamples; i++) {
      const y = (i / numSamples) * 5;
      const x = (y * y) / (2 * d0) + (fx - d0 / 2);
      points.push({ x, y });
    }
  } else {
    // 双曲线 (e > 1)
    const numSamples = 80;
    for (let i = -numSamples; i <= numSamples; i++) {
      const t = (i / numSamples) * 1.1; // 避免分母为 0
      const r = (e * d0) / (1 - e * Math.cos(t));
      const x = fx - r * Math.cos(t);
      const y = r * Math.sin(t);
      points.push({ x, y });
    }
  }

  // 动点 P 示例
  const tP = theta % (2 * Math.PI);
  const rP = Math.abs((e * d0) / (1 - e * Math.cos(tP)));
  const px = fx - rP * Math.cos(tP);
  const py = rP * Math.sin(tP);

  const df = Math.hypot(px - fx, py);
  const dl = Math.abs(px - lx);

  return {
    points,
    foci: { f1: f },
    directrix: { x: lx },
    pPoint: { x: px, y: py },
    d1: df,
    dl,
    isDegenerate: false,
  };
}

/**
 * 动圆切线轨迹法数据
 */
export function getLocusGenData(
  conicType: "ellipse" | "hyperbola",
  a: number,
  c: number,
  theta: number,
): ConicSceneData {
  const f1 = { x: -c, y: 0 };
  const f2 = { x: c, y: 0 };
  const R = 2 * a;

  // 定圆以 F1 为圆心，半径 R
  const auxiliaryCircles: { center: Point2D; r: number }[] = [
    { center: f1, r: R },
  ];

  // 动点 Q 在定圆上
  const qx = f1.x + R * Math.cos(theta);
  const qy = f1.y + R * Math.sin(theta);
  const Q = { x: qx, y: qy };

  // 动圆圆心 M 为 F2与Q 连线的垂直平分线 与 F1Q 的交点
  // 椭圆场景: M 到 F1 的距离 + M 到 F2 的距离 = R
  const b =
    conicType === "ellipse"
      ? Math.sqrt(Math.max(0.1, a * a - c * c))
      : Math.sqrt(Math.max(0.1, c * c - a * a));

  let mx = 0;
  let my = 0;

  if (conicType === "ellipse") {
    // 椭圆参数
    mx = a * Math.cos(theta);
    my = b * Math.sin(theta);
  } else {
    // 双曲线
    const secT = 1 / Math.cos(theta * 0.4);
    mx = a * secT;
    my = b * Math.tan(theta * 0.4);
  }

  const d1 = Math.hypot(mx - f1.x, my - f1.y);
  const d2 = Math.hypot(mx - f2.x, my - f2.y);

  // 动圆半径为 |MF2|
  auxiliaryCircles.push({ center: { x: mx, y: my }, r: d2 });

  return {
    points: [], // 由动画组件直接画
    foci: { f1, f2 },
    pPoint: { x: mx, y: my },
    d1,
    d2,
    isDegenerate: false,
    auxiliaryCircles,
    stringPolygon: [f1, { x: mx, y: my }, Q, f2],
  };
}
