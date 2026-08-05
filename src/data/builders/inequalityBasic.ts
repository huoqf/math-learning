import type { MathPanelData } from "../types";
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

    return {
      quantities: [
        {
          label: "积定值 k",
          symbol: "k",
          value: k.toFixed(2),
        },
        {
          label: "最值取点 x = √k",
          symbol: "x_{min}",
          value: minX.toFixed(2),
          highlight: isAtMin ? "extreme" : undefined,
        },
        {
          label: "最小值 y_min = 2√k",
          symbol: "y_{min}",
          value: minY.toFixed(2),
          highlight: isAtMin ? "extreme" : undefined,
        },
        {
          label: "当前自变量 x",
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
          name: "对勾函数与基本不等式最值",
          latex: "x + \\frac{k}{x} \\ge 2\\sqrt{k} \\quad (x > 0)",
          prerequisites: ["x > 0", "k > 0"],
          condition: "当且仅当 x = \\sqrt{k} 时取等号，取得最小值 2\\sqrt{k}",
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
    };
  }

  return {
    quantities: [
      {
        label: "算术平均 AM (a+b)/2",
        symbol: "AM",
        value: am.toFixed(2),
        highlight: "positive",
      },
      {
        label: "几何平均 GM √(ab)",
        symbol: "GM",
        value: gm.toFixed(2),
        highlight: "positive",
      },
      {
        label: "调和平均 HM 2ab/(a+b)",
        symbol: "HM",
        value: hm.toFixed(2),
      },
      {
        label: "平方平均 QM √((a²+b²)/2)",
        symbol: "QM",
        value: qm.toFixed(2),
      },
      {
        label: "差值 AM - GM",
        symbol: "\\Delta",
        value: diffAmGm.toFixed(4),
        highlight: isEqual ? "zero" : undefined,
      },
      {
        label: "取等状态 (a=b)",
        symbol: "Status",
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
  };
}
