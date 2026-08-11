import type { MathPanelData } from "../types";
import {
  calcTrigProperties,
  formatPiValue,
} from "@/features/trigTransform/math/trigTransform";

export function buildTrigTransformPanel(
  params: Record<string, number>,
): MathPanelData {
  const A = params.A ?? 1.5;
  const omega = params.omega ?? 2;
  const phi = params.phi ?? Math.PI / 3;
  const k = params.k ?? 0;

  const props = calcTrigProperties(A, omega, phi, k);
  const periodStr = formatPiValue(props.period);

  return {
    quantities: [
      {
        label: "函数周期 T",
        symbol: `T = \\frac{2\\pi}{\\omega}`,
        value: periodStr,
      },
      {
        label: "振幅 A",
        symbol: "A",
        value: props.amplitude.toFixed(2),
      },
      {
        label: "最大值 y_max",
        symbol: "y_{max}",
        value: props.yMax.toFixed(2),
      },
      {
        label: "最小值 y_min",
        symbol: "y_{min}",
        value: props.yMin.toFixed(2),
      },
    ],
    theorems: [
      {
        name: "三角函数图象变换",
        latex: "y = A\\sin(\\omega x + \\varphi) + k",
        prerequisites: ["A > 0, \\omega > 0"],
      },
    ],
    gaokaoPoints: [
      {
        text: "图象变换顺序：先平移后伸缩（平移 |φ| 单位）与先伸缩后平移（平移 |φ|/ω 单位）。",
        importance: "gaokao",
      },
    ],
    warnings: [],
    mnemonic: "先平移移 phi，后平移移 phi 比 omega！",
  };
}
