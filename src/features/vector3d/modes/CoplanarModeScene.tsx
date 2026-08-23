import type { Vec3 } from "@/math3d/vector3";
import type { CoplanarInfo } from "@/math3d/basis";
import {
  Vector3DArrow,
  FormulaLabel3D,
  Segment3D,
  Point3D,
  PointLabel3D,
} from "@/components/Math3D";
import { MATH_COLORS } from "@/theme";
import { TriangleMesh } from "../TriangleMesh";

interface CoplanarModeSceneProps {
  O: Vec3;
  vecA: Vec3;
  vecB: Vec3;
  vecC: Vec3;
  P: Vec3;
  projABC: { projectedPoint: Vec3; distance: number };
  coplanarInfo: CoplanarInfo;
  showBasisVectors: boolean;
  showPlaneExt: boolean;
  showTriangleABC: boolean;
  showPerpDistance: boolean;
  showCentroid: boolean;
}

export function CoplanarModeScene({
  O,
  vecA,
  vecB,
  vecC,
  P,
  projABC,
  coplanarInfo,
  showBasisVectors,
  showPlaneExt,
  showTriangleABC,
  showPerpDistance,
  showCentroid,
}: CoplanarModeSceneProps) {
  const pointA = vecA;
  const pointB = vecB;
  const pointC = vecC;

  return (
    <>
      {/* 基底三向量 OA, OB, OC */}
      {showBasisVectors && (
        <>
          <Vector3DArrow from={O} to={vecA} colorKey="paramPrimary" />
          <FormulaLabel3D
            position={{ x: vecA.x * 0.5, y: -0.28, z: 0 }}
            tex="\\vec{a}"
          />
          <Point3D position={pointA} colorKey="paramPrimary" />
          <PointLabel3D position={pointA} text="A" offset={[0.15, -0.15, 0]} />

          <Vector3DArrow from={O} to={vecB} colorKey="paramSecondary" />
          <FormulaLabel3D
            position={{
              x: vecB.x * 0.5 - 0.28,
              y: vecB.y * 0.5 + 0.15,
              z: 0,
            }}
            tex="\\vec{b}"
          />
          <Point3D position={pointB} colorKey="paramSecondary" />
          <PointLabel3D position={pointB} text="B" offset={[-0.15, 0.15, 0]} />

          <Vector3DArrow from={O} to={vecC} colorKey="paramTertiary" />
          <FormulaLabel3D
            position={{
              x: -0.28,
              y: pointC.y * 0.5,
              z: pointC.z * 0.5 + 0.18,
            }}
            tex="\\vec{c}"
          />
          <Point3D position={pointC} colorKey="paramTertiary" />
          <PointLabel3D position={pointC} text="C" offset={[0, 0.08, 0.18]} />
        </>
      )}

      {/* 1. 平面 ABC 动态自适应延展参考面 */}
      {showPlaneExt &&
        (() => {
          const H = projABC.projectedPoint;
          const AB = {
            x: pointB.x - pointA.x,
            y: pointB.y - pointA.y,
            z: pointB.z - pointA.z,
          };
          const AC = {
            x: pointC.x - pointA.x,
            y: pointC.y - pointA.y,
            z: pointC.z - pointA.z,
          };
          const w = {
            x: H.x - pointA.x,
            y: H.y - pointA.y,
            z: H.z - pointA.z,
          };

          // 投影解算仿射坐标 u, v
          const d1 = AB.x * AB.x + AB.y * AB.y + AB.z * AB.z;
          const d2 = AC.x * AC.x + AC.y * AC.y + AC.z * AC.z;
          const d12 = AB.x * AC.x + AB.y * AC.y + AB.z * AC.z;
          const det = d1 * d2 - d12 * d12;
          let uH = 0.33;
          let vH = 0.33;
          if (det > 1e-6) {
            const w1 = w.x * AB.x + w.y * AB.y + w.z * AB.z;
            const w2 = w.x * AC.x + w.y * AC.y + w.z * AC.z;
            uH = (w1 * d2 - w2 * d12) / det;
            vH = (w2 * d1 - w1 * d12) / det;
          }

          const uMin = Math.min(-0.35, uH - 0.35);
          const uMax = Math.max(1.35, uH + 0.35);
          const vMin = Math.min(-0.35, vH - 0.35);
          const vMax = Math.max(1.35, vH + 0.35);

          const q00 = {
            x: pointA.x + uMin * AB.x + vMin * AC.x,
            y: pointA.y + uMin * AB.y + vMin * AC.y,
            z: pointA.z + uMin * AB.z + vMin * AC.z,
          };
          const q10 = {
            x: pointA.x + uMax * AB.x + vMin * AC.x,
            y: pointA.y + uMax * AB.y + vMin * AC.y,
            z: pointA.z + uMax * AB.z + vMin * AC.z,
          };
          const q11 = {
            x: pointA.x + uMax * AB.x + vMax * AC.x,
            y: pointA.y + uMax * AB.y + vMax * AC.y,
            z: pointA.z + uMax * AB.z + vMax * AC.z,
          };
          const q01 = {
            x: pointA.x + uMin * AB.x + vMax * AC.x,
            y: pointA.y + uMin * AB.y + vMax * AC.y,
            z: pointA.z + uMin * AB.z + vMax * AC.z,
          };

          return (
            <>
              <TriangleMesh
                A={q00}
                B={q10}
                C={q11}
                color={MATH_COLORS.secondary}
                opacity={0.06}
                renderOrder={1}
                depthWrite={false}
              />
              <TriangleMesh
                A={q00}
                B={q11}
                C={q01}
                color={MATH_COLORS.secondary}
                opacity={0.06}
                renderOrder={1}
                depthWrite={false}
              />
              <Segment3D
                from={q00}
                to={q10}
                colorKey="asymptote"
                dashed
                opacity={0.4}
                lineWidth={1.2}
              />
              <Segment3D
                from={q10}
                to={q11}
                colorKey="asymptote"
                dashed
                opacity={0.4}
                lineWidth={1.2}
              />
              <Segment3D
                from={q11}
                to={q01}
                colorKey="asymptote"
                dashed
                opacity={0.4}
                lineWidth={1.2}
              />
              <Segment3D
                from={q01}
                to={q00}
                colorKey="asymptote"
                dashed
                opacity={0.4}
                lineWidth={1.2}
              />
            </>
          );
        })()}

      {/* 2. △ABC 截面核心三角形 */}
      {showTriangleABC && (
        <>
          <TriangleMesh
            A={pointA}
            B={pointB}
            C={pointC}
            color={
              coplanarInfo.isCoplanar
                ? MATH_COLORS.paramTertiary
                : MATH_COLORS.primary
            }
            opacity={coplanarInfo.isCoplanar ? 0.35 : 0.18}
            renderOrder={2}
            polygonOffset={true}
            polygonOffsetFactor={-2}
          />

          {/* △ABC 截面三条边界实线 */}
          <Segment3D
            from={pointA}
            to={pointB}
            dashed={false}
            colorKey={
              coplanarInfo.isCoplanar ? "paramTertiary" : "vectorProjection"
            }
            lineWidth={2.4}
          />
          <Segment3D
            from={pointB}
            to={pointC}
            dashed={false}
            colorKey={
              coplanarInfo.isCoplanar ? "paramTertiary" : "vectorProjection"
            }
            lineWidth={2.4}
          />
          <Segment3D
            from={pointC}
            to={pointA}
            dashed={false}
            colorKey={
              coplanarInfo.isCoplanar ? "paramTertiary" : "vectorProjection"
            }
            lineWidth={2.4}
          />
        </>
      )}

      {/* 3. 当不共面时，展示从点 P 到平面 ABC 的垂线段与垂足 H */}
      {showPerpDistance &&
        !coplanarInfo.isCoplanar &&
        projABC.distance > 0.05 && (
          <>
            <Segment3D
              from={P}
              to={projABC.projectedPoint}
              colorKey="degeneracy"
              dashed
              lineWidth={2}
              opacity={0.9}
            />
            <Point3D position={projABC.projectedPoint} colorKey="secondary" />
            <PointLabel3D
              position={projABC.projectedPoint}
              text="H"
              offset={[0.12, 0.12, 0.06]}
            />
          </>
        )}

      {/* 4. 重心 G (当点 P 重合在重心或开启展示时) */}
      {showCentroid && coplanarInfo.isCentroid && (
        <>
          <Point3D
            position={{
              x: (pointA.x + pointB.x + pointC.x) / 3,
              y: (pointA.y + pointB.y + pointC.y) / 3,
              z: (pointA.z + pointB.z + pointC.z) / 3,
            }}
            colorKey="highlight"
          />
          <PointLabel3D
            position={{
              x: (pointA.x + pointB.x + pointC.x) / 3,
              y: (pointA.y + pointB.y + pointC.y) / 3,
              z: (pointA.z + pointB.z + pointC.z) / 3,
            }}
            text="G"
            offset={[0.12, 0.12, 0.12]}
          />
        </>
      )}

      {/* 5. 四面体实体内部展示：轻量侧面半透明线框 */}
      {coplanarInfo.isInsideTetrahedron && (
        <>
          <TriangleMesh
            A={O}
            B={pointA}
            C={pointB}
            color={MATH_COLORS.primary}
            opacity={0.05}
          />
          <TriangleMesh
            A={O}
            B={pointB}
            C={pointC}
            color={MATH_COLORS.primary}
            opacity={0.05}
          />
          <TriangleMesh
            A={O}
            B={pointC}
            C={pointA}
            color={MATH_COLORS.primary}
            opacity={0.05}
          />
        </>
      )}

      {/* 6. 当四点共面时，在平面 ABC 内高亮向量 AP */}
      {coplanarInfo.isCoplanar && (
        <>
          <Vector3DArrow from={pointA} to={P} colorKey="secondary" />
          <FormulaLabel3D
            position={{
              x: (pointA.x + P.x) * 0.5 + 0.15,
              y: (pointA.y + P.y) * 0.5,
              z: (pointA.z + P.z) * 0.5 + 0.15,
            }}
            tex="\\overrightarrow{AP}"
          />
        </>
      )}
    </>
  );
}
