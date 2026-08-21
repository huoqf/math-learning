import React from "react";
import { Plane3D } from "@/components/Math3D/Plane3D";
import { Segment3D } from "@/components/Math3D/Segment3D";
import { FormulaLabel3D } from "@/components/Math3D/FormulaLabel3D";
import { CompoundLabel3D } from "@/components/Math3D/CompoundLabel3D";
import { Point3D } from "@/components/Math3D/Point3D";
import { AngleArc3D } from "@/components/Math3D/AngleArc3D";
import { calculatePerpPropState } from "@/math3d/surfaceRelation";

interface SurfacePerpPropSceneProps {
  lineThetaDeg: number;
  subType: "standard" | "counterExample" | "dualPerp";
}

export const SurfacePerpPropScene: React.FC<SurfacePerpPropSceneProps> = ({
  lineThetaDeg,
  subType,
}) => {
  const isDualPerp = subType === "dualPerp";
  const state = calculatePerpPropState(lineThetaDeg);

  if (isDualPerp) {
    // 双垂直交线定理场景：alpha 垂直于 gamma，beta 垂直于 gamma，交线 l 垂直于 gamma
    return (
      <>
        {/* 基底底面 gamma (z=0) */}
        <Plane3D
          origin={{ x: 0, y: 0, z: 0 }}
          uAxis={{ x: 1, y: 0, z: 0 }}
          vAxis={{ x: 0, y: 1, z: 0 }}
          width={5.6}
          height={5.6}
          colorKey="secondary"
          opacity={0.22}
        />
        <FormulaLabel3D position={{ x: 2.3, y: 2.3, z: 0.05 }} tex="\gamma" />

        {/* 立面 alpha (xz 平面, y=0) 垂直于 gamma */}
        <Plane3D
          origin={{ x: 0, y: 0, z: 1.5 }}
          uAxis={{ x: 1, y: 0, z: 0 }}
          vAxis={{ x: 0, y: 0, z: 1 }}
          width={5.2}
          height={3}
          colorKey="paramTertiary"
          opacity={0.25}
        />
        <FormulaLabel3D position={{ x: 2.3, y: 0.1, z: 2.6 }} tex="\alpha" />

        {/* 立面 beta (yz 平面, x=0) 垂直于 gamma */}
        <Plane3D
          origin={{ x: 0, y: 0, z: 1.5 }}
          uAxis={{ x: 0, y: 1, z: 0 }}
          vAxis={{ x: 0, y: 0, z: 1 }}
          width={5.2}
          height={3}
          colorKey="paramSecondary"
          opacity={0.22}
        />
        <FormulaLabel3D position={{ x: 0.1, y: 2.3, z: 2.6 }} tex="\beta" />

        {/* 两面交线 l (z 轴) 必垂直于 gamma */}
        <Segment3D
          from={{ x: 0, y: 0, z: 0 }}
          to={{ x: 0, y: 0, z: 3.2 }}
          colorKey="paramPrimary"
          lineWidth={3}
        />
        <FormulaLabel3D position={{ x: 0.15, y: 0.15, z: 3.3 }} tex="l" />
        <CompoundLabel3D
          position={{ x: 0, y: 0, z: 0 }}
          base="O"
          colorKey="paramPrimary"
          offset={[-0.2, -0.2, 0]}
        />
        <Point3D
          position={{ x: 0, y: 0, z: 0 }}
          colorKey="paramPrimary"
          radius={0.05}
        />

        {/* 交线 l 垂直于底面直角标记 */}
        <AngleArc3D
          vertex={{ x: 0, y: 0, z: 0 }}
          dirA={{ x: 1, y: 0, z: 0 }}
          dirB={{ x: 0, y: 0, z: 1 }}
          radius={0.5}
          colorKey="paramPrimary"
        />
      </>
    );
  }

  // 性质定理 1：面内垂直于交线推出线面垂直
  return (
    <>
      {/* 底面 alpha (z=0) */}
      <Plane3D
        origin={{ x: 0, y: 0, z: 0 }}
        uAxis={{ x: 1, y: 0, z: 0 }}
        vAxis={{ x: 0, y: 1, z: 0 }}
        width={5.6}
        height={5.6}
        colorKey="secondary"
        opacity={0.22}
      />
      <FormulaLabel3D position={{ x: 2.3, y: 2.3, z: 0.05 }} tex="\alpha" />

      {/* 垂直立面 beta (x=0, yz平面) */}
      <Plane3D
        origin={{ x: 0, y: 0, z: 1.5 }}
        uAxis={{ x: 0, y: 1, z: 0 }}
        vAxis={{ x: 0, y: 0, z: 1 }}
        width={5.6}
        height={3}
        colorKey="paramTertiary"
        opacity={0.25}
      />
      <FormulaLabel3D position={{ x: 0.1, y: 2.3, z: 2.6 }} tex="\beta" />

      {/* 两面交线 l (y 轴) */}
      <Segment3D
        from={state.lineLStart}
        to={state.lineLEnd}
        colorKey="secondary"
        lineWidth={2.5}
      />
      <FormulaLabel3D position={{ x: 0.15, y: 2.6, z: 0.05 }} tex="l" />

      {/* 面内直线 a */}
      <Segment3D
        from={state.lineAStart}
        to={state.lineAEnd}
        colorKey="paramPrimary"
        lineWidth={3}
      />
      <FormulaLabel3D
        position={{
          x: 0.05,
          y: state.lineAEnd.y + 0.15,
          z: state.lineAEnd.z + 0.15,
        }}
        tex="a"
      />
      <CompoundLabel3D
        position={{ x: 0, y: 0, z: 0 }}
        base="O"
        colorKey="paramPrimary"
        offset={[-0.14, -0.14, 0]}
      />
      <Point3D
        position={{ x: 0, y: 0, z: 0 }}
        colorKey="paramPrimary"
        radius={0.05}
      />

      {/* 直线 a 与交线 l 的夹角弧 (a ⊥ l 时直角方框) */}
      <AngleArc3D
        vertex={{ x: 0, y: 0, z: 0 }}
        dirA={{ x: 0, y: 1, z: 0 }}
        dirB={{ x: 0, y: state.aDir.y, z: state.aDir.z }}
        radius={0.45}
        isRight={state.isPerpToAlpha}
        colorKey={state.isPerpToAlpha ? "highlight" : "paramSecondary"}
      />
    </>
  );
};
