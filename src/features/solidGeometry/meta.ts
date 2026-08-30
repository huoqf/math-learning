import type { KnowledgeNode } from "@/data/types";

export const solidRotationBodyNode: KnowledgeNode = {
  id: "know-solid-rotation-body",
  title: "旋转体的结构特征（圆柱、圆锥、圆台、球）",
  labTitle: "旋转体的结构特征",
  chapter: "立体几何与空间向量",
  module: "立体几何",
  importance: "core",
  animationIds: ["anim-solid-rotation-body"],
  prerequisites: [],
  route: "/solid-rotation-body",
};

export const solidPositionNode: KnowledgeNode = {
  id: "know-solid-position",
  title: "空间线面平行与垂直判定定理",
  labTitle: "线面位置关系判定",
  chapter: "立体几何与空间向量",
  module: "立体几何",
  importance: "core",
  animationIds: ["anim-solid-position"],
  prerequisites: [],
  route: "/solid-position",
};

export const solidSurfaceRelationNode: KnowledgeNode = {
  id: "know-solid-surface-relation",
  title: "面面平行与面面垂直的判定及性质定理",
  labTitle: "面面位置关系判定",
  chapter: "立体几何与空间向量",
  module: "立体几何",
  importance: "core",
  animationIds: ["anim-solid-surface-relation"],
  prerequisites: ["know-solid-position"],
  route: "/solid-surface-relation",
};

export const solidSectionNode: KnowledgeNode = {
  id: "know-solid-section",
  title: "多面体的截面作图与截面积计算",
  labTitle: "多面体截面实验室",
  chapter: "立体几何与空间向量",
  module: "立体几何",
  importance: "gaokao",
  animationIds: ["anim-solid-section"],
  prerequisites: ["know-solid-position"],
  route: "/solid-section",
};

export const solidFoldingNode: KnowledgeNode = {
  id: "know-solid-folding",
  title: "平面图形折叠与翻折二面角",
  labTitle: "平面图形翻折实验室",
  chapter: "立体几何与空间向量",
  module: "立体几何压轴",
  importance: "hard",
  animationIds: ["anim-solid-folding"],
  prerequisites: ["know-solid-surface-relation"],
  route: "/solid-folding",
};

export const solidAngleNode: KnowledgeNode = {
  id: "know-solid-angle",
  title: "空间直角坐标系与求空间角",
  labTitle: "空间角：长方体截面二面角",
  chapter: "立体几何与空间向量",
  module: "空间向量应用",
  importance: "hard",
  animationIds: ["anim-solid-angle"],
  prerequisites: ["know-solid-position"],
  route: "/solid-angle",
};

export const solidDistanceNode: KnowledgeNode = {
  id: "know-solid-distance",
  title: "利用空间向量求点到平面的距离与体积极值",
  labTitle: "点到平面的距离（向量法）",
  chapter: "立体几何与空间向量",
  module: "空间向量应用",
  importance: "gaokao",
  animationIds: ["anim-solid-distance"],
  prerequisites: ["know-solid-angle"],
  route: "/solid-distance",
};

export const solidParametricNode: KnowledgeNode = {
  id: "know-solid-parametric",
  title: "空间向量与动点存在性、最值问题",
  labTitle: "动点存在性与最值实验室",
  chapter: "立体几何与空间向量",
  module: "空间向量压轴",
  importance: "hard",
  animationIds: ["anim-solid-parametric"],
  prerequisites: ["know-solid-angle", "know-solid-distance"],
  route: "/solid-parametric",
};

export const solidBallNode: KnowledgeNode = {
  id: "know-solid-ball",
  title: "多面体与旋转体的外接球、内切球",
  labTitle: "外接球与内切球实验室",
  chapter: "立体几何与空间向量",
  module: "立体几何",
  importance: "hard",
  animationIds: ["anim-solid-ball"],
  prerequisites: ["know-solid-position"],
  route: "/solid-ball",
};

export const solidBallModelsNode: KnowledgeNode = {
  id: "know-solid-ball-models",
  title: "多面体外接球与内切球四大模型（墙角/侧棱垂直/补形/内切等体积）",
  labTitle: "外接球与内切球四大模型实验室",
  chapter: "立体几何与空间向量",
  module: "立体几何压轴",
  importance: "hard",
  animationIds: ["anim-solid-ball-models"],
  prerequisites: ["know-solid-ball"],
  route: "/solid-ball-models",
};

export const solidAdvancedSphereNode: KnowledgeNode = {
  id: "know-solid-advanced-sphere",
  title: "多面体与旋转体进阶切接球（双外心/三球同心/旋转体切接/体积极值）",
  labTitle: "进阶切接球与体积极值实验室",
  chapter: "立体几何与空间向量",
  module: "立体几何压轴",
  importance: "hard",
  animationIds: ["anim-solid-advanced-sphere"],
  prerequisites: ["know-solid-ball-models"],
  route: "/solid-advanced-sphere",
};

export const solidRotationBodyLoader = () => import("./RotationBodyAnimation");
export const solidPositionLoader = () => import("./LinePlaneRelationAnimation");
export const solidSurfaceRelationLoader = () =>
  import("./SurfaceRelationAnimation");
export const solidSectionLoader = () => import("./section/SectionCuboidDemo");
export const solidFoldingLoader = () => import("./FoldingAnimation");
export const solidAngleLoader = () => import("./SpatialAngleAnimation");
export const solidDistanceLoader = () => import("./SpatialDistanceAnimation");
export const solidParametricLoader = () => import("./ParametricPointAnimation");
export const solidBallLoader = () => import("./CircumInSphereAnimation");
export const solidBallModelsLoader = () =>
  import("./PolyhedronCircumSphereAnimation");
export const solidAdvancedSphereLoader = () =>
  import("./AdvancedSphereAnimation");
