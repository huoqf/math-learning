import type {
  MathPanelData,
  MathQuantity,
  Theorem,
  GaokaoPoint,
  WarningItem,
} from "../types";
import { MATH_COLORS } from "@/theme";
import { solveBasisCoefficients, checkCoplanarCondition } from "@/math3d/basis";
import type { Vec3 } from "@/math3d/vector3";

export function buildVector3DBasisPanel(
  params: Record<string, number>,
  extraConfig?: {
    mode?: "parallelepiped" | "coplanar" | "degeneration";
    vecA?: Vec3;
    vecB?: Vec3;
    vecC?: Vec3;
  },
): MathPanelData {
  const x = params.x ?? 1.5;
  const y = params.y ?? 1.2;
  const z = params.z ?? 1.8;
  const cz = params.cz ?? 2.0;

  const mode = extraConfig?.mode ?? "parallelepiped";
  const modeLabelMap = {
    parallelepiped: "平行六面体分解",
    coplanar: "四点共面探究 (x+y+z=1)",
    degeneration: "基底共面检验",
  };

  const vecA: Vec3 = extraConfig?.vecA ?? { x: 2, y: 0, z: 0 };
  const vecB: Vec3 = extraConfig?.vecB ?? { x: 0.5, y: 2, z: 0 };
  const vecC: Vec3 = extraConfig?.vecC ?? { x: 0, y: 0.5, z: cz };

  const decomposition = solveBasisCoefficients(vecA, vecB, vecC, {
    x: x * vecA.x + y * vecB.x + z * vecC.x,
    y: x * vecA.y + y * vecB.y + z * vecC.y,
    z: x * vecA.z + y * vecB.z + z * vecC.z,
  });

  const coplanarInfo = checkCoplanarCondition(x, y, z);

  const quantities: MathQuantity[] = [
    {
      label: "当前教学模式",
      symbol: "\\text{Mode}",
      value: modeLabelMap[mode] ?? "基底分解",
      color: MATH_COLORS.primary,
    },
    {
      label: "基底线性无关性",
      symbol: "(\\vec{a}\\times\\vec{b})\\cdot\\vec{c}",
      value: decomposition.isValid
        ? `正常 (det = ${decomposition.det.toFixed(2)})`
        : "退化失效 (共面!)",
      color: decomposition.isValid
        ? MATH_COLORS.primary
        : MATH_COLORS.secondary,
    },
    {
      label: "分解向量表达式",
      symbol: "\\vec{OP}",
      value: `\\color{#EF4444}{${x.toFixed(1)}}\\vec{a} + \\color{#D97706}{${y.toFixed(1)}}\\vec{b} + \\color{#059669}{${z.toFixed(1)}}\\vec{c}`,
      color: MATH_COLORS.highlight,
    },
    {
      label: "系数之和 x + y + z",
      symbol: "x + y + z",
      value: Number(coplanarInfo.sum.toFixed(2)),
      color: coplanarInfo.isCoplanar
        ? MATH_COLORS.highlight
        : MATH_COLORS.primary,
    },
  ];

  if (coplanarInfo.isCoplanar) {
    quantities.push({
      label: "四点共面状态",
      symbol: "P \\in (ABC)",
      value: coplanarInfo.isCentroid
        ? "位于 △ABC 重心处 (x=y=z=1/3)"
        : coplanarInfo.isInsideTriangle
          ? "位于 △ABC 内部及边界"
          : "位于 (ABC) 延伸平面上",
      color: MATH_COLORS.highlight,
    });
  }

  const theorems: Theorem[] = [
    {
      name: "空间向量基本定理",
      latex: `\\forall \\vec{p}, \\; \\exists! (\\color{#EF4444}{x},\\color{#D97706}{y},\\color{#059669}{z}), \\; \\text{使得} \\; \\vec{p} = \\color{#EF4444}{x}\\vec{a} + \\color{#D97706}{y}\\vec{b} + \\color{#059669}{z}\\vec{c}`,
      level: "core",
      condition: "a, b, c 是空间中三个不共面的基底向量",
    },
    {
      name: "共面向量定理 (四点共面条件)",
      latex: `\\vec{OP} = \\color{#EF4444}{x}\\vec{OA} + \\color{#D97706}{y}\\vec{OB} + \\color{#059669}{z}\\vec{OC} \\quad (\\color{#EF4444}{x} + \\color{#D97706}{y} + \\color{#059669}{z} = 1)`,
      level: "core",
      condition: "当且仅当 x + y + z = 1 时，点 P 与 A, B, C 四点共面",
    },
  ];

  const gaokaoPoints: GaokaoPoint[] = [
    {
      text: "高考选填题核心考点：若四点 P, A, B, C 共面，对任意空间基点 O，向量分解系数和必满足 x + y + z = 1！常用于线面平行判定与共面交点解算。",
      importance: "gaokao",
    },
    {
      text: "高考立体几何解题技巧：当 x, y, z ≥ 0 且 x+y+z=1 时，P 必落在 △ABC 凸多边形截面内部；当 x=y=z=1/3 时，P 恰为 △ABC 的重心！",
      importance: "gaokao",
    },
  ];

  const warnings: WarningItem[] = [];

  if (!decomposition.isValid || Math.abs(cz) < 0.05) {
    warnings.push({
      text: "🚨 基底向量 a, b, c 共面 (det ≈ 0)！空间基底定理失效，任意 3D 向量无法被唯一分解！",
      level: "warning",
    });
  }

  if (Math.abs(z) < 0.05 && decomposition.isValid) {
    warnings.push({
      text: "当前 z = 0，向量 OP 转化为 x a + y b，退化为与基底 a, b 共面的二维向量！",
      level: "warning",
    });
  }

  if (coplanarInfo.isCoplanar) {
    warnings.push({
      text: "💡 触发高考核心条件：系数和 x + y + z = 1！点 P 落在基底端点 A, B, C 决定的截面 (ABC) 内！",
      level: "warning",
    });
  }

  return { quantities, theorems, gaokaoPoints, warnings };
}
