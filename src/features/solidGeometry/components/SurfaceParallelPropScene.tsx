import React from "react";
import { Plane3D } from "@/components/Math3D/Plane3D";
import { Vector3DArrow } from "@/components/Math3D/Vector3DArrow";
import { FormulaLabel3D } from "@/components/Math3D/FormulaLabel3D";
import { calculateParallelIntersectionLines } from "@/math3d/surfaceRelation";

interface SurfaceParallelPropSceneProps {
  zHeight: number;
  tiltDeg: number;
  azimuthDeg: number;
  step: number;
}

export const SurfaceParallelPropScene: React.FC<
  SurfaceParallelPropSceneProps
> = ({ zHeight, tiltDeg, azimuthDeg, step }) => {
  const actualTilt = 45 + tiltDeg * 0.3; // 适中倾斜
  const lines = calculateParallelIntersectionLines(
    zHeight,
    actualTilt,
    azimuthDeg,
  );

  const gammaTiltRad = (actualTilt * Math.PI) / 180;
  const gammaAzimuthRad = (azimuthDeg * Math.PI) / 180;

  // 截面 gamma 的基底
  const uGamma = {
    x: lines.lineDir.x,
    y: lines.lineDir.y,
    z: lines.lineDir.z,
  };
  const vGamma = {
    x: Math.cos(gammaTiltRad) * Math.cos(gammaAzimuthRad),
    y: Math.cos(gammaTiltRad) * Math.sin(gammaAzimuthRad),
    z: -Math.sin(gammaTiltRad),
  };

  return (
    <>
      {/* 下平面 beta (z=0) */}
      <Plane3D
        origin={{ x: 0, y: 0, z: 0 }}
        uAxis={{ x: 1, y: 0, z: 0 }}
        vAxis={{ x: 0, y: 1, z: 0 }}
        width={5.6}
        height={5.6}
        colorKey="secondary"
        opacity={0.22}
      />
      <FormulaLabel3D position={{ x: 2.3, y: 2.3, z: 0.05 }} tex="\beta" />

      {/* 上平面 alpha (z=zHeight) */}
      <Plane3D
        origin={{ x: 0, y: 0, z: zHeight }}
        uAxis={{ x: 1, y: 0, z: 0 }}
        vAxis={{ x: 0, y: 1, z: 0 }}
        width={5.6}
        height={5.6}
        colorKey="paramTertiary"
        opacity={0.25}
      />
      <FormulaLabel3D
        position={{ x: 2.3, y: 2.3, z: zHeight + 0.1 }}
        tex="\alpha"
      />

      {/* 第三相交平面 gamma */}
      {step > 0.05 && (
        <Plane3D
          origin={{ x: 0, y: 0, z: (zHeight * step) / 2 }}
          uAxis={uGamma}
          vAxis={vGamma}
          width={5.6}
          height={Math.max(1, (zHeight * step) / Math.sin(gammaTiltRad) + 1.2)}
          colorKey="primary"
          opacity={0.22}
        />
      )}
      {step > 0.05 && (
        <FormulaLabel3D
          position={{ x: 0.1, y: 2.3, z: (zHeight * step) / 2 + 0.15 }}
          tex="\gamma"
        />
      )}

      {/* 下交线 a (在面 beta 上) */}
      {step > 0.1 && (
        <>
          <Vector3DArrow
            from={lines.lineAStart}
            to={lines.lineAEnd}
            colorKey="paramPrimary"
          />
          <FormulaLabel3D
            position={{
              x: lines.lineAEnd.x + 0.15,
              y: lines.lineAEnd.y + 0.15,
              z: 0.05,
            }}
            tex="a"
          />
        </>
      )}

      {/* 上交线 b (在面 alpha 上) */}
      {step > 0.6 && (
        <>
          <Vector3DArrow
            from={lines.lineBStart}
            to={lines.lineBEnd}
            colorKey="paramSecondary"
          />
          <FormulaLabel3D
            position={{
              x: lines.lineBEnd.x + 0.15,
              y: lines.lineBEnd.y + 0.15,
              z: zHeight + 0.05,
            }}
            tex="b"
          />
        </>
      )}

      {/* 平行平面间距公垂线段 d */}
      <Vector3DArrow
        from={{ x: -2, y: -2, z: 0 }}
        to={{ x: -2, y: -2, z: zHeight }}
        colorKey="highlight"
      />
      <FormulaLabel3D position={{ x: -2.2, y: -2, z: zHeight / 2 }} tex="d" />
    </>
  );
};
