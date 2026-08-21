import { useMemo } from "react";
import {
  Point3D,
  PointLabel3D,
  CompoundLabel3D,
  Segment3D,
  Polygon3DFace,
} from "@/components/Math3D";
import {
  SphereShell,
  InSphere,
  Cylinder,
  Cone,
  Frustum,
} from "@/components/Math3D/solids";
import {
  calculatePerpPlanesSphere,
  calculateConcentricSpheres,
  calculateTruncatedConeSphere,
  calculateSphereExtrema,
} from "@/math3d/advancedSphereModels";
import type { Vec3 } from "@/math3d/vector3";

export type AdvancedSphereModelType =
  "perpPlanes" | "concentric" | "truncatedCone" | "extrema";

export interface AdvancedSphereSceneProps {
  modelType: AdvancedSphereModelType;
  params: Record<string, number>;
  showSphere?: boolean;
  showAuxLines?: boolean;
  showSection?: boolean;
  showTangentPoints?: boolean;
}

export const AdvancedSphereScene = ({
  modelType,
  params,
  showSphere = true,
  showAuxLines = true,
  showSection = true,
  showTangentPoints = true,
}: AdvancedSphereSceneProps) => {
  // ─── 1. 面面垂直双外心模型 ───
  const perpPlanesData = useMemo(() => {
    if (modelType !== "perpPlanes") return null;
    const r1 = params.r1 ?? 3;
    const r2 = params.r2 ?? 3.5;
    const c = params.c ?? 3;
    return calculatePerpPlanesSphere(r1, r2, c);
  }, [modelType, params.r1, params.r2, params.c]);

  // ─── 2. 三球同心模型 ───
  const concentricData = useMemo(() => {
    if (modelType !== "concentric") return null;
    const a = params.a ?? 4;
    return calculateConcentricSpheres(a);
  }, [modelType, params.a]);

  // ─── 3. 圆台切接模型 ───
  const truncatedConeData = useMemo(() => {
    if (modelType !== "truncatedCone") return null;
    const r1 = params.r1 ?? 1.5;
    const r2 = params.r2 ?? 3;
    const h = params.h ?? 4.24;
    return calculateTruncatedConeSphere(r1, r2, h);
  }, [modelType, params.r1, params.r2, params.h]);

  // ─── 4. 体积极值模型 ───
  const extremaData = useMemo(() => {
    if (modelType !== "extrema") return null;
    const R = params.R ?? 3;
    const shapeType = params.shapeType ?? 0;
    const h = params.h ?? 3.46;
    return calculateSphereExtrema(R, shapeType, h);
  }, [modelType, params.R, params.shapeType, params.h]);

  return (
    <group>
      {/* ────────────────── 1. 面面垂直双外心模型 ────────────────── */}
      {modelType === "perpPlanes" && perpPlanesData && (
        <group>
          {/* 外接球壳 */}
          {showSphere && (
            <SphereShell
              center={perpPlanesData.center}
              radius={perpPlanesData.radius}
              colorKey="sphereShell"
              opacity={0.08}
            />
          )}

          {/* 四面体骨架 */}
          {(() => {
            const { A, C, B, P } = perpPlanesData.vertices;
            const { O1, O2, H, center } = perpPlanesData;

            return (
              <>
                {/* 底面与侧面三角形半透明面片 */}
                {showSection && (
                  <>
                    <Polygon3DFace
                      points={[A, C, B]}
                      colorKey="paramPrimary"
                      opacity={0.12}
                    />
                    <Polygon3DFace
                      points={[A, C, P]}
                      colorKey="paramSecondary"
                      opacity={0.12}
                    />
                  </>
                )}

                {/* 公共底边 AC (交线) */}
                <Segment3D from={A} to={C} colorKey="accent" lineWidth={3.5} />

                {/* 底面两条边 */}
                <Segment3D
                  from={A}
                  to={B}
                  colorKey="paramPrimary"
                  lineWidth={2.2}
                />
                <Segment3D
                  from={C}
                  to={B}
                  colorKey="paramPrimary"
                  lineWidth={2.2}
                />

                {/* 侧面两条边 */}
                <Segment3D
                  from={A}
                  to={P}
                  colorKey="paramSecondary"
                  lineWidth={2.2}
                />
                <Segment3D
                  from={C}
                  to={P}
                  colorKey="paramSecondary"
                  lineWidth={2.2}
                />

                {/* 连接 PB 形成四面体 */}
                <Segment3D
                  from={P}
                  to={B}
                  colorKey="line"
                  dashed
                  lineWidth={1.8}
                />

                {/* 辅助线：空间直角矩形与外心垂线 */}
                {showAuxLines && (
                  <>
                    {/* H -> O1 (底面中垂线) */}
                    <Segment3D
                      from={H}
                      to={O1}
                      colorKey="paramTertiary"
                      dashed
                      lineWidth={1.8}
                    />
                    {/* H -> O2 (侧面中垂线) */}
                    <Segment3D
                      from={H}
                      to={O2}
                      colorKey="paramTertiary"
                      dashed
                      lineWidth={1.8}
                    />
                    {/* O1 -> O (底面外心垂线) */}
                    <Segment3D
                      from={O1}
                      to={center}
                      colorKey="paramTertiary"
                      dashed
                      lineWidth={2}
                    />
                    {/* O2 -> O (侧面外心垂线) */}
                    <Segment3D
                      from={O2}
                      to={center}
                      colorKey="paramTertiary"
                      dashed
                      lineWidth={2}
                    />
                    {/* 外接球半径线 O -> A, O -> C */}
                    <Segment3D
                      from={center}
                      to={A}
                      colorKey="primary"
                      dashed
                      lineWidth={1.8}
                    />
                    <Segment3D
                      from={center}
                      to={C}
                      colorKey="primary"
                      dashed
                      lineWidth={1.8}
                    />
                  </>
                )}

                {/* 顶点标注 */}
                <Point3D position={A} colorKey="accent" />
                <PointLabel3D position={A} text="A" offset={[-0.2, 0, 0]} />

                <Point3D position={C} colorKey="accent" />
                <PointLabel3D position={C} text="C" offset={[0.2, 0, 0]} />

                <Point3D position={B} colorKey="paramPrimary" />
                <PointLabel3D position={B} text="B" offset={[0, 0.25, 0]} />

                <Point3D position={P} colorKey="paramSecondary" />
                <PointLabel3D position={P} text="P" offset={[0, 0, 0.25]} />

                <Point3D position={H} colorKey="line" />
                <PointLabel3D position={H} text="H" offset={[0, -0.2, -0.2]} />

                <Point3D position={O1} colorKey="paramTertiary" />
                <CompoundLabel3D
                  position={O1}
                  base="O"
                  subscript="1"
                  offset={[0.2, 0.1, 0]}
                />

                <Point3D position={O2} colorKey="paramTertiary" />
                <CompoundLabel3D
                  position={O2}
                  base="O"
                  subscript="2"
                  offset={[0.2, 0, 0.1]}
                />

                <Point3D position={center} colorKey="accent" />
                <PointLabel3D
                  position={center}
                  text="O"
                  offset={[0.2, 0.15, 0.15]}
                />
              </>
            );
          })()}
        </group>
      )}

      {/* ────────────────── 2. 三球同心对比模型 ────────────────── */}
      {modelType === "concentric" && concentricData && (
        <group>
          {/* 外接球壳 (天蓝) */}
          {showSphere && (
            <SphereShell
              center={concentricData.center}
              radius={concentricData.circumRadius}
              colorKey="sphereShell"
              opacity={0.08}
            />
          )}

          {/* 棱切球壳 (翡翠草绿) */}
          {showSphere && (
            <SphereShell
              center={concentricData.center}
              radius={concentricData.edgeRadius}
              colorKey="paramTertiary"
              opacity={0.12}
            />
          )}

          {/* 内切球壳 (暖珊瑚红) */}
          {showSphere && (
            <InSphere
              center={concentricData.center}
              radius={concentricData.inRadius}
              opacity={0.18}
            />
          )}

          {/* 正四面体 6 条棱 */}
          {(() => {
            const [V0, V1, V2, V3] = concentricData.vertices;
            const edges: [Vec3, Vec3][] = [
              [V0, V1],
              [V0, V2],
              [V0, V3],
              [V1, V2],
              [V2, V3],
              [V3, V1],
            ];

            return (
              <>
                {edges.map(([from, to], i) => (
                  <Segment3D
                    key={i}
                    from={from}
                    to={to}
                    colorKey="paramPrimary"
                    lineWidth={2.5}
                  />
                ))}

                {/* 棱切点 (6个中点) */}
                {showTangentPoints &&
                  concentricData.edgeTangents.map((pt: Vec3, i: number) => (
                    <Point3D
                      key={`edge-${i}`}
                      position={pt}
                      colorKey="paramTertiary"
                    />
                  ))}

                {/* 面切点 (4个重心) */}
                {showTangentPoints &&
                  concentricData.faceTangents.map((pt: Vec3, i: number) => (
                    <Point3D
                      key={`face-${i}`}
                      position={pt}
                      colorKey="inSphereShell"
                    />
                  ))}

                {/* 顶点标注 */}
                <Point3D position={V0} colorKey="paramPrimary" />
                <PointLabel3D
                  position={V0}
                  text="A"
                  offset={[0.15, 0.15, 0.15]}
                />

                <Point3D position={V1} colorKey="paramPrimary" />
                <PointLabel3D
                  position={V1}
                  text="B"
                  offset={[0.15, -0.15, -0.15]}
                />

                <Point3D position={V2} colorKey="paramPrimary" />
                <PointLabel3D
                  position={V2}
                  text="C"
                  offset={[-0.15, 0.15, -0.15]}
                />

                <Point3D position={V3} colorKey="paramPrimary" />
                <PointLabel3D
                  position={V3}
                  text="D"
                  offset={[-0.15, -0.15, 0.15]}
                />

                <Point3D position={concentricData.center} colorKey="accent" />
                <PointLabel3D
                  position={concentricData.center}
                  text="O"
                  offset={[0.2, 0.1, 0]}
                />
              </>
            );
          })()}
        </group>
      )}

      {/* ────────────────── 3. 圆台切接球与内切临界模型 ────────────────── */}
      {modelType === "truncatedCone" && truncatedConeData && (
        <group>
          {/* 圆台实体 */}
          <Frustum
            rBottom={truncatedConeData.r2}
            rTop={truncatedConeData.r1}
            height={truncatedConeData.height}
            colorKey="paramPrimary"
            opacity={0.16}
          />

          {/* 外接球 (天蓝) */}
          {showSphere && (
            <SphereShell
              center={truncatedConeData.circumCenter}
              radius={truncatedConeData.circumRadius}
              colorKey="sphereShell"
              opacity={0.08}
            />
          )}

          {/* 内切球 (暖珊瑚红，满足内切条件时显示) */}
          {showTangentPoints && truncatedConeData.hasInSphere && (
            <InSphere
              center={truncatedConeData.inCenter}
              radius={truncatedConeData.inRadius}
              opacity={0.18}
            />
          )}

          {/* 轴截面轮廓与半径虚线 */}
          {showSection && (
            <>
              <Polygon3DFace
                points={[
                  { x: 0, y: -truncatedConeData.r2, z: 0 },
                  { x: 0, y: truncatedConeData.r2, z: 0 },
                  {
                    x: 0,
                    y: truncatedConeData.r1,
                    z: truncatedConeData.height,
                  },
                  {
                    x: 0,
                    y: -truncatedConeData.r1,
                    z: truncatedConeData.height,
                  },
                ]}
                colorKey="paramSecondary"
                opacity={0.12}
              />
              {/* 轴线 O1-O2 */}
              <Segment3D
                from={{ x: 0, y: 0, z: 0 }}
                to={{ x: 0, y: 0, z: truncatedConeData.height }}
                colorKey="paramTertiary"
                dashed
                lineWidth={2}
              />
              {/* 外接球半径虚线 R: O -> (0, r2, 0) 与 O -> (0, r1, h) */}
              <Segment3D
                from={truncatedConeData.circumCenter}
                to={{ x: 0, y: truncatedConeData.r2, z: 0 }}
                colorKey="paramSecondary"
                dashed
                lineWidth={1.8}
              />
              <Segment3D
                from={truncatedConeData.circumCenter}
                to={{
                  x: 0,
                  y: truncatedConeData.r1,
                  z: truncatedConeData.height,
                }}
                colorKey="paramSecondary"
                dashed
                lineWidth={1.8}
              />
            </>
          )}

          {/* 顶点标注 */}
          <Point3D
            position={{ x: 0, y: 0, z: truncatedConeData.height }}
            colorKey="paramPrimary"
          />
          <CompoundLabel3D
            position={{ x: 0, y: 0, z: truncatedConeData.height }}
            base="O"
            subscript="1"
            offset={[-0.25, 0.1, 0]}
          />

          <Point3D position={{ x: 0, y: 0, z: 0 }} colorKey="paramPrimary" />
          <CompoundLabel3D
            position={{ x: 0, y: 0, z: 0 }}
            base="O"
            subscript="2"
            offset={[-0.25, -0.1, 0]}
          />

          <Point3D
            position={truncatedConeData.circumCenter}
            colorKey="accent"
          />
          <PointLabel3D
            position={truncatedConeData.circumCenter}
            text="O"
            offset={[0.25, 0, 0]}
          />

          {truncatedConeData.hasInSphere && (
            <>
              <Point3D
                position={truncatedConeData.inCenter}
                colorKey="inSphereShell"
              />
              <PointLabel3D
                position={truncatedConeData.inCenter}
                text="I"
                offset={[0.2, 0, 0]}
              />
            </>
          )}
        </group>
      )}

      {/* ────────────────── 4. 球内接几何体体积极值模型 ────────────────── */}
      {modelType === "extrema" && extremaData && (
        <group>
          {/* 固定外接球壳 */}
          {showSphere && (
            <SphereShell
              center={{ x: 0, y: 0, z: 0 }}
              radius={extremaData.R}
              colorKey="sphereShell"
              opacity={0.08}
            />
          )}

          {/* 内接圆柱 */}
          {extremaData.shapeType === 0 && (
            <group position={[0, -extremaData.h / 2, 0]}>
              <Cylinder
                radius={extremaData.r}
                height={extremaData.h}
                colorKey="paramSecondary"
                opacity={0.2}
              />
            </group>
          )}

          {/* 内接圆锥 */}
          {extremaData.shapeType === 1 && (
            <group position={[0, -extremaData.R, 0]}>
              <Cone
                radius={extremaData.r}
                height={extremaData.h}
                colorKey="paramTertiary"
                opacity={0.2}
              />
            </group>
          )}

          {/* 球心标注 */}
          <Point3D position={{ x: 0, y: 0, z: 0 }} colorKey="accent" />
          <PointLabel3D
            position={{ x: 0, y: 0, z: 0 }}
            text="O"
            offset={[0.15, 0.15, 0.15]}
          />
        </group>
      )}
    </group>
  );
};
