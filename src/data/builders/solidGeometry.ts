/**
 * 立体几何模块看板数据生成器聚合导出 (Barrel)
 *
 * 原 128KB 巨型单文件已按子专题拆分如下：
 * 1. solidSpatialAngle.ts       - 空间角（异面直线角、线面角、二面角、点面距）
 * 2. solidLinePlane.ts          - 线面位置关系（平行/垂直判定与性质）
 * 3. solidSurfaceRelation.ts    - 面面位置关系（平行/垂直判定与性质）
 * 4. solidSection.ts            - 空间截面问题（截面多边形与射影面积）
 * 5. solidCircumSphere.ts       - 基础切接球（长方体、正棱锥、直棱柱、圆柱圆锥切接球）
 * 6. solidRotationBody.ts       - 旋转体结构特征（圆柱、圆锥、圆台、球）
 * 7. solidPolyhedronSphere.ts   - 多面体与球经典模型（墙角/柱体/补形/垂棱/内切球）
 * 8. solidFolding.ts            - 空间图形折叠（梯形/矩形/三角形/菱形翻折）
 * 9. solidParametricPoint.ts    - 空间动点存在性与极值问题
 * 10. solidAdvancedSphere.ts    - 进阶切接球专题（垂面共弦/同心球/圆台球/切截极值）
 */

export { buildSpatialAnglePanel } from "./solidSpatialAngle";
export { buildLinePlaneRelationPanel } from "./solidLinePlane";
export { buildSurfaceRelationPanel } from "./solidSurfaceRelation";
export { buildSectionPanel } from "./solidSection";
export { buildCircumSpherePanel } from "./solidCircumSphere";
export { buildRotationBodyPanel } from "./solidRotationBody";
export { buildPolyhedronSpherePanel } from "./solidPolyhedronSphere";
export { buildSolidFoldingPanel } from "./solidFolding";
export { buildParametricPointPanel } from "./solidParametricPoint";
export { buildAdvancedSpherePanel } from "./solidAdvancedSphere";
