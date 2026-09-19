import type {
  MathPanelData,
  MathQuantity,
  Theorem,
  GaokaoPoint,
  WarningItem,
  ReasoningStep,
} from "../types";
import type { TriangleExtremaState } from "@/math/triangleExtrema";
import { MATH_COLORS } from "@/theme";

export function buildTriangleExtremaPanel(
  _params: Record<string, number>,
  config?: Record<string, unknown>,
): MathPanelData {
  const studyMode = (config?.studyMode as string) ?? "angle-transform";
  const isAcuteOnly = (config?.isAcuteOnly as boolean) ?? false;
  const calcState = config?.calcState as TriangleExtremaState | undefined;

  const quantities: MathQuantity[] = [];
  const theorems: Theorem[] = [];
  const gaokaoPoints: GaokaoPoint[] = [];
  const warnings: WarningItem[] = [];
  // 推导链：按左屏探究模式给出「① 符号表达式 → ② 代入解析式 → ③ 结果」三步
  const reasoningSteps: ReasoningStep[] = [];

  if (calcState && calcState.isValid) {
    const {
      extrema,
      sides,
      angles,
      circumcircle,
      inscribed,
      apolloniusCircle,
      acuteRange,
      vertices,
    } = calcState;

    // 1. 公共核心几何特征量
    quantities.push(
      {
        label: "外接圆半径 R",
        symbol: "R = \\frac{a}{2\\sin A}",
        value: circumcircle.radius.toFixed(2),
        color: MATH_COLORS.circle,
        highlight: "positive",
      },
      {
        label: "射影定理验算",
        symbol: "b\\cos C + c\\cos B",
        value: `${extrema.projectionSum.toFixed(2)} (= a = ${sides.a.toFixed(2)})`,
        color: MATH_COLORS.paramPrimary,
      },
    );

    // 2. 按左屏选择的 studyMode 深度同步专属核心数学量
    if (studyMode === "angle-transform") {
      quantities.push(
        {
          label: "当前周长 P",
          symbol: "P = a + b + c",
          value: `${extrema.perimeter.toFixed(2)} (最大 ${extrema.maxPerimeter.toFixed(2)})`,
          color: MATH_COLORS.paramPrimary,
          highlight: "positive",
        },
        {
          label: "两边和 b + c 范围",
          symbol: "b + c",
          value: `(${(extrema.minSideSum ?? sides.a).toFixed(2)}, ${extrema.maxSideSum.toFixed(2)}]`,
          color: MATH_COLORS.paramSecondary,
        },
        {
          label: "当前面积 S",
          symbol: "S_{\\triangle ABC}",
          value: `${extrema.area.toFixed(2)} (最大 ${extrema.maxArea.toFixed(2)})`,
          color: MATH_COLORS.sequenceHighlight,
        },
      );
      if (inscribed) {
        quantities.push(
          {
            label: "内切圆半径 r",
            symbol: "r = \\frac{S}{p}",
            value: inscribed.inradius.toFixed(2),
            color: MATH_COLORS.complexNum,
          },
          {
            label: "角 $A$ 平分线 $t_a$",
            symbol: "t_a",
            value: inscribed.bisectorA.toFixed(2),
            color: MATH_COLORS.tangentLine,
          },
        );
      }
      if (isAcuteOnly && acuteRange && acuteRange.isPossible) {
        quantities.push({
          label: "锐角约束角 B 范围",
          symbol: "B \\in (90^\\circ-A, 90^\\circ)",
          value: `(${acuteRange.minAngleB.toFixed(0)}°, ${acuteRange.maxAngleB.toFixed(0)}°)`,
          color: MATH_COLORS.paramPrimary,
          highlight: "negative",
        });
      }
    } else if (studyMode === "side-ineq") {
      const b2_plus_c2 = sides.b * sides.b + sides.c * sides.c;
      const two_bc = 2 * sides.b * sides.c;
      quantities.push(
        {
          label: "当前面积 S 与最值",
          symbol: "S = \\frac{1}{2}bc\\sin A",
          value: `${extrema.area.toFixed(2)} (最大 ${extrema.maxArea.toFixed(2)})`,
          color: MATH_COLORS.sequenceHighlight,
          highlight: "positive",
        },
        {
          label: "两边积 bc 与上限",
          symbol: "bc",
          value: `${extrema.sideProduct.toFixed(2)} (上限 ${extrema.maxSideProduct.toFixed(2)})`,
          color: MATH_COLORS.paramPrimary,
        },
        {
          label: "均值差 b²+c² - 2bc",
          symbol: "(b - c)^2",
          value: `${(b2_plus_c2 - two_bc).toFixed(2)} (\\ge 0)`,
          color: MATH_COLORS.paramSecondary,
        },
        {
          label: "两边和 b + c",
          symbol: "b + c",
          value: `${extrema.sideSum.toFixed(2)} (上限 ${extrema.maxSideSum.toFixed(2)})`,
          color: MATH_COLORS.paramTertiary,
        },
      );
      if (inscribed) {
        quantities.push({
          label: "内切圆半径 r",
          symbol: "r = \\frac{S}{p}",
          value: inscribed.inradius.toFixed(2),
          color: MATH_COLORS.complexNum,
        });
      }
    } else if (studyMode === "apollonius") {
      if (apolloniusCircle) {
        quantities.push(
          {
            label: "阿氏圆半径 $R_A$ (最大高)",
            symbol: "R_A = \\frac{k}{|k^2-1|}a",
            value: apolloniusCircle.radius.toFixed(2),
            color: MATH_COLORS.paramPrimary,
            highlight: "positive",
          },
          {
            label: "阿氏圆心坐标",
            symbol: "O_A(x_0, 0)",
            value: `(${apolloniusCircle.center.x.toFixed(2)}, 0)`,
            color: MATH_COLORS.circle,
          },
          {
            label: "最大面积 $S_{\\max}$",
            symbol: "S_{\\max} = \\frac{1}{2}a R_A",
            value: extrema.maxArea.toFixed(2),
            color: MATH_COLORS.sequenceHighlight,
          },
          {
            label: "当前高与面积",
            symbol: "h_a, \\; S",
            value: `h = ${vertices.A.y.toFixed(2)}, S = ${extrema.area.toFixed(2)}`,
            color: MATH_COLORS.tangentLine,
          },
          {
            label: "动点顶角 ∠A",
            symbol: "\\angle A",
            value: `${angles.A.toFixed(1)}°`,
            color: MATH_COLORS.paramPrimary,
          },
        );
      }
    } else if (studyMode === "polarization") {
      const halfA = sides.a / 2;
      quantities.push(
        {
          label: "数量积 AB·AC (恒为定值)",
          symbol: "\\vec{AB} \\cdot \\vec{AC}",
          value: `${extrema.dotProduct.toFixed(2)} (m_a^2 - (a/2)^2)`,
          color: MATH_COLORS.paramPrimary,
          highlight: "positive",
        },
        {
          label: "中线平方与 (a/2)²",
          symbol: "m_a^2, \\; (a/2)^2",
          value: `${(calcState.polarization?.medianLength ? Math.pow(calcState.polarization.medianLength, 2) : 0).toFixed(2)} - ${(halfA * halfA).toFixed(2)}`,
          color: MATH_COLORS.complexNum,
        },
        {
          label: "中线定理 2m_a² + 2(a/2)²",
          symbol: "b^2 + c^2",
          value: `${(sides.b * sides.b + sides.c * sides.c).toFixed(2)}`,
          color: MATH_COLORS.paramSecondary,
        },
        {
          label: "当前面积 S",
          symbol: "S = \\frac{1}{2}a h_a",
          value: `${extrema.area.toFixed(2)} (最大 ${extrema.maxArea.toFixed(2)})`,
          color: MATH_COLORS.sequenceHighlight,
        },
      );
    }
  }

  // 1.5 推导链：严格遵循「① 符号表达式 → ② 代入解析式 → ③ 结果」，
  // 严禁直接抛孤立数值 —— 解三角形是新高考第 16 题 15 分主位，必须呈现分步作答闭环。
  if (calcState && calcState.isValid) {
    const {
      extrema,
      sides,
      angles,
      apolloniusCircle,
      polarization,
      acuteRange,
    } = calcState;
    const halfA = sides.a / 2;

    // 锐角约束只改变**下界**（端点由直角临界给出），最大值公式不变，
    // 因为等腰取等点 B = (180°-A)/2 恒落在开区间 (90°-A, 90°) 内 —— 见 math/triangleExtrema.ts:123。
    const lowerBoundNote =
      isAcuteOnly && acuteRange && acuteRange.isPossible
        ? `勾选了「锐角三角形」约束：角 $B$ 被截断在开区间 $(90^\\circ-A, 90^\\circ)$，下界不再趋近退化点 $a$，而由直角临界端点给出 $P_{\\min} = ${acuteRange.minPerimeter.toFixed(2)}$（开区间，取不到）。`
        : `下界对应三点共线的退化端点（$b + c \\to a$），属开区间，取不到。`;

    if (studyMode === "angle-transform") {
      reasoningSteps.push(
        {
          step: 1,
          title: "审题定法 · 正弦定理边化角",
          detail:
            "已知角 $A$ 与对边 $a$，正弦定理先把外接圆直径 $2R$ 定成常数。再把 $b + c$ 用其余两角的正弦表示，使角 $B$ 成为唯一自变量。",
          latex:
            "b + c = 2R(\\sin B + \\sin C), \\quad 2R = \\frac{a}{\\sin A}",
          rubric: "采分点：写出正弦定理并声明以角 B 为自变量（3分）",
        },
        {
          step: 2,
          title: "建模联立 · 和差化积压成单角",
          detail:
            "由内角和 $C = 180^\\circ - A - B$ 消去 $C$，和差化积后 $b + c$ 只随 $\\cos\\frac{B-C}{2}$ 变化，故 $B = C$ 时取得最大值。",
          latex:
            "b + c = 4R\\cos\\frac{A}{2}\\cos\\frac{B-C}{2} \\le 4R\\cos\\frac{A}{2} = \\frac{a}{\\sin\\frac{A}{2}}",
          rubric: "采分点：和差化积并指出取等条件 B = C（4分）",
        },
        {
          step: 3,
          title: "代入求解 · 周长与面积最值",
          detail: `代入 $a = ${sides.a.toFixed(2)}$、$A = ${angles.A.toFixed(1)}^\\circ$：取等点 $B = C = \\frac{180^\\circ-A}{2}$（等腰）处两边和最大，故周长最大 $P_{\\max} = a + (b+c)_{\\max} = ${extrema.maxPerimeter.toFixed(2)}$，面积同时在该等腰点最大 $S_{\\max} = ${extrema.maxArea.toFixed(2)}$。${lowerBoundNote}`,
          latex: `b + c \\le \\frac{${sides.a.toFixed(2)}}{\\sin ${(angles.A / 2).toFixed(1)}^\\circ} = ${extrema.maxSideSum.toFixed(2)}`,
          rubric: "采分点：代入求两边和与周长最值并写明取等条件（3分）",
        },
      );
    } else if (studyMode === "side-ineq") {
      reasoningSteps.push(
        {
          step: 1,
          title: "审题定法 · 余弦定理搭桥",
          detail:
            "已知角 $A$ 与对边 $a$，目标是逼出两边积 $bc$ 的上限。先用余弦定理写出 $a^2$ 与 $b, c, A$ 的关系。",
          latex: "a^2 = b^2 + c^2 - 2bc\\cos A",
          rubric: "采分点：写出余弦定理并明确要求 bc 的上限（3分）",
        },
        {
          step: 2,
          title: "建模联立 · 均值不等式降元",
          detail:
            "由均值不等式 $b^2 + c^2 \\ge 2bc$ 放缩，再把 $1 - \\cos A$ 用半角写成 $2\\sin^2\\frac{A}{2}$，把两个变量 $b, c$ 压缩成乘积 $bc$。",
          latex:
            "a^2 \\ge 2bc(1 - \\cos A) = 4bc\\sin^2\\frac{A}{2} \\implies bc \\le \\frac{a^2}{4\\sin^2\\frac{A}{2}}",
          rubric: "采分点：均值不等式放缩并完成半角化简（4分）",
        },
        {
          step: 3,
          title: "代入求解 · 面积同时封顶",
          detail: `取等条件为 $b = c$（等腰）。代入 $a = ${sides.a.toFixed(2)}$、$A = ${angles.A.toFixed(1)}^\\circ$ 得 $bc \\le ${extrema.maxSideProduct.toFixed(2)}$；再由 $S = \\frac{1}{2}bc\\sin A$ 同步封顶。`,
          latex: `S = \\frac{1}{2}bc\\sin A \\le \\frac{a^2}{4\\tan\\frac{A}{2}} = ${extrema.maxArea.toFixed(2)}`,
          rubric: "采分点：代入求出 bc 与面积的上限（3分）",
        },
      );
    } else if (studyMode === "apollonius") {
      if (apolloniusCircle) {
        const { radius: radiusA, ratioK } = apolloniusCircle;
        reasoningSteps.push(
          {
            step: 1,
            title: "审题定法 · 定比轨迹识模型",
            detail:
              "底边 $BC$ 固定，动顶点 $A$ 到 $B, C$ 的距离之比为常数 $k \\ne 1$。面积最大等价于高 $h_a$ 最大，于是问题转化为求轨迹上的最高点。",
            latex: `\\frac{AB}{AC} = k = ${ratioK.toFixed(2)} \\neq 1`,
            rubric: "采分点：识别定比轨迹并转译为求高最大值（3分）",
          },
          {
            step: 2,
            title: "建模联立 · 平方配方得阿氏圆",
            detail:
              "把距离比平方后按坐标展开配方，轨迹是一个圆（阿波罗尼斯圆）；其半径就是动点所能达到的最大高度。",
            latex:
              "\\left(x - \\frac{k^2+1}{2(k^2-1)}a\\right)^2 + y^2 = \\left(\\frac{k}{|k^2-1|}a\\right)^2 \\implies h_{a,\\max} = R_A",
            rubric: "采分点：配方求出阿氏圆圆心与半径（4分）",
          },
          {
            step: 3,
            title: "代入求解 · 代入求最大面积",
            detail: `代入底边 $a = ${sides.a.toFixed(2)}$ 与阿氏圆半径 $R_A = ${radiusA.toFixed(2)}$，此时动点 $A$ 位于圆心正上方，高取到 $R_A$。`,
            latex: `S_{\\max} = \\frac{1}{2}a\\cdot R_A = \\frac{1}{2}\\times ${sides.a.toFixed(2)}\\times ${radiusA.toFixed(2)} = ${extrema.maxArea.toFixed(2)}`,
            rubric: "采分点：代入求出最大面积（3分）",
          },
        );
      }
    } else if (studyMode === "polarization") {
      const medianSq = polarization ? polarization.medianLength ** 2 : 0;
      reasoningSteps.push(
        {
          step: 1,
          title: "审题定法 · 中线基底分解",
          detail:
            "取底边 $BC$ 的中点 $M$，把 $\\vec{AB}, \\vec{AC}$ 都以中线 $\\vec{AM}$ 与半底边为基底分解，构造成平方差。",
          latex:
            "\\vec{AB}\\cdot\\vec{AC} = |\\vec{AM}|^2 - |\\vec{BM}|^2 = m_a^2 - \\left(\\frac{a}{2}\\right)^2",
          rubric: "采分点：引入中线基底并写出极化形式（3分）",
        },
        {
          step: 2,
          title: "建模联立 · 中线长定理换元",
          detail:
            "用中线长定理把 $m_a^2$ 换成三边表达式，再用余弦定理 $b^2 + c^2 - a^2 = 2bc\\cos A$ 收尾，与数量积的定义式互相印证。",
          latex:
            "m_a^2 = \\frac{2b^2+2c^2-a^2}{4} \\implies \\vec{AB}\\cdot\\vec{AC} = \\frac{b^2+c^2-a^2}{2} = bc\\cos A",
          rubric: "采分点：中线长定理换元并与余弦定理互证（4分）",
        },
        {
          step: 3,
          title: "代入求解 · 数值双路对照",
          detail: `代入中线长 $m_a = ${polarization ? polarization.medianLength.toFixed(2) : "—"}$（即 $m_a^2 = ${medianSq.toFixed(2)}$）与半底边 $\\frac{a}{2} = ${halfA.toFixed(2)}$，所得差值与由定义直接算出的数量积应完全一致。`,
          latex: `\\vec{AB}\\cdot\\vec{AC} = ${medianSq.toFixed(2)} - ${(halfA * halfA).toFixed(2)} = ${extrema.dotProduct.toFixed(2)}`,
          rubric: "采分点：数值代入完成双路校验（3分）",
        },
      );
    }
  }

  // 2. 定理与推导模型 (左屏选中的探究模式，核心定理设为 level: "core" 置顶展示)
  if (studyMode === "angle-transform") {
    theorems.push({
      name: "正弦定理边化角与辅助角求最值模型",
      latex:
        "b + c = 2R(\\sin B + \\sin C) = 4R\\cos\\frac{A}{2}\\cos\\frac{B-C}{2} \\le \\frac{a}{\\sin(A/2)}",
      condition:
        "已知角 A 和对边 a，内角 B 为自变量 ($0 < B < 180^\\circ - A$)",
      note: "由和差化积/辅助角公式，当且仅当 $B = C = \\frac{180^\\circ-A}{2}$（等腰三角形）时取最大值。取值范围为 $(a, \\frac{a}{\\sin(A/2)}]$，下界 $a$ 对应三点共线退化端点。",
      level: "core",
    });
  } else if (studyMode === "side-ineq") {
    theorems.push({
      name: "余弦定理结合均值不等式最值模型",
      latex:
        "a^2 = b^2 + c^2 - 2bc\\cos A \\ge 2bc(1 - \\cos A) = 4bc\\sin^2\\frac{A}{2} \\implies bc \\le \\frac{a^2}{4\\sin^2(A/2)}",
      condition: "已知对角 A 和对边 a，两边长 $b, c > 0$",
      note: "由均值不等式 $b^2+c^2 \\ge 2bc$ 得两边乘积最大值，此时面积 $S = \\frac{1}{2}bc\\sin A \\le \\frac{a^2}{4\\tan(A/2)}$，当且仅当 $b=c$ 时取等号。",
      level: "core",
    });
  } else if (studyMode === "apollonius") {
    theorems.push({
      name: "阿波罗尼斯圆（定比边动点轨迹定理）",
      latex:
        "\\frac{AB}{AC} = k \\quad (k \\ne 1) \\implies \\left(x - \\frac{k^2+1}{2(k^2-1)}a\\right)^2 + y^2 = \\left(\\frac{k}{|k^2-1|}a\\right)^2",
      condition:
        "底边 BC 固定，动顶点 A 到两端点距离之比为常数 $k > 0$ 且 $k \\ne 1$",
      note: "动点 A 的轨迹是阿氏圆，最大高度等于圆半径 $R_A$，当 A 位于圆心正上方时面积取得最大值 $S_{\\max} = \\frac{1}{2}a R_A$。",
      level: "core",
    });
  } else if (studyMode === "polarization") {
    theorems.push({
      name: "向量极化恒等式与中线模型定理",
      latex:
        "\\vec{AB} \\cdot \\vec{AC} = |\\vec{AM}|^2 - |\\vec{BM}|^2 = m_a^2 - \\left(\\frac{a}{2}\\right)^2",
      condition: "M 为底边 BC 的中点，$m_a$ 为中线长 $|\\vec{AM}|$",
      note: "将两边向量的数量积转化为中线长平方与底边一半平方之差。当中线长固定时，数量积恒为定值；反之已知数量积可直接定中线长。",
      level: "core",
    });
  }

  // 锐角三角形补充定理
  if (isAcuteOnly) {
    theorems.push({
      name: "锐角三角形内角范围截断定理",
      latex:
        "\\begin{cases} 0 < B < 90^\\circ \\\\ 0 < C = 180^\\circ - A - B < 90^\\circ \\end{cases} \\implies 90^\\circ - A < B < 90^\\circ",
      condition: "三角形三个内角均为锐角 ($A, B, C < 90^\\circ$)",
      note: "锐角限制使角 B 的定义域两端被截断为开区间 $(90^\\circ-A, 90^\\circ)$，最值可能在等腰点取得，但下界端点不可取到（开区间）。",
      level: "important",
    });
  }

  // 3. 高考必考点总结
  gaokaoPoints.push(
    {
      text: "新高考解答题必考（第 16 题 · 15 分）：求周长/两边和优先使用正弦定理“边化角”转化为单一角三角函数；求面积/边积优先使用余弦定理结合均值不等式。",
      importance: "gaokao",
    },
    {
      text: "易错避坑一（开闭区间与退化）：三角形边长范围下界如 $b+c > a$ 通常为开区间（退化为三点共线不可达），切勿误写为闭区间导致扣分。",
      importance: "hard",
    },
    {
      text: "易错避坑二（锐角三角形限制）：若题干包含“锐角三角形”，必须联立 $0<B<90^\\circ$ 与 $0<180^\\circ-A-B<90^\\circ$ 求出角 B 的交集范围，在受限区间内求函数值域。",
      importance: "hard",
    },
  );

  // 4. 退化警示
  if (calcState && !calcState.isValid) {
    warnings.push({
      text:
        calcState.warning ??
        "退化警示：无法构成有效三角形，内角和超出限制或两边和小于第三边。",
      level: "danger",
    });
  } else if (calcState && isAcuteOnly && !calcState.isAcute) {
    warnings.push({
      text: `当前角 B=${calcState.angles.B.toFixed(0)}° 或角 C=${calcState.angles.C.toFixed(0)}° 超出锐角范围 (90°-A, 90°)，非锐角三角形！`,
      level: "warning",
    });
  }

  return {
    quantities,
    theorems,
    gaokaoPoints,
    warnings,
    reasoningSteps,
    mnemonic:
      "求和用正弦辅助角，求积用余弦基本式；阿氏隐圆看半径，锐角范围必截断。",
  };
}
