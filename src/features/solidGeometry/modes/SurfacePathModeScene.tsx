/**
 * 模式四：表面展开最短路径 子场景（折线段 AP 与 PC1 + 理论最佳折点 P1 指示）
 */
import { Segment3D, Point3D, CompoundLabel3D } from "@/components/Math3D";
import type { Vec3 } from "@/math3d/vector3";
import type { SurfacePathResult } from "@/math3d/parametricPoint";

interface SurfacePathModeSceneProps {
  A: Vec3;
  P: Vec3;
  C1: Vec3;
  resPath: SurfacePathResult;
}

export default function SurfacePathModeScene({
  A,
  P,
  C1,
  resPath,
}: SurfacePathModeSceneProps) {
  const isOptimalSide = resPath.bestPathType === "side_BB1";

  return (
    <>
      {/* 实时探索折线段 AP 与 PC1 (纯几何线段，无箭头) */}
      <Segment3D from={A} to={P} colorKey="highlight" lineWidth={3} />
      <Segment3D from={P} to={C1} colorKey="highlight" lineWidth={3} />

      {/* 侧棱 BB1 上的理论最佳折点 P1 */}
      <Point3D position={resPath.optimalP1} colorKey="paramTertiary" />
      <CompoundLabel3D
        position={resPath.optimalP1}
        base="P"
        subscript="1"
        offset={[-0.3, 0, 0.1]}
      />

      {/* 若全局最优不在侧棱 BB1 上，额外高亮标出全局最优折点 P* (如前底棱或后底棱) */}
      {!isOptimalSide && (
        <>
          <Point3D position={resPath.globalOptimalP} colorKey="paramPrimary" />
          <CompoundLabel3D
            position={resPath.globalOptimalP}
            base="P"
            subscript="*"
            offset={[0, -0.2, 0.15]}
          />
          <Segment3D
            from={A}
            to={resPath.globalOptimalP}
            colorKey="paramPrimary"
            lineWidth={2}
            dashed
          />
          <Segment3D
            from={resPath.globalOptimalP}
            to={C1}
            colorKey="paramPrimary"
            lineWidth={2}
            dashed
          />
        </>
      )}
    </>
  );
}
