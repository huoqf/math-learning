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
import type { Vec3 } from "@/math3d/vector3";
import type { FoldingSceneCommonProps } from "./types";

/** 菱形沿短对角线 BD 翻折模型场景 */
export function FoldingRhombusScene({
  foldState,
  showVectorBasis,
  showDihedralArc,
  alphaDeg,
  a,
  interactionMode,
  onPointDrag,
  foldingData,
}: FoldingSceneCommonProps) {
  const { O, B, C, D, "A'": A_prime } = foldingData.points;
  const hAO = (Math.sqrt(3) / 2) * a;
  const A_0: Vec3 = { x: -hAO, y: 0, z: 0 };
  const showUnfolded = foldState === "both" || foldState === "unfolded";

  return (
    <>
      {/* (A) 静态底面 △BCD 实体填充面与无箭头棱 */}
      <Polygon3DFace points={[B, C, D]} colorKey="primary" opacity={0.25} />
      <Segment3D from={B} to={D} colorKey="secondary" lineWidth={3} />
      <Segment3D from={B} to={C} colorKey="primary" />
      <Segment3D from={D} to={C} colorKey="primary" />
      <Segment3D from={O} to={C} colorKey="paramTertiary" />

      {/* (B) 展平状态下的整块菱形 A_0BCD 柔和半透明参考轮廓 */}
      {showUnfolded && (
        <>
          <Polygon3DFace
            points={[A_0, B, C, D]}
            colorKey="circle"
            opacity={0.12}
          />
          <Segment3D
            from={A_0}
            to={B}
            colorKey="circle"
            opacity={0.6}
            lineWidth={1.5}
          />
          <Segment3D
            from={D}
            to={A_0}
            colorKey="circle"
            opacity={0.6}
            lineWidth={1.5}
          />
          <Segment3D
            from={O}
            to={A_0}
            colorKey="circle"
            opacity={0.6}
            lineWidth={1.5}
          />
          <Segment3D
            from={A_0}
            to={C}
            colorKey="circle"
            opacity={0.6}
            lineWidth={1.5}
          />
          <CompoundLabel3D
            position={A_0}
            base="A"
            subscript="0"
            offset={[-0.2, 0, 0]}
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
          <Segment3D from={O} to={A_prime} colorKey="highlight" lineWidth={2} />
          <Segment3D from={A_prime} to={C} colorKey="accent" lineWidth={2} />

          {/* 二面角平面角构造垂线对：OC ⊥ BD 与 OA' ⊥ BD (二面角 A'-BD-C 的平面角) */}
          {showDihedralArc && alphaDeg > 0 && alphaDeg < 180 && (
            <>
              <Segment3D
                from={O}
                to={C}
                colorKey="paramPrimary"
                lineWidth={2.5}
              />
              <Segment3D
                from={O}
                to={A_prime}
                colorKey="paramPrimary"
                lineWidth={2.5}
              />
              <AngleArc3D
                vertex={O}
                dirA={{ x: 1, y: 0, z: 0 }}
                dirB={{
                  x: A_prime.x,
                  y: 0,
                  z: A_prime.z,
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
              x: -(hAO * Math.cos((alphaDeg * Math.PI) / 180)),
              y: 0,
              z: Math.max(0, Math.min(hAO, raw.z)),
            })}
            onDrag={(next) => onPointDrag(next.z, hAO)}
            colorKey="highlight"
          />
          <FormulaLabel3D position={A_prime} tex="A'" offset={[-0.2, 0, 0.2]} />
        </>
      )}

      {/* 向量建系与法向量可视化 (带箭头空间向量，以 O 为原点) */}
      {showVectorBasis && (
        <>
          <Vector3DArrow
            from={O}
            to={{ x: 2, y: 0, z: 0 }}
            colorKey="paramPrimary"
          />
          <Vector3DArrow
            from={O}
            to={{ x: 0, y: 2, z: 0 }}
            colorKey="paramSecondary"
          />
          <Vector3DArrow
            from={O}
            to={{ x: 0, y: 0, z: 2 }}
            colorKey="paramTertiary"
          />
          <FormulaLabel3D position={{ x: 2.1, y: 0, z: 0 }} tex="x" />
          <FormulaLabel3D position={{ x: 0, y: 2.1, z: 0 }} tex="y" />
          <FormulaLabel3D position={{ x: 0, y: 0, z: 2.1 }} tex="z" />

          <Vector3DArrow
            from={O}
            to={{ x: 0, y: 0, z: 1.6 }}
            colorKey="secondary"
          />
          <FormulaLabel3D position={{ x: 0, y: 0, z: 1.7 }} tex="\vec{n}_1" />
          {alphaDeg > 0 && alphaDeg < 180 && (
            <>
              <Vector3DArrow
                from={O}
                to={{
                  x: 1.6 * Math.sin((alphaDeg * Math.PI) / 180),
                  y: 0,
                  z: 1.6 * Math.cos((alphaDeg * Math.PI) / 180),
                }}
                colorKey="highlight"
              />
              <FormulaLabel3D
                position={{
                  x: 1.7 * Math.sin((alphaDeg * Math.PI) / 180),
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
      <PointLabel3D position={O} text="O" offset={[0, -0.3, -0.2]} />
      <PointLabel3D position={B} text="B" offset={[0, -0.2, 0]} />
      <PointLabel3D position={D} text="D" offset={[0, 0.2, 0]} />
      <PointLabel3D position={C} text="C" offset={[0.2, 0, 0]} />
    </>
  );
}
