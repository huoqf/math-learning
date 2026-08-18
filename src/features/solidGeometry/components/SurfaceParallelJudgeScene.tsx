import React from "react";
import { Plane3D } from "@/components/Math3D/Plane3D";
import { Vector3DArrow } from "@/components/Math3D/Vector3DArrow";
import { PointLabel3D } from "@/components/Math3D/PointLabel3D";
import { Point3D } from "@/components/Math3D/Point3D";
import { FormulaLabel3D } from "@/components/Math3D/FormulaLabel3D";
import { calculateParallelJudgeState } from "@/math3d/surfaceRelation";

interface SurfaceParallelJudgeSceneProps {
  isIntersect: boolean;
  tiltDeg: number;
  zHeight: number;
}

export const SurfaceParallelJudgeScene: React.FC<
  SurfaceParallelJudgeSceneProps
> = ({ isIntersect, tiltDeg, zHeight }) => {
  const state = calculateParallelJudgeState(isIntersect, tiltDeg, zHeight);
  const rad = (tiltDeg * Math.PI) / 180;

  // 上平面 alpha 的 uAxis 与 vAxis (绕 X 轴旋转)
  const uAxis = { x: 1, y: 0, z: 0 };
  const vAxis = isIntersect
    ? { x: 0, y: 1, z: 0 }
    : { x: 0, y: Math.cos(rad), z: Math.sin(rad) };

  const alphaOrigin = isIntersect
    ? { x: 0, y: 0, z: zHeight }
    : { x: 0, y: 0.8 * Math.cos(rad), z: zHeight + 0.8 * Math.sin(rad) };

  return (
    <>
      {/* 基准下平面 beta */}
      <Plane3D
        origin={{ x: 0, y: 0, z: 0 }}
        uAxis={{ x: 1, y: 0, z: 0 }}
        vAxis={{ x: 0, y: 1, z: 0 }}
        width={5.6}
        height={5.6}
        colorKey="secondary"
        opacity={0.25}
      />
      <FormulaLabel3D position={{ x: 2.5, y: 2.5, z: 0.1 }} tex="\beta" />

      {/* 上平面 alpha */}
      <Plane3D
        origin={alphaOrigin}
        uAxis={uAxis}
        vAxis={vAxis}
        width={5.6}
        height={5.6}
        colorKey="paramTertiary"
        opacity={0.28}
      />
      <FormulaLabel3D
        position={{
          x: alphaOrigin.x + 2.5,
          y: alphaOrigin.y + 2.5 * vAxis.y,
          z: alphaOrigin.z + 2.5 * vAxis.z + 0.15,
        }}
        tex="\alpha"
      />

      {/* 直线 a */}
      <Vector3DArrow
        from={state.lineAStart}
        to={state.lineAEnd}
        colorKey="paramPrimary"
      />
      <FormulaLabel3D
        position={{
          x: state.lineAEnd.x + 0.2,
          y: state.lineAEnd.y,
          z: state.lineAEnd.z + 0.1,
        }}
        tex="a"
      />

      {/* 直线 b */}
      <Vector3DArrow
        from={state.lineBStart}
        to={state.lineBEnd}
        colorKey="paramSecondary"
      />
      <FormulaLabel3D
        position={{
          x: state.lineBEnd.x + 0.2,
          y: state.lineBEnd.y,
          z: state.lineBEnd.z + 0.1,
        }}
        tex="b"
      />

      {/* 相交点 P */}
      {isIntersect && (
        <>
          <Point3D
            position={{ x: 0, y: 0, z: zHeight }}
            colorKey="highlight"
            radius={0.06}
          />
          <PointLabel3D
            position={{ x: 0, y: 0, z: zHeight }}
            text="P"
            offset={[-0.2, -0.2, 0.15]}
          />
        </>
      )}

      {/* 法向量 n1 (alpha) 与 n2 (beta) */}
      <Vector3DArrow
        from={{ x: -1.8, y: -1.8, z: 0 }}
        to={{ x: -1.8, y: -1.8, z: 1.5 }}
        colorKey="secondary"
      />
      <FormulaLabel3D position={{ x: -1.6, y: -1.8, z: 1.6 }} tex="\vec{n_2}" />

      <Vector3DArrow
        from={{
          x: alphaOrigin.x + 1.2,
          y: alphaOrigin.y + 1.2 * vAxis.y,
          z: alphaOrigin.z + 1.2 * vAxis.z,
        }}
        to={{
          x: alphaOrigin.x + 1.2 + state.alphaNormal.x * 1.5,
          y: alphaOrigin.y + 1.2 * vAxis.y + state.alphaNormal.y * 1.5,
          z: alphaOrigin.z + 1.2 * vAxis.z + state.alphaNormal.z * 1.5,
        }}
        colorKey="paramPrimary"
      />
      <FormulaLabel3D
        position={{
          x: alphaOrigin.x + 1.4 + state.alphaNormal.x * 1.5,
          y: alphaOrigin.y + 1.2 * vAxis.y + state.alphaNormal.y * 1.5,
          z: alphaOrigin.z + 1.2 * vAxis.z + state.alphaNormal.z * 1.5 + 0.1,
        }}
        tex="\vec{n_1}"
      />
    </>
  );
};
