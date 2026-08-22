/**
 * 模式一：棱上单动点与空间角及存在性 子场景（截面 PAC + 法向量 + 动连线 DP + 存在性指示）
 */
import { distance } from "@/math3d/vector3";
import type { Vec3 } from "@/math3d/vector3";
import {
  Polygon3DFace,
  Segment3D,
  Vector3DArrow,
  FormulaLabel3D,
  Point3D,
  CompoundLabel3D,
} from "@/components/Math3D";
import type { SinglePointAngleResult } from "@/math3d/parametricPoint";

interface SinglePointAngleModeSceneProps {
  a: number;
  c: number;
  P: Vec3;
  A: Vec3;
  C: Vec3;
  D: Vec3;
  C1: Vec3;
  B1: Vec3;
  resSingle: SinglePointAngleResult;
}

export default function SinglePointAngleModeScene({
  a,
  c,
  P,
  A,
  C,
  D,
  C1,
  B1,
  resSingle,
}: SinglePointAngleModeSceneProps) {
  // 截面中心与法向量缩放
  const centerPAC: Vec3 = {
    x: (P.x + A.x + C.x) / 3,
    y: (P.y + A.y + C.y) / 3,
    z: (P.z + A.z + C.z) / 3,
  };
  const normLen = resSingle.lenN < 1e-9 ? 1 : resSingle.lenN;
  const vecNormalScaled: Vec3 = {
    x: centerPAC.x + (resSingle.nPAC.x / normLen) * 1.8,
    y: centerPAC.y + (resSingle.nPAC.y / normLen) * 1.8,
    z: centerPAC.z + (resSingle.nPAC.z / normLen) * 1.8,
  };

  return (
    <>
      {/* 截面 PAC 半透明面片 */}
      <Polygon3DFace points={[P, A, C]} colorKey="secondary" opacity={0.25} />

      {/* 截面三条边 (纯几何线段，绝无箭头) */}
      <Segment3D from={A} to={P} colorKey="highlight" lineWidth={2.5} />
      <Segment3D from={P} to={C} colorKey="highlight" lineWidth={2.5} />
      <Segment3D from={C} to={A} colorKey="highlight" lineWidth={2.5} />

      {/* 截面法向量 (唯一代数向量箭头) */}
      {resSingle.lenN > 1e-4 && (
        <>
          <Vector3DArrow
            from={centerPAC}
            to={vecNormalScaled}
            colorKey="secondary"
          />
          <FormulaLabel3D position={vecNormalScaled} tex="\\vec{n}" />
        </>
      )}

      {/* 动连线 DP (纯几何线段) */}
      <Segment3D from={D} to={P} colorKey="accent" lineWidth={2.5} />
      {/* 探究线 AC1 (纯几何线段) */}
      <Segment3D from={A} to={C1} colorKey="secondary" dashed lineWidth={2} />

      {/* 存在性目标点指示：当未与当前动点 P 重叠时才显示 P_0 辅助点 */}
      {resSingle.isTargetDihedralExist &&
        distance(P, resSingle.dihedralTargetP) > 0.25 && (
          <>
            <Point3D
              position={resSingle.dihedralTargetP}
              colorKey="paramTertiary"
            />
            <CompoundLabel3D
              position={resSingle.dihedralTargetP}
              base="P"
              subscript="0"
              offset={[0.2, 0, 0]}
            />
          </>
        )}

      {/* 超界虚线导轨延伸指示 */}
      {!resSingle.isTargetDihedralExist && (
        <Segment3D
          from={B1}
          to={{
            x: a,
            y: 0,
            z: Math.min(
              c * 1.5,
              Math.max(c + 0.8, resSingle.dihedralTargetP.z),
            ),
          }}
          colorKey="highlight"
          dashed
          lineWidth={1.5}
        />
      )}
    </>
  );
}
