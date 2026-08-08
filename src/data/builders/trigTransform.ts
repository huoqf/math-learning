import type { MathPanelData } from "../types";
import {
  calcTrigProperties,
  getTransformPathSteps,
  formatPiValue,
} from "@/features/trigTransform/math/trigTransform";

export function buildTrigTransformPanel(
  params: Record<string, number>,
  config?: Record<string, unknown>,
): MathPanelData {
  const A = params.A ?? 1.5;
  const omega = params.omega ?? 2;
  const phi = params.phi ?? Math.PI / 3;
  const k = params.k ?? 0;

  const studyMode = (config?.studyMode as string) ?? "properties";
  const pathType =
    (config?.pathType as "shift-first" | "stretch-first") ?? "shift-first";
  const stepIndex = (config?.stepIndex as number) ?? 0;

  const props = calcTrigProperties(A, omega, phi, k);
  const pathSteps = getTransformPathSteps(A, omega, phi, k, pathType);
  const currentStep = pathSteps[stepIndex] ?? pathSteps[0];

  const phiStr = formatPiValue(phi);
  const periodStr = formatPiValue(props.period);

  return {
    quantities: [
      {
        id: "amplitude",
        label: "振幅 A",
        formula: `A = ${A.toFixed(1)}`,
        value: A.toFixed(1),
        highlight: true,
      },
      {
        id: "omega",
        label: "角频率 ω",
        formula: `\\omega = ${omega.toFixed(1)}`,
        value: omega.toFixed(1),
        highlight: true,
      },
      {
        id: "period",
        label: "函数周期 T",
        formula: `T = \\frac{2\\pi}{\\omega} = ${periodStr}`,
        value: periodStr,
      },
      {
        id: "phi",
        label: "初相 φ",
        formula: `\\varphi = ${phiStr}`,
        value: phiStr,
      },
      {
        id: "range",
        label: "函数值域",
        formula: `y \\in [${props.yMin.toFixed(1)}, ${props.yMax.toFixed(1)}]`,
        value: `[${props.yMin.toFixed(1)}, ${props.yMax.toFixed(1)}]`,
      },
      {
        id: "symmetry-axis",
        label: "主对称轴",
        formula: `x = ${formatPiValue(props.mainSymmetryAxes[0])}`,
        value: `x = ${formatPiValue(props.mainSymmetryAxes[0])}`,
      },
      {
        id: "symmetry-center",
        label: "主对称中心",
        formula: `(${formatPiValue(props.mainSymmetryCenters[0][0])}, ${props.mainSymmetryCenters[0][1].toFixed(1)})`,
        value: `(${formatPiValue(props.mainSymmetryCenters[0][0])}, ${props.mainSymmetryCenters[0][1].toFixed(1)})`,
      },
    ],
    theorems: [
      {
        name: "正弦型函数标准式",
        latex: "y = A \\sin(\\omega x + \\varphi) + k",
        condition:
          "A 控制振幅，\\omega 控制周期，\\varphi 控制初相，k 控制垂直偏置",
        prerequisites: [
          "A > 0",
          "\\omega > 0",
          "|\\varphi| \\leq \\dfrac{\\pi}{2}",
        ],
        level: "core",
      },
      {
        name: "高考必考：平移伸缩顺序规则",
        latex:
          "y = \\sin(\\omega x + \\varphi) = \\sin\\!\\left[\\omega\\!\\left(x + \\frac{\\varphi}{\\omega}\\right)\\right]",
        condition:
          "先伸缩后平移：平移量为 \\dfrac{|\\varphi|}{\\omega}，而非 |\\varphi|！",
        level: "important",
      },
    ],
    gaokaoPoints: [
      {
        text: "求 $y=A\\sin(\\omega x+\\varphi)$ 单调区间：令 $-\\dfrac{\\pi}{2}+2k\\pi \\leq \\omega x+\\varphi \\leq \\dfrac{\\pi}{2}+2k\\pi$ 整体代换。",
        importance: "gaokao",
      },
      {
        text: "图象变换易错陷阱：先伸缩后平移，x 轴平移量为 $\\dfrac{|\\varphi|}{\\omega}$，而非 $|\\varphi|$。",
        importance: "hard",
      },
      {
        text: "五点作图法：令 $\\omega x+\\varphi = 0, \\dfrac{\\pi}{2}, \\pi, \\dfrac{3\\pi}{2}, 2\\pi$ 求 5 个关键点。",
        importance: "core",
      },
    ],
    warnings:
      Math.abs(A) < 1e-4
        ? [
            {
              text: "退化警告：振幅 A = 0 时函数退化为常数函数 y = k！",
              level: "danger" as const,
            },
          ]
        : [],
    mnemonic: "先平移移φ，先伸缩移φ/ω；整体代换求单调，五点作图相位牢。",
  };
}
