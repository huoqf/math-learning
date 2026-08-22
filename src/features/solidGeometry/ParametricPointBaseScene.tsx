/**
 * 动车任意模式共享的 3D 基底骨架：长方体透视骨架 + 顶点标注 + 侧棱 BB1 导轨 + 可拖拽动点 P
 */
import {
  Scene3DGrid,
  Point3D,
  PointLabel3D,
  CompoundLabel3D,
  Segment3D,
} from "@/components/Math3D";
import type { InteractionMode3D } from "@/components/Math3D";
import { Cuboid } from "@/components/Math3D/solids";
import type { Vec3 } from "@/math3d/vector3";

interface ParametricPointBaseSceneProps {
  a: number;
  b: number;
  c: number;
  P: Vec3;
  A: Vec3;
  B: Vec3;
  C: Vec3;
  D: Vec3;
  A1: Vec3;
  B1: Vec3;
  C1: Vec3;
  D1: Vec3;
  interactionMode: InteractionMode3D;
  onPDrag: (z: number) => void;
}

export default function ParametricPointBaseScene({
  a,
  b,
  c,
  P,
  A,
  B,
  C,
  D,
  A1,
  B1,
  C1,
  D1,
  interactionMode,
  onPDrag,
}: ParametricPointBaseSceneProps) {
  return (
    <>
      {/* 空间直角坐标系（纯三轴系统，彻底移除地面网格） */}
      <Scene3DGrid size={5.5} showGrid={false} />

      {/* 长方体透视骨架 (尺寸与顶点 100% 精确贴合) */}
      <Cuboid a={a} b={b} c={c} opacity={0.12} colorKey="primary" />

      {/* 顶点文本标注（纯 3D 矢量文字，严格使用 CompoundLabel3D 消除豆腐块） */}
      <PointLabel3D position={A} text="A" offset={[-0.2, -0.2, -0.1]} />
      <PointLabel3D position={B} text="B" offset={[0.2, -0.2, -0.1]} />
      <PointLabel3D position={C} text="C" offset={[0.2, 0.2, -0.1]} />
      <PointLabel3D position={D} text="D" offset={[-0.2, 0.2, -0.1]} />
      <CompoundLabel3D
        position={A1}
        base="A"
        subscript="1"
        offset={[-0.2, -0.2, 0.2]}
      />
      <CompoundLabel3D
        position={B1}
        base="B"
        subscript="1"
        offset={[0.2, -0.2, 0.2]}
      />
      <CompoundLabel3D
        position={C1}
        base="C"
        subscript="1"
        offset={[0.2, 0.2, 0.2]}
      />
      <CompoundLabel3D
        position={D1}
        base="D"
        subscript="1"
        offset={[-0.2, 0.2, 0.2]}
      />

      {/* 侧棱 BB1 高亮轨迹导轨 (纯几何线段，无箭头) */}
      <Segment3D from={B} to={B1} colorKey="highlight" lineWidth={2.5} />

      {/* 动点 P：在侧棱 BB1 上垂直拖拽 */}
      <Point3D
        position={P}
        draggable={interactionMode === "drag"}
        constrain={(raw) => ({
          x: a,
          y: 0,
          z: Math.min(c, Math.max(0, raw.z)),
        })}
        onDrag={(next) => {
          onPDrag(next.z);
        }}
        colorKey="highlight"
      />
      <PointLabel3D position={P} text="P" offset={[0.18, 0, 0.1]} />
    </>
  );
}
