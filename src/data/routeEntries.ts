import type { KnowledgeNode } from "./types";

export interface RouteEntry {
  node: KnowledgeNode;
  /** 动态 import，返回的模块中第一个命名导出即为组件 */
  loader: () => Promise<Record<string, React.ComponentType>>;
  /** 3D 页面需要 Guarded3DPage 包裹（WebGL 门禁 + 懒加载） */
  guarded3D?: boolean;
}

// ── 1. 集合与常用逻辑 ──
import {
  vennNode,
  logicNode,
  quantifiersNode,
  vennLoader,
  logicLoader,
  quantifiersLoader,
} from "@/features/set/meta";

// ── 2. 不等式 ──
import {
  inequalityBasicNode,
  inequalityBasicLoader,
} from "@/features/inequalityBasic/meta";
import {
  nikeStandardNode,
  nikeAmgmNode,
  nikeShiftedNode,
  nikeStandardLoader,
  nikeAmgmLoader,
  nikeShiftedLoader,
} from "@/features/nike/meta";
import {
  node as inequalityAbsoluteNode,
  loader as inequalityAbsoluteLoader,
} from "@/features/inequalityAbsolute/meta";

// ── 3. 函数概念与性质 ──
import {
  domainNode,
  parityNode,
  symmetryNode,
  domainLoader,
  parityLoader,
  symmetryLoader,
} from "@/features/funcProperties/meta";
import {
  exponentialNode,
  logarithmicNode,
  powerNode,
  exponentialLoader,
  logarithmicLoader,
  powerLoader,
} from "@/features/funcExpLog/meta";
import { funcZeroNode, funcZeroLoader } from "@/features/funcZero/meta";
import { transformNode, transformLoader } from "@/features/transform/meta";
import { compositeNode, compositeLoader } from "@/features/composite/meta";
import { quadraticNode, quadraticLoader } from "@/features/quadratic/meta";

// ── 4. 三角函数与解三角形 ──
import { trigLinesNode, trigLinesLoader } from "@/features/trigLines/meta";
import {
  trigIdentityNode,
  trigIdentityLoader,
} from "@/features/trigIdentity/meta";
import {
  trigFormulasNode,
  trigFormulasLoader,
} from "@/features/trigFormulas/meta";
import {
  trigTangentNode,
  trigTangentLoader,
} from "@/features/trigTangent/meta";
import {
  node as trigTransformNode,
  loader as trigTransformLoader,
} from "@/features/trigTransform/meta";
import {
  node as triangleSolveNode,
  loader as triangleSolveLoader,
} from "@/features/triangleSolve/meta";
import {
  node as triangleExtremaNode,
  loader as triangleExtremaLoader,
} from "@/features/triangleExtrema/meta";

// ── 5. 平面向量与复数 ──
import {
  vectorLinearNode,
  vectorLinearLoader,
} from "@/features/vectorLinear/meta";
import {
  vectorDotProductNode,
  vectorDotProductLoader,
} from "@/features/vectorDotProduct/meta";
import {
  vectorBasisNode,
  vectorBasisLoader,
} from "@/features/vectorBasis/meta";
import {
  node as vectorPolarizationApolloniusNode,
  loader as vectorPolarizationApolloniusLoader,
} from "@/features/vectorPolarizationApollonius/meta";
import { complexNode, complexLoader } from "@/features/complex/meta";

// ── 6. 数列 ──
import {
  arithmeticSequenceNode,
  geometricSequenceNode,
  recurrenceSequenceNode,
  modelsSequenceNode,
  arithmeticSequenceLoader,
  geometricSequenceLoader,
  recurrenceSequenceLoader,
  modelsSequenceLoader,
} from "@/features/sequence/meta";

// ── 7. 导数及其应用 ──
import { derivativeNode, derivativeLoader } from "@/features/derivative/meta";
import {
  derivativeMonotonicityNode,
  derivativeMonotonicityLoader,
} from "@/features/derivative-monotonicity/meta";
import {
  secondDerivativeNode,
  secondDerivativeLoader,
} from "@/features/second-derivative/meta";
import {
  node as derivativeEndpointTaylorNode,
  loader as derivativeEndpointTaylorLoader,
} from "@/features/derivative-endpoint-taylor/meta";
import {
  constantSingleNode,
  constantDoubleNode,
  constantSingleLoader,
  constantDoubleLoader,
} from "@/features/constant/meta";
import {
  derivativeShiftNode,
  derivativeShiftLoader,
} from "@/features/derivativeShift/meta";
import {
  derivativeTranscendentalNode,
  derivativeTranscendentalLoader,
} from "@/features/derivativeTranscendental/meta";

// ── 8. 平面解析几何 ──
import {
  lineEquationNode,
  lineEquationLoader,
} from "@/features/lineEquation/meta";
import { lineCircleNode, lineCircleLoader } from "@/features/line-circle/meta";
import {
  circleCircleNode,
  circleCircleLoader,
} from "@/features/circle-circle/meta";
import {
  conicDefinitionNode,
  conicDefinitionLoader,
} from "@/features/conicDefinition/meta";
import {
  conicPropertiesNode,
  conicPropertiesLoader,
} from "@/features/conicProperties/meta";
import { parabolaNode, parabolaLoader } from "@/features/parabola/meta";
import { meta as conicLineMeta } from "@/features/conicLine/meta";
import { meta as conicParamMeta } from "@/features/conicParam/meta";
import {
  conicParamTNode,
  conicParamTLoader,
} from "@/features/conicParamT/meta";
import {
  node as conicHomogenizationNode,
  loader as conicHomogenizationLoader,
} from "@/features/conicHomogenization/meta";

// ── 9. 立体几何与空间向量 (3D) ──
import {
  solidRotationBodyNode,
  solidPositionNode,
  solidSurfaceRelationNode,
  solidSectionNode,
  solidFoldingNode,
  solidAngleNode,
  solidDistanceNode,
  solidParametricNode,
  solidBallNode,
  solidBallModelsNode,
  solidAdvancedSphereNode,
  solidRotationBodyLoader,
  solidPositionLoader,
  solidSurfaceRelationLoader,
  solidSectionLoader,
  solidFoldingLoader,
  solidAngleLoader,
  solidDistanceLoader,
  solidParametricLoader,
  solidBallLoader,
  solidBallModelsLoader,
  solidAdvancedSphereLoader,
} from "@/features/solidGeometry/meta";
import {
  vector3dBasisNode,
  vector3dBasisLoader,
} from "@/features/vector3d/meta";

// ── 10. 概率与统计 ──
import {
  probabilityCountingNode,
  probabilityCountingLoader,
} from "@/features/probabilityCounting/meta";
import {
  bayesNode,
  markovNode,
  bayesLoader,
  markovLoader,
} from "@/features/probabilityBayes/meta";
import {
  probabilityDistributionNode,
  probabilityDistributionLoader,
} from "@/features/probabilityDistribution/meta";
import {
  statPercentileNode,
  statPercentileLoader,
} from "@/features/statPercentile/meta";
import {
  probabilityNormalNode,
  probabilityNormalLoader,
} from "@/features/probabilityNormal/meta";
import {
  regressionNode,
  independenceNode,
  regressionLoader,
  independenceLoader,
} from "@/features/pairedData/meta";

// ── 聚合全量路由条目 (72 个节点，100% 规范化) ──

export const routeEntries: RouteEntry[] = [
  // 1. 集合与常用逻辑
  { node: vennNode, loader: vennLoader },
  { node: logicNode, loader: logicLoader },
  { node: quantifiersNode, loader: quantifiersLoader },

  // 2. 不等式
  { node: inequalityBasicNode, loader: inequalityBasicLoader },
  { node: nikeStandardNode, loader: nikeStandardLoader },
  { node: nikeAmgmNode, loader: nikeAmgmLoader },
  { node: nikeShiftedNode, loader: nikeShiftedLoader },
  {
    node: inequalityAbsoluteNode,
    loader: inequalityAbsoluteLoader as RouteEntry["loader"],
  },

  // 3. 函数概念与性质
  { node: domainNode, loader: domainLoader },
  { node: parityNode, loader: parityLoader },
  { node: symmetryNode, loader: symmetryLoader },
  { node: exponentialNode, loader: exponentialLoader },
  { node: logarithmicNode, loader: logarithmicLoader },
  { node: powerNode, loader: powerLoader },
  { node: funcZeroNode, loader: funcZeroLoader },
  { node: transformNode, loader: transformLoader },
  { node: compositeNode, loader: compositeLoader },
  { node: quadraticNode, loader: quadraticLoader },

  // 4. 三角函数与解三角形
  { node: trigLinesNode, loader: trigLinesLoader as RouteEntry["loader"] },
  {
    node: trigIdentityNode,
    loader: trigIdentityLoader as RouteEntry["loader"],
  },
  {
    node: trigFormulasNode,
    loader: trigFormulasLoader as RouteEntry["loader"],
  },
  { node: trigTangentNode, loader: trigTangentLoader as RouteEntry["loader"] },
  {
    node: trigTransformNode,
    loader: trigTransformLoader as RouteEntry["loader"],
  },
  {
    node: triangleSolveNode,
    loader: triangleSolveLoader as RouteEntry["loader"],
  },
  {
    node: triangleExtremaNode,
    loader: triangleExtremaLoader as RouteEntry["loader"],
  },

  // 5. 平面向量与复数
  { node: vectorLinearNode, loader: vectorLinearLoader },
  { node: vectorDotProductNode, loader: vectorDotProductLoader },
  { node: vectorBasisNode, loader: vectorBasisLoader },
  {
    node: vectorPolarizationApolloniusNode,
    loader: vectorPolarizationApolloniusLoader as RouteEntry["loader"],
  },
  { node: complexNode, loader: complexLoader },

  // 6. 数列
  { node: arithmeticSequenceNode, loader: arithmeticSequenceLoader },
  { node: geometricSequenceNode, loader: geometricSequenceLoader },
  { node: recurrenceSequenceNode, loader: recurrenceSequenceLoader },
  { node: modelsSequenceNode, loader: modelsSequenceLoader },

  // 7. 导数及其应用
  { node: derivativeNode, loader: derivativeLoader },
  {
    node: derivativeMonotonicityNode,
    loader: derivativeMonotonicityLoader,
  },
  { node: secondDerivativeNode, loader: secondDerivativeLoader },
  {
    node: derivativeEndpointTaylorNode,
    loader: derivativeEndpointTaylorLoader as RouteEntry["loader"],
  },
  { node: constantSingleNode, loader: constantSingleLoader },
  { node: constantDoubleNode, loader: constantDoubleLoader },
  { node: derivativeShiftNode, loader: derivativeShiftLoader },
  {
    node: derivativeTranscendentalNode,
    loader: derivativeTranscendentalLoader,
  },

  // 8. 平面解析几何
  {
    node: lineEquationNode,
    loader: lineEquationLoader as RouteEntry["loader"],
  },
  { node: lineCircleNode, loader: lineCircleLoader },
  { node: circleCircleNode, loader: circleCircleLoader },
  {
    node: conicDefinitionNode,
    loader: conicDefinitionLoader as RouteEntry["loader"],
  },
  {
    node: conicPropertiesNode,
    loader: conicPropertiesLoader as RouteEntry["loader"],
  },
  { node: parabolaNode, loader: parabolaLoader as RouteEntry["loader"] },
  { node: conicLineMeta.node, loader: conicLineMeta.loader },
  { node: conicParamMeta.node, loader: conicParamMeta.loader },
  {
    node: conicParamTNode,
    loader: conicParamTLoader as RouteEntry["loader"],
  },
  {
    node: conicHomogenizationNode,
    loader: conicHomogenizationLoader as RouteEntry["loader"],
  },

  // 9. 立体几何与空间向量 (3D)
  {
    node: solidRotationBodyNode,
    loader: solidRotationBodyLoader,
    guarded3D: true,
  },
  {
    node: solidPositionNode,
    loader: solidPositionLoader,
    guarded3D: true,
  },
  {
    node: solidSurfaceRelationNode,
    loader: solidSurfaceRelationLoader,
    guarded3D: true,
  },
  {
    node: solidSectionNode,
    loader: solidSectionLoader,
    guarded3D: true,
  },
  {
    node: solidFoldingNode,
    loader: solidFoldingLoader,
    guarded3D: true,
  },
  {
    node: vector3dBasisNode,
    loader: vector3dBasisLoader,
    guarded3D: true,
  },
  {
    node: solidAngleNode,
    loader: solidAngleLoader,
    guarded3D: true,
  },
  {
    node: solidDistanceNode,
    loader: solidDistanceLoader,
    guarded3D: true,
  },
  {
    node: solidParametricNode,
    loader: solidParametricLoader,
    guarded3D: true,
  },
  {
    node: solidBallNode,
    loader: solidBallLoader,
    guarded3D: true,
  },
  {
    node: solidBallModelsNode,
    loader: solidBallModelsLoader,
    guarded3D: true,
  },
  {
    node: solidAdvancedSphereNode,
    loader: solidAdvancedSphereLoader,
    guarded3D: true,
  },

  // 10. 概率与统计
  { node: probabilityCountingNode, loader: probabilityCountingLoader },
  { node: bayesNode, loader: bayesLoader },
  { node: markovNode, loader: markovLoader },
  {
    node: probabilityDistributionNode,
    loader: probabilityDistributionLoader,
  },
  { node: statPercentileNode, loader: statPercentileLoader },
  { node: probabilityNormalNode, loader: probabilityNormalLoader },
  { node: regressionNode, loader: regressionLoader },
  { node: independenceNode, loader: independenceLoader },
];

/** 动画 ID 到路由的映射（从 routeEntries 自动派生） */
export const ANIMATION_ROUTE_MAP: Record<string, string> = {};
for (const entry of routeEntries) {
  if (entry.node.route) {
    for (const animId of entry.node.animationIds) {
      ANIMATION_ROUTE_MAP[animId] = entry.node.route;
    }
  }
}

/** 路径到实验室标题的映射（从 routeEntries 自动派生） */
export const PATH_TO_LABEL: Record<string, string> = {};
for (const entry of routeEntries) {
  if (entry.node.route) {
    PATH_TO_LABEL[entry.node.route] = entry.node.labTitle || entry.node.title;
  }
}
