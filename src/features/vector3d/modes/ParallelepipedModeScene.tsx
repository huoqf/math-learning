import type { Vec3 } from "@/math3d/vector3";
import type { ParallelepipedVertices } from "@/math3d/basis";
import { Vector3DArrow, FormulaLabel3D, Segment3D } from "@/components/Math3D";
import { MATH_COLORS } from "@/theme";
import { TriangleMesh } from "../TriangleMesh";

interface ParallelepipedModeSceneProps {
  O: Vec3;
  vecA: Vec3;
  vecB: Vec3;
  vecC: Vec3;
  box: ParallelepipedVertices;
  x: number;
  y: number;
  z: number;
  cz: number;
  showBasisVectors: boolean;
  showDecompPath: boolean;
  showBoxSkeleton: boolean;
}

export function ParallelepipedModeScene({
  O,
  vecA,
  vecB,
  vecC,
  box,
  x,
  y,
  z,
  cz,
  showBasisVectors,
  showDecompPath,
  showBoxSkeleton,
}: ParallelepipedModeSceneProps) {
  const pointC = vecC;

  return (
    <>
      {/* 基向量 a, b, c */}
      {showBasisVectors && (
        <>
          <Vector3DArrow from={O} to={vecA} colorKey="paramPrimary" />
          <FormulaLabel3D
            position={{ x: vecA.x * 0.5, y: -0.28, z: 0 }}
            tex="\\vec{a}"
          />

          <Vector3DArrow from={O} to={vecB} colorKey="paramSecondary" />
          <FormulaLabel3D
            position={{
              x: vecB.x * 0.5 - 0.28,
              y: vecB.y * 0.5 + 0.15,
              z: 0,
            }}
            tex="\\vec{b}"
          />

          <Vector3DArrow from={O} to={vecC} colorKey="paramTertiary" />
          <FormulaLabel3D
            position={{
              x: -0.28,
              y: pointC.y * 0.5,
              z: pointC.z * 0.5 + 0.18,
            }}
            tex="\\vec{c}"
          />
        </>
      )}

      {/* 1. 分步加法路径链（当分量绝对值 >= 0.05 且开关开启时渲染） */}
      {showDecompPath && (
        <>
          {Math.abs(x) >= 0.05 && (
            <>
              <Vector3DArrow from={O} to={box.xa} colorKey="paramPrimary" />
              <FormulaLabel3D
                position={{
                  x: box.xa.x * 0.5,
                  y: box.xa.y * 0.5 + 0.25,
                  z: 0,
                }}
                tex={`\\color{${MATH_COLORS.paramPrimary}}{${x.toFixed(1)}\\vec{a}}`}
              />
            </>
          )}

          {Math.abs(y) >= 0.05 && (
            <>
              <Vector3DArrow
                from={box.xa}
                to={box.xy}
                colorKey="paramSecondary"
              />
              <FormulaLabel3D
                position={{
                  x: (box.xa.x + box.xy.x) * 0.5 + 0.25,
                  y: (box.xa.y + box.xy.y) * 0.5,
                  z: 0,
                }}
                tex={`\\color{${MATH_COLORS.paramSecondary}}{${y.toFixed(1)}\\vec{b}}`}
              />
            </>
          )}

          {Math.abs(z) >= 0.05 && (
            <>
              <Vector3DArrow
                from={box.xy}
                to={box.P}
                colorKey="paramTertiary"
              />
              <FormulaLabel3D
                position={{
                  x: (box.xy.x + box.P.x) * 0.5 + 0.25,
                  y: (box.xy.y + box.P.y) * 0.5,
                  z: (box.xy.z + box.P.z) * 0.5,
                }}
                tex={`\\color{${MATH_COLORS.paramTertiary}}{${z.toFixed(1)}\\vec{c}}`}
              />
            </>
          )}
        </>
      )}

      {/* 平行六面体透视骨架与半透明底面 */}
      {showBoxSkeleton && (
        <>
          <TriangleMesh
            A={O}
            B={box.xa}
            C={box.xy}
            color={cz < 0.1 ? MATH_COLORS.degeneracy : MATH_COLORS.primary}
            opacity={0.06}
          />
          <TriangleMesh
            A={O}
            B={box.xy}
            C={box.yb}
            color={cz < 0.1 ? MATH_COLORS.degeneracy : MATH_COLORS.primary}
            opacity={0.06}
          />

          {/* 底面 4 棱 */}
          <Segment3D
            from={O}
            to={box.xa}
            colorKey="asymptote"
            dashed
            opacity={0.6}
          />
          <Segment3D
            from={box.xa}
            to={box.xy}
            colorKey="asymptote"
            dashed
            opacity={0.6}
          />
          <Segment3D
            from={box.xy}
            to={box.yb}
            colorKey="asymptote"
            dashed
            opacity={0.6}
          />
          <Segment3D
            from={box.yb}
            to={O}
            colorKey="asymptote"
            dashed
            opacity={0.6}
          />

          {/* 顶面 4 棱 */}
          <Segment3D
            from={box.zc}
            to={box.xz}
            colorKey="asymptote"
            dashed
            opacity={0.6}
          />
          <Segment3D
            from={box.xz}
            to={box.P}
            colorKey="asymptote"
            dashed
            opacity={0.6}
          />
          <Segment3D
            from={box.P}
            to={box.yz}
            colorKey="asymptote"
            dashed
            opacity={0.6}
          />
          <Segment3D
            from={box.yz}
            to={box.zc}
            colorKey="asymptote"
            dashed
            opacity={0.6}
          />

          {/* 4 条立棱 / 侧棱 */}
          <Segment3D
            from={O}
            to={box.zc}
            colorKey="asymptote"
            dashed
            opacity={0.6}
          />
          <Segment3D
            from={box.xa}
            to={box.xz}
            colorKey="asymptote"
            dashed
            opacity={0.6}
          />
          <Segment3D
            from={box.xy}
            to={box.P}
            colorKey="asymptote"
            dashed
            opacity={0.6}
          />
          <Segment3D
            from={box.yb}
            to={box.yz}
            colorKey="asymptote"
            dashed
            opacity={0.6}
          />
        </>
      )}
    </>
  );
}
