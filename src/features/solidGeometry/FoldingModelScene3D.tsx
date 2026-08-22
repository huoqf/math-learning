import {
  Segment3D,
  Vector3DArrow,
  Point3D,
  PointLabel3D,
  CompoundLabel3D,
  FormulaLabel3D,
  Polygon3DFace,
  AngleArc3D,
} from "@/components/Math3D";
import type { InteractionMode3D } from "@/components/Math3D";
import type { FoldingModelKind, FoldingResult } from "@/math3d/folding";
import type { Vec3 } from "@/math3d/vector3";

interface FoldingModelScene3DProps {
  model: FoldingModelKind;
  foldingData: FoldingResult;
  foldState: "both" | "folded" | "unfolded";
  interactionMode: InteractionMode3D;
  showVectorBasis: boolean;
  showDihedralArc: boolean;
  alphaDeg: number;
  a: number;
  b: number;
  onPointDrag: (newZ: number, maxRadius: number) => void;
}

export function FoldingModelScene3D({
  model,
  foldingData,
  foldState,
  interactionMode,
  showVectorBasis,
  showDihedralArc,
  alphaDeg,
  a,
  b,
  onPointDrag: handlePointDrag,
}: FoldingModelScene3DProps) {
  return (
    <>
      {/* ── 1. 直角梯形翻折 ── */}
      {model === "trapezoid" &&
        (() => {
          const { A, B, C, E, "D'": D_prime } = foldingData.points;
          const D_0: Vec3 = { x: a, y: 0, z: 0 };
          const showUnfolded = foldState === "both" || foldState === "unfolded";

          return (
            <>
              {/* (A) 静态底面矩形 ABCE 实体填充面与无箭头几何棱 */}
              <Polygon3DFace
                points={[A, B, C, E]}
                colorKey="primary"
                opacity={0.25}
              />
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
                  <Segment3D
                    from={D_prime}
                    to={A}
                    colorKey="accent"
                    lineWidth={2}
                  />

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
                    onDrag={(next) => handlePointDrag(next.z, a - b)}
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
        })()}

      {/* ── 2. 矩形沿对角线翻折 ── */}
      {model === "rectangleDiagonal" &&
        (() => {
          const { A, B, C, D, HA, "A'": A_prime } = foldingData.points;
          const showUnfolded = foldState === "both" || foldState === "unfolded";
          const rA = Math.sqrt((A.x - HA.x) ** 2 + (A.y - HA.y) ** 2);

          return (
            <>
              {/* (A) 静态底面 △CBD 实体填充面与无箭头棱 */}
              <Polygon3DFace
                points={[B, C, D]}
                colorKey="primary"
                opacity={0.25}
              />
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
                  <Segment3D
                    from={A_prime}
                    to={C}
                    colorKey="accent"
                    lineWidth={2}
                  />

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
                    onDrag={(next) => handlePointDrag(next.z, rA)}
                    colorKey="highlight"
                  />
                  <FormulaLabel3D
                    position={A_prime}
                    tex="A'"
                    offset={[-0.2, 0, 0.2]}
                  />
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
                  <FormulaLabel3D
                    position={{ x: HA.x + 2.1, y: HA.y, z: 0 }}
                    tex="x"
                  />
                  <FormulaLabel3D
                    position={{ x: HA.x, y: HA.y + 2.1, z: 0 }}
                    tex="y"
                  />
                  <FormulaLabel3D
                    position={{ x: HA.x, y: HA.y, z: 2.1 }}
                    tex="z"
                  />

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
        })()}

      {/* ── 3. 等腰三角形沿高翻折 ── */}
      {model === "triangleAltitude" &&
        (() => {
          const { A, B, D, "C'": C_prime } = foldingData.points;
          const halfA = a / 2;
          const C_0: Vec3 = { x: halfA, y: 0, z: 0 };
          const showUnfolded = foldState === "both" || foldState === "unfolded";

          return (
            <>
              {/* (A) 静态底面 △ABD 实体填充面与无箭头棱 */}
              <Polygon3DFace
                points={[A, B, D]}
                colorKey="primary"
                opacity={0.25}
              />
              <Segment3D from={D} to={A} colorKey="secondary" lineWidth={3} />
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
                    opacity={0.35}
                  />
                  <Segment3D
                    from={D}
                    to={C_prime}
                    colorKey="highlight"
                    lineWidth={2.5}
                  />
                  <Segment3D
                    from={A}
                    to={C_prime}
                    colorKey="highlight"
                    lineWidth={2.5}
                  />
                  <Segment3D
                    from={B}
                    to={C_prime}
                    colorKey="accent"
                    lineWidth={2}
                  />

                  {/* 二面角平面角构造垂线对：DB ⊥ AD 与 DC' ⊥ AD */}
                  {showDihedralArc && alphaDeg > 0 && alphaDeg < 180 && (
                    <>
                      <Segment3D
                        from={D}
                        to={B}
                        colorKey="paramPrimary"
                        lineWidth={2.5}
                      />
                      <Segment3D
                        from={D}
                        to={C_prime}
                        colorKey="paramPrimary"
                        lineWidth={2.5}
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

                  <Point3D
                    position={C_prime}
                    draggable={interactionMode === "drag"}
                    constrain={(raw) => ({
                      x: halfA * Math.cos((alphaDeg * Math.PI) / 180),
                      y: 0,
                      z: Math.max(0, Math.min(halfA, raw.z)),
                    })}
                    onDrag={(next) => handlePointDrag(next.z, halfA)}
                    colorKey="highlight"
                  />
                  <FormulaLabel3D
                    position={C_prime}
                    tex="C'"
                    offset={[0.2, 0, 0.2]}
                  />
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
                  <FormulaLabel3D
                    position={{ x: 0, y: 0, z: 1.7 }}
                    tex="\vec{n}_1"
                  />
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
        })()}

      {/* ── 4. 菱形沿短对角线翻折 ── */}
      {model === "rhombus" &&
        (() => {
          const { O, B, C, D, "A'": A_prime } = foldingData.points;
          const hAO = (Math.sqrt(3) / 2) * a;
          const A_0: Vec3 = { x: -hAO, y: 0, z: 0 };
          const showUnfolded = foldState === "both" || foldState === "unfolded";

          return (
            <>
              {/* (A) 静态底面 △BCD 实体填充面与无箭头棱 */}
              <Polygon3DFace
                points={[B, C, D]}
                colorKey="primary"
                opacity={0.25}
              />
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
                  <Segment3D
                    from={O}
                    to={A_prime}
                    colorKey="highlight"
                    lineWidth={2}
                  />
                  <Segment3D
                    from={A_prime}
                    to={C}
                    colorKey="accent"
                    lineWidth={2}
                  />

                  {/* 二面角平面角构造垂线对：OA_0 ⊥ BD 与 OA' ⊥ BD */}
                  {showDihedralArc && alphaDeg > 0 && alphaDeg < 180 && (
                    <>
                      <Segment3D
                        from={O}
                        to={A_0}
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
                        dirA={{ x: -1, y: 0, z: 0 }}
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
                    onDrag={(next) => handlePointDrag(next.z, hAO)}
                    colorKey="highlight"
                  />
                  <FormulaLabel3D
                    position={A_prime}
                    tex="A'"
                    offset={[-0.2, 0, 0.2]}
                  />
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
                  <FormulaLabel3D
                    position={{ x: 0, y: 0, z: 1.7 }}
                    tex="\vec{n}_1"
                  />
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
        })()}
    </>
  );
}
