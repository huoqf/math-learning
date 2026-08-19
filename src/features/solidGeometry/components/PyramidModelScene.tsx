import { useMemo } from "react";
import {
  Vector3DArrow,
  Plane3D,
  CompoundLabel3D,
  Point3D,
  AngleArc3D,
} from "@/components/Math3D";
import { calcPyramidModel } from "@/math3d/lineRelation";
import { projectPointOnSegment } from "@/math3d/vector3";

interface PyramidModelSceneProps {
  lambdaE: number;
  lambdaF: number;
  a?: number;
  b?: number;
  h?: number;
  draggable?: boolean;
  onDragE?: (lambda: number) => void;
  onDragF?: (lambda: number) => void;
}

export function PyramidModelScene({
  lambdaE,
  lambdaF,
  a = 3.6,
  b = 2.8,
  h = 3.5,
  draggable = false,
  onDragE,
  onDragF,
}: PyramidModelSceneProps) {
  const model = useMemo(
    () => calcPyramidModel(a, b, h, lambdaE, lambdaF),
    [a, b, h, lambdaE, lambdaF],
  );

  const { P, A, B, C, D, E, F, isEFParallelBase } = model;

  return (
    <group>
      {/* 1. 底面 ABCD (规范半透明矩形面) */}
      <Plane3D
        origin={{ x: a / 2, y: b / 2, z: 0 }}
        uAxis={{ x: 1, y: 0, z: 0 }}
        vAxis={{ x: 0, y: 1, z: 0 }}
        width={a}
        height={b}
        colorKey="secondary"
        opacity={0.18}
      />

      {/* 2. 底面四边形边线 */}
      <Vector3DArrow from={A} to={B} colorKey="secondary" />
      <Vector3DArrow from={B} to={C} colorKey="secondary" />
      <Vector3DArrow from={C} to={D} colorKey="secondary" />
      <Vector3DArrow from={D} to={A} colorKey="secondary" />

      {/* 3. 侧棱 PA, PB, PC, PD (PA ⊥ 底面作为主参线高亮) */}
      <Vector3DArrow from={A} to={P} colorKey="paramPrimary" />
      <Vector3DArrow from={P} to={B} colorKey="secondary" />
      <Vector3DArrow from={P} to={C} colorKey="secondary" />
      <Vector3DArrow from={P} to={D} colorKey="secondary" />

      {/* 4. 侧面 PAD (垂直基准参考平面) */}
      <Plane3D
        origin={{ x: 0, y: b / 2, z: h / 2 }}
        uAxis={{ x: 0, y: 1, z: 0 }}
        vAxis={{ x: 0, y: 0, z: 1 }}
        width={b}
        height={h}
        colorKey="paramTertiary"
        opacity={0.15}
      />

      {/* 5. 动点 E 与 F 连线 EF (平行时鲜艳高亮，相交时警示色) */}
      <Vector3DArrow
        from={E}
        to={F}
        colorKey={isEFParallelBase ? "highlight" : "paramSecondary"}
      />

      {/* PA ⊥ AB 与 PA ⊥ AD 直角标记 (高考立体几何建系核心依据) */}
      <AngleArc3D
        vertex={A}
        dirA={{ x: 1, y: 0, z: 0 }}
        dirB={{ x: 0, y: 0, z: 1 }}
        radius={0.45}
        colorKey="paramPrimary"
      />
      <AngleArc3D
        vertex={A}
        dirA={{ x: 0, y: 1, z: 0 }}
        dirB={{ x: 0, y: 0, z: 1 }}
        radius={0.45}
        colorKey="paramPrimary"
      />

      {/* 6. 几何基准特征点 A, B, C, D, P */}
      <Point3D position={P} colorKey="paramPrimary" radius={0.05} />
      <Point3D position={A} colorKey="secondary" radius={0.045} />
      <Point3D position={B} colorKey="secondary" radius={0.045} />
      <Point3D position={C} colorKey="secondary" radius={0.045} />
      <Point3D position={D} colorKey="secondary" radius={0.045} />

      {/* 7. 动点 E、F (严格使用 projectPointOnSegment 进行倾斜侧棱正交投影与比值解算) */}
      <Point3D
        position={E}
        colorKey="highlight"
        draggable={draggable}
        constrain={(raw) => projectPointOnSegment(raw, P, B).point}
        onDrag={(next) => {
          const proj = projectPointOnSegment(next, P, B);
          onDragE?.(Number(proj.t.toFixed(2)));
        }}
      />
      <Point3D
        position={F}
        colorKey="highlight"
        draggable={draggable}
        constrain={(raw) => projectPointOnSegment(raw, P, C).point}
        onDrag={(next) => {
          const proj = projectPointOnSegment(next, P, C);
          onDragF?.(Number(proj.t.toFixed(2)));
        }}
      />

      {/* 8. 关键顶点高中数学斜体标准标签 */}
      <CompoundLabel3D
        position={P}
        base="P"
        offset={[0, 0, 0.22]}
        colorKey="paramPrimary"
      />
      <CompoundLabel3D
        position={A}
        base="A"
        offset={[-0.22, -0.22, 0]}
        colorKey="label"
      />
      <CompoundLabel3D
        position={B}
        base="B"
        offset={[0.22, -0.22, 0]}
        colorKey="label"
      />
      <CompoundLabel3D
        position={C}
        base="C"
        offset={[0.22, 0.22, 0]}
        colorKey="label"
      />
      <CompoundLabel3D
        position={D}
        base="D"
        offset={[-0.22, 0.22, 0]}
        colorKey="label"
      />
      <CompoundLabel3D
        position={E}
        base="E"
        colorKey="highlight"
        offset={[0.18, -0.18, 0.12]}
      />
      <CompoundLabel3D
        position={F}
        base="F"
        colorKey="highlight"
        offset={[0.18, 0.18, 0.12]}
      />
    </group>
  );
}
