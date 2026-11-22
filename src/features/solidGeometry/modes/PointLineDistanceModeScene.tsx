/**
 * 模式二：点到直线的距离 子场景（纯几何垂足直角三角形 + 选必一空间向量投影对照）
 */
import {
  Polygon3DFace,
  Point3D,
  PointLabel3D,
  FormulaLabel3D,
  Segment3D,
  AngleArc3D,
  Vector3DArrow,
} from "@/components/Math3D";
import type { CuboidVertices } from "@/math3d/spatialAngle";
import type { PointLineDistanceResult } from "@/math3d/spatialDistance";
import { add, lerp, normalize, scale, sub, type Vec3 } from "@/math3d/vector3";
import { formatMathNumber } from "@/utils/mathFormat";

interface PointLineDistanceModeSceneProps {
  c: number;
  vertices: CuboidVertices;
  pointLineData: PointLineDistanceResult;
  showAxes: boolean;
  showCoordinates: boolean;
  showAuxiliary: boolean;
  showRightAngles: boolean;
  showNormals: boolean;
  interactionMode: "orbit" | "drag";
  activeStep?: number;
  onPDrag: (next: Vec3) => void;
}

export default function PointLineDistanceModeScene({
  c,
  vertices,
  pointLineData,
  showAxes,
  showCoordinates,
  showAuxiliary,
  showRightAngles,
  showNormals,
  interactionMode,
  activeStep,
  onPDrag,
}: PointLineDistanceModeSceneProps) {
  const { B, D1 } = vertices;
  const { P, footH, u } = pointLineData;
  const uUnit = normalize(u);
  const arrowEnd = add(B, scale(uUnit, 1.4));
  const distMid = lerp(P, footH, 0.5);

  return (
    <>
      {/* 定直线 l：体对角线 BD₁ */}
      <Segment3D
        from={B}
        to={D1}
        colorKey="secondary"
        lineWidth={activeStep === 1 ? 4.5 : 3}
      />
      <FormulaLabel3D
        position={lerp(B, D1, 0.82)}
        tex="l"
        offset={[0.14, 0.14, 0.12]}
      />

      {/* 动点 P 在侧棱 AA₁ 上滑动 */}
      {showAxes && showCoordinates ? (
        <FormulaLabel3D
          position={P}
          tex={`P(0,0,${formatMathNumber(P.z)})`}
          offset={[-0.25, -0.2, 0.12]}
        />
      ) : (
        <PointLabel3D position={P} text="P" offset={[-0.22, -0.18, 0.12]} />
      )}
      <Point3D
        position={P}
        draggable={interactionMode === "drag"}
        constrain={(raw) => ({
          x: 0,
          y: 0,
          z: Math.min(c, Math.max(0, raw.z)),
        })}
        onDrag={onPDrag}
        colorKey="paramPrimary"
      />

      {/* 辅助平面 △PBD₁ 与直角投影三角形 △PHB */}
      {showAuxiliary && (
        <>
          <Polygon3DFace points={[P, B, D1]} colorKey="accent" opacity={0.14} />
          <Polygon3DFace
            points={[P, footH, B]}
            colorKey="paramTertiary"
            opacity={activeStep === 2 ? 0.36 : 0.22}
          />
          <Segment3D
            from={B}
            to={P}
            dashed
            colorKey="paramPrimary"
            lineWidth={activeStep === 1 ? 3.4 : 2}
          />
          <Segment3D
            from={P}
            to={D1}
            dashed
            colorKey="accent"
            lineWidth={1.6}
          />
          {/* 向量投影段 BH（位于直线 BD₁ 上） */}
          <Segment3D
            from={B}
            to={footH}
            colorKey="paramSecondary"
            lineWidth={activeStep === 2 ? 4.6 : 3}
          />
        </>
      )}

      {/* 垂足 H 与垂线段 PH（点到直线的距离 d） */}
      <Segment3D
        from={P}
        to={footH}
        colorKey="paramTertiary"
        lineWidth={activeStep === 3 ? 4.8 : 3.2}
      />
      <Point3D position={footH} colorKey="paramTertiary" />
      <PointLabel3D position={footH} text="H" offset={[0.14, 0.14, 0.14]} />
      <FormulaLabel3D position={distMid} tex="d" offset={[0.12, 0.12, 0.12]} />

      {/* 垂足直角标记 PH ⊥ BD₁ */}
      {showRightAngles && (
        <AngleArc3D
          vertex={footH}
          dirA={sub(P, footH)}
          dirB={sub(B, footH)}
          radius={0.25}
          colorKey="paramTertiary"
          isRight
        />
      )}

      {/* 选必一空间向量射影对照：斜向量 BP 与直线单位方向向量 u₀ */}
      {showNormals && (
        <>
          <Vector3DArrow from={B} to={P} colorKey="paramPrimary" />
          <FormulaLabel3D
            position={lerp(B, P, 0.55)}
            tex="\overrightarrow{BP}"
            offset={[0.12, -0.18, 0.14]}
          />
          <Vector3DArrow from={B} to={arrowEnd} colorKey="secondary" />
          <FormulaLabel3D
            position={arrowEnd}
            tex="\vec{u}_0"
            offset={[0.12, 0.12, 0.1]}
          />
        </>
      )}
    </>
  );
}
