import { useMemo } from "react";
import {
  CameraRig,
  Cuboid,
  Segment3D,
  SectionPlane3D,
  Point3D,
  PointLabel3D,
  CompoundLabel3D,
} from "@/components/Math3D";
import type { CameraPreset } from "@/hooks/use3DViewport";
import { MATH_COLORS } from "@/theme";
import {
  buildCubeVertices,
  solvePerpLineLocus,
  solveConstDistCircle,
  solveConstAngleConic,
  type SolidDynamicLocusMode,
} from "@/math3d/solidDynamicLocus";

export interface SolidDynamicLocusScene3DProps {
  mode: SolidDynamicLocusMode;
  a: number;
  t: number;
  rFactor: number;
  tiltDeg: number;
  preset: CameraPreset;
  controlsRef: React.RefObject<unknown>;
  showRightAngles?: boolean;
}

export function SolidDynamicLocusScene3D({
  mode,
  a,
  t,
  rFactor,
  tiltDeg,
  controlsRef,
  showRightAngles = true,
}: SolidDynamicLocusScene3DProps) {
  const vertices = useMemo(() => buildCubeVertices(a), [a]);

  const perpRes = useMemo(
    () => (mode === "perpLineLocus" ? solvePerpLineLocus(a, t) : null),
    [mode, a, t],
  );
  const circleRes = useMemo(
    () =>
      mode === "constDistCircle" ? solveConstDistCircle(a, rFactor, t) : null,
    [mode, a, rFactor, t],
  );
  const conicRes = useMemo(
    () =>
      mode === "constAngleConic" ? solveConstAngleConic(a, tiltDeg, t) : null,
    [mode, a, tiltDeg, t],
  );

  const labelOffset = 0.12;

  return (
    <>
      <CameraRig ref={controlsRef as never} enabled />

      {/* 正方体主框架 */}
      <Cuboid a={a} b={a} c={a} opacity={0.07} colorKey="primary" />

      {/* 正方体 8 个顶点标注 */}
      <PointLabel3D
        position={vertices.A}
        text="A"
        colorKey="label"
        offset={[-labelOffset, -labelOffset, -0.05]}
      />
      <PointLabel3D
        position={vertices.B}
        text="B"
        colorKey="label"
        offset={[labelOffset, -labelOffset, -0.05]}
      />
      <PointLabel3D
        position={vertices.C}
        text="C"
        colorKey="label"
        offset={[labelOffset, labelOffset, -0.05]}
      />
      <PointLabel3D
        position={vertices.D}
        text="D"
        colorKey="label"
        offset={[-labelOffset, labelOffset, -0.05]}
      />
      <CompoundLabel3D
        position={vertices.A1}
        base="A"
        subscript="1"
        colorKey="label"
        offset={[-labelOffset, -labelOffset, 0.08]}
      />
      <CompoundLabel3D
        position={vertices.B1}
        base="B"
        subscript="1"
        colorKey="label"
        offset={[labelOffset, -labelOffset, 0.08]}
      />
      <CompoundLabel3D
        position={vertices.C1}
        base="C"
        subscript="1"
        colorKey="label"
        offset={[labelOffset, labelOffset, 0.08]}
      />
      <CompoundLabel3D
        position={vertices.D1}
        base="D"
        subscript="1"
        colorKey="label"
        offset={[-labelOffset, labelOffset, 0.08]}
      />

      {/* 模式 1：线面垂直定轨迹（BD1 ⊥ 平面 AB1C） */}
      {perpRes && (
        <>
          <SectionPlane3D
            sectionPoints={perpRes.sectionPoints}
            plane={perpRes.plane}
            planeExtent={a * 0.95}
            color={MATH_COLORS.paramTertiary}
            showPlaneQuad={false}
            showProjection={false}
          />
          {/* 定直线体对角线 BD1 */}
          <Segment3D
            from={vertices.B}
            to={vertices.D1}
            colorKey="paramSecondary"
            lineWidth={2.5}
          />
          {/* 垂足 H 与动点 P */}
          <Point3D
            position={perpRes.footH}
            colorKey="paramSecondary"
            radius={0.055}
          />
          <PointLabel3D
            position={perpRes.footH}
            text="H"
            colorKey="paramSecondary"
            offset={[0.1, 0.08, 0.08]}
          />
          {/* 垂直连线 HP 与 AP */}
          <Segment3D
            from={perpRes.footH}
            to={perpRes.movingPointP}
            colorKey="paramTertiary"
            lineWidth={2}
            dashed
          />
          <Segment3D
            from={vertices.A}
            to={perpRes.movingPointP}
            colorKey="paramPrimary"
            lineWidth={2.2}
          />
          <Point3D
            position={perpRes.movingPointP}
            colorKey="paramPrimary"
            radius={0.068}
          />
          <PointLabel3D
            position={perpRes.movingPointP}
            text="P"
            colorKey="paramPrimary"
            offset={[0.12, 0.12, 0.1]}
          />
          {showRightAngles && (
            <>
              <Segment3D
                from={perpRes.rightAngleMark[0]}
                to={perpRes.rightAngleMark[1]}
                colorKey="paramSecondary"
                lineWidth={1.6}
              />
              <Segment3D
                from={perpRes.rightAngleMark[1]}
                to={perpRes.rightAngleMark[2]}
                colorKey="paramSecondary"
                lineWidth={1.6}
              />
            </>
          )}
        </>
      )}

      {/* 模式 2：定距球面截底面成圆弧（A1P = R） */}
      {circleRes && (
        <>
          {/* 侧棱高线 A1A */}
          <Segment3D
            from={vertices.A1}
            to={vertices.A}
            colorKey="paramSecondary"
            lineWidth={2.6}
          />
          <Point3D
            position={vertices.A1}
            colorKey="paramPrimary"
            radius={0.055}
          />
          <Point3D
            position={vertices.A}
            colorKey="paramSecondary"
            radius={0.048}
          />

          {/* 底面四分之一圆弧轨迹 */}
          {circleRes.arcPoints.slice(0, -1).map((pt, idx) => (
            <Segment3D
              key={`arc-${idx}`}
              from={pt}
              to={circleRes.arcPoints[idx + 1]}
              colorKey="paramTertiary"
              lineWidth={3}
            />
          ))}

          {/* 定长斜线段 A1P 与投影半径 AP */}
          <Segment3D
            from={vertices.A1}
            to={circleRes.movingPointP}
            colorKey="paramPrimary"
            lineWidth={2.4}
          />
          <Segment3D
            from={vertices.A}
            to={circleRes.movingPointP}
            colorKey="paramTertiary"
            lineWidth={2}
            dashed
          />
          <Point3D
            position={circleRes.movingPointP}
            colorKey="paramPrimary"
            radius={0.07}
          />
          <PointLabel3D
            position={circleRes.movingPointP}
            text="P"
            colorKey="paramPrimary"
            offset={[0.12, 0.12, 0.1]}
          />
          {showRightAngles && (
            <>
              <Segment3D
                from={circleRes.rightAngleMark[0]}
                to={circleRes.rightAngleMark[1]}
                colorKey="paramSecondary"
                lineWidth={1.6}
              />
              <Segment3D
                from={circleRes.rightAngleMark[1]}
                to={circleRes.rightAngleMark[2]}
                colorKey="paramSecondary"
                lineWidth={1.6}
              />
            </>
          )}
        </>
      )}

      {/* 模式 3：定角圆锥面被截面所截交线（圆 / 椭圆 / 抛物线 / 双曲线） */}
      {conicRes && (
        <>
          {/* 圆锥轴线 A1A */}
          <Segment3D
            from={vertices.A1}
            to={vertices.A}
            colorKey="paramPrimary"
            lineWidth={2.4}
          />
          <Point3D
            position={vertices.A1}
            colorKey="paramPrimary"
            radius={0.055}
          />
          <Point3D
            position={vertices.A}
            colorKey="paramSecondary"
            radius={0.048}
          />

          {/* 圆锥轮廓母线 */}
          {conicRes.coneGeneratrices.map((endPt, idx) => (
            <Segment3D
              key={`gen-${idx}`}
              from={vertices.A1}
              to={endPt}
              colorKey="line"
              lineWidth={1.1}
              dashed
              opacity={0.45}
            />
          ))}

          {/* 半透明斜截平面（交线不闭合时传空顶点列表，避免自动闭合直连） */}
          <SectionPlane3D
            sectionPoints={[]}
            plane={conicRes.plane}
            planeExtent={a * 1.15}
            color={MATH_COLORS.paramSecondary}
            showPlaneQuad
            showProjection={false}
          />

          {/* 圆锥截交线分段绘制 */}
          {conicRes.curveBranches.map((branch, bIdx) =>
            branch
              .slice(0, -1)
              .map((pt, idx) => (
                <Segment3D
                  key={`conic-${bIdx}-${idx}`}
                  from={pt}
                  to={branch[idx + 1]}
                  colorKey="paramTertiary"
                  lineWidth={3}
                />
              )),
          )}

          {/* 当前截面交线上的动点 P 及母线 A1P */}
          <Segment3D
            from={vertices.A1}
            to={conicRes.movingPointP}
            colorKey="paramPrimary"
            lineWidth={2}
          />
          <Point3D
            position={conicRes.movingPointP}
            colorKey="paramPrimary"
            radius={0.068}
          />
          <PointLabel3D
            position={conicRes.movingPointP}
            text="P"
            colorKey="paramPrimary"
            offset={[0.12, 0.12, 0.1]}
          />

          {showRightAngles && (
            <>
              <Segment3D
                from={conicRes.rightAngleMark[0]}
                to={conicRes.rightAngleMark[1]}
                colorKey="paramSecondary"
                lineWidth={1.6}
              />
              <Segment3D
                from={conicRes.rightAngleMark[1]}
                to={conicRes.rightAngleMark[2]}
                colorKey="paramSecondary"
                lineWidth={1.6}
              />
            </>
          )}
        </>
      )}
    </>
  );
}
