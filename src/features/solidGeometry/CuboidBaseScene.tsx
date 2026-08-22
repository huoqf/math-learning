/**
 * 基础长方体 + 顶点标号 共享骨架场景
 *
 * 承载"基础长方体 <Cuboid a b c/> + Scene3DGrid(showAxes 时) + 顶点文本标号/坐标标注"整块共享骨架。
 * 建系 (showAxes) 后智能切换为带坐标数值标注 (showCoordinates)，否则使用纯字母标号。
 */
import {
  Scene3DGrid,
  FormulaLabel3D,
  PointLabel3D,
  CompoundLabel3D,
} from "@/components/Math3D";
import { Cuboid } from "@/components/Math3D/solids";
import type { CuboidVertices } from "@/math3d/spatialAngle";

interface CuboidBaseSceneProps {
  a: number;
  b: number;
  c: number;
  vertices: CuboidVertices;
  showAxes: boolean;
  showCoordinates: boolean;
}

export default function CuboidBaseScene({
  a,
  b,
  c,
  vertices,
  showAxes,
  showCoordinates,
}: CuboidBaseSceneProps) {
  const { A, B, C, D, A1, B1, C1, D1 } = vertices;

  return (
    <>
      {/* 纯净直角坐标系 A-xyz（受左屏开关控制，动态适配长方体尺寸，正半轴实线箭头，负半轴细虚线） */}
      {showAxes && (
        <Scene3DGrid size={[a + 1.2, b + 1.2, c + 1.2]} showGrid={false} />
      )}

      {/* 基础长方体 */}
      <Cuboid a={a} b={b} c={c} opacity={0.1} colorKey="primary" />

      {/* 顶点文本标号与空间坐标（建系后智能切换为带坐标数值标注） */}
      {showAxes && showCoordinates ? (
        <>
          <FormulaLabel3D
            position={A}
            tex="A(0,0,0)"
            offset={[-0.2, -0.2, -0.15]}
          />
          <FormulaLabel3D
            position={B}
            tex={`B(${a},0,0)`}
            offset={[0.2, -0.2, -0.15]}
          />
          <FormulaLabel3D
            position={C}
            tex={`C(${a},${b},0)`}
            offset={[0.2, 0.2, -0.15]}
          />
          <FormulaLabel3D
            position={D}
            tex={`D(0,${b},0)`}
            offset={[-0.2, 0.2, -0.15]}
          />
          <FormulaLabel3D
            position={A1}
            tex={`A_1(0,0,${c})`}
            offset={[-0.25, -0.2, 0.15]}
          />
          <FormulaLabel3D
            position={B1}
            tex={`B_1(${a},0,${c})`}
            offset={[0.25, -0.2, 0.15]}
          />
          <FormulaLabel3D
            position={C1}
            tex={`C_1(${a},${b},${c})`}
            offset={[0.25, 0.2, 0.15]}
          />
          <FormulaLabel3D
            position={D1}
            tex={`D_1(0,${b},${c})`}
            offset={[-0.25, 0.2, 0.15]}
          />
        </>
      ) : (
        <>
          <PointLabel3D position={A} text="A" offset={[-0.15, -0.15, -0.15]} />
          <PointLabel3D position={B} text="B" offset={[0.15, -0.15, -0.15]} />
          <PointLabel3D position={C} text="C" offset={[0.15, 0.15, -0.15]} />
          <PointLabel3D position={D} text="D" offset={[-0.15, 0.15, -0.15]} />
          <CompoundLabel3D
            position={A1}
            base="A"
            subscript="1"
            offset={[-0.15, -0.15, 0.15]}
          />
          <CompoundLabel3D
            position={B1}
            base="B"
            subscript="1"
            offset={[0.15, -0.15, 0.15]}
          />
          <CompoundLabel3D
            position={C1}
            base="C"
            subscript="1"
            offset={[0.15, 0.15, 0.15]}
          />
          <CompoundLabel3D
            position={D1}
            base="D"
            subscript="1"
            offset={[-0.15, 0.15, 0.15]}
          />
        </>
      )}
    </>
  );
}
