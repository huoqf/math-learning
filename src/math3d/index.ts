export type { Vec3 } from "./vector3";
export {
  add,
  sub,
  scale,
  dot,
  cross,
  norm,
  normalize,
  angleBetween,
  distance,
  lerp,
} from "./vector3";

export type { Plane } from "./plane";
export {
  planeFromPoints,
  pointPlaneDistance,
  projectPointToPlane,
  planeAngle,
  linePlaneAngle,
  isPointOnPlane,
} from "./plane";

export { mathToThree, threeToMath } from "./coordinateConvention";

export type { SilhouettePoint, SilhouetteResult } from "./silhouette";
export { computeSilhouette } from "./silhouette";

export type { ProfilePoint } from "./rotationProfiles";
export {
  cylinderProfile,
  coneProfile,
  frustumProfile,
  sphereProfile,
  sampleCurveProfile,
  rimRadiusAtZ,
  radiusAtZ,
} from "./rotationProfiles";

export {
  cuboidCircumRadius,
  regularTetrahedronCircumRadius,
  regularTetrahedronInRadius,
  regularPyramidCircumRadius,
  coneCircumRadius,
  sphereVolume,
  sphereSurfaceArea,
  inSphereRadiusByVolume,
  regularPolygonCircumRadius,
  regularPolygonArea,
} from "./solidGeometry";

export type { LinePlaneRelation } from "./lineRelation";
export {
  judgeLinePlane,
  judgeLineParallel,
  judgePlaneParallel,
} from "./lineRelation";

export type {
  PolyhedronEdge,
  Polyhedron,
  RotationSection,
} from "./sectionIntersection";
export {
  intersectConvexPolyhedronPlane,
  buildCuboidPolyhedron,
  buildRegularPyramidPolyhedron,
  buildRegularPrismPolyhedron,
  intersectRotationSolidPlane,
} from "./sectionIntersection";

export type { SectionProjectionDetails } from "./sectionArea";
export {
  computeSectionArea3D,
  computeSectionPerimeter3D,
  judgeSectionShape,
  computeProjectionArea2D,
  computeSectionProjectionDetails,
} from "./sectionArea";

export type {
  ConstructionStepInfo,
  ConstructionLine,
  ConstructionPoint,
} from "./sectionConstruction";
export {
  buildPolyhedronConstructionSteps,
  buildCuboidConstructionSteps,
  intersectLines3D,
} from "./sectionConstruction";

export type { ViewName, Point2D, ViewDrawing } from "./orthographicProjection";
export { projectPolyhedron, VIEW_AXES } from "./orthographicProjection";

export {
  cylinderViews,
  coneViews,
  frustumViews,
  sphereViews,
} from "./curvedSolidViews";
