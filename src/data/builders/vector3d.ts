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
import { calculateVectorOperations } from "@/math3d/vectorOperations";
import type { Vec3 } from "@/math3d/vector3";

export function buildVector3DBasisPanel(
  params: Record<string, number>,
  extraConfig?: {
    mode?: "parallelepiped" | "coplanar" | "coordDotProduct";
    vecA?: Vec3;
    vecB?: Vec3;
    vecC?: Vec3;
  },
): MathPanelData {
  const mode = extraConfig?.mode ?? "parallelepiped";

  if (mode === "coordDotProduct") {
    const ax = params.ax ?? 2;
    const ay = params.ay ?? 1;
    const az = params.az ?? 0;
    const bx = params.bx ?? 1;
    const by = params.by ?? 2;
    const bz = params.bz ?? 2;

    const vecA: Vec3 = { x: ax, y: ay, z: az };
    const vecB: Vec3 = { x: bx, y: by, z: bz };
    const res = calculateVectorOperations(vecA, vecB);

    const quantities: MathQuantity[] = [
      {
        label: "向量 a 空间坐标",
        symbol: "\\vec{a}",
        value: `(${ax.toFixed(1)}, \\; ${ay.toFixed(1)}, \\; ${az.toFixed(1)})`,
        color: MATH_COLORS.paramPrimary,
      },
      {
        label: "向量 b 空间坐标",
        symbol: "\\vec{b}",
        value: `(${bx.toFixed(1)}, \\; ${by.toFixed(1)}, \\; ${bz.toFixed(1)})`,
        color: MATH_COLORS.paramSecondary,
      },
      {
        label: "和向量坐标 a + b",
        symbol: "\\vec{a}+\\vec{b}",
        value: `(${res.sum.x.toFixed(1)}, \\; ${res.sum.y.toFixed(1)}, \\; ${res.sum.z.toFixed(1)})`,
        color: MATH_COLORS.highlight,
      },
      {
        label: "差向量坐标 a - b",
        symbol: "\\vec{a}-\\vec{b}",
        value: `(${res.diff.x.toFixed(1)}, \\; ${res.diff.y.toFixed(1)}, \\; ${res.diff.z.toFixed(1)})`,
        color: MATH_COLORS.secondary,
      },
      {
        label: "空间向量数量积 a · b",
        symbol: "\\vec{a}\\cdot\\vec{b}",
        value: Number(res.dotProduct.toFixed(2)),
        color: res.isPerp ? MATH_COLORS.paramTertiary : MATH_COLORS.primary,
      },
      {
        label: "向量模长 |a| 与 |b|",
        symbol: "|\\vec{a}|, |\\vec{b}|",
        value: `${res.normA.toFixed(2)}, \\; ${res.normB.toFixed(2)}`,
        color: MATH_COLORS.primary,
      },
      {
        label: "空间向量夹角 θ",
        symbol: "\\theta",
        value: `${res.angleDeg.toFixed(1)}^\\circ \\; (\\cos\\theta=${res.cosTheta.toFixed(3)})`,
        color: MATH_COLORS.highlight,
      },
      {
        label: "b 在 a 上的投影向量",
        symbol: "\\vec{b}_{\\vec{a}}",
        value: `(${res.projBOnA.x.toFixed(2)}, \\; ${res.projBOnA.y.toFixed(2)}, \\; ${res.projBOnA.z.toFixed(2)})`,
        color: MATH_COLORS.paramTertiary,
      },
    ];

    const theorems: Theorem[] = [
      {
        name: "空间向量加减与数乘坐标运算法则",
        latex: `\\vec{a}\\pm\\vec{b} = (x_1\\pm x_2, \\; y_1\\pm y_2, \\; z_1\\pm z_2), \\quad \\lambda\\vec{a} = (\\lambda x_1, \\lambda y_1, \\lambda z_1)`,
        level: "core",
        condition: "各分量分别进行代数加减与数乘",
      },
      {
        name: "空间向量数量积坐标公式与夹角",
        latex: `\\vec{a}\\cdot\\vec{b} = x_1x_2 + y_1y_2 + z_1z_2 = |\\vec{a}||\\vec{b}|\\cos\\theta, \\quad \\cos\\theta = \\frac{x_1x_2+y_1y_2+z_1z_2}{\\sqrt{x_1^2+y_1^2+z_1^2}\\sqrt{x_2^2+y_2^2+z_2^2}}`,
        level: "core",
        condition:
          "垂直判定：\\vec{a}\\perp\\vec{b} \\iff \\vec{a}\\cdot\\vec{b} = 0",
      },
      {
        name: "空间正交投影向量与投影数量",
        latex: `\\vec{b}_{\\vec{a}} = \\left(\\frac{\\vec{a}\\cdot\\vec{b}}{|\\vec{a}|^2}\\right)\\vec{a} = (|\\vec{b}|\\cos\\theta)\\frac{\\vec{a}}{|\\vec{a}|}`,
        level: "important",
        condition: "投影数量为标量，投影向量方向与 a 相同或相反",
      },
    ];

    const gaokaoPoints: GaokaoPoint[] = [
      {
        text: "【两向量垂直充要条件】空间中两非零向量垂直 ⟺ x₁x₂ + y₁y₂ + z₁z₂ = 0，常用于求空间平面的法向量！",
        importance: "gaokao",
      },
      {
        text: "【投影向量与点线距】向量 b 在向量 a 上的投影向量为 (a·b / |a|²) a，其模长为点到直线垂线段勾股计算的基础！",
        importance: "gaokao",
      },
    ];

    const warnings: WarningItem[] = [];
    if (res.isPerp) {
      warnings.push({
        text: "🎯 空间向量正交：a · b = 0 (θ = 90°)，两向量相互垂直！",
        level: "warning",
      });
    } else if (res.isParallel) {
      warnings.push({
        text: "⚠️ 空间向量共线：各对应坐标成比例 (θ = 0° 或 180°)！",
        level: "warning",
      });
    }

    return { quantities, theorems, gaokaoPoints, warnings };
  }

  const x = params.x ?? 1.5;
  const y = params.y ?? 1.2;
  const z = params.z ?? 1.8;
  const cz = params.cz ?? 2.0;

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
