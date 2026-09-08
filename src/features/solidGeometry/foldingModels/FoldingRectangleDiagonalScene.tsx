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
import type { FoldingSceneCommonProps } from "./types";

/** 矩形沿对角线 BD 翻折模型场景 */
export function FoldingRectangleDiagonalScene({
  foldState,
  showVectorBasis,
  showDihedralArc,
  alphaDeg,
  interactionMode,
  onPointDrag,
  foldingData,
}: FoldingSceneCommonProps) {
  const { A, B, C, D, HA, "A'": A_prime } = foldingData.points;
  const showUnfolded = foldState === "both" || foldState === "unfolded";
  const rA = Math.sqrt((A.x - HA.x) ** 2 + (A.y - HA.y) ** 2);

  return (
    <>
      {/* (A) 静态底面 △CBD 实体填充面与无箭头棱 */}
      <Polygon3DFace points={[B, C, D]} colorKey="primary" opacity={0.25} />
      <Segment3D from={B} to={D} colorKey="secondary" lineWidth={3} />
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
            opacity={0.35}
          />
          <Segment3D
            from={B}
            to={A_prime}
            colorKey="highlight"
            lineWidth={2.5}
          />
          <Segment3D
            from={D}
            to={A_prime}
            colorKey="highlight"
            lineWidth={2.5}
          />
          <Segment3D
            from={HA}
            to={A_prime}
            colorKey="highlight"
            lineWidth={2}
          />
          <Segment3D from={A_prime} to={C} colorKey="accent" lineWidth={2} />

          {/* 二面角平面角构造垂线对：HA A ⊥ BD 与 HA A' ⊥ BD */}
          {showDihedralArc && alphaDeg > 0 && alphaDeg < 180 && (
            <>
              <Segment3D
                from={HA}
                to={A}
                colorKey="paramPrimary"
                lineWidth={2.5}
              />
              <Segment3D
                from={HA}
                to={A_prime}
                colorKey="paramPrimary"
                lineWidth={2.5}
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

          <Point3D
            position={A_prime}
            draggable={interactionMode === "drag"}
            constrain={(raw) => ({
              x: A_prime.x,
              y: A_prime.y,
              z: Math.max(0, Math.min(rA, raw.z)),
            })}
            onDrag={(next) => onPointDrag(next.z, rA)}
            colorKey="highlight"
          />
          <FormulaLabel3D position={A_prime} tex="A'" offset={[-0.2, 0, 0.2]} />
        </>
      )}

      {/* 向量建系与法向量可视化 (带箭头空间向量) */}
      {showVectorBasis && (
        <>
          <Vector3DArrow
            from={HA}
            to={{ x: HA.x + 2, y: HA.y, z: 0 }}
            colorKey="paramPrimary"
          />
          <Vector3DArrow
            from={HA}
            to={{ x: HA.x, y: HA.y + 2, z: 0 }}
            colorKey="paramSecondary"
          />
          <Vector3DArrow
            from={HA}
            to={{ x: HA.x, y: HA.y, z: 2 }}
            colorKey="paramTertiary"
          />
          <FormulaLabel3D position={{ x: HA.x + 2.1, y: HA.y, z: 0 }} tex="x" />
          <FormulaLabel3D position={{ x: HA.x, y: HA.y + 2.1, z: 0 }} tex="y" />
          <FormulaLabel3D position={{ x: HA.x, y: HA.y, z: 2.1 }} tex="z" />

          <Vector3DArrow
            from={HA}
            to={{ x: HA.x, y: HA.y, z: 1.6 }}
            colorKey="secondary"
          />
          <FormulaLabel3D
            position={{ x: HA.x, y: HA.y, z: 1.7 }}
            tex="\vec{n}_1"
          />
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
