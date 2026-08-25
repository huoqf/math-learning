import type {
  MathPanelData,
  MathQuantity,
  Theorem,
  GaokaoPoint,
  WarningItem,
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
            label: "角 A 平分线 t_a",
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
            label: "阿氏圆半径 R_A (最大高)",
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
            label: "最大面积 S_max",
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

  // 2. 定理与推导模型 (左屏选中的探究模式，核心定理设为 level: "core" 置顶展示)
  if (studyMode === "angle-transform") {
    theorems.push({
      name: "正弦定理角化边与辅助角求最值模型",
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
      text: "新高考解答题必考（第15/17题）：求周长/两边和优先使用正弦定理“角化边”转化为单一角三角函数；求面积/边积优先使用余弦定理结合均值不等式。",
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
    mnemonic:
      "求和用正弦辅助角，求积用余弦基本式；阿氏隐圆看半径，锐角范围必截断。",
  };
}
