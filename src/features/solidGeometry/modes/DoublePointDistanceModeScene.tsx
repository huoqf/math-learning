/**
 * 模式二：双动点与向量最值 子场景（对角线 AC 导轨 + 动点 Q 拖拽 + 动线段 PQ + 公垂线直角方框）
 */
import {
  Segment3D,
  Point3D,
  PointLabel3D,
  AngleArc3D,
} from "@/components/Math3D";
import type { InteractionMode3D } from "@/components/Math3D";
import type { Vec3 } from "@/math3d/vector3";
import type { DoublePointDistanceResult } from "@/math3d/parametricPoint";

interface DoublePointDistanceModeSceneProps {
  a: number;
  b: number;
  lambda: number;
  mu: number;
  P: Vec3;
  Q: Vec3;
  A: Vec3;
  C: Vec3;
  resDouble: DoublePointDistanceResult;
  interactionMode: InteractionMode3D;
  onQDrag: (mu: number) => void;
}

export default function DoublePointDistanceModeScene({
  a,
  b,
  lambda,
  mu,
  P,
  Q,
  A,
  C,
  resDouble,
  interactionMode,
  onQDrag,
}: DoublePointDistanceModeSceneProps) {
  // 公垂线判断
  const isAtCommonPerp =
    Math.abs(mu - resDouble.optimalMu) < 0.03 && lambda < 0.05;
  const acLenSq = a * a + b * b;

  return (
    <>
      {/* 底面对角线 AC 高亮轨迹导轨 (纯几何线段) */}
      <Segment3D from={A} to={C} colorKey="secondary" lineWidth={2.5} />

      {/* 动点 Q：在 AC 上可向量正交平滑拖拽 */}
      <Point3D
        position={Q}
        draggable={interactionMode === "drag"}
        constrain={(raw) => {
          const dotVal = raw.x * a + raw.y * b;
          const t = Math.min(1, Math.max(0, dotVal / acLenSq));
          return { x: t * a, y: t * b, z: 0 };
        }}
        onDrag={(next) => {
          const t = Math.min(
            1,
            Math.max(0, (next.x * a + next.y * b) / acLenSq),
          );
          onQDrag(t);
        }}
        colorKey="accent"
      />
      <PointLabel3D position={Q} text="Q" offset={[0.15, 0.15, -0.1]} />

      {/* 动线段 PQ (纯几何线段，无箭头) */}
      <Segment3D
        from={P}
        to={Q}
        colorKey={isAtCommonPerp ? "paramTertiary" : "highlight"}
        lineWidth={isAtCommonPerp ? 3.5 : 3}
      />

      {/* 当到达公垂线极值时，渲染双直角方框 */}
      {isAtCommonPerp && (
        <>
          <AngleArc3D
            vertex={resDouble.optimalFootOnBB1}
            dirA={{ x: 0, y: 0, z: 1 }}
            dirB={{
              x: resDouble.optimalFootOnAC.x - a,
              y: resDouble.optimalFootOnAC.y,
              z: 0,
            }}
            radius={0.35}
            isRight
            colorKey="paramTertiary"
          />
        </>
      )}
    </>
  );
}
