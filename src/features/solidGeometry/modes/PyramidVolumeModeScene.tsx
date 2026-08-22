/**
 * 模式三：动点三棱锥体积极值 子场景（底面 △ACD + 侧棱 + 动高线 PB + 直角方框）
 */
import {
  Polygon3DFace,
  Segment3D,
  AngleArc3D,
  FormulaLabel3D,
} from "@/components/Math3D";
import type { Vec3 } from "@/math3d/vector3";
import type { PyramidVolumeExtremaResult } from "@/math3d/parametricPoint";

interface PyramidVolumeModeSceneProps {
  a: number;
  P: Vec3;
  A: Vec3;
  B: Vec3;
  C: Vec3;
  D: Vec3;
  resVolume: PyramidVolumeExtremaResult;
}

export default function PyramidVolumeModeScene({
  a,
  P,
  A,
  B,
  C,
  D,
  resVolume,
}: PyramidVolumeModeSceneProps) {
  return (
    <>
      {/* 底面 △ACD 半透明面片 */}
      <Polygon3DFace points={[A, C, D]} colorKey="secondary" opacity={0.3} />

      {/* 底面三边 */}
      <Segment3D from={A} to={C} colorKey="secondary" lineWidth={2} />
      <Segment3D from={C} to={D} colorKey="secondary" lineWidth={2} />
      <Segment3D from={D} to={A} colorKey="secondary" lineWidth={2} />

      {/* 棱锥三条侧棱 PA, PC, PD */}
      <Segment3D from={P} to={A} colorKey="highlight" lineWidth={2.5} />
      <Segment3D from={P} to={C} colorKey="highlight" lineWidth={2.5} />
      <Segment3D from={P} to={D} colorKey="highlight" lineWidth={2.5} />

      {/* 动高线 PB 垂线段 (纯几何线段，虚线高) */}
      <Segment3D
        from={P}
        to={B}
        colorKey="paramTertiary"
        dashed
        lineWidth={2.5}
      />
      {resVolume.heightH > 0.4 && (
        <FormulaLabel3D
          position={{
            x: a + 0.25,
            y: 0,
            z: resVolume.heightH / 2,
          }}
          tex={`h=${resVolume.heightH.toFixed(1)}`}
        />
      )}

      {/* 垂足 B 处直角方框 */}
      <AngleArc3D
        vertex={B}
        dirA={{ x: 0, y: 0, z: 1 }}
        dirB={{ x: -1, y: 0, z: 0 }}
        radius={0.35}
        isRight
        colorKey="paramTertiary"
      />
    </>
  );
}
