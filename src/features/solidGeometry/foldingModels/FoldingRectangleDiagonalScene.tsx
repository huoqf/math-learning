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
import { distance, normalize, sub, add, scale } from "@/math3d/vector3";
import {
  buildFoldArcSegments,
  constrainFoldDragPoint,
  resolveFoldAlphaFromDrag,
} from "@/math3d/folding";
import type { FoldingSceneCommonProps } from "./types";

/** 矩形沿对角线 BD 翻折模型场景 */
export function FoldingRectangleDiagonalScene({
  foldState,
  showVectorBasis,
  showDihedralArc,
  alphaDeg,
  activeStep,
  interactionMode,
  onPointDrag,
  foldingData,
}: FoldingSceneCommonProps) {
  const { A, B, C, D, HA, "A'": A_prime } = foldingData.points;
  const showUnfolded = foldState === "both" || foldState === "unfolded";
  const rA = distance(A, HA);
  const er = normalize(sub(A, HA));
  const arcSegments = buildFoldArcSegments(HA, er, rA, 20);
  const projA = { x: A_prime.x, y: A_prime.y, z: 0 };
  const cbdCentroid = scale(add(add(C, B), D), 1 / 3);
  const abdCentroid = scale(add(add(A_prime, B), D), 1 / 3);
  const eFold = normalize(sub(B, D));
  const n2 = foldingData.normals?.n2 ?? { x: 0, y: 0, z: 1 };

  return (
    <>
      {/* (A) 静态底面 △CBD 实体填充面与无箭头棱 */}
      <Polygon3DFace
        points={[B, C, D]}
        colorKey="primary"
        opacity={activeStep === 1 ? 0.36 : 0.25}
      />
      <Segment3D
        from={B}
        to={D}
        colorKey="secondary"
        lineWidth={activeStep === 1 ? 4.5 : 3}
      />
      <Segment3D from={B} to={C} colorKey="primary" />
      <Segment3D from={D} to={C} colorKey="primary" />

      {/* (B) 展平状态下的整块矩形 ABCD 柔和半透明参考轮廓 */}
      {showUnfolded && (
        <>
          <Polygon3DFace
            points={[A, B, C, D]}
            colorKey="circle"
            opacity={0.12}
          />
          <Segment3D
            from={A}
            to={B}
            colorKey="circle"
            opacity={0.6}
            lineWidth={1.5}
          />
          <Segment3D
            from={D}
            to={A}
            colorKey="circle"
            opacity={0.6}
            lineWidth={1.5}
          />
          <Segment3D
            from={HA}
            to={A}
            colorKey="circle"
            opacity={0.6}
            lineWidth={1.5}
          />
          <CompoundLabel3D
            position={A}
            base="A"
            subscript="0"
            offset={[-0.2, -0.2, 0]}
          />
        </>
      )}

      {/* (C) 翻折三角形 △A'BD 实体填充面与 3D 棱 */}
      {foldState !== "unfolded" && (
        <>
          <Polygon3DFace
            points={[B, A_prime, D]}
            colorKey="highlight"
            opacity={activeStep === 2 ? 0.48 : 0.35}
          />
          <Segment3D
            from={B}
            to={A_prime}
            colorKey="highlight"
            lineWidth={activeStep === 2 ? 3.8 : 2.5}
          />
          <Segment3D
            from={D}
            to={A_prime}
            colorKey="highlight"
            lineWidth={activeStep === 2 ? 3.8 : 2.5}
          />
          <Segment3D
            from={HA}
            to={A_prime}
            colorKey="highlight"
            lineWidth={activeStep === 2 ? 3.2 : 2}
          />
          <Segment3D
            from={A_prime}
            to={C}
            colorKey="accent"
            lineWidth={activeStep === 3 ? 3.8 : 2}
          />

          {/* 二面角平面角构造垂线对：HA A ⊥ BD 与 HA A' ⊥ BD */}
          {showDihedralArc && alphaDeg > 0 && alphaDeg < 180 && (
            <>
              <Segment3D
                from={HA}
                to={A}
                colorKey="paramPrimary"
                lineWidth={activeStep === 3 ? 3.8 : 2.5}
              />
              <Segment3D
                from={HA}
                to={A_prime}
                colorKey="paramPrimary"
                lineWidth={activeStep === 3 ? 3.8 : 2.5}
              />
              <AngleArc3D
                vertex={HA}
                dirA={{
                  x: A.x - HA.x,
                  y: A.y - HA.y,
                  z: 0,
                }}
                dirB={{
                  x: A_prime.x - HA.x,
                  y: A_prime.y - HA.y,
                  z: A_prime.z - HA.z,
                }}
                radius={0.8}
                colorKey="paramPrimary"
              />
            </>
          )}

          {/* 翻折圆弧轨迹与底面垂足射影 */}
          {arcSegments.map((seg, i) => (
            <Segment3D
              key={`fold-arc-${i}`}
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
                from={A_prime}
                to={projA}
                colorKey="secondary"
                dashed
                lineWidth={1.6}
              />
              <Point3D position={projA} colorKey="secondary" />
            </>
          )}

          <Point3D
            position={A_prime}
            draggable={interactionMode === "drag"}
            constrain={(raw) => constrainFoldDragPoint(raw, HA, er, rA)}
            onDrag={(next) => {
              const radial = (next.x - HA.x) * er.x + (next.y - HA.y) * er.y;
              onPointDrag(resolveFoldAlphaFromDrag(radial, next.z));
            }}
            colorKey="highlight"
          />
          <FormulaLabel3D position={A_prime} tex="A'" offset={[-0.2, 0, 0.2]} />
        </>
      )}

      {/* 向量建系与法向量可视化（以垂足 H_A 为原点，沿 H_A→A, D→B 建系，法向量置于面重心避开坐标轴） */}
      {showVectorBasis && (
        <>
          <Vector3DArrow
            from={HA}
            to={add(HA, scale(er, 2))}
            colorKey="paramPrimary"
          />
          <Vector3DArrow
            from={HA}
            to={add(HA, scale(eFold, 2))}
            colorKey="paramSecondary"
          />
          <Vector3DArrow
            from={HA}
            to={{ x: HA.x, y: HA.y, z: 2 }}
            colorKey="paramTertiary"
          />
          <FormulaLabel3D position={add(HA, scale(er, 2.15))} tex="x" />
          <FormulaLabel3D position={add(HA, scale(eFold, 2.15))} tex="y" />
          <FormulaLabel3D position={{ x: HA.x, y: HA.y, z: 2.15 }} tex="z" />

          <Vector3DArrow
            from={cbdCentroid}
            to={{ x: cbdCentroid.x, y: cbdCentroid.y, z: 1.5 }}
            colorKey="secondary"
          />
          <FormulaLabel3D
            position={{ x: cbdCentroid.x, y: cbdCentroid.y, z: 1.65 }}
            tex="\vec{n}_1"
          />
          {alphaDeg > 0 && alphaDeg < 180 && (
            <>
              <Vector3DArrow
                from={abdCentroid}
                to={add(abdCentroid, scale(n2, 1.5))}
                colorKey="highlight"
              />
              <FormulaLabel3D
                position={add(abdCentroid, scale(n2, 1.68))}
                tex="\vec{n}_2"
              />
            </>
          )}
        </>
      )}

      {/* 静态顶点标签 */}
      <CompoundLabel3D
        position={HA}
        base="H"
        subscript="A"
        offset={[0, -0.3, -0.2]}
      />
      <PointLabel3D position={B} text="B" offset={[0.2, -0.2, 0]} />
      <PointLabel3D position={D} text="D" offset={[-0.2, 0.2, 0]} />
      <PointLabel3D position={C} text="C" offset={[0.2, 0.2, 0]} />
    </>
  );
}
