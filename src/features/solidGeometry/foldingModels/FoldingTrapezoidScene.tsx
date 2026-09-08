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

/** 直角梯形沿腰线 CE 翻折模型场景 */
export function FoldingTrapezoidScene({
  foldState,
  showVectorBasis,
  showDihedralArc,
  alphaDeg,
  a,
  b,
  interactionMode,
  onPointDrag,
  foldingData,
}: FoldingSceneCommonProps) {
  const { A, B, C, E, "D'": D_prime } = foldingData.points;
  const D_0: Vec3 = { x: a, y: 0, z: 0 };
  const showUnfolded = foldState === "both" || foldState === "unfolded";

  return (
    <>
      {/* (A) 静态底面矩形 ABCE 实体填充面与无箭头几何棱 */}
      <Polygon3DFace points={[A, B, C, E]} colorKey="primary" opacity={0.25} />
      <Segment3D from={A} to={B} colorKey="primary" />
      <Segment3D from={B} to={C} colorKey="primary" />
      <Segment3D from={A} to={E} colorKey="primary" />
      {/* 折痕轴 CE */}
      <Segment3D from={E} to={C} colorKey="secondary" lineWidth={3} />

      {/* (B) 展平状态下的直角梯形 ABCD_0 柔和半透明参考轮廓 */}
      {showUnfolded && (
        <>
          <Polygon3DFace
            points={[A, B, C, D_0]}
            colorKey="circle"
            opacity={0.12}
          />
          <Segment3D
            from={E}
            to={D_0}
            colorKey="circle"
            opacity={0.6}
            lineWidth={1.5}
          />
          <Segment3D
            from={C}
            to={D_0}
            colorKey="circle"
            opacity={0.6}
            lineWidth={1.5}
          />
          <CompoundLabel3D
            position={D_0}
            base="D"
            subscript="0"
            offset={[0.2, -0.2, 0]}
          />
        </>
      )}

      {/* (C) 翻折三角形 △CD'E 实体填充面与 3D 几何棱 */}
      {foldState !== "unfolded" && (
        <>
          <Polygon3DFace
            points={[E, C, D_prime]}
            colorKey="highlight"
            opacity={0.35}
          />
          <Segment3D
            from={E}
            to={D_prime}
            colorKey="highlight"
            lineWidth={2.5}
          />
          <Segment3D
            from={C}
            to={D_prime}
            colorKey="highlight"
            lineWidth={2.5}
          />
          <Segment3D from={D_prime} to={A} colorKey="accent" lineWidth={2} />

          {/* 二面角平面角构造垂线对：ED' ⊥ EC 与 EA ⊥ EC */}
          {showDihedralArc && alphaDeg > 0 && alphaDeg < 180 && (
            <>
              <Segment3D
                from={E}
                to={A}
                colorKey="paramPrimary"
                lineWidth={2.5}
              />
              <Segment3D
                from={E}
                to={D_prime}
                colorKey="paramPrimary"
                lineWidth={2.5}
              />
              <AngleArc3D
                vertex={E}
                dirA={{ x: -1, y: 0, z: 0 }}
                dirB={{
                  x: D_prime.x - E.x,
                  y: 0,
                  z: D_prime.z - E.z,
                }}
                radius={0.8}
                colorKey="paramPrimary"
              />
            </>
          )}

          <Point3D
            position={D_prime}
            draggable={interactionMode === "drag"}
            constrain={(raw) => {
              const lenED = a - b;
              return {
                x: b + lenED * Math.cos((alphaDeg * Math.PI) / 180),
                y: 0,
                z: Math.max(0, Math.min(lenED, raw.z)),
              };
            }}
            onDrag={(next) => onPointDrag(next.z, a - b)}
            colorKey="highlight"
          />
          <FormulaLabel3D
            position={D_prime}
            tex="D'"
            offset={[0.1, 0.1, 0.2]}
          />
        </>
      )}

      {/* 向量建系与两半平面法向量可视化 (带箭头空间向量) */}
      {showVectorBasis && (
        <>
          <Vector3DArrow
            from={A}
            to={{ x: 2.2, y: 0, z: 0 }}
            colorKey="paramPrimary"
          />
          <Vector3DArrow
            from={A}
            to={{ x: 0, y: 2.2, z: 0 }}
            colorKey="paramSecondary"
          />
          <Vector3DArrow
            from={A}
            to={{ x: 0, y: 0, z: 2.2 }}
            colorKey="paramTertiary"
          />
          <FormulaLabel3D position={{ x: 2.3, y: 0, z: 0 }} tex="x" />
          <FormulaLabel3D position={{ x: 0, y: 2.3, z: 0 }} tex="y" />
          <FormulaLabel3D position={{ x: 0, y: 0, z: 2.3 }} tex="z" />

          <Vector3DArrow
            from={E}
            to={{ x: E.x, y: E.y, z: 1.6 }}
            colorKey="secondary"
          />
          <FormulaLabel3D
            position={{ x: E.x, y: E.y, z: 1.7 }}
            tex="\vec{n}_1"
          />
          {alphaDeg > 0 && alphaDeg < 180 && (
            <>
              <Vector3DArrow
                from={E}
                to={{
                  x: E.x - 1.6 * Math.sin((alphaDeg * Math.PI) / 180),
                  y: E.y,
                  z: 1.6 * Math.cos((alphaDeg * Math.PI) / 180),
                }}
                colorKey="highlight"
              />
              <FormulaLabel3D
                position={{
                  x: E.x - 1.7 * Math.sin((alphaDeg * Math.PI) / 180),
                  y: E.y,
                  z: 1.7 * Math.cos((alphaDeg * Math.PI) / 180),
                }}
                tex="\vec{n}_2"
              />
            </>
          )}
        </>
      )}

      {/* 顶点 3D 文本标签 */}
      <PointLabel3D position={A} text="A" offset={[-0.2, -0.2, 0]} />
      <PointLabel3D position={B} text="B" offset={[-0.2, 0.2, 0]} />
      <PointLabel3D position={E} text="E" offset={[0, -0.25, 0]} />
      <PointLabel3D position={C} text="C" offset={[0, 0.25, 0]} />
    </>
  );
}
