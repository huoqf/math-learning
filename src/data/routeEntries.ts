import type { KnowledgeNode } from "./types";

export interface RouteEntry {
  node: KnowledgeNode;
  /** 动态 import，返回的模块中第一个命名导出即为组件 */
  loader: () => Promise<Record<string, React.ComponentType>>;
  /** 3D 页面需要 Guarded3DPage 包裹（WebGL 门禁 + 懒加载） */
  guarded3D?: boolean;
}

// ── 已迁移 meta.ts 的页面（从 meta.ts import） ──
import {
  vennNode,
  logicNode,
  vennLoader,
  logicLoader,
} from "@/features/set/meta";
import {
  statPercentileNode,
  statPercentileLoader,
} from "@/features/statPercentile/meta";
import {
  conicDefinitionNode,
  conicDefinitionLoader,
} from "@/features/conicDefinition/meta";
import {
  conicPropertiesNode,
  conicPropertiesLoader,
} from "@/features/conicProperties/meta";
import { parabolaNode, parabolaLoader } from "@/features/parabola/meta";
import {
  lineEquationNode,
  lineEquationLoader,
} from "@/features/lineEquation/meta";
import { lineCircleNode, lineCircleLoader } from "@/features/line-circle/meta";
import {
  circleCircleNode,
  circleCircleLoader,
} from "@/features/circle-circle/meta";
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
  node as triangleSolveNode,
  loader as triangleSolveLoader,
} from "@/features/triangleSolve/meta";
import {
  node as triangleExtremaNode,
  loader as triangleExtremaLoader,
} from "@/features/triangleExtrema/meta";
import { meta as conicLineMeta } from "@/features/conicLine/meta";
import { meta as conicParamMeta } from "@/features/conicParam/meta";
import {
  nikeStandardNode,
  nikeAmgmNode,
  nikeShiftedNode,
  nikeStandardLoader,
  nikeAmgmLoader,
  nikeShiftedLoader,
} from "@/features/nike/meta";
import {
  inequalityBasicNode,
  inequalityBasicLoader,
} from "@/features/inequalityBasic/meta";
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
import {
  node as trigTransformNode,
  loader as trigTransformLoader,
} from "@/features/trigTransform/meta";
import {
  node as inequalityAbsoluteNode,
  loader as inequalityAbsoluteLoader,
} from "@/features/inequalityAbsolute/meta";
import {
  secondDerivativeNode,
  secondDerivativeLoader,
} from "@/features/second-derivative/meta";
import {
  conicParamTNode,
  conicParamTLoader,
} from "@/features/conicParamT/meta";
import {
  node as conicHomogenizationNode,
  loader as conicHomogenizationLoader,
} from "@/features/conicHomogenization/meta";
import {
  regressionNode,
  independenceNode,
  regressionLoader,
  independenceLoader,
} from "@/features/pairedData/meta";

// ── 暂未迁移的页面（内联声明，未来逐步迁移到 meta.ts） ──

const legacyEntries: RouteEntry[] = [
  {
    node: conicParamTNode,
    loader: conicParamTLoader as RouteEntry["loader"],
  },
  {
    node: secondDerivativeNode,
    loader: secondDerivativeLoader,
  },
  {
    node: vectorDotProductNode,
    loader: vectorDotProductLoader,
  },
  {
    node: inequalityAbsoluteNode,
    loader: inequalityAbsoluteLoader as RouteEntry["loader"],
  },
  {
    node: trigTransformNode,
    loader: trigTransformLoader as RouteEntry["loader"],
  },
  {
    node: inequalityBasicNode,
    loader: inequalityBasicLoader,
  },
  {
    node: conicParamMeta.node,
    loader: conicParamMeta.loader,
  },
  {
    node: conicLineMeta.node,
    loader: conicLineMeta.loader,
  },
  {
    node: parabolaNode,
    loader: parabolaLoader as RouteEntry["loader"],
  },
  {
    node: conicPropertiesNode,
    loader: conicPropertiesLoader as RouteEntry["loader"],
  },
  {
    node: triangleExtremaNode,
    loader: triangleExtremaLoader as RouteEntry["loader"],
  },
  {
    node: lineEquationNode,
    loader: lineEquationLoader as RouteEntry["loader"],
  },
  {
    node: trigLinesNode,
    loader: trigLinesLoader as RouteEntry["loader"],
  },
  {
    node: trigIdentityNode,
    loader: trigIdentityLoader as RouteEntry["loader"],
  },
  {
    node: trigFormulasNode,
    loader: trigFormulasLoader as RouteEntry["loader"],
  },
  {
    node: trigTangentNode,
    loader: trigTangentLoader as RouteEntry["loader"],
  },
  {
    node: {
      id: "know-sequence-geom",
      title: "等差数列通项与求和",
      labTitle: "等差数列实验室",
      chapter: "数列",
      module: "等差与等比数列",
      importance: "core",
      animationIds: ["anim-sequence"],
      prerequisites: [],
      route: "/sequence-arithmetic",
    },
    loader: () => import("@/features/sequence/ArithmeticPage"),
  },
  {
    node: {
      id: "know-sequence-geometric",
      title: "等比数列通项与求和",
      labTitle: "等比数列实验室",
      chapter: "数列",
      module: "等差与等比数列",
      importance: "core",
      animationIds: ["anim-sequence-geom"],
      prerequisites: [],
      route: "/sequence-geometric",
    },
    loader: () => import("@/features/sequence/GeometricPage"),
  },
  {
    node: {
      id: "know-sequence-recurrence",
      title: "递推数列与构造法求通项",
      labTitle: "递推与构造法实验室",
      chapter: "数列",
      module: "数列递推",
      importance: "hard",
      animationIds: ["anim-sequence-recurrence"],
      prerequisites: ["know-sequence-geom"],
      route: "/sequence-recurrence",
    },
    loader: () => import("@/features/sequence/RecurrencePage"),
  },
  {
    node: {
      id: "know-sequence-sum",
      title: "高考求和模型",
      labTitle: "高考求和模型实验室",
      chapter: "数列",
      module: "数列求和",
      importance: "gaokao",
      animationIds: ["anim-sequence-sum"],
      prerequisites: ["know-sequence-geom"],
      route: "/sequence-models",
    },
    loader: () => import("@/features/sequence/ModelsPage"),
  },
  {
    node: {
      id: "know-func-domain-range",
      title: "函数的概念、定义域与值域",
      labTitle: "定义域与值域实验室",
      chapter: "函数概念与性质",
      module: "函数概念",
      importance: "basic",
      animationIds: ["anim-func-properties"],
      prerequisites: [],
      route: "/function-domain",
    },
    loader: () => import("@/features/funcProperties/DomainPage"),
  },
  {
    node: {
      id: "know-func-properties",
      title: "函数的单调性与奇偶性",
      labTitle: "单调奇偶性实验室",
      chapter: "函数概念与性质",
      module: "函数的基本性质",
      importance: "core",
      animationIds: ["anim-func-properties"],
      prerequisites: ["know-func-domain-range"],
      route: "/function-parity",
    },
    loader: () => import("@/features/funcProperties/ParityPage"),
  },
  {
    node: {
      id: "know-func-symmetry",
      title: "函数的对称性、周期性与轴/中心对称",
      labTitle: "对称与周期实验室",
      chapter: "函数概念与性质",
      module: "函数的基本性质",
      importance: "gaokao",
      animationIds: ["anim-func-properties"],
      prerequisites: ["know-func-properties"],
      route: "/function-symmetry",
    },
    loader: () => import("@/features/funcProperties/SymmetryPage"),
  },
  {
    node: {
      id: "know-func-explog",
      title: "指数与对数函数图像及反函数关系",
      labTitle: "指数函数实验室",
      chapter: "函数概念与性质",
      module: "基本初等函数",
      importance: "gaokao",
      animationIds: ["anim-func-explog"],
      prerequisites: ["know-func-properties"],
      route: "/function-exponential",
    },
    loader: () => import("@/features/funcExpLog/ExponentialPage"),
  },
  {
    node: {
      id: "know-func-logarithmic",
      title: "对数函数图像与反函数关系",
      labTitle: "对数函数实验室",
      chapter: "函数概念与性质",
      module: "基本初等函数",
      importance: "gaokao",
      animationIds: ["anim-func-explog"],
      prerequisites: ["know-func-properties"],
      route: "/function-logarithmic",
    },
    loader: () => import("@/features/funcExpLog/LogarithmicPage"),
  },
  {
    node: {
      id: "know-power-function",
      title: "幂函数的性质与图像变化",
      labTitle: "幂函数实验室",
      chapter: "函数概念与性质",
      module: "基本初等函数",
      importance: "basic",
      animationIds: ["anim-func-explog"],
      prerequisites: ["know-func-properties"],
      route: "/function-power",
    },
    loader: () => import("@/features/funcExpLog/PowerPage"),
  },
  {
    node: {
      id: "know-func-zero",
      title: "函数的零点与二分逼近法",
      labTitle: "零点二分法实验室",
      chapter: "函数概念与性质",
      module: "函数与方程",
      importance: "core",
      animationIds: ["anim-func-zero"],
      prerequisites: ["know-func-properties"],
      route: "/function-zero",
    },
    loader: () => import("@/features/funcZero/FuncZeroAnimation"),
  },
  {
    node: {
      id: "know-func-transform",
      title: "函数图象的平移、伸缩与翻折变换",
      labTitle: "函数图象变换实验室",
      chapter: "函数概念与性质",
      module: "图象变换",
      importance: "gaokao",
      animationIds: ["anim-func-transform"],
      prerequisites: ["know-func-properties"],
      route: "/transform",
    },
    loader: () => import("@/features/transform/TransformAnimation"),
  },
  {
    node: {
      id: "know-func-composite",
      title: "分段函数临界与复合函数同增异减",
      labTitle: "分段与复合函数实验室",
      chapter: "函数概念与性质",
      module: "分段与复合函数",
      importance: "hard",
      animationIds: ["anim-func-composite"],
      prerequisites: ["know-func-properties"],
      route: "/composite",
    },
    loader: () => import("@/features/composite/CompositeAnimation"),
  },
  {
    node: {
      id: "know-quadratic",
      title: "二次函数与一元二次方程、不等式",
      labTitle: "二次函数实验室",
      chapter: "函数概念与性质",
      module: "二次函数",
      importance: "core",
      animationIds: ["anim-quadratic"],
      prerequisites: ["know-func-properties"],
      route: "/quadratic",
    },
    loader: () => import("@/features/quadratic/QuadraticAnimation"),
  },
  {
    node: {
      id: "know-derivative-tangent",
      title: "导数的几何意义与切线方程",
      labTitle: "导数几何意义",
      chapter: "导数及其应用",
      module: "导数概念",
      importance: "gaokao",
      animationIds: ["anim-derivative-tangent"],
      prerequisites: ["know-func-properties"],
      route: "/derivative",
    },
    loader: () => import("@/features/derivative/DerivativeAnimation"),
  },
  {
    node: {
      id: "know-derivative-constant",
      title: "导数与不等式恒成立、存在性问题",
      labTitle: "单变量恒成立实验室",
      chapter: "导数及其应用",
      module: "导数的应用",
      importance: "gaokao",
      animationIds: ["anim-constant-single"],
      prerequisites: ["know-derivative-compare"],
      route: "/constant-single",
    },
    loader: () => import("@/features/constant/SingleVarPage"),
  },
  {
    node: {
      id: "know-constant-double",
      title: "双变量博弈与存在性问题",
      labTitle: "双变量博弈实验室",
      chapter: "导数及其应用",
      module: "导数的应用",
      importance: "gaokao",
      animationIds: ["anim-constant-double"],
      prerequisites: ["know-derivative-compare"],
      route: "/constant-double",
    },
    loader: () => import("@/features/constant/DoubleVarPage"),
  },

  {
    node: {
      id: "know-derivative-transcendental",
      title: "基准超越函数与切线放缩模型",
      labTitle: "基准超越函数与切线放缩模型",
      chapter: "导数及其应用",
      module: "导数压轴",
      importance: "hard",
      animationIds: ["anim-derivative-transcendental"],
      prerequisites: ["know-derivative-compare"],
      route: "/derivative-transcendental",
    },
    loader: () =>
      import("@/features/derivativeTranscendental/TranscendentalAnimation"),
  },
  {
    node: {
      id: "know-derivative-shift",
      title: "隐零点定理与极值点偏移",
      labTitle: "隐零点定理与极值点偏移",
      chapter: "导数及其应用",
      module: "导数压轴",
      importance: "hard",
      animationIds: ["anim-derivative-shift"],
      prerequisites: ["know-derivative-compare"],
      route: "/derivative-shift",
    },
    loader: () => import("@/features/derivativeShift/DerivativeShiftAnimation"),
  },
  {
    node: {
      id: "know-probability-counting",
      title: "计数原理与二项式定理",
      labTitle: "计数原理与二项式定理实验室",
      chapter: "概率与统计",
      module: "排列组合",
      importance: "core",
      animationIds: ["anim-probability-counting"],
      prerequisites: [],
      route: "/probability-counting",
    },
    loader: () =>
      import("@/features/probabilityCounting/ProbabilityCountingAnimation"),
  },
  {
    node: {
      id: "know-probability-bayes",
      title: "条件概率、全概率公式与贝叶斯",
      labTitle: "条件概率与贝叶斯实验室",
      chapter: "概率与统计",
      module: "古典与条件概率",
      importance: "gaokao",
      animationIds: ["anim-probability-bayes"],
      prerequisites: [],
      route: "/probability-bayes",
    },
    loader: () =>
      import("@/features/probabilityBayes/ProbabilityBayesAnimation"),
  },
  {
    node: {
      id: "know-probability-markov",
      title: "全概率公式与马尔可夫链状态转移递推",
      labTitle: "全概与马尔可夫链递推实验室",
      chapter: "概率与统计",
      module: "概率压轴",
      importance: "hard",
      animationIds: ["anim-probability-markov"],
      prerequisites: ["know-probability-bayes"],
      route: "/probability-markov",
    },
    loader: () =>
      import("@/features/probabilityBayes/ProbabilityBayesAnimation"),
  },
  {
    node: {
      id: "know-probability-distribution",
      title: "离散型随机变量分布列与数字特征",
      labTitle: "离散型随机变量分布列与数字特征",
      chapter: "概率与统计",
      module: "随机变量及其分布",
      importance: "gaokao",
      animationIds: ["anim-probability-distribution"],
      prerequisites: ["know-probability-bayes"],
      route: "/probability-distribution",
    },
    loader: () =>
      import("@/features/probabilityDistribution/ProbabilityDistributionAnimation"),
  },
  {
    node: {
      id: "know-probability-normal",
      title: "频率直方图与正态分布曲线",
      labTitle: "频率分布直方图与正态分布实验室",
      chapter: "概率与统计",
      module: "随机变量及其分布",
      importance: "gaokao",
      animationIds: ["anim-probability-normal"],
      prerequisites: [],
      route: "/statistics-normal",
    },
    loader: () =>
      import("@/features/probabilityNormal/ProbabilityNormalAnimation"),
  },
  {
    node: {
      id: "know-solid-rotation-body",
      title: "旋转体的结构特征（圆柱、圆锥、圆台、球）",
      labTitle: "旋转体的结构特征",
      chapter: "立体几何与空间向量",
      module: "立体几何",
      importance: "core",
      animationIds: ["anim-solid-rotation-body"],
      prerequisites: [],
      route: "/solid-rotation-body",
    },
    loader: () => import("@/features/solidGeometry/RotationBodyAnimation"),
    guarded3D: true,
  },
  {
    node: {
      id: "know-solid-position",
      title: "空间线面平行与垂直判定定理",
      labTitle: "线面位置关系判定",
      chapter: "立体几何与空间向量",
      module: "立体几何",
      importance: "core",
      animationIds: ["anim-solid-position"],
      prerequisites: [],
      route: "/solid-position",
    },
    loader: () => import("@/features/solidGeometry/LinePlaneRelationAnimation"),
    guarded3D: true,
  },
  {
    node: {
      id: "know-solid-surface-relation",
      title: "面面平行与面面垂直的判定及性质定理",
      labTitle: "面面位置关系判定",
      chapter: "立体几何与空间向量",
      module: "立体几何",
      importance: "core",
      animationIds: ["anim-solid-surface-relation"],
      prerequisites: ["know-solid-position"],
      route: "/solid-surface-relation",
    },
    loader: () => import("@/features/solidGeometry/SurfaceRelationAnimation"),
    guarded3D: true,
  },
  {
    node: {
      id: "know-solid-section",
      title: "多面体的截面作图与截面积计算",
      labTitle: "多面体截面实验室",
      chapter: "立体几何与空间向量",
      module: "立体几何",
      importance: "gaokao",
      animationIds: ["anim-solid-section"],
      prerequisites: ["know-solid-position"],
      route: "/solid-section",
    },
    loader: () => import("@/features/solidGeometry/section/SectionCuboidDemo"),
    guarded3D: true,
  },
  {
    node: {
      id: "know-solid-folding",
      title: "平面图形折叠与翻折二面角",
      labTitle: "平面图形翻折实验室",
      chapter: "立体几何与空间向量",
      module: "立体几何压轴",
      importance: "hard",
      animationIds: ["anim-solid-folding"],
      prerequisites: ["know-solid-surface-relation"],
      route: "/solid-folding",
    },
    loader: () => import("@/features/solidGeometry/FoldingAnimation"),
    guarded3D: true,
  },
  {
    node: {
      id: "know-vector3d-basis",
      title: "空间向量基本定理与基底分解及共面向量",
      labTitle: "空间向量基底分解实验室",
      chapter: "立体几何与空间向量",
      module: "空间向量",
      importance: "core",
      animationIds: ["anim-vector3d-basis"],
      prerequisites: ["know-vector-basis"],
      route: "/vector3d-basis",
    },
    loader: () => import("@/features/vector3d/Vector3DBasisAnimation"),
    guarded3D: true,
  },
  {
    node: {
      id: "know-solid-angle",
      title: "空间直角坐标系与求空间角",
      labTitle: "空间角：长方体截面二面角",
      chapter: "立体几何与空间向量",
      module: "空间向量应用",
      importance: "hard",
      animationIds: ["anim-solid-angle"],
      prerequisites: ["know-solid-position"],
      route: "/solid-angle",
    },
    loader: () => import("@/features/solidGeometry/SpatialAngleAnimation"),
    guarded3D: true,
  },
  {
    node: {
      id: "know-solid-distance",
      title: "利用空间向量求点到平面的距离与体积极值",
      labTitle: "点到平面的距离（向量法）",
      chapter: "立体几何与空间向量",
      module: "空间向量应用",
      importance: "gaokao",
      animationIds: ["anim-solid-distance"],
      prerequisites: ["know-solid-angle"],
      route: "/solid-distance",
    },
    loader: () => import("@/features/solidGeometry/SpatialAngleAnimation"),
    guarded3D: true,
  },
  {
    node: {
      id: "know-solid-parametric",
      title: "空间向量与动点存在性、最值问题",
      labTitle: "动点存在性与最值实验室",
      chapter: "立体几何与空间向量",
      module: "空间向量压轴",
      importance: "hard",
      animationIds: ["anim-solid-parametric"],
      prerequisites: ["know-solid-angle", "know-solid-distance"],
      route: "/solid-parametric",
    },
    loader: () => import("@/features/solidGeometry/ParametricPointAnimation"),
    guarded3D: true,
  },
  {
    node: {
      id: "know-solid-ball",
      title: "多面体与旋转体的外接球、内切球",
      labTitle: "外接球与内切球实验室",
      chapter: "立体几何与空间向量",
      module: "立体几何",
      importance: "hard",
      animationIds: ["anim-solid-ball"],
      prerequisites: ["know-solid-position"],
      route: "/solid-ball",
    },
    loader: () => import("@/features/solidGeometry/CircumInSphereAnimation"),
    guarded3D: true,
  },
  {
    node: {
      id: "know-solid-ball-models",
      title: "多面体外接球与内切球四大模型（墙角/侧棱垂直/补形/内切等体积）",
      labTitle: "外接球与内切球四大模型实验室",
      chapter: "立体几何与空间向量",
      module: "立体几何压轴",
      importance: "hard",
      animationIds: ["anim-solid-ball-models"],
      prerequisites: ["know-solid-ball"],
      route: "/solid-ball-models",
    },
    loader: () =>
      import("@/features/solidGeometry/PolyhedronCircumSphereAnimation"),
    guarded3D: true,
  },
  {
    node: {
      id: "know-solid-advanced-sphere",
      title: "多面体与旋转体进阶切接球（双外心/三球同心/旋转体切接/体积极值）",
      labTitle: "进阶切接球与体积极值实验室",
      chapter: "立体几何与空间向量",
      module: "立体几何压轴",
      importance: "hard",
      animationIds: ["anim-solid-advanced-sphere"],
      prerequisites: ["know-solid-ball-models"],
      route: "/solid-advanced-sphere",
    },
    loader: () => import("@/features/solidGeometry/AdvancedSphereAnimation"),
    guarded3D: true,
  },
];

import {
  node as derivativeEndpointTaylorNode,
  loader as derivativeEndpointTaylorLoader,
} from "@/features/derivative-endpoint-taylor/meta";

// ── 聚合导出 ──

export const routeEntries: RouteEntry[] = [
  // 已迁移 meta.ts 的页面
  { node: vennNode, loader: vennLoader },
  { node: logicNode, loader: logicLoader },
  { node: statPercentileNode, loader: statPercentileLoader },
  { node: conicDefinitionNode, loader: conicDefinitionLoader },
  { node: triangleSolveNode, loader: triangleSolveLoader },
  { node: lineCircleNode, loader: lineCircleLoader },
  { node: circleCircleNode, loader: circleCircleLoader },
  { node: vectorLinearNode, loader: vectorLinearLoader },
  { node: vectorBasisNode, loader: vectorBasisLoader },
  {
    node: vectorPolarizationApolloniusNode,
    loader: vectorPolarizationApolloniusLoader as RouteEntry["loader"],
  },
  { node: complexNode, loader: complexLoader as RouteEntry["loader"] },
  {
    node: derivativeEndpointTaylorNode,
    loader: derivativeEndpointTaylorLoader as RouteEntry["loader"],
  },
  {
    node: conicHomogenizationNode,
    loader: conicHomogenizationLoader as RouteEntry["loader"],
  },
  {
    node: regressionNode,
    loader: regressionLoader as RouteEntry["loader"],
  },
  {
    node: independenceNode,
    loader: independenceLoader as RouteEntry["loader"],
  },
  { node: nikeStandardNode, loader: nikeStandardLoader },
  { node: nikeAmgmNode, loader: nikeAmgmLoader },
  { node: nikeShiftedNode, loader: nikeShiftedLoader },
  // 暂未迁移的页面
  ...legacyEntries,
];

/** 从 routeEntries 自动生成的路由→标题映射（替代 App.tsx 中手写的 PATH_TO_LABEL） */
export const PATH_TO_LABEL: Record<string, string> = Object.fromEntries(
  routeEntries
    .filter((e) => e.node.route)
    .map((e) => [e.node.route!, e.node.labTitle ?? e.node.title]),
);

/** 从 routeEntries 自动生成的 animationId → route 映射（替代 KnowledgeTreeHome 中手写的 ANIMATION_ROUTE_MAP） */
export const ANIMATION_ROUTE_MAP: Record<string, string> = Object.fromEntries(
  routeEntries
    .filter((e) => e.node.route && e.node.animationIds?.length)
    .flatMap((e) =>
      e.node.animationIds.map((animId) => [animId, e.node.route!]),
    ),
);
