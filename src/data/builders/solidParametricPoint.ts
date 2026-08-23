import type {
  MathPanelData,
  MathQuantity,
  Theorem,
  GaokaoPoint,
  WarningItem,
} from "../types";
import { MATH_COLORS } from "@/theme";
import {
  calculateSinglePointAngle,
  calculateDoublePointDistance,
  calculatePyramidVolumeExtrema,
  calculateSurfacePath,
} from "@/math3d/parametricPoint";

// ── know-solid-parametric: 空间向量与动点存在性、最值问题 ──

export function buildParametricPointPanel(
  params: Record<string, number>,
  config?: Record<string, unknown>,
): MathPanelData {
  const mode = (config?.activeMode as string) ?? "singlePointAngle";
  const a = params.a ?? 4;
  const b = params.b ?? 3;
  const c = params.c ?? 3;
  const lambda = params.lambda ?? 0.5;
  const mu = params.mu ?? 0.5;
  const targetThetaDeg = params.targetThetaDeg ?? 45;
  const quantities: MathQuantity[] = [];
  const theorems: Theorem[] = [];
  const gaokaoPoints: GaokaoPoint[] = [];
  const warnings: WarningItem[] = [];

  if (mode === "singlePointAngle") {
    const res = calculateSinglePointAngle(a, b, c, lambda, targetThetaDeg);

    quantities.push(
      {
        label: "动点参数 λ",
        symbol: "\\lambda = \\frac{BP}{BB_1}",
        value: Number(lambda.toFixed(2)),
        color: MATH_COLORS.paramPrimary,
      },
      {
        label: "动点 P 空间坐标",
        symbol: "P",
        value: `(${a}, 0, ${(lambda * c).toFixed(2)})`,
        color: MATH_COLORS.primary,
      },
      {
        label: "截面 PAC 法向量 n",
        symbol: "\\vec{n}(\\lambda)",
        value: `(${res.nPAC.x.toFixed(1)}, ${res.nPAC.y.toFixed(1)}, ${res.nPAC.z.toFixed(1)})`,
        color: MATH_COLORS.secondary,
      },
      {
        label: "点 D 到平面 PAC 距离 d",
        symbol: "d(\\lambda)",
        value: Number(res.distDToPAC.toFixed(3)),
        color: MATH_COLORS.paramSecondary,
      },
      {
        label: "二面角 P-AC-B 大小",
        symbol: "\\theta(\\lambda)",
        value: `${res.dihedralDeg.toFixed(2)}°`,
        color: MATH_COLORS.highlight,
      },
      {
        label: `目标二面角 ${targetThetaDeg}° 求解`,
        symbol: "\\lambda_{\\text{目标}}",
        value: res.isTargetDihedralExist
          ? `${res.lambdaTargetDihedral} (存在)`
          : `${res.rawLambdaTarget.toFixed(2)} (超界不存在)`,
        color: res.isTargetDihedralExist
          ? MATH_COLORS.paramTertiary
          : MATH_COLORS.highlight,
      },
      {
        label: "DP ⊥ AC₁ 存在性求解",
        symbol: "\\lambda_{\\text{直角}}",
        value: res.isPerpExist ? `${res.lambdaPerpDP_AC1}` : "无解 (不存在)",
        color: res.isPerpExist
          ? MATH_COLORS.paramTertiary
          : MATH_COLORS.highlight,
      },
    );

    theorems.push(
      {
        name: "空间动点向量坐标化定理",
        latex: `\\vec{OP}(\\lambda) = (1-\\lambda)\\vec{OB} + \\lambda \\vec{OB_1} = (a, 0, \\lambda c)`,
        level: "core",
        condition: "λ ∈ [0, 1] 决定动点在线段/棱上的相对位置",
      },
      {
        name: "二面角与点面距离动参表达式",
        latex: `d(\\lambda) = \\frac{a b c \\lambda}{\\sqrt{\\lambda^2 c^2(a^2+b^2) + a^2 b^2}}, \\quad \\cos \\theta(\\lambda) = \\frac{a b}{\\sqrt{\\lambda^2 c^2(a^2+b^2) + a^2 b^2}}`,
        level: "core",
      },
      {
        name: "目标二面角反解方程与区间检验",
        latex: `\\cos \\theta(\\lambda) = \\cos \\theta_0 \\;\\Rightarrow\\; \\lambda = \\frac{a b \\tan \\theta_0}{c \\sqrt{a^2+b^2}}`,
        level: "important",
        note: `当前目标角度 θ₀ = ${targetThetaDeg}°，求得 λ = ${res.rawLambdaTarget.toFixed(2)} (${res.isTargetDihedralExist ? "在棱 BB₁ 上存在" : "超出 [0,1] 不存在"})`,
      },
      {
        name: "动点存在性探究（向量垂直充要条件）",
        latex: `\\vec{DP} \\cdot \\vec{AC_1} = 0 \\;\\Leftrightarrow\\; a^2 - b^2 + \\lambda c^2 = 0 \\;\\Rightarrow\\; \\lambda = \\frac{b^2 - a^2}{c^2}`,
        level: "important",
        note: "当且仅当方程解出的 λ ∈ [0, 1] 时，棱 BB₁ 上存在点 P 满足垂直条件",
      },
    );

    gaokaoPoints.push(
      {
        text: "【高考探究存在性核心解题套路】① 设动点比例参数 λ ∈ [0, 1] 表达点 P 坐标；② 根据几何条件（线面角/二面角/垂直/平行）列出关于 λ 的向量方程；③ 解方程并检验解是否落于 [0, 1] 闭区间。有解则存在，无解则不存在。",
        importance: "gaokao",
      },
      {
        text: "【单调性与最值】二面角余弦 cosθ(λ) 随 λ 增加单调递减（角度 θ 增大）。当 λ=0 时 cosθ=1（θ=0°，退化）；当 λ=1 时达到该棱上的二面角最大值。",
        importance: "gaokao",
      },
    );

    if (lambda === 0) {
      warnings.push({
        text: "λ = 0 时动点 P 退化落于顶点 B 处，截面 PAC 退化为底面边 AC (直线)！",
        level: "warning",
      });
    }
  } else if (mode === "doublePointDistance") {
    const res = calculateDoublePointDistance(a, b, c, lambda, mu);

    quantities.push(
      {
        label: "动点 P 比例 λ",
        symbol: "\\lambda",
        value: Number(lambda.toFixed(2)),
        color: MATH_COLORS.paramPrimary,
      },
      {
        label: "动点 Q 比例 μ",
        symbol: "\\mu",
        value: Number(mu.toFixed(2)),
        color: MATH_COLORS.paramSecondary,
      },
      {
        label: "动线段 PQ 长度",
        symbol: "|PQ|",
        value: Number(res.distPQ.toFixed(3)),
        color: MATH_COLORS.highlight,
      },
      {
        label: "异面公垂线段最小距离",
        symbol: "|PQ|_{\\min}",
        value: Number(res.minDistSkew.toFixed(3)),
        color: MATH_COLORS.paramTertiary,
      },
      {
        label: "距离相对极小值增量",
        symbol: "\\Delta d = |PQ| - |PQ|_{\\min}",
        value: Number(res.distDelta.toFixed(3)),
        color:
          res.distDelta < 0.01
            ? MATH_COLORS.paramTertiary
            : MATH_COLORS.paramSecondary,
      },
      {
        label: "二次型 μ 偏离项贡献",
        symbol: "(a^2+b^2)(\\mu - \\mu_0)^2",
        value: Number(res.muTermContrib.toFixed(2)),
        color: MATH_COLORS.secondary,
      },
      {
        label: "二次型 λ 偏离项贡献",
        symbol: "\\lambda^2 c^2",
        value: Number(res.lambdaTermContrib.toFixed(2)),
        color: MATH_COLORS.primary,
      },
    );

    theorems.push(
      {
        name: "双动点距离二次型最值定理",
        latex: `|PQ|^2(\\lambda, \\mu) = a^2(1-\\mu)^2 + b^2 \\mu^2 + \\lambda^2 c^2 = (a^2+b^2)\\left(\\mu - \\frac{a^2}{a^2+b^2}\\right)^2 + \\frac{a^2b^2}{a^2+b^2} + \\lambda^2 c^2`,
        level: "core",
        note: "通过配方法分离变量：当 λ=0 且 μ=a²/(a²+b²) 时取得严格最小值",
      },
      {
        name: "异面直线公垂线段最小距离",
        latex: `d_{\\min} = \\frac{a b}{\\sqrt{a^2 + b^2}}`,
        level: "important",
        condition: "公垂线段同时垂直于异面直线 AC 与 BB₁",
      },
    );

    gaokaoPoints.push({
      text: "【高考双动点最值解法】对于双参数 (λ, μ) 最值问题，利用配方法化简二次多元函数，独立求解各个独立项的极小值，即可得出最值与取最值时的空间位置。",
      importance: "gaokao",
    });

    if (Math.abs(mu - res.optimalMu) < 0.02 && lambda === 0) {
      warnings.push({
        text: `当前双动点 P, Q 处于异面直线公垂线段两端点位置，|PQ| 达到全局极小值 d_min = ${res.minDistSkew.toFixed(2)}！`,
        level: "info",
      });
    }
  } else if (mode === "pyramidVolumeExtrema") {
    const res = calculatePyramidVolumeExtrema(a, b, c, lambda);

    quantities.push(
      {
        label: "动点 P 比例 λ",
        symbol: "\\lambda",
        value: Number(lambda.toFixed(2)),
        color: MATH_COLORS.paramPrimary,
      },
      {
        label: "动点 P 空间高度 h",
        symbol: "h(\\lambda) = \\lambda c",
        value: Number(res.heightH.toFixed(2)),
        color: MATH_COLORS.paramTertiary,
      },
      {
        label: "固定底面 △ACD 面积",
        symbol: "S_{\\Delta ACD}",
        value: Number(res.baseAreaACD.toFixed(2)),
        color: MATH_COLORS.secondary,
      },
      {
        label: "三棱锥 P-ACD 动态体积",
        symbol: "V_{P-ACD}(\\lambda)",
        value: Number(res.volumePACD.toFixed(3)),
        color: MATH_COLORS.highlight,
      },
      {
        label: "三棱锥体积最大极值",
        symbol: "V_{\\max}",
        value: Number(res.maxVolumePACD.toFixed(3)),
        color: MATH_COLORS.paramPrimary,
      },
    );

    theorems.push(
      {
        name: "动点三棱锥体积极值定理（动高模型）",
        latex: `V(\\lambda) = \\frac{1}{3} S_{\\Delta ACD} \\cdot h(\\lambda) = \\frac{1}{6} a b (\\lambda c) \\le \\frac{1}{6} a b c = V_{\\max}`,
        level: "core",
        condition: "当 λ = 1.0 (动点 P 到达顶点 B₁) 时取最大体积",
      },
      {
        name: "等底同高体积转换原理",
        latex: `V_{P-ACD} = V_{D-PAC} = \\frac{1}{3} S_{\\Delta PAC} \\cdot d_{D-\\text{面}}`,
        level: "important",
        note: "等体积法是高考解答题中求空间点到截面距离的核心转化桥梁",
      },
    );

    gaokaoPoints.push({
      text: "【高考体积极值考法】立体几何体积极值题型中，通常有一面面积为定值（如此处的底面 △ACD），动点在棱上移动使得高线线性变化，极值点必在边界端点处取得。",
      importance: "gaokao",
    });

    if (lambda === 0) {
      warnings.push({
        text: "λ = 0 时动点 P 位于底面内，三棱锥高度退化为 0，体积退化为 0！",
        level: "warning",
      });
    } else if (lambda === 1) {
      warnings.push({
        text: `λ = 1.0 时动点 P 到达顶端 B₁，三棱锥高度达到最大值 c = ${c}，体积达到全局最大极值 V_max = ${res.maxVolumePACD.toFixed(2)}！`,
        level: "info",
      });
    }
  } else {
    // surfaceShortestPath
    const res = calculateSurfacePath(a, b, c, lambda);

    quantities.push(
      {
        label: "动点 P 比例 λ",
        symbol: "\\lambda",
        value: Number(lambda.toFixed(2)),
        color: MATH_COLORS.paramPrimary,
      },
      {
        label: "当前折线段 A-P-C₁ 长度",
        symbol: "|AP| + |PC_1|",
        value: Number(res.currentPathLength.toFixed(3)),
        color: MATH_COLORS.highlight,
      },
      {
        label: "侧面展开路径 1 最短长",
        symbol: "L_{\\text{侧}}",
        value: Number(res.path1Length.toFixed(3)),
        color: MATH_COLORS.secondary,
      },
      {
        label: "最佳折点 λ₁",
        symbol: "\\lambda_1 = \\frac{a}{a+b}",
        value: Number(res.optimalLambda1.toFixed(3)),
        color: MATH_COLORS.paramTertiary,
      },
      {
        label: "底面展开路径 2 最短长",
        symbol: "L_{\\text{底}}",
        value: Number(res.path2Length.toFixed(3)),
        color: MATH_COLORS.primary,
      },
      {
        label: "全局表面最短距离",
        symbol: "L_{\\min}",
        value: Number(res.globalMinLength.toFixed(3)),
        color: MATH_COLORS.paramPrimary,
      },
    );

    theorems.push(
      {
        name: "多面体表面动点最短路径定理 (平面展开法)",
        latex: `L_{\\text{侧}} = \\sqrt{(a+b)^2 + c^2}, \\quad L_{\\text{底}} = \\sqrt{a^2 + (b+c)^2}`,
        level: "core",
        note: "两点之间直线段最短。将 3D 几何面沿折痕展开为 2D 矩形，直线连接起点与终点",
      },
      {
        name: "相似三角形反解侧棱交点",
        latex: `\\lambda_1 = \\frac{a}{a+b} \\;\\Rightarrow\\; z_{P_1} = \\frac{a c}{a + b}`,
        level: "important",
      },
    );

    gaokaoPoints.push({
      text: "【立体几何表面最短路径通法】“化曲为平，展成平面”。分类讨论所有可能的展开途径，利用勾股定理求出各展开平面上的直线段长度，取其中的最小值。",
      importance: "gaokao",
    });

    if (Math.abs(lambda - res.optimalLambda1) < 0.02) {
      warnings.push({
        text: `动折点 P 此时正处于侧面展开直线的交点处 (λ = ${res.optimalLambda1.toFixed(2)})，折线路径取得侧面最短距离 L = ${res.path1Length.toFixed(2)}！`,
        level: "info",
      });
    }
  }

  return { quantities, theorems, gaokaoPoints, warnings };
}
