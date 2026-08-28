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
import { buildQuantifiersPanel } from "./builders/quantifiersBuilder";

import { buildDerivativeShiftPanel } from "./builders/derivativeShift";
import { buildSecondDerivativePanel } from "./builders/secondDerivative";
import { buildProbabilityCountingPanel } from "./builders/probabilityCounting";
import { buildProbabilityBayesPanel } from "./builders/probabilityBayes";
import { buildProbabilityDistributionPanel } from "./builders/probabilityDistribution";
import { buildProbabilityNormalPanel } from "./builders/probabilityNormal";
import { buildPairedDataPanel } from "./builders/pairedData";
import { buildStatPercentilePanel } from "./builders/statPercentile";
import {
  buildSpatialAnglePanel,
  buildLinePlaneRelationPanel,
  buildSurfaceRelationPanel,
  buildCircumSpherePanel,
  buildRotationBodyPanel,
  buildSectionPanel,
  buildPolyhedronSpherePanel,
  buildSolidFoldingPanel,
  buildParametricPointPanel,
  buildAdvancedSpherePanel,
} from "./builders/solidGeometry";
import { buildVector3DBasisPanel } from "./builders/vector3d";
import { buildSequencePanel } from "./builders/sequence";
import { buildConicDefinitionPanel } from "./builders/conicDefinition";
import { buildConicPropertiesPanel } from "./builders/conicProperties";
import { buildLineEquationPanel } from "./builders/lineEquation";
import { buildTrigLinesPanel } from "./builders/trigLines";
import { buildTrigIdentityPanel } from "./builders/trigIdentity";
import { buildTrigFormulasPanel } from "./builders/trigFormulas";
import { buildTrigTangentPanel } from "./builders/trigTangent";
import { buildTriangleSolvePanel } from "./builders/triangleSolve";
import { buildTriangleExtremaPanel } from "./builders/triangleExtrema";
import { buildParabolaPanel } from "./builders/parabola";
import { buildConicLineMathQuantities } from "./builders/conicLine";
import { buildConicParamPanel } from "./builders/conicParam";
import { buildInequalityBasicPanel } from "./builders/inequalityBasic";
import { buildInequalityAbsolutePanel } from "./builders/inequalityAbsolute";
import { buildTrigTransformPanel } from "./builders/trigTransform";
import { buildLineCirclePanel } from "./builders/lineCircle";
import { buildCircleCirclePanel } from "./builders/circleCircle";
import { buildVectorLinearPanel } from "./builders/vectorLinear";
import { buildVectorDotProductPanel } from "./builders/vectorDotProduct";
import { buildVectorBasisPanel } from "./builders/vectorBasis";
import { buildComplexPanel } from "./builders/complex";
import { buildDerivativeEndpointTaylorPanel } from "./builders/derivativeEndpointTaylor";
import { buildDerivativeMonotonicityQuantities } from "./builders/derivativeMonotonicity";
import { buildLineParamTPanel } from "./builders/lineParamT";
import { buildVectorPolarizationApolloniusPanel } from "./builders/vectorPolarizationApollonius";
import { buildConicHomogenizationPanel } from "./builders/conicHomogenization";

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
    case "anim-derivative-endpoint":
    case "anim-derivative-endpoint-taylor":
      return buildDerivativeEndpointTaylorPanel(params, config);
    case "anim-complex-geometry":
    case "anim-complex-geometric":
      return buildComplexPanel(params, config);
    case "anim-ineq-absolute":
      return buildInequalityAbsolutePanel(params, config);
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
    case "anim-paired-data-regression":
    case "anim-paired-data-independence":
      return buildPairedDataPanel(params, config);
    case "anim-probability-normal":
      return buildProbabilityNormalPanel(params, config);
    case "anim-probability-distribution":
      return buildProbabilityDistributionPanel(params, config);
    case "anim-probability-bayes":
    case "anim-probability-markov":
      return buildProbabilityBayesPanel(params, config);
    case "anim-probability-counting":
      return buildProbabilityCountingPanel(params, config);
    case "anim-derivative-shift":
      return buildDerivativeShiftPanel(params, config);
    case "anim-derivative-transcendental":
      return buildTranscendentalPanel(params, config);
    case "anim-nike":
    case "anim-nike-standard":
    case "anim-nike-amgm":
    case "anim-nike-shifted":
      return buildNikePanel(params, config);
    case "anim-quadratic":
      return buildQuadraticPanel(params, config);
    case "anim-derivative-tangent":
      return buildDerivativePanel(params, config);
    case "anim-derivative-monotonicity":
    case "anim-derivative-compare":
      return buildDerivativeMonotonicityQuantities(
        params,
        config as Parameters<typeof buildDerivativeMonotonicityQuantities>[1],
      );
    case "anim-derivative-inflection":
      return buildSecondDerivativePanel(params, config);
    case "anim-constant-single":
      return buildConstantSinglePanel(params, config);
    case "anim-constant-double":
      return buildConstantDoublePanel(params, config);
    case "anim-set-venn":
    case "anim-logic-conditions":
      return buildSetPanel(params);
    case "anim-logic-quantifiers":
      return buildQuantifiersPanel(
        params,
        config as Parameters<typeof buildQuantifiersPanel>[1],
      );
    case "anim-func-properties":
    case "anim-func-domain":
    case "anim-func-parity":
    case "anim-func-symmetry":
      return buildFuncPropertiesPanel(params, config);
    case "anim-func-explog":
    case "anim-func-exponential":
    case "anim-func-logarithmic":
    case "anim-func-power":
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
      return buildLinePlaneRelationPanel(params, config);
    case "anim-solid-surface-relation":
      return buildSurfaceRelationPanel(params, config);
    case "anim-solid-section":
      return buildSectionPanel(params, config);
    case "anim-solid-ball":
      return buildCircumSpherePanel(params, config);
    case "anim-solid-ball-models":
      return buildPolyhedronSpherePanel(params, config);
    case "anim-solid-advanced-sphere":
      return buildAdvancedSpherePanel(params, config);
    case "anim-solid-rotation-body":
      return buildRotationBodyPanel(params, config);
    case "anim-solid-folding":
      return buildSolidFoldingPanel(params, config);
    case "anim-solid-parametric":
    case "anim-solid-parametric-point":
    case "anim-parametric-point":
      return buildParametricPointPanel(params, config);
    case "anim-vector3d-basis":
      return buildVector3DBasisPanel(
        params,
        config as Parameters<typeof buildVector3DBasisPanel>[1],
      );
    case "anim-sequence":
    case "anim-sequence-geom":
    case "anim-sequence-recurrence":
    case "anim-sequence-sum":
      return buildSequencePanel(params, config);
    case "anim-conic-definition":
      return buildConicDefinitionPanel(params, config);
    case "anim-conic-properties":
      return buildConicPropertiesPanel(params, config);
    case "anim-conic-parabola":
      return buildParabolaPanel(params, config);
    case "anim-conic-line":
      return buildConicLineMathQuantities(
        params,
        config as Parameters<typeof buildConicLineMathQuantities>[1],
      );
    case "anim-conic-param":
      return buildConicParamPanel(params, config);
    case "anim-conic-param-t":
      return buildLineParamTPanel(params, config);
    case "anim-line-equation":
      return buildLineEquationPanel(params, config);
    case "anim-line-circle":
      return buildLineCirclePanel(params, config);
    case "anim-circle-circle":
      return buildCircleCirclePanel(params, config);
    case "anim-trig-lines":
      return buildTrigLinesPanel(params, config);
    case "anim-trig-transform":
      return buildTrigTransformPanel(params, config);
    case "anim-triangle-solve":
      return buildTriangleSolvePanel(params, config);
    case "anim-vector-linear":
      return buildVectorLinearPanel(params, config);
    case "anim-vector-dot-product":
      return buildVectorDotProductPanel(params, config);
    case "anim-vector-basis":
      return buildVectorBasisPanel(params, config);
    case "anim-vector-polarization-apollonius":
      return buildVectorPolarizationApolloniusPanel(params, config);
    case "anim-conic-homogenization":
      return buildConicHomogenizationPanel(params, config);
    case "anim-ineq-basic":
    case "anim-inequality-basic":
      return buildInequalityBasicPanel(params, config);
    default:
      return EMPTY;
  }
}
