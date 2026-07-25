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

// ── know-solid-rotation-body: 旋转体的结构特征 ──

export function buildRotationBodyPanel(
  params: Record<string, number>,
): MathPanelData {
  const shape =
    ((params as Record<string, unknown>).shape as string) ?? "rectangle";
  const r1 = params.r1 ?? 1.5;
  const r2 = params.r2 ?? 0.8;
  const height = params.height ?? 3;

  const quantities: MathQuantity[] = [];
  const theorems: Theorem[] = [];

  if (shape === "rectangle") {
    quantities.push(
      { label: "底半径", symbol: "r", value: r1, color: "#2563EB" },
      { label: "高", symbol: "h", value: height, color: "#059669" },
      {
        label: "侧面积",
        symbol: "S_{侧}",
        value: (2 * Math.PI * r1 * height).toFixed(2),
        color: "#D97706",
      },
      {
        label: "体积",
        symbol: "V",
        value: (Math.PI * r1 ** 2 * height).toFixed(2),
        color: "#DC2626",
      },
    );
    theorems.push(
      { name: "圆柱侧面积", latex: "S_{侧}=2\\pi r h", level: "core" },
      { name: "圆柱体积", latex: "V=\\pi r^2 h", level: "core" },
    );
  } else if (shape === "rightTriangle") {
    const l = Math.sqrt(r1 ** 2 + height ** 2);
    quantities.push(
      { label: "底半径", symbol: "r", value: r1, color: "#2563EB" },
      { label: "高", symbol: "h", value: height, color: "#059669" },
      { label: "母线长", symbol: "l", value: l.toFixed(2), color: "#8B5CF6" },
      {
        label: "侧面积",
        symbol: "S_{侧}",
        value: (Math.PI * r1 * l).toFixed(2),
        color: "#D97706",
      },
      {
        label: "体积",
        symbol: "V",
        value: ((Math.PI * r1 ** 2 * height) / 3).toFixed(2),
        color: "#DC2626",
      },
    );
    theorems.push(
      { name: "圆锥母线长", latex: "l=\\sqrt{r^2+h^2}", level: "core" },
      { name: "圆锥侧面积", latex: "S_{侧}=\\pi r l", level: "core" },
      { name: "圆锥体积", latex: "V=\\dfrac{1}{3}\\pi r^2 h", level: "core" },
    );
  } else if (shape === "rightTrapezoid") {
    const l = Math.sqrt((r1 - r2) ** 2 + height ** 2);
    quantities.push(
      { label: "下底半径", symbol: "r_1", value: r1, color: "#2563EB" },
      { label: "上底半径", symbol: "r_2", value: r2, color: "#059669" },
      { label: "高", symbol: "h", value: height, color: "#D97706" },
      { label: "母线长", symbol: "l", value: l.toFixed(2), color: "#8B5CF6" },
      {
        label: "体积",
        symbol: "V",
        value: ((Math.PI * height * (r1 ** 2 + r1 * r2 + r2 ** 2)) / 3).toFixed(
          2,
        ),
        color: "#DC2626",
      },
    );
    theorems.push(
      { name: "圆台母线长", latex: "l=\\sqrt{(r_1-r_2)^2+h^2}", level: "core" },
      {
        name: "圆台体积",
        latex: "V=\\dfrac{1}{3}\\pi h(r_1^2+r_1r_2+r_2^2)",
        level: "core",
      },
    );
  } else {
    // semicircle → sphere
    quantities.push(
      { label: "半径", symbol: "r", value: r1, color: "#2563EB" },
      {
        label: "表面积",
        symbol: "S",
        value: (4 * Math.PI * r1 ** 2).toFixed(2),
        color: "#D97706",
      },
      {
        label: "体积",
        symbol: "V",
        value: ((4 / 3) * Math.PI * r1 ** 3).toFixed(2),
        color: "#DC2626",
      },
    );
    theorems.push(
      { name: "球表面积", latex: "S=4\\pi r^2", level: "core" },
      { name: "球体积", latex: "V=\\dfrac{4}{3}\\pi r^3", level: "core" },
    );
  }

  const gaokaoPoints: GaokaoPoint[] = [
    {
      text: "旋转体是立体几何的基础概念：圆柱由矩形旋转、圆锥由直角三角形旋转、圆台由直角梯形旋转、球由半圆旋转形成。",
      importance: "core",
    },
    {
      text: "旋转体的表面积和体积是高考常考内容，需要熟练掌握各旋转体的公式。",
      importance: "gaokao",
    },
  ];

  const warnings: WarningItem[] = [];
  if (shape === "rightTrapezoid" && Math.abs(r1 - r2) < 0.05) {
    warnings.push({
      text: "上下底半径接近相等，圆台退化为圆柱！",
      level: "warning",
    });
  }

  return { quantities, theorems, gaokaoPoints, warnings };
}
