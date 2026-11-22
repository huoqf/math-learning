import {
  Polygon3DFace,
  Segment3D,
  Vector3DArrow,
  Point3D,
  PointLabel3D,
  CompoundLabel3D,
  FormulaLabel3D,
  AngleArc3D,
} from "@/components/Math3D";
import {
  buildFoldArcSegments,
  constrainFoldDragPoint,
  resolveFoldAlphaFromDrag,
} from "@/math3d/folding";
import type { FoldingSceneCommonProps } from "./types";

/** 等腰三角形沿高 AD 翻折模型场景 */
export function FoldingTriangleAltitudeScene({
  foldState,
  showVectorBasis,
  showDihedralArc,
  alphaDeg,
  a,
  activeStep,
  interactionMode,
  onPointDrag,
  foldingData,
}: FoldingSceneCommonProps) {
  const { A, B, D, "C'": C_prime } = foldingData.points;
  const C_0 = foldingData.unfoldedPoints.C_0;
  const halfA = a / 2;
  const showUnfolded = foldState === "both" || foldState === "unfolded";
  const arcSegments = buildFoldArcSegments(D, { x: 1, y: 0, z: 0 }, halfA, 20);
  const projC = { x: C_prime.x, y: 0, z: 0 };

  return (
    <>
      {/* (A) 静态底面 △ABD 实体填充面与无箭头棱 */}
      <Polygon3DFace
        points={[A, B, D]}
        colorKey="primary"
        opacity={activeStep === 1 ? 0.36 : 0.25}
      />
      <Segment3D
        from={D}
        to={A}
        colorKey="secondary"
        lineWidth={activeStep === 1 ? 4.5 : 3}
      />
      <Segment3D from={D} to={B} colorKey="primary" />
      <Segment3D from={A} to={B} colorKey="primary" />

      {/* (B) 展平状态下的整块等腰三角形 ABC_0 柔和半透明参考轮廓 */}
      {showUnfolded && (
        <>
          <Polygon3DFace
            points={[B, A, C_0]}
            colorKey="circle"
            opacity={0.12}
          />
          <Segment3D
            from={B}
            to={C_0}
            colorKey="circle"
            opacity={0.6}
            lineWidth={1.5}
          />
          <Segment3D
            from={A}
            to={C_0}
            colorKey="circle"
            opacity={0.6}
            lineWidth={1.5}
          />
          <Segment3D
            from={D}
            to={C_0}
            colorKey="circle"
            opacity={0.6}
            lineWidth={1.5}
          />
          <CompoundLabel3D
            position={C_0}
            base="C"
            subscript="0"
            offset={[0.2, 0, 0]}
          />
        </>
      )}

      {/* (C) 翻折三角形 △AC'D 实体填充面与 3D 棱 */}
      {foldState !== "unfolded" && (
        <>
          <Polygon3DFace
            points={[A, C_prime, D]}
            colorKey="highlight"
            opacity={activeStep === 2 ? 0.48 : 0.35}
          />
          <Segment3D
            from={D}
            to={C_prime}
            colorKey="highlight"
            lineWidth={activeStep === 2 ? 3.8 : 2.5}
          />
          <Segment3D
            from={A}
            to={C_prime}
            colorKey="highlight"
            lineWidth={activeStep === 2 ? 3.8 : 2.5}
          />
          <Segment3D
            from={B}
            to={C_prime}
            colorKey="accent"
            lineWidth={activeStep === 3 ? 3.8 : 2}
          />

          {/* 二面角平面角构造垂线对：DB ⊥ AD 与 DC' ⊥ AD */}
          {showDihedralArc && alphaDeg > 0 && alphaDeg < 180 && (
            <>
              <Segment3D
                from={D}
                to={B}
                colorKey="paramPrimary"
                lineWidth={activeStep === 3 ? 3.8 : 2.5}
              />
              <Segment3D
                from={D}
                to={C_prime}
                colorKey="paramPrimary"
                lineWidth={activeStep === 3 ? 3.8 : 2.5}
              />
              <AngleArc3D
                vertex={D}
                dirA={{ x: -1, y: 0, z: 0 }}
                dirB={{
                  x: C_prime.x,
                  y: 0,
                  z: C_prime.z,
                }}
                radius={0.8}
                colorKey="paramPrimary"
              />
            </>
          )}

          {/* 翻折半圆弧轨迹与底面垂足射影 */}
          {arcSegments.map((seg, i) => (
            <Segment3D
              key={`tri-arc-${i}`}
              from={seg.from}
              to={seg.to}
              colorKey="trace"
              dashed
              opacity={0.45}
              lineWidth={1.2}
            />
          ))}
          {alphaDeg > 2 && alphaDeg < 178 && (
            <>
              <Segment3D
                from={C_prime}
                to={projC}
                colorKey="secondary"
                dashed
                lineWidth={1.6}
              />
              <Point3D position={projC} colorKey="secondary" />
            </>
          )}

          <Point3D
            position={C_prime}
            draggable={interactionMode === "drag"}
            constrain={(raw) =>
              constrainFoldDragPoint(raw, D, { x: 1, y: 0, z: 0 }, halfA)
            }
            onDrag={(next) =>
              onPointDrag(resolveFoldAlphaFromDrag(next.x, next.z))
            }
            colorKey="highlight"
          />
          <FormulaLabel3D position={C_prime} tex="C'" offset={[0.2, 0, 0.2]} />
        </>
      )}

      {/* 向量建系与法向量可视化 (带箭头空间向量，以 D 为原点) */}
      {showVectorBasis && (
        <>
          <Vector3DArrow
            from={D}
            to={{ x: 2, y: 0, z: 0 }}
            colorKey="paramPrimary"
          />
          <Vector3DArrow
            from={D}
            to={{ x: 0, y: 2.2, z: 0 }}
            colorKey="paramSecondary"
          />
          <Vector3DArrow
            from={D}
            to={{ x: 0, y: 0, z: 2 }}
            colorKey="paramTertiary"
          />
          <FormulaLabel3D position={{ x: 2.1, y: 0, z: 0 }} tex="x" />
          <FormulaLabel3D position={{ x: 0, y: 2.3, z: 0 }} tex="y" />
          <FormulaLabel3D position={{ x: 0, y: 0, z: 2.1 }} tex="z" />

          <Vector3DArrow
            from={D}
            to={{ x: 0, y: 0, z: 1.6 }}
            colorKey="secondary"
          />
          <FormulaLabel3D position={{ x: 0, y: 0, z: 1.7 }} tex="\vec{n}_1" />
          {alphaDeg > 0 && alphaDeg < 180 && (
            <>
              <Vector3DArrow
                from={D}
                to={{
                  x: -1.6 * Math.sin((alphaDeg * Math.PI) / 180),
                  y: 0,
                  z: 1.6 * Math.cos((alphaDeg * Math.PI) / 180),
                }}
                colorKey="highlight"
              />
              <FormulaLabel3D
                position={{
                  x: -1.7 * Math.sin((alphaDeg * Math.PI) / 180),
                  y: 0,
                  z: 1.7 * Math.cos((alphaDeg * Math.PI) / 180),
                }}
                tex="\vec{n}_2"
              />
            </>
          )}
        </>
      )}

      {/* 静态顶点标签 */}
      <PointLabel3D position={D} text="D" offset={[0, -0.3, -0.2]} />
      <PointLabel3D position={A} text="A" offset={[0, 0.2, 0]} />
      <PointLabel3D position={B} text="B" offset={[-0.2, -0.2, 0]} />
    </>
  );
}
