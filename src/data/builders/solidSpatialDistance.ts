import type {
  MathPanelData,
  MathQuantity,
  Theorem,
  GaokaoPoint,
  WarningItem,
  ReasoningStep,
} from "../types";
import { MATH_COLORS } from "@/theme";
import {
  solveSkewLinesDistance,
  solveSideEdgeAndFaceDiagonalDistance,
  solvePointPlaneDistance,
} from "@/math3d/spatialDistance";

// ── know-solid-distance: 异面直线公垂线与空间距离动态极值 ──

export function buildSpatialDistancePanel(
  params: Record<string, number>,
  config?: Record<string, unknown>,
): MathPanelData {
  const mode = (config?.mode as string) ?? "skewDistance";
  const preset = (config?.preset as string) ?? "free";
  const a = params.a ?? 3;
  const b = params.b ?? 2;
  const c = params.c ?? 2;
  const lambda = params.lambda ?? 0.5;
  const mu = params.mu ?? 0.4;

  const quantities: MathQuantity[] = [];
  const theorems: Theorem[] = [];
  const gaokaoPoints: GaokaoPoint[] = [];
  const warnings: WarningItem[] = [];
  const reasoningSteps: ReasoningStep[] = [];
  let examAnchor = "";
  let mnemonic = "";

  if (mode === "skewDistance") {
    // 异面直线公垂线与距离极值模式
    const isEdgeModel = preset === "sideEdge";
    const isCube =
      preset === "cube" || (Math.abs(a - b) < 1e-4 && Math.abs(b - c) < 1e-4);
    const skew = isEdgeModel
      ? solveSideEdgeAndFaceDiagonalDistance(a, b, c, lambda, mu)
      : solveSkewLinesDistance(a, b, c, lambda, mu);

    examAnchor = "新高考解答题 · 空间向量法求异面直线公垂线与动点极值";
    mnemonic =
      "异面求距选向量，外积法矢射影长；双垂直处公垂足，平行平面化点面。";

    // 1. 几何特征量与代数解（附录区）
    quantities.push(
      {
        label: isEdgeModel ? "异面直线 1 (BB₁)" : "异面直线 1 (A₁B)",
        symbol: "\\vec{u}",
        value: isEdgeModel ? `(0, 0, ${c})` : `(${a}, 0, -${c})`,
        color: MATH_COLORS.paramPrimary,
        isInvariant: true,
        invariantNote: "直线方向向量固定",
      },
      {
        label: "异面直线 2 (AC)",
        symbol: "\\vec{v}",
        value: `(${a}, ${b}, 0)`,
        color: MATH_COLORS.paramSecondary,
        isInvariant: true,
        invariantNote: "直线方向向量固定",
      },
      {
        label: "动点 P 实时坐标",
        symbol: "P(\\lambda)",
        value: `(${skew.P.x.toFixed(2)}, ${skew.P.y.toFixed(2)}, ${skew.P.z.toFixed(2)})`,
        color: MATH_COLORS.paramPrimary,
      },
      {
        label: "动点 Q 实时坐标",
        symbol: "Q(\\mu)",
        value: `(${skew.Q.x.toFixed(2)}, ${skew.Q.y.toFixed(2)}, 0)`,
        color: MATH_COLORS.paramSecondary,
      },
      {
        label: "动线段实时距离 |PQ|",
        symbol: "|PQ|",
        value: Number(skew.distPQ.toFixed(4)),
        color: skew.isAtPerpendicular
          ? MATH_COLORS.paramTertiary
          : MATH_COLORS.highlight,
        highlight: skew.isAtPerpendicular ? "extreme" : undefined,
      },
      {
        label: "公垂线最短距离 d_min",
        symbol: isCube ? "d_{\\min} = \\frac{\\sqrt{3}}{3}a" : "d_{\\min}",
        value: Number(skew.minDist.toFixed(4)),
        color: MATH_COLORS.paramTertiary,
        isInvariant: true,
        invariantNote: isCube
          ? "正方体面对角线公垂距离恒为 (√3/3)a（定值不变量）"
          : "长方体尺寸确定时公垂距离为全局最小值（唯一不变量）",
      },
      {
        label: "公垂方向向量 n",
        symbol: "\\vec{n}_{\\perp}",
        value: `(${skew.nRaw.x.toFixed(1)}, ${skew.nRaw.y.toFixed(1)}, ${skew.nRaw.z.toFixed(1)})`,
        color: MATH_COLORS.accent,
        isInvariant: true,
        invariantNote: "两异面直线确定唯一的空间正交公垂方向",
      },
    );

    // 2. 核心数学警示（高中数学核心概念与临界辨析，拒绝无意义浮点误差报告）
    if (skew.isAtPerpendicular) {
      warnings.push({
        text: `【极值命中 · 双垂直成立】动线段 $PQ$ 此时严格重合于公垂线段 $H_1H_2$！两垂足处建立双直角关系（$H_1H_2 \\perp l_1$ 且 $H_1H_2 \\perp l_2$），空间两点距离取得全局唯一最小值 $d_{\\min} = ${skew.minDist.toFixed(4)}$。`,
        level: "info",
      });
    } else {
      warnings.push({
        text: `【非极值斜线状态】当前线段 $PQ$ 为异面斜线段（$|PQ| > d_{\\min}$）。由空间向量正交基底分解原理，因未同时垂直于两直线，线段长度必严格大于公垂线段。`,
        level: "warning",
      });
    }

    warnings.push({
      text: "【高中数学易错警示】证明公垂线段必须分别交代 $H_1H_2 \\perp l_1$ 与 $H_1H_2 \\perp l_2$ 两组垂直关系，两者缺一不可；若仅与单条直线垂直，则仅为射影垂线而非公垂线。",
      level: "warning",
    });

    // 3. 高考大题三步推演链（保留严谨代数参数式，绝非定点数值）
    if (isEdgeModel) {
      reasoningSteps.push(
        {
          step: 1,
          title: "建立空间直角坐标系并参数化动点代数坐标",
          detail: `以 $A$ 为原点建立空间直角坐标系 $A\\text{-}xyz$。侧棱 $BB_1$ 与对角线 $AC$ 的方向向量及动点代数坐标为：`,
          latex: `\\begin{aligned} &\\vec{u} = (0, 0, ${c}), \\quad \\vec{v} = (${a}, ${b}, 0) \\\\[1ex] &P(\\lambda) = (a, 0, \\lambda c) = (${a}, 0, ${c.toFixed(1)}\\lambda) \\\\[1ex] &Q(\\mu) = (\\mu a, \\mu b, 0) = (${a}\\mu, ${b}\\mu, 0), \\quad \\lambda, \\mu \\in [0, 1] \\end{aligned}`,
          rubric: "高考大题采分点：建立坐标系与确定动点参数代数式（4分）",
        },
        {
          step: 2,
          title: "利用双垂直正交条件联立求解公垂足参数",
          detail:
            "公垂向量 $\\vec{PQ}$ 同时垂直于侧棱 $BB_1$ 与底面对角线 $AC$，列出正交方程组：",
          latex: `\\begin{aligned} &\\begin{cases} \\vec{PQ} \\cdot \\vec{u} = -c^2\\lambda = 0 \\\\[1ex] \\vec{PQ} \\cdot \\vec{v} = (a^2+b^2)\\mu - a^2 = 0 \\end{cases} \\\\[1.5ex] \\implies &\\begin{cases} \\lambda^* = 0 \\\\[1.5ex] \\mu^* = \\dfrac{a^2}{a^2+b^2} = ${((a * a) / (a * a + b * b)).toFixed(4)} \\end{cases} \\end{aligned}`,
          rubric: "高考大题采分点：正交方程组构建与解析解求解（4分）",
        },
        {
          step: 3,
          title: "化归平行平面法与平面几何求解最短距离",
          detail:
            "转化为点 $B$ 到截面 $ACC_1A_1$ 的距离，即 $\\text{Rt}\\triangle ABC$ 斜边 $AC$ 上的高：",
          latex: `\\begin{aligned} d_{\\min} &= \\frac{a b}{\\sqrt{a^2 + b^2}} \\\\[1.5ex] &= \\frac{${a} \\times ${b}}{\\sqrt{${a}^2 + ${b}^2}} \\approx ${skew.minDist.toFixed(4)} \\end{aligned}`,
          rubric: "高考大题采分点：线面平行转化与斜边高距离计算（4分）",
        },
      );
    } else {
      reasoningSteps.push(
        {
          step: 1,
          title: "建立空间直角坐标系并参数化动点代数坐标",
          detail: `以 $A$ 为原点建立空间直角坐标系 $A\\text{-}xyz$。两异面直线的方向向量及动点代数坐标为：`,
          latex: `\\begin{aligned} &\\vec{u} = (${a}, 0, -${c}), \\quad \\vec{v} = (${a}, ${b}, 0) \\\\[1ex] &P(\\lambda) = (\\lambda a, 0, (1-\\lambda)c) = (${a}\\lambda, 0, ${c.toFixed(1)}(1-\\lambda)) \\\\[1ex] &Q(\\mu) = (\\mu a, \\mu b, 0) = (${a}\\mu, ${b}\\mu, 0), \\quad \\lambda, \\mu \\in [0, 1] \\end{aligned}`,
          rubric: "高考大题采分点：建立坐标系与确定动点参数代数式（4分）",
        },
        {
          step: 2,
          title: "利用双垂直正交条件联立求解公垂足参数",
          detail:
            "公垂向量 $\\vec{PQ}$ 同时垂直于直线 $A_1B$ 与直线 $AC$，列出正交方程组：",
          latex: isCube
            ? `\\begin{aligned} &\\begin{cases} \\vec{PQ} \\cdot \\vec{u} = 2a^2\\lambda - a^2\\mu - a^2 = 0 \\\\[1ex] \\vec{PQ} \\cdot \\vec{v} = 2a^2\\mu - a^2\\lambda = 0 \\end{cases} \\\\[1.5ex] \\implies &\\begin{cases} \\lambda^* = \\dfrac{2}{3} \\\\[1.5ex] \\mu^* = \\dfrac{1}{3} \\end{cases} \\end{aligned}`
            : `\\begin{aligned} &\\begin{cases} (${a}^2+${c}^2)\\lambda - ${a}^2\\mu = ${c}^2 \\\\[1ex] (${a}^2+${b}^2)\\mu - ${a}^2\\lambda = 0 \\end{cases} \\\\[1.5ex] \\implies &\\begin{cases} \\lambda^* = \\dfrac{c^2(a^2+b^2)}{a^2b^2+b^2c^2+c^2a^2} = ${skew.optimalLambda.toFixed(4)} \\\\[2ex] \\mu^* = \\dfrac{a^2c^2}{a^2b^2+b^2c^2+c^2a^2} = ${skew.optimalMu.toFixed(4)} \\end{cases} \\end{aligned}`,
          rubric: "高考大题采分点：正交方程组构建与解析解求解（4分）",
        },
        {
          step: 3,
          title: "向量外积法与平行平面法求解公垂线最短距离",
          detail:
            "求公垂向量 $\\vec{n} = \\vec{u} \\times \\vec{v}$ 并代入向量射影距离公式：",
          latex: isCube
            ? `\\begin{aligned} \\vec{n} &= \\vec{u} \\times \\vec{v} = (${skew.nRaw.x.toFixed(1)}, ${skew.nRaw.y.toFixed(1)}, ${skew.nRaw.z.toFixed(1)}) \\\\[1ex] \\implies d_{\\min} &= \\frac{|\\vec{AA_1} \\cdot \\vec{n}|}{|\\vec{n}|} \\\\[1.5ex] &= \\frac{a^3}{\\sqrt{3}a^2} = \\frac{\\sqrt{3}}{3} a \\approx ${((Math.sqrt(3) / 3) * a).toFixed(4)} \\end{aligned}`
            : `\\begin{aligned} \\vec{n} &= \\vec{u} \\times \\vec{v} = (${skew.nRaw.x.toFixed(1)}, ${skew.nRaw.y.toFixed(1)}, ${skew.nRaw.z.toFixed(1)}) \\\\[1ex] \\implies d_{\\min} &= \\frac{|\\vec{AA_1} \\cdot \\vec{n}|}{|\\vec{n}|} \\\\[1.5ex] &= \\frac{abc}{\\sqrt{b^2 c^2 + a^2 c^2 + a^2 b^2}} \\approx ${skew.minDist.toFixed(4)} \\end{aligned}`,
          rubric: "高考大题采分点：公垂向量计算与点乘射影公式代入（4分）",
        },
      );
    }

    // 4. 定理公式
    if (preset === "cube") {
      theorems.push({
        name: "正方体面对角线公垂距离秒杀定理",
        latex: `d_{\\min} = \\frac{\\sqrt{3}}{3} a \\approx ${((Math.sqrt(3) / 3) * a).toFixed(4)}`,
        level: "core",
        note: `在正方体中，面对角线 A₁B 与底面对角线 AC 的公垂足分别为两对角线的 2/3 与 1/3 处，最短距离恒为 (√3/3)a`,
      });
    }

    theorems.push(
      {
        name: "公垂线唯一定理与最短性原理",
        latex: `\\forall P \\in l_1, \\; Q \\in l_2, \\quad |PQ| \\ge |H_1 H_2| = d_{\\min}`,
        level: "core",
        condition: "H₁H₂ 垂直于 l₁ 且垂直于 l₂，当且仅当 P=H₁, Q=H₂ 时等号成立",
      },
      {
        name: "向量外积与点乘射影距离公式",
        latex: isEdgeModel
          ? `\\vec{n} = \\vec{u} \\times \\vec{v}, \\quad d_{\\min} = \\frac{|\\vec{AB} \\cdot \\vec{n}|}{|\\vec{n}|} = \\frac{a b}{\\sqrt{a^2 + b^2}}`
          : `\\vec{n} = \\vec{u} \\times \\vec{v}, \\quad d_{\\min} = \\frac{|\\vec{AA_1} \\cdot \\vec{n}|}{|\\vec{n}|} = \\frac{abc}{\\sqrt{b^2 c^2 + a^2 c^2 + a^2 b^2}}`,
        level: "core",
        note: "向量外积 n 必然垂直于两异面直线的方向向量，为两直线公垂向量",
      },
      {
        name: "化归平行平面定理（线面平行转化法）",
        latex: `l_1 \\parallel \\alpha, \\; l_2 \\subset \\alpha \\implies d(l_1, l_2) = d(l_1, \\alpha) = d(P_0, \\alpha)`,
        level: "important",
        note: isEdgeModel
          ? "过 AC 作平行于 BB₁ 的截面 ACC₁A₁，将异面距离转化为点 B 到截面 ACC₁A₁ 的垂线距离"
          : "过 AC 作平行于 A₁B 的截面 ACD₁，将异面距离转化为点 A₁ 到平面 ACD₁ 的垂线距离",
      },
      isEdgeModel
        ? {
            name: "异面垂直动点距离独立二次型配方法",
            latex: `|PQ|^2 = c^2\\lambda^2 + (a^2+b^2)(\\mu - \\mu^*)^2 + d_{\\min}^2 \\ge d_{\\min}^2`,
            level: "important",
            note: "因侧棱 BB₁ ⊥ 底面对角线 AC，方向向量正交无交叉项，可直接分离配方求得极值",
          }
        : {
            name: "公垂线正交基底分解与极值原理",
            latex: `|\\vec{PQ}|^2 = |\\vec{H_1H_2}|^2 + |(\\lambda - \\lambda^*)\\vec{u} + (\\mu^* - \\mu)\\vec{v}|^2 \\ge d_{\\min}^2`,
            level: "important",
            note: "由双垂直性质 H₁H₂ ⊥ u 且 H₁H₂ ⊥ v，动向量在公垂线与跨线平面上严格正交分解，当且仅当 λ=λ*, μ=μ* 时模方取得极小值",
          },
    );

    gaokaoPoints.push(
      {
        text: "高考立体几何求异面直线距离三大通法：① 向量射影法（设法向量 n=u×v，代公式 d=|AB·n|/|n|，大题首选）；② 平行平面法（构造过一条直线平行另一条直线的辅助面，转化为点面距）；③ 动点参数二次函数配方法（设动点坐标求距离函数极值）。",
        importance: "gaokao",
      },
      {
        text: "双直角特征采分点：在证明公垂线时，必须分别交代 H₁H₂ ⊥ l₁ 与 H₁H₂ ⊥ l₂ 两组垂直关系，两者缺一不可。",
        importance: "gaokao",
      },
    );
  } else if (mode === "pointPlaneDistance") {
    // 点到平面距离与等体积法对账
    const distRes = solvePointPlaneDistance(a, b, c, lambda);
    const zE = lambda * c;

    examAnchor = "高考解答题 18 题 · 点到平面垂直距离与等体积法对账";
    mnemonic = "点面距离两通法：向量射影模除模，等体积法免建系。";

    quantities.push(
      {
        label: "原点 A 坐标",
        symbol: "A",
        value: "(0, 0, 0)",
        color: MATH_COLORS.primary,
        isInvariant: true,
      },
      {
        label: "动点 E 坐标",
        symbol: "E(\\lambda)",
        value: `(0, 0, ${zE.toFixed(2)})`,
        color: MATH_COLORS.paramPrimary,
      },
      {
        label: "截面 BDE 法向量 n",
        symbol: "\\vec{n}",
        value: `(${distRes.nRaw.x.toFixed(2)}, ${distRes.nRaw.y.toFixed(2)}, ${distRes.nRaw.z.toFixed(2)})`,
        color: MATH_COLORS.paramTertiary,
      },
      {
        label: "点面垂直距离 d",
        symbol: "d(A, \\text{面}BDE)",
        value: Number(distRes.distance.toFixed(4)),
        color: MATH_COLORS.paramPrimary,
      },
      {
        label: "三棱锥 E-ABD 体积",
        symbol: "V_{E-ABD}",
        value: Number(distRes.volume.toFixed(4)),
        color: MATH_COLORS.accent,
      },
      {
        label: "底面 △ABD 面积",
        symbol: "S_{\\Delta ABD}",
        value: Number(distRes.areaBase.toFixed(4)),
        color: MATH_COLORS.secondary,
        isInvariant: true,
        invariantNote: "底面三角形尺寸固定，面积为不变量",
      },
      {
        label: "截面 △BDE 面积",
        symbol: "S_{\\Delta BDE}",
        value: Number(distRes.areaSection.toFixed(4)),
        color: MATH_COLORS.paramSecondary,
      },
    );

    warnings.push({
      text: "【等体积换底法规范】利用等体积法求高线时，必须明确写出换底等式 $V_{A-BDE} = V_{E-ABD}$；向量法计算距离时，分子斜向量投影必须带绝对值符号保证距离为非负数。",
      level: "warning",
    });

    theorems.push(
      {
        name: "向量射影法求点到平面距离公式",
        latex: `d = \\frac{|\\vec{AB} \\cdot \\vec{n}|}{|\\vec{n}|} = \\frac{a b z_E}{\\sqrt{b^2 z_E^2 + a^2 z_E^2 + a^2 b^2}}`,
        level: "core",
        note: "B 为截面内参考已知点，n 为截面法向量",
      },
      {
        name: "等体积换底法互验定理",
        latex: `V_{A-BDE} = V_{E-ABD} = \\frac{1}{3} S_{\\Delta ABD} \\cdot z_E = \\frac{1}{3} S_{\\Delta BDE} \\cdot d \\implies d = \\frac{S_{\\Delta ABD} \\cdot z_E}{S_{\\Delta BDE}}`,
        level: "core",
        note: "等体积法不依赖建系与法向量，是高考立体几何高频简捷验证手段",
      },
    );

    gaokaoPoints.push({
      text: "点面距大题评分规范：向量法写出 d = |AB·n|/|n| 可直接得满分；几何法转换顶点利用等体积法需写清“V_{A-BDE} = V_{E-ABD}”换底说明。",
      importance: "gaokao",
    });

    reasoningSteps.push(
      {
        step: 1,
        title: "建立空间直角坐标系并求解截面 BDE 法向量",
        detail: `设平面 $BDE$ 法向量为 $\\vec{n} = (x, y, z)$，由正交垂直关系列方程组：`,
        latex: `\\begin{aligned} &\\begin{cases} \\vec{n} \\cdot \\vec{BD} = 0 \\\\[1ex] \\vec{n} \\cdot \\vec{BE} = 0 \\end{cases} \\\\[1.5ex] \\implies &\\vec{n} = (${distRes.nRaw.x.toFixed(2)}, ${distRes.nRaw.y.toFixed(2)}, ${distRes.nRaw.z.toFixed(2)}) \\end{aligned}`,
        rubric: "高考大题采分点：坐标系建立与法向量求解（4分）",
      },
      {
        step: 2,
        title: "代入向量点积射影公式计算垂直距离",
        detail:
          "取截面内已知参考点 $B$，斜向量 $\\vec{AB}$ 在法向量 $\\vec{n}$ 上的射影长度：",
        latex: `d = \\frac{|\\vec{AB} \\cdot \\vec{n}|}{|\\vec{n}|} = ${distRes.distance.toFixed(4)}`,
        rubric: "高考大题采分点：向量射影公式代入与准确计算（4分）",
      },
      {
        step: 3,
        title: "利用等体积换底法对账检验计算准确性",
        detail:
          "等体积法换底 $V_{A-BDE} = V_{E-ABD}$ 反求高线 $d$，结果严格自洽：",
        latex: `\\begin{aligned} d &= \\frac{3 V_{E-ABD}}{S_{\\Delta BDE}} \\\\[1.5ex] &= \\frac{3 \\times ${distRes.volume.toFixed(4)}}{${distRes.areaSection.toFixed(4)}} = ${distRes.distance.toFixed(4)} \\end{aligned}`,
        rubric: "高考大题采分点：等体积反解与结论验证（4分）",
      },
    );
  } else {
    // volumeExtrema: 动点三棱锥体积极值与轨迹
    const distRes = solvePointPlaneDistance(a, b, c, lambda);
    const zE = lambda * c;

    examAnchor = "高考立体几何 · 换底法与动点体积极值单调性";
    mnemonic =
      "动点体积求极值，定面为底高为自；底定高变呈线性，区间端点取极大。";

    quantities.push(
      {
        label: "动点 E 比例 λ",
        symbol: "\\lambda = \\frac{AE}{AA_1}",
        value: Number(lambda.toFixed(2)),
        color: MATH_COLORS.paramPrimary,
      },
      {
        label: "棱锥动态高线 h",
        symbol: "h(\\lambda) = \\lambda c",
        value: Number(zE.toFixed(2)),
        color: MATH_COLORS.highlight,
      },
      {
        label: "固定底面面积 S",
        symbol: "S_{\\Delta ABD} = \\frac{1}{2}ab",
        value: Number(distRes.areaBase.toFixed(4)),
        color: MATH_COLORS.secondary,
        isInvariant: true,
        invariantNote: "长方体底面直角三角形面积恒定",
      },
      {
        label: "三棱锥实时体积 V",
        symbol: "V(\\lambda)",
        value: Number(distRes.volume.toFixed(4)),
        color: MATH_COLORS.paramTertiary,
      },
      {
        label: "三棱锥最大体积 V_max",
        symbol: "V_{\\max} = \\frac{1}{6}abc",
        value: Number(distRes.maxVolume.toFixed(4)),
        color: MATH_COLORS.paramPrimary,
        isInvariant: true,
        invariantNote: "动点到达顶点 A₁ 时的理论最大容积",
      },
    );

    warnings.push({
      text: "【换底法思维】分析棱锥体积时首选固定面为底面。△ABD 面积恒定不变，体积仅由高线 EA 决定，因此体积与分点比 λ 呈严格一次线性关系，最值必在定义域区间端点取得。",
      level: "info",
    });

    theorems.push({
      name: "动点体积极值定理（底定高变线性单调）",
      latex: `V(\\lambda) = \\frac{1}{3} S_{\\text{底}} \\cdot h(\\lambda) = \\frac{1}{6} a b (\\lambda c) \\le \\frac{1}{6} a b c = V_{\\max}`,
      level: "core",
      condition: "当且仅当 λ = 1.0 (即动点 E 到达侧棱顶端 A₁) 时取得最大体积",
    });

    gaokaoPoints.push({
      text: "体积极值思维模型：立体几何动点极值首选“换底法”。将定面视为底面，动点到定面的高线即为自变量，高线最大时体积最大。",
      importance: "gaokao",
    });

    reasoningSteps.push(
      {
        step: 1,
        title: "分析三棱锥底面积的不变性",
        detail:
          "底面 $\\triangle ABD$ 位于长方体底面，边长 $a, b$ 固定，其面积恒定为 $\\frac{1}{2}ab$：",
        latex: `\\begin{aligned} S_{\\Delta ABD} &= \\frac{1}{2} a b \\\\[1ex] &= \\frac{1}{2} (${a})(${b}) = ${distRes.areaBase.toFixed(2)} \\end{aligned}`,
        rubric: "高考大题采分点：定底面积分析（4分）",
      },
      {
        step: 2,
        title: "建立体积关于分点比例 λ 的线性函数",
        detail:
          "动点 $E$ 在侧棱 $AA_1$ 上移动，高线 $h(\\lambda) = \\lambda c$ 与体积成严格正比例关系：",
        latex: `\\begin{aligned} V(\\lambda) &= \\frac{1}{3} S_{\\Delta ABD} \\cdot (\\lambda c) \\\\[1ex] &= \\frac{1}{6} (${a})(${b})(${c}) \\lambda = ${distRes.maxVolume.toFixed(2)} \\lambda \\end{aligned}`,
        rubric: "高考大题采分点：体积函数构建（4分）",
      },
      {
        step: 3,
        title: "区间端点判定极值结论",
        detail:
          "由于 $\\lambda \\in (0, 1]$，体积函数关于 $\\lambda$ 单调递增，端点处取得最大极值：",
        latex: `V_{\\max} = V(1.0) = ${distRes.maxVolume.toFixed(4)}`,
        rubric: "高考大题采分点：端点极值结论明确（4分）",
      },
    );
  }

  return {
    quantities,
    theorems,
    gaokaoPoints,
    warnings,
    reasoningSteps,
    examAnchor,
    mnemonic,
  };
}
