import type { MathPanelData, ReasoningStep } from "../types";
import { calcMeans } from "@/features/inequalityBasic/math/inequalityBasic";

export function buildInequalityBasicPanel(
  params: Record<string, number>,
  config?: Record<string, unknown>,
): MathPanelData {
  const a = params.a ?? 4.0;
  const b = params.b ?? 2.0;
  const k = params.k ?? 4.0;
  const studyMode = (config?.studyMode as string) ?? "semicircle";

  const { am, gm, hm, qm, isEqual, diffAmGm } = calcMeans(a, b);

  if (studyMode === "nike") {
    const minX = Math.sqrt(k);
    const minY = 2 * minX;
    const currentX = a;
    const currentY = currentX + k / currentX;
    const isAtMin = Math.abs(currentX - minX) < 0.05;

    const reasoningSteps: ReasoningStep[] = [
      {
        step: 1,
        title: "审题定法 · 检验一正与乘积定值",
        detail: `由题设 $x > 0, k = ${k.toFixed(1)} > 0$，验证两正数项之积为定值 $x \\cdot \\frac{k}{x} = ${k.toFixed(1)}$。`,
        latex: `x > 0, \\; \\frac{k}{x} > 0 \\implies x \\cdot \\frac{k}{x} = k = ${k.toFixed(1)}`,
        rubric: "准确验证正数定义域与乘积定值条件得 2 分",
      },
      {
        step: 2,
        title: "建模联立 · 应用基本不等式放缩",
        detail: `由基本不等式 $u + v \\ge 2\\sqrt{uv}$，代入项得 $x + \\frac{k}{x} \\ge 2\\sqrt{k}$。`,
        latex: `f(x) = x + \\frac{${k.toFixed(1)}}{x} \\ge 2\\sqrt{${k.toFixed(1)}} = ${minY.toFixed(2)}`,
        rubric: "规范写出基本不等式公式与数值代入得 2 分",
      },
      {
        step: 3,
        title: "求解反思 · 检验等号成立条件",
        detail: `当且仅当两项相等 $x = \\frac{k}{x}$ 即 $x^2 = k$ 时取等号，因 $x > 0$ 解得极小值点 $x = \\sqrt{k} = ${minX.toFixed(2)}$。`,
        latex: `x = \\frac{k}{x} \\iff x = \\sqrt{k} = ${minX.toFixed(2)} \\implies f_{\\min} = ${minY.toFixed(2)}`,
        rubric: "解出极小值点并完成闭环反思得 2 分",
      },
    ];

    return {
      quantities: [
        {
          label: "积定值 k",
          symbol: "k",
          value: k.toFixed(2),
        },
        {
          label: "极小值驻点 x",
          symbol: "x_{\\min}",
          value: minX.toFixed(2),
          highlight: isAtMin ? "extreme" : undefined,
        },
        {
          label: "函数最小值 f_min",
          symbol: "y_{\\min}",
          value: minY.toFixed(2),
          highlight: isAtMin ? "extreme" : undefined,
        },
        {
          label: "当前探针自变量 x",
          symbol: "x",
          value: currentX.toFixed(2),
        },
        {
          label: "当前函数值 f(x)",
          symbol: "f(x)",
          value: currentY.toFixed(2),
        },
      ],
      theorems: [
        {
          name: "对勾函数与基本不等式最值定理",
          latex: "x + \\frac{k}{x} \\ge 2\\sqrt{k} \\quad (x > 0, k > 0)",
          prerequisites: ["x > 0", "k > 0"],
          condition:
            "当且仅当 x = \\sqrt{k} 时取等号，最小值 y_{\\min} = 2\\sqrt{k}",
        },
      ],
      gaokaoPoints: [
        {
          text: "积定和最小原则：当两项之积为定值 $k$ 时，两项之和 $x + \\frac{k}{x}$ 在 $x = \\sqrt{k}$ 处取得最小值 $2\\sqrt{k}$。",
          importance: "gaokao",
        },
        {
          text: "拼凑拆项技巧：高考求 $f(x) = x + \\frac{b}{x-a} \\ (x>a)$ 最小值时，拆项拼凑为 $(x-a) + \\frac{b}{x-a} + a$ 满足“积为定值”前提。",
          importance: "core",
        },
      ],
      warnings: [
        {
          text: "定义域正数限制：当 $x < 0$ 时，$y = x + \\frac{k}{x}$ 为奇函数，无最小值，仅有极大值 $-2\\sqrt{k}$。",
          level: "danger",
        },
      ],
      mnemonic: "积定和最小，和定积最大；一正二定三相等！",
      reasoningSteps,
    };
  }

  const reasoningSteps: ReasoningStep[] =
    studyMode === "square"
      ? [
          {
            step: 1,
            title: "审题定法 · 边长与面积代数建模",
            detail: `大正方形边长为 $a + b = ${(a + b).toFixed(1)}$，总面积为 $(a+b)^2 = ${((a + b) ** 2).toFixed(2)}$。`,
            latex: `S_{\\text{大}} = (a + b)^2 = a^2 + 2ab + b^2`,
            rubric: "准确写出组合图形与边长面积关系得 2 分",
          },
          {
            step: 2,
            title: "建模联立 · 面积分割恒等分解",
            detail: `大正方形由 4 个直角边为 $a, b$ 的矩形与中央小正方形拼成，中央小正方形边长为 $|a - b| = ${Math.abs(a - b).toFixed(1)}$。`,
            latex: `(a + b)^2 = 4ab + (a - b)^2 = ${(4 * a * b).toFixed(2)} + ${(Math.abs(a - b) ** 2).toFixed(2)}`,
            rubric: "列出完全平方面积恒等分解式得 2 分",
          },
          {
            step: 3,
            title: "求解反思 · 平方非负性证明不等式",
            detail: `因实数平方差非负 $(a - b)^2 \\ge 0$，故 $(a+b)^2 \\ge 4ab$，两边开方得 $\\frac{a+b}{2} \\ge \\sqrt{ab}$，当且仅当 $a = b$ 时中央小正方形缩为一点取等号。`,
            latex: `(a - b)^2 \\ge 0 \\implies a^2 + b^2 \\ge 2ab \\iff \\frac{a+b}{2} \\ge \\sqrt{ab}`,
            rubric: "由平方非负性导出基本不等式并明确取等充要条件得 2 分",
          },
        ]
      : [
          {
            step: 1,
            title: "审题定法 · 直径与圆半径几何建模",
            detail: `直径为 $AB = a + b = ${(a + b).toFixed(1)}$，圆心为 $O$，半圆半径为算术平均 $OC = \\frac{a+b}{2} = ${am.toFixed(2)}$。`,
            latex: `R = OC = \\frac{a+b}{2} = AM`,
            rubric: "准确建立半圆直径与算术平均半径对应得 2 分",
          },
          {
            step: 2,
            title: "建模联立 · 射影定理推导几何平均半弦",
            detail: `过分点 $P$ 作直径垂线交半圆于 $C$，由射影定理得 $PC^2 = AP \\cdot PB = ab$，故垂线半弦长 $PC = \\sqrt{ab} = ${gm.toFixed(2)}$。`,
            latex: `PC \\perp AB \\implies PC^2 = AP \\cdot PB = ab \\implies PC = \\sqrt{ab} = GM`,
            rubric: "应用射影定理推导半弦长几何意义得 2 分",
          },
          {
            step: 3,
            title: "求解反思 · 直角边不大于斜边证明不等式",
            detail: `在直角三角形 $OPC$ 中，直角边不大于斜边 $PC \\le OC$，即 $\\sqrt{ab} \\le \\frac{a+b}{2}$。过 $P$ 向 $OC$ 作垂线截得 $CD = \\frac{2ab}{a+b} = HM$。当且仅当 $P$ 与 $O$ 重合（$a = b$）时取等号。`,
            latex: `PC \\le OC \\iff \\sqrt{ab} \\le \\frac{a+b}{2}, \\quad HM \\le GM \\le AM`,
            rubric: "由直角边斜边几何关系完成不等式证明与四均值链闭环得 2 分",
          },
        ];

  return {
    quantities: [
      {
        label: "算术平均 AM",
        symbol: "\\frac{a+b}{2}",
        value: am.toFixed(2),
        highlight: "positive",
      },
      {
        label: "几何平均 GM",
        symbol: "\\sqrt{ab}",
        value: gm.toFixed(2),
        highlight: "positive",
      },
      {
        label: "调和平均 HM",
        symbol: "\\frac{2ab}{a+b}",
        value: hm.toFixed(2),
      },
      {
        label: "平方平均 QM",
        symbol: "\\sqrt{\\frac{a^2+b^2}{2}}",
        value: qm.toFixed(2),
      },
      {
        label: "均值差 AM - GM",
        symbol: "\\Delta",
        value: diffAmGm.toFixed(4),
        highlight: isEqual ? "zero" : undefined,
      },
      {
        label: "等号成立状态",
        symbol: "a = b",
        value: isEqual ? "已取等 (a = b)" : "未取等 (a ≠ b)",
        highlight: isEqual ? "extreme" : undefined,
      },
    ],
    theorems: [
      {
        name: "基本不等式 (均值不等式)",
        latex: "\\frac{a+b}{2} \\ge \\sqrt{ab} \\quad (a+b \\ge 2\\sqrt{ab})",
        prerequisites: ["a > 0", "b > 0 (一正)"],
        condition: "当且仅当 a = b 时取等号 (三相等)",
      },
      {
        name: "四均值不等式链",
        latex: "HM \\le GM \\le AM \\le QM",
        prerequisites: ["a > 0", "b > 0"],
        condition: "当且仅当 a = b 时所有不等号同时取等",
      },
    ],
    gaokaoPoints: [
      {
        text: "“一正二定三相等”法则：高考最值解题三要素：① 变量必须为正；② 和或积为定值；③ 取等号条件必须在变量取值范围内可达。",
        importance: "gaokao",
      },
      {
        text: "乘“1”妙用（常数代换法）：已知 $ax + by = 1$，求 $\\frac{1}{x} + \\frac{1}{y}$ 最小值时，乘以 $(ax+by)$ 展开后再用基本不等式。",
        importance: "core",
      },
      {
        text: "双变量消元与范围分析：利用 $a + b \\ge 2\\sqrt{ab}$ 实现“和”与“积”互相转化，求解最值与范围。",
        importance: "core",
      },
    ],
    warnings: [
      {
        text: "负数条件失效警示：若 $a, b$ 中含有负数，基本不等式不成立！如 $(-2)+(-8)=-10 < 2\\sqrt{(-2)(-8)}=8$。",
        level: "danger",
      },
      {
        text: "虚假最值警示：若取等条件 $a = b$ 不在自变量定义域内，则套用基本不等式求得的值非最值，需使用单调性分析。",
        level: "warning",
      },
    ],
    mnemonic: "一正二定三相等，和定积最大，积定和最小！",
    reasoningSteps,
  };
}
