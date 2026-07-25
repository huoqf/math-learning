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
