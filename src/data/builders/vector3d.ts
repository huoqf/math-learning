import type {
  MathPanelData,
  MathQuantity,
  Theorem,
  GaokaoPoint,
  WarningItem,
} from "../types";
import { MATH_COLORS } from "@/theme";
import {
  solveBasisCoefficients,
  checkCoplanarCondition,
  calculateBasisVectorNorm,
} from "@/math3d/basis";
import type { Vec3 } from "@/math3d/vector3";

export function buildVector3DBasisPanel(
  params: Record<string, number>,
  extraConfig?: {
    mode?: "parallelepiped" | "coplanar";
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
  const modeLabelMap: Record<string, string> = {
    parallelepiped: "空间向量基本定理 (基底分解)",
    coplanar: "共面向量定理与四点共面 (x+y+z=1)",
  };

  const vecA: Vec3 = extraConfig?.vecA ?? { x: 2, y: 0, z: 0 };
  const vecB: Vec3 = extraConfig?.vecB ?? { x: 0.6, y: 2, z: 0 };
  const vecC: Vec3 = extraConfig?.vecC ?? { x: 0, y: 0.5, z: cz };

  const targetP: Vec3 = {
    x: x * vecA.x + y * vecB.x + z * vecC.x,
    y: x * vecA.y + y * vecB.y + z * vecC.y,
    z: x * vecA.z + y * vecB.z + z * vecC.z,
  };

  const decomposition = solveBasisCoefficients(vecA, vecB, vecC, targetP);
  const coplanarInfo = checkCoplanarCondition(x, y, z);
  const normInfo = calculateBasisVectorNorm(vecA, vecB, vecC, x, y, z);

  const quantities: MathQuantity[] = [
    {
      label: "当前探究模式",
      symbol: "\\text{Mode}",
      value: modeLabelMap[mode] ?? "基底分解",
      color: MATH_COLORS.primary,
    },
    {
      label: "基底状态判断",
      symbol: "\\text{基底共面性}",
      value: decomposition.isValid
        ? "线性无关 · 构成空间基底"
        : "三向量共面 · 基底失效!",
      color: decomposition.isValid
        ? MATH_COLORS.primary
        : MATH_COLORS.degeneracy,
    },
    {
      label: "基底线性组合表示",
      symbol: "\\vec{OP}",
      value: `\\color{${MATH_COLORS.paramPrimary}}{${x.toFixed(1)}}\\vec{a} + \\color{${MATH_COLORS.paramSecondary}}{${y.toFixed(1)}}\\vec{b} + \\color{${MATH_COLORS.paramTertiary}}{${z.toFixed(1)}}\\vec{c}`,
      color: MATH_COLORS.highlight,
    },
    {
      label: "基底分解系数 (x, y, z)",
      symbol: "(x, y, z)",
      value: `(${x.toFixed(2)}, \\; ${y.toFixed(2)}, \\; ${z.toFixed(2)})`,
      color: MATH_COLORS.paramPrimary,
    },
    {
      label: "空间直角坐标 P(x, y, z)",
      symbol: "P(x,y,z)",
      value: `(${targetP.x.toFixed(2)}, \\; ${targetP.y.toFixed(2)}, \\; ${targetP.z.toFixed(2)})`,
      color: MATH_COLORS.secondary,
    },
    {
      label: "向量模长与模方",
      symbol: "|\\vec{OP}|",
      value: `${normInfo.modulus.toFixed(2)} \\; (\\text{模方}=${normInfo.modulusSq.toFixed(2)})`,
      color: MATH_COLORS.primary,
    },
    {
      label: "分解系数之和",
      symbol: "x + y + z",
      value: Number(coplanarInfo.sum.toFixed(2)),
      color: coplanarInfo.isCoplanar
        ? MATH_COLORS.highlight
        : MATH_COLORS.primary,
    },
  ];

  // 空间位置判定量
  let regionDesc = "空间四面体 O-ABC 外部";
  if (coplanarInfo.spatialRegion === "plane_inside") {
    regionDesc = coplanarInfo.isCentroid
      ? "恰为 △ABC 重心 G (1/3, 1/3, 1/3)"
      : "位于 △ABC 截面三角形内部或边上";
  } else if (coplanarInfo.spatialRegion === "plane_outside") {
    regionDesc = "共面 (x+y+z=1)，位于截面外延平面上";
  } else if (coplanarInfo.spatialRegion === "tetra_inside") {
    regionDesc = "位于四面体 O-ABC 实体内部 (x,y,z>0 且 和<1)";
  }

  quantities.push({
    label: "动点 P 空间几何定位",
    symbol: "\\text{Pos}(P)",
    value: regionDesc,
    color:
      coplanarInfo.isCoplanar || coplanarInfo.isInsideTetrahedron
        ? MATH_COLORS.highlight
        : MATH_COLORS.primary,
  });

  const theorems: Theorem[] = [
    {
      name: "空间向量基本定理",
      latex: `\\vec{p} = \\color{${MATH_COLORS.paramPrimary}}{x}\\vec{a} + \\color{${MATH_COLORS.paramSecondary}}{y}\\vec{b} + \\color{${MATH_COLORS.paramTertiary}}{z}\\vec{c} \\quad (\\text{有序实数组 } (x,y,z) \\text{ 存在且唯一})`,
      level: "core",
      condition: "前提：a, b, c 是空间中三个【不共面】的向量（基底向量）",
    },
    {
      name: "共面向量定理与四点共面充要条件",
      latex: `P, A, B, C \\text{ 共面} \\iff \\vec{OP} = \\color{${MATH_COLORS.paramPrimary}}{x}\\vec{OA} + \\color{${MATH_COLORS.paramSecondary}}{y}\\vec{OB} + \\color{${MATH_COLORS.paramTertiary}}{z}\\vec{OC} \\quad (\\color{${MATH_COLORS.paramPrimary}}{x}+\\color{${MATH_COLORS.paramSecondary}}{y}+\\color{${MATH_COLORS.paramTertiary}}{z}=1)`,
      level: "core",
      condition: "充要条件：若 A, B, C 不共线，对空间任一点 O 均满足系数和为 1",
    },
    {
      name: "基底法数量积与模长展开（大题通法）",
      latex: `|\\vec{OP}|^2 = x^2|\\vec{a}|^2 + y^2|\\vec{b}|^2 + z^2|\\vec{c}|^2 + 2xy(\\vec{a}\\cdot\\vec{b}) + 2yz(\\vec{b}\\cdot\\vec{c}) + 2zx(\\vec{c}\\cdot\\vec{a})`,
      level: "important",
      condition: "适用于斜棱柱、任意四面体等不易建立直角坐标系的几何体",
    },
  ];

  const gaokaoPoints: GaokaoPoint[] = [
    {
      text: "【选填秒杀·四点共面】若已知 OP = x OA + y OB + z OC 且 P 在平面 ABC 上，对任意基点 O 恒有 x + y + z = 1，直接列方程秒杀未知参数！",
      importance: "gaokao",
    },
    {
      text: "【截面与四面体区域定位】① x,y,z ≥ 0 且 x+y+z=1   ⟹   P 在 △ABC 内部；② x=y=z=1/3   ⟹   重心 G；③ x,y,z > 0 且 x+y+z < 1   ⟹   四面体 O-ABC 实体内部。",
      importance: "gaokao",
    },
    {
      text: "【两类共面概念严格辨析】① 基底自身共面：为病态退化，无法构成空间基底；② 点 P 与面 ABC 共面：为正常空间基底下的四点共面定理 (x+y+z=1)。",
      importance: "gaokao",
    },
  ];

  const warnings: WarningItem[] = [];

  if (!decomposition.isValid || Math.abs(cz) < 0.05) {
    warnings.push({
      text: "🚨 基底向量 a, b, c 共面 (det ≈ 0)！空间基本定理前提失效，三维空间点无法唯一分解！",
      level: "warning",
    });
  }

  if (Math.abs(z) < 0.05 && decomposition.isValid) {
    warnings.push({
      text: "当前 z = 0，向量 OP 退化为与基底 a, b 共面的二维向量！",
      level: "warning",
    });
  }

  if (coplanarInfo.isCoplanar) {
    warnings.push({
      text: "💡 触发高考核心考点：系数和 x + y + z = 1！点 P 落在基底端点 A, B, C 决定的平面 (ABC) 内！",
      level: "warning",
    });
  }

  return { quantities, theorems, gaokaoPoints, warnings };
}
