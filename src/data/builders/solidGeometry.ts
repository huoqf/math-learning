import type {
  MathPanelData,
  MathQuantity,
  Theorem,
  GaokaoPoint,
  WarningItem,
} from "../types";
import {
  cuboidCircumRadius,
  sphereVolume,
  sphereSurfaceArea,
} from "@/math3d/solidGeometry";
import { planeAngle } from "@/math3d/plane";
import { judgeLinePlane } from "@/math3d/lineRelation";
import type { Vec3 } from "@/math3d/vector3";
import type { Plane } from "@/math3d/plane";

// ── know-solid-angle: 空间角（长方体截面二面角） ──

export function buildSpatialAnglePanel(
  params: Record<string, number>,
): MathPanelData {
  const a = params.a ?? 3;
  const b = params.b ?? 2;
  const c = params.c ?? 2;
  const ex = params.ex ?? 1.2;

  const A: Vec3 = { x: 0, y: 0, z: 0 };
  const B: Vec3 = { x: a, y: 0, z: 0 };
  const D: Vec3 = { x: 0, y: b, z: 0 };
  const E: Vec3 = { x: 0, y: 0, z: ex };

  const basePlane: Plane = { point: A, normal: { x: 0, y: 0, z: 1 } };
  // 使用 planeFromPoints 逻辑计算截面法向量
  const v1: Vec3 = { x: D.x - B.x, y: D.y - B.y, z: D.z - B.z };
  const v2: Vec3 = { x: E.x - B.x, y: E.y - B.y, z: E.z - B.z };
  const n2: Vec3 = {
    x: v1.y * v2.z - v1.z * v2.y,
    y: v1.z * v2.x - v1.x * v2.z,
    z: v1.x * v2.y - v1.y * v2.x,
  };
  const cutNormal: Plane = { point: B, normal: n2 };
  const dihedral = planeAngle(basePlane, cutNormal);
  const dihedralDeg = (dihedral * 180) / Math.PI;

  const quantities: MathQuantity[] = [
    {
      label: "长 a",
      symbol: "a",
      value: a,
      color: "#2563EB",
    },
    {
      label: "宽 b",
      symbol: "b",
      value: b,
      color: "#059669",
    },
    {
      label: "高 c",
      symbol: "c",
      value: c,
      color: "#D97706",
    },
    {
      label: "截面点 E 高度",
      symbol: "z_E",
      value: ex,
      color: "#DC2626",
    },
    {
      label: "二面角 B-DE",
      symbol: "θ",
      value: dihedralDeg.toFixed(2),
      unit: "°",
      color: "#DC2626",
    },
  ];

  const theorems: Theorem[] = [
    {
      name: "二面角定义",
      latex: `\\theta = \\arccos \\frac{|\\vec{n_1} \\cdot \\vec{n_2}|}{|\\vec{n_1}||\\vec{n_2}|}`,
      level: "core",
      note: "两个半平面的法向量夹角即为二面角（或其补角）",
    },
    {
      name: "长方体顶点坐标",
      latex: `A(0,0,0),\\; B(a,0,0),\\; D(0,b,0),\\; E(0,0,z_E)`,
      level: "important",
    },
  ];

  const gaokaoPoints: GaokaoPoint[] = [
    {
      text: "空间向量求二面角是高考立体几何的核心方法：建立空间直角坐标系，求两个平面的法向量，利用向量夹角公式计算。",
      importance: "gaokao",
    },
    {
      text: "注意二面角范围为 [0°, 180°]，向量夹角公式给出的可能是补角，需根据几何直观判断锐/钝。",
      importance: "hard",
    },
  ];

  const warnings: WarningItem[] = [];
  if (dihedralDeg < 1 || dihedralDeg > 179) {
    warnings.push({
      text: "二面角接近 0° 或 180°，截面退化为平面或共面！",
      level: "warning",
    });
  }

  return { quantities, theorems, gaokaoPoints, warnings };
}

// ── know-solid-position: 线面位置关系 ──

export function buildLinePlaneRelationPanel(
  params: Record<string, number>,
): MathPanelData {
  const a = params.a ?? 3;
  const t = params.lineParam ?? 0.5;

  const plane: Plane = {
    point: { x: 0, y: 0, z: 0 },
    normal: { x: 0, y: 0, z: 1 },
  };

  const lineDir: Vec3 = { x: 1, y: t, z: 0 };
  const pointOnLine: Vec3 = { x: 0, y: 0, z: a };
  const relation = judgeLinePlane(lineDir, plane, pointOnLine);

  const relationText =
    relation === "parallel"
      ? "线面平行"
      : relation === "perpendicular"
        ? "线面垂直"
        : relation === "inPlane"
          ? "线在面内"
          : "线面相交";

  const quantities: MathQuantity[] = [
    {
      label: "棱长 a",
      symbol: "a",
      value: a,
      color: "#2563EB",
    },
    {
      label: "方向参数 t",
      symbol: "t",
      value: t,
      color: "#059669",
    },
    {
      label: "位置关系",
      value: relationText,
      color: "#DC2626",
    },
  ];

  const theorems: Theorem[] = [
    {
      name: "线面平行判定定理",
      latex: `\\vec{l} \\cdot \\vec{n} = 0 \\;\\Rightarrow\\; l \\parallel \\alpha`,
      level: "core",
      condition: "直线方向向量与平面法向量垂直，且直线不在平面内",
    },
    {
      name: "线面垂直判定定理",
      latex: `\\vec{l} \\parallel \\vec{n} \\;\\Rightarrow\\; l \\perp \\alpha`,
      level: "core",
      condition: "直线方向向量与平面法向量平行",
    },
  ];

  const gaokaoPoints: GaokaoPoint[] = [
    {
      text: "线面位置关系是立体几何的基础，高考中常与空间向量法结合考查。判定定理和性质定理是证明线面平行/垂直的核心工具。",
      importance: "gaokao",
    },
  ];

  return { quantities, theorems, gaokaoPoints, warnings: [] };
}

// ── know-solid-ball: 外接球与内切球 ──

export function buildCircumSpherePanel(
  params: Record<string, number>,
): MathPanelData {
  const a = params.a ?? 3;
  const b = params.b ?? 2;
  const c = params.c ?? 2;

  const R = cuboidCircumRadius(a, b, c);
  const V = sphereVolume(R);
  const S = sphereSurfaceArea(R);

  const quantities: MathQuantity[] = [
    {
      label: "长方体棱长",
      symbol: "a",
      value: a,
      color: "#2563EB",
    },
    {
      label: "长方体棱宽",
      symbol: "b",
      value: b,
      color: "#059669",
    },
    {
      label: "长方体棱高",
      symbol: "c",
      value: c,
      color: "#D97706",
    },
    {
      label: "外接球半径",
      symbol: "R",
      value: R.toFixed(4),
      color: "#DC2626",
    },
    {
      label: "外接球体积",
      symbol: "V",
      value: V.toFixed(4),
      color: "#8B5CF6",
    },
    {
      label: "外接球表面积",
      symbol: "S",
      value: S.toFixed(4),
      color: "#EC4899",
    },
  ];

  const theorems: Theorem[] = [
    {
      name: "长方体外接球半径",
      latex: `R = \\frac{\\sqrt{a^2 + b^2 + c^2}}{2}`,
      level: "core",
      note: "长方体体对角线的一半即为外接球半径",
    },
    {
      name: "球体积公式",
      latex: `V = \\frac{4}{3}\\pi R^3`,
      level: "important",
    },
    {
      name: "球表面积公式",
      latex: `S = 4\\pi R^2`,
      level: "important",
    },
  ];

  const gaokaoPoints: GaokaoPoint[] = [
    {
      text: "外接球问题的核心是找到球心位置（到各顶点距离相等的点），长方体的外接球球心即为体对角线中点。",
      importance: "gaokao",
    },
    {
      text: "正棱锥外接球半径公式 R = (r²+h²)/(2h)，其中 r 为底面外接圆半径，h 为高。",
      importance: "hard",
    },
  ];

  return { quantities, theorems, gaokaoPoints, warnings: [] };
}
