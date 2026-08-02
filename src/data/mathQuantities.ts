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
import { buildTranscendentalPanel } from "./builders/transcendental";

import { buildDerivativeShiftPanel } from "./builders/derivativeShift";
import { buildProbabilityCountingPanel } from "./builders/probabilityCounting";
import { buildProbabilityBayesPanel } from "./builders/probabilityBayes";
import { buildProbabilityDistributionPanel } from "./builders/probabilityDistribution";
import { buildProbabilityNormalPanel } from "./builders/probabilityNormal";
import { buildPairedDataPanel } from "./builders/pairedData";
import { buildStatPercentilePanel } from "./builders/statPercentile";
import {
  buildSpatialAnglePanel,
  buildLinePlaneRelationPanel,
  buildCircumSpherePanel,
  buildRotationBodyPanel,
  buildSectionPanel,
} from "./builders/solidGeometry";
import { buildVector3DBasisPanel } from "./builders/vector3d";
import { buildSequencePanel } from "./builders/sequence";
import { buildConicDefinitionPanel } from "./builders/conicDefinition";
import { buildLineEquationPanel } from "./builders/lineEquation";
import { buildTrigLinesPanel } from "./builders/trigLines";
import { buildTrigIdentityPanel } from "./builders/trigIdentity";
import { buildTrigFormulasPanel } from "./builders/trigFormulas";
import { buildTrigTangentPanel } from "./builders/trigTangent";
import { buildTriangleSolvePanel } from "./builders/triangleSolve";
import { buildTriangleExtremaPanel } from "./builders/triangleExtrema";

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
    case "anim-triangle-extrema":
      return buildTriangleExtremaPanel(params, config);
    case "anim-trig-identity":
    case "anim-trig-unit-circle":
      return buildTrigIdentityPanel(params, config);
    case "anim-trig-tangent":
      return buildTrigTangentPanel(params, config);
    case "anim-trig-formulas":
      return buildTrigFormulasPanel(params, config);
    case "anim-stat-percentile":
      return buildStatPercentilePanel(params, config);

    case "anim-paired-data":
      return buildPairedDataPanel(params, config);
    case "anim-probability-normal":
      return buildProbabilityNormalPanel(params, config);
    case "anim-probability-distribution":
      return buildProbabilityDistributionPanel(params, config);
    case "anim-probability-bayes":
      return buildProbabilityBayesPanel(params, config);
    case "anim-probability-counting":
      return buildProbabilityCountingPanel(params, config);
    case "anim-derivative-shift":
      return buildDerivativeShiftPanel(params, config);
    case "anim-derivative-transcendental":
      return buildTranscendentalPanel(params, config);
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
      return buildFuncExpLogPanel(params, config);
    case "anim-func-zero":
      return buildFuncZeroPanel(params);
    case "anim-func-transform":
      return buildFuncTransformPanel(params, config);
    case "anim-func-composite":
      return buildFuncCompositePanel(params, config);
    case "anim-solid-angle":
    case "anim-solid-distance":
      return buildSpatialAnglePanel(params, config);
    case "anim-solid-position":
    case "anim-solid-surface-relation":
      return buildLinePlaneRelationPanel(params, config);
    case "anim-solid-section":
      return buildSectionPanel(params, config);
    case "anim-solid-ball":
      return buildCircumSpherePanel(params, config);
    case "anim-solid-rotation-body":
      return buildRotationBodyPanel(params);
    case "anim-vector3d-basis":
      return buildVector3DBasisPanel(params, config as any);
    case "anim-sequence":
    case "anim-sequence-geom":
    case "anim-sequence-recurrence":
    case "anim-sequence-sum":
      return buildSequencePanel(params, config);
    case "anim-conic-definition":
      return buildConicDefinitionPanel(params, config);
    case "anim-line-equation":
      return buildLineEquationPanel(params, config);
    case "anim-trig-lines":
      return buildTrigLinesPanel(params, config);
    case "anim-triangle-solve":
      return buildTriangleSolvePanel(params, config);
    default:
      return EMPTY;
  }
}
