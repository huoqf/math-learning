import type { MathPanelData } from "../types";
import { calculateTransform } from "@/math/transform";
import { MATH_COLORS } from "@/theme";

export function buildFuncTransformPanel(
  params: Record<string, number>,
  config?: Record<string, unknown>,
): MathPanelData {
  const fnType = (config?.fnType as any) || "quadratic";
  const foldMode = (config?.foldMode as any) || "none";
  const h = params.h ?? 1.0;
  const k = params.k ?? 0.5;
  const A = params.A ?? 1.5;
  const omega = params.omega ?? 1.0;

  const res = calculateTransform(fnType, { h, k, A, omega, foldMode });

  const quantities: MathPanelData["quantities"] = [
    {
      label: "左右平移",
      symbol: "h",
      value: h > 0 ? `右移 ${h}` : h < 0 ? `左移 ${Math.abs(h)}` : "0",
      color: MATH_COLORS.paramPrimary,
    },
    {
      label: "上下平移",
      symbol: "k",
      value: k > 0 ? `上移 ${k}` : k < 0 ? `下移 ${Math.abs(k)}` : "0",
      color: MATH_COLORS.paramSecondary,
    },
    {
      label: "纵向伸缩",
      symbol: "A",
      value: `${A} 倍`,
      color: MATH_COLORS.paramPrimary,
    },
    {
      label: "横向伸缩",
      symbol: "ω",
      value: `${omega} 倍`,
      color: MATH_COLORS.paramSecondary,
    },
    {
      label: "翻折模式",
      value:
        foldMode === "global"
          ? "|f(x)| 轴上翻"
          : foldMode === "input"
            ? "f(|x|) y轴对称"
            : "无",
    },
    { label: "几何演化", value: res.description },
  ];

  const theorems: MathPanelData["theorems"] = [
    {
      name: "图像平移口诀 (左加右减，上加下减)",
      latex: "y = f(x \\mp h) \\pm k",
      level: "core",
      prerequisites: ["x - h 对应向右平移 h", "+ k 对应向上平移 k"],
    },
    {
      name: "绝对值翻折法则",
      latex: "y = |f(x)| \\quad \\text{保留 } x \\text{ 轴上方，下方翻到上方}",
      level: "important",
      prerequisites: ["y = f(|x|) 保留 y 轴右侧，左侧按右侧对称"],
    },
  ];

  const gaokaoPoints: MathPanelData["gaokaoPoints"] = [
    {
      text: "高考图像平移陷阱：y = f(2x + 1) 是由 y = f(2x) 向左平移 1/2 个单位得到，而不是 1 个单位！提公因数 2 得 y = f(2(x + 1/2))。",
      importance: "gaokao",
    },
    {
      text: "翻折图像定义域与值域：y = |f(x)| 的值域必为 [0, +∞)；y = f(|x|) 必定为偶函数。",
      importance: "gaokao",
    },
  ];

  const warnings: MathPanelData["warnings"] = [];
  if (res.isDegenerate && res.warningMessage) {
    warnings.push({ text: res.warningMessage, level: "warning" });
  }

  return {
    quantities,
    theorems,
    gaokaoPoints,
    warnings,
    mnemonic:
      "左加右减平移定，上加下减纵向移；整体绝对值保留上，自变量绝对对称右。",
  };
}
