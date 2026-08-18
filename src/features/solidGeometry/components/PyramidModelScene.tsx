import { useMemo } from "react";
import {
  Vector3DArrow,
  Plane3D,
  PointLabel3D,
  Point3D,
} from "@/components/Math3D";
import { calcPyramidModel } from "@/math3d/lineRelation";

interface PyramidModelSceneProps {
  lambdaE: number;
  lambdaF: number;
  a?: number;
  b?: number;
  h?: number;
}

export function PyramidModelScene({
  lambdaE,
  lambdaF,
  a = 3.6,
  b = 2.8,
  h = 3.5,
}: PyramidModelSceneProps) {
  const model = useMemo(
    () => calcPyramidModel(a, b, h, lambdaE, lambdaF),
    [a, b, h, lambdaE, lambdaF],
  );

  const { P, A, B, C, D, E, F, isEFParallelBase } = model;

  return (
    <group>
      {/* 1. 底面 ABCD */}
      <Plane3D
        origin={{ x: a / 2, y: b / 2, z: 0 }}
        uAxis={{ x: 1, y: 0, z: 0 }}
        vAxis={{ x: 0, y: 1, z: 0 }}
        width={a}
        height={b}
        colorKey="secondary"
        opacity={0.15}
      />

      {/* 2. 底面四边形边线 */}
      <Vector3DArrow from={A} to={B} colorKey="secondary" />
      <Vector3DArrow from={B} to={C} colorKey="secondary" />
      <Vector3DArrow from={C} to={D} colorKey="secondary" />
      <Vector3DArrow from={D} to={A} colorKey="secondary" />

      {/* 3. 侧棱 PA, PB, PC, PD */}
      <Vector3DArrow from={A} to={P} colorKey="paramPrimary" />
      <Vector3DArrow from={P} to={B} colorKey="secondary" />
      <Vector3DArrow from={P} to={C} colorKey="secondary" />
      <Vector3DArrow from={P} to={D} colorKey="secondary" />

      {/* 4. 侧面 PAD (高亮基准参考平面) */}
      <Plane3D
        origin={{ x: 0, y: b / 2, z: h / 2 }}
        uAxis={{ x: 0, y: 1, z: 0 }}
        vAxis={{ x: 0, y: 0, z: 1 }}
        width={b}
        height={h}
        colorKey="paramTertiary"
        opacity={0.12}
      />

      {/* 5. 动点 E 与 F 连线 EF */}
      <Vector3DArrow
        from={E}
        to={F}
        colorKey={isEFParallelBase ? "highlight" : "paramSecondary"}
      />

      {/* 6. 动点 E、F (纯净细腻几何点 radius=0.05，由左屏精准滑块与预设按钮驱动) */}
      <Point3D position={E} colorKey="highlight" radius={0.05} />
      <Point3D position={F} colorKey="highlight" radius={0.05} />

      {/* 7. 关键顶点标签 */}
      <PointLabel3D position={{ x: P.x, y: P.y, z: P.z + 0.2 }} text="P" />
      <PointLabel3D position={{ x: A.x - 0.2, y: A.y - 0.2, z: 0 }} text="A" />
      <PointLabel3D position={{ x: B.x + 0.2, y: B.y - 0.2, z: 0 }} text="B" />
      <PointLabel3D position={{ x: C.x + 0.2, y: C.y + 0.2, z: 0 }} text="C" />
      <PointLabel3D position={{ x: D.x - 0.2, y: D.y + 0.2, z: 0 }} text="D" />
      <PointLabel3D
        position={{ x: E.x + 0.15, y: E.y - 0.2, z: E.z + 0.1 }}
        text="E"
      />
      <PointLabel3D
        position={{ x: F.x + 0.15, y: F.y + 0.2, z: F.z + 0.1 }}
        text="F"
      />
    </group>
  );
}
