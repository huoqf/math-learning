import type {
  MathPanelData,
  MathQuantity,
  Theorem,
  GaokaoPoint,
  WarningItem,
} from "../types";
import { MATH_COLORS } from "@/theme";

export function buildVector3DBasisPanel(
  params: Record<string, number>,
): MathPanelData {
  const x = params.x ?? 1.5;
  const y = params.y ?? 1.2;
  const z = params.z ?? 1.8;

  const sumCoeff = x + y + z;
  const isCoplanarWithABC = Math.abs(sumCoeff - 1) < 0.01;

  const quantities: MathQuantity[] = [
    {
      label: "分解向量 OP",
      symbol: "\\vec{OP}",
      value: `${x.toFixed(1)}\\vec{a} + ${y.toFixed(1)}\\vec{b} + ${z.toFixed(1)}\\vec{c}`,
      color: MATH_COLORS.highlight,
    },
    {
      label: "系数之和 x + y + z",
      symbol: "x + y + z",
      value: Number(sumCoeff.toFixed(2)),
      color: isCoplanarWithABC ? MATH_COLORS.highlight : MATH_COLORS.primary,
    },
  ];

  const theorems: Theorem[] = [
    {
      name: "空间向量基本定理",
      latex: `\\forall \\vec{p}, \\; \\exists! (x,y,z), \\; \\text{使得} \\; \\vec{p} = x\\vec{a} + y\\vec{b} + z\\vec{c}`,
      level: "core",
      condition: "a, b, c 是空间中三个不共面的基底向量",
    },
    {
      name: "共面向量定理 (四点共面条件)",
      latex: `\\vec{OP} = x\\vec{OA} + y\\vec{OB} + z\\vec{OC} \\quad (x + y + z = 1)`,
      level: "core",
      condition: "当且仅当 x + y + z = 1 时，点 P 与 A, B, C 四点共面",
    },
  ];

  const gaokaoPoints: GaokaoPoint[] = [
    {
      text: "高考选填题热点：若四点 P, A, B, C 共面，对任意基点 O，向量分解系数和必满足 x + y + z = 1！常用于线面平行与共面交点探究。",
      importance: "gaokao",
    },
  ];

  const warnings: WarningItem[] = [];

  if (Math.abs(z) < 0.05) {
    warnings.push({
      text: "当前 z = 0，向量 OP 转化为 x a + y b，退化为与基底 a, b 共面的二维向量！",
      level: "warning",
    });
  }

  if (isCoplanarWithABC) {
    warnings.push({
      text: "系数和 x + y + z = 1！点 P 落在基底端点 A, B, C 决定的截面 (ABC) 内！",
      level: "warning",
    });
  }

  return { quantities, theorems, gaokaoPoints, warnings };
}
