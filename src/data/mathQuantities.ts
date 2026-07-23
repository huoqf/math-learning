import type { MathPanelData } from "./types";
import { buildQuadraticPanel } from "./builders/quadratic";
import { buildDerivativePanel } from "./builders/derivative";
import { buildConstantSinglePanel } from "./builders/constantSingle";
import { buildConstantDoublePanel } from "./builders/constantDouble";
import { buildSetPanel } from "./builders/set";
import { buildFuncPropertiesPanel } from "./builders/funcProperties";
import { buildFuncExpLogPanel } from "./builders/funcExpLog";
import { buildFuncZeroPanel } from "./builders/funcZero";
import { buildFuncTransformPanel } from "./builders/funcTransform";
import { buildFuncCompositePanel } from "./builders/funcComposite";
import { buildNikePanel } from "./builders/nike";

export type { MathPanelData } from "./types";

const EMPTY: MathPanelData = {
  quantities: [],
  theorems: [],
  gaokaoPoints: [],
  warnings: [],
};

export function buildMathQuantities(
  animId: string,
  params: Record<string, number>,
  config?: Record<string, unknown>,
): MathPanelData {
  switch (animId) {
    case "anim-nike":
      return buildNikePanel(params, config);
    case "anim-quadratic":
      return buildQuadraticPanel(params, config);
    case "anim-derivative-tangent":
      return buildDerivativePanel(params, config);
    case "anim-constant-single":
      return buildConstantSinglePanel(params, config);
    case "anim-constant-double":
      return buildConstantDoublePanel(params, config);
    case "anim-set-venn":
    case "anim-logic-conditions":
      return buildSetPanel(params);
    case "anim-func-properties":
      return buildFuncPropertiesPanel(params, config);
    case "anim-func-explog":
      return buildFuncExpLogPanel(params);
    case "anim-func-zero":
      return buildFuncZeroPanel(params);
    case "anim-func-transform":
      return buildFuncTransformPanel(params, config);
    case "anim-func-composite":
      return buildFuncCompositePanel(params, config);
    default:
      return EMPTY;
  }
}
