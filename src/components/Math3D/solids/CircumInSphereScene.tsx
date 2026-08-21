import { useMemo } from "react";
import { Point3D } from "../Point3D";
import { PointLabel3D } from "../PointLabel3D";
import { CompoundLabel3D } from "../CompoundLabel3D";
import { Segment3D } from "../Segment3D";
import { Polygon3DFace } from "../Polygon3DFace";
import {
  Cuboid,
  RegularPyramid,
  TriangularPrism,
  Cone,
  Cylinder,
  SphereShell,
  InSphere,
} from "@/components/Math3D/solids";
import {
  calculateCuboidSphere,
  calculatePyramidSphere,
  calculatePrismSphere,
  calculateConeSphere,
  calculateCylinderSphere,
  type SphereType,
  type ShapeType,
} from "@/math3d/circumInSphere";

export interface CircumInSphereSceneProps {
  sphereType: SphereType;
  shape: ShapeType;
  params: Record<string, number>;
  showSolid?: boolean;
  showSphere?: boolean;
  showAuxLines?: boolean;
  showSection?: boolean;
  showTangentPoints?: boolean;
}

export const CircumInSphereScene = ({
  sphereType,
  shape,
  params,
  showSolid = true,
  showSphere = true,
  showAuxLines = true,
  showSection = true,
  showTangentPoints = true,
}: CircumInSphereSceneProps) => {
  const a = params.a ?? 3;
  const b = params.b ?? 2;
  const c = params.c ?? 2;

  // 1. 数学模型解算
  const modelData = useMemo(() => {
    switch (shape) {
      case "cuboid":
        return calculateCuboidSphere(a, b, c, sphereType);
      case "regularPyramid":
        return calculatePyramidSphere(a, c, sphereType);
      case "triangularPrism":
        return calculatePrismSphere(a, b, c, sphereType);
      case "cone":
        return calculateConeSphere(a, c, sphereType);
      case "cylinder":
        return calculateCylinderSphere(a, c, sphereType);
    }
  }, [shape, sphereType, a, b, c]);

  const { radius, center, keyPoints, auxSegments } = modelData;

  // 2. 轴截面多边形顶点 (圆锥/圆柱)
  const sectionVertices = useMemo(() => {
    if (shape === "cone") {
      return [
        { x: -a, y: 0, z: 0 },
        { x: a, y: 0, z: 0 },
        { x: 0, y: 0, z: c },
      ];
    }
    if (shape === "cylinder") {
      return [
        { x: -a, y: 0, z: 0 },
        { x: a, y: 0, z: 0 },
        { x: a, y: 0, z: c },
        { x: -a, y: 0, z: c },
      ];
    }
    return [];
  }, [shape, a, c]);

  return (
    <group>
      {/* ── 1. 几何体实体渲染 ── */}
      {showSolid && (
        <>
          {shape === "cuboid" && (
            <Cuboid a={a} b={b} c={c} colorKey="primary" opacity={0.2} />
          )}
          {shape === "regularPyramid" && (
            <RegularPyramid
              sides={4}
              baseRadius={a / Math.sqrt(2)}
              height={c}
              colorKey="primary"
              opacity={0.25}
            />
          )}
          {shape === "triangularPrism" && (
            <TriangularPrism legA={a} legB={b} height={c} colorKey="primary" />
          )}
          {shape === "cone" && (
            <Cone radius={a} height={c} colorKey="primary" opacity={0.22} />
          )}
          {shape === "cylinder" && (
            <Cylinder radius={a} height={c} colorKey="primary" opacity={0.22} />
          )}
        </>
      )}

      {/* ── 2. 轴截面剖面 (圆锥/圆柱) ── */}
      {showSection && sectionVertices.length > 0 && (
        <Polygon3DFace
          points={sectionVertices}
          colorKey="accent"
          opacity={0.28}
        />
      )}

      {/* ── 3. 切接球渲染 (标准通透带赤道虚实大圆) ── */}
      {showSphere &&
        (sphereType === "circum" ? (
          <SphereShell
            center={center}
            radius={radius}
            colorKey="sphereShell"
            opacity={0.08}
            showGreatCircles={true}
          />
        ) : (
          <InSphere center={center} radius={radius} opacity={0.12} />
        ))}

      {/* ── 4. 球心点与球心标注 (纯净符号，数值 100% 归位右屏看板) ── */}
      <Point3D position={center} colorKey="highlight" />
      <PointLabel3D
        position={center}
        text={sphereType === "circum" ? "O" : "I"}
      />

      {/* ── 5. 关键特征点标注 ── */}
      {shape === "cuboid" && (
        <>
          <Point3D position={{ x: 0, y: 0, z: 0 }} colorKey="primary" />
          <PointLabel3D position={{ x: 0, y: 0, z: 0 }} text="A" />
          <Point3D position={{ x: a, y: b, z: c }} colorKey="primary" />
          <CompoundLabel3D
            position={{ x: a, y: b, z: c }}
            base="C"
            subscript="1"
          />
          <Point3D position={{ x: a, y: b, z: 0 }} colorKey="primary" />
          <PointLabel3D position={{ x: a, y: b, z: 0 }} text="C" />
        </>
      )}

      {shape === "regularPyramid" && keyPoints.S && (
        <>
          <Point3D position={keyPoints.S} colorKey="primary" />
          <PointLabel3D position={keyPoints.S} text="S" />
          <Point3D position={keyPoints.OBase} colorKey="primary" />
          <CompoundLabel3D position={keyPoints.OBase} base="O" subscript="1" />
        </>
      )}

      {shape === "triangularPrism" && keyPoints.O1 && keyPoints.O2 && (
        <>
          <Point3D position={keyPoints.O1} colorKey="primary" />
          <CompoundLabel3D position={keyPoints.O1} base="O" subscript="1" />
          <Point3D position={keyPoints.O2} colorKey="primary" />
          <CompoundLabel3D position={keyPoints.O2} base="O" subscript="2" />
        </>
      )}

      {(shape === "cone" || shape === "cylinder") && keyPoints.O1 && (
        <>
          <Point3D position={keyPoints.O1} colorKey="primary" />
          <CompoundLabel3D position={keyPoints.O1} base="O" subscript="1" />
        </>
      )}

      {/* ── 6. 相切切点标注 ── */}
      {showTangentPoints &&
        sphereType === "inscribed" &&
        Object.entries(keyPoints)
          .filter(([k]) => k.startsWith("t"))
          .map(([k, pt]) => (
            <group key={k}>
              <Point3D position={pt} colorKey="inSphereShell" />
              <PointLabel3D position={pt} text="T" />
            </group>
          ))}

      {/* ── 7. 必标辅助线与公垂半径 ── */}
      {showAuxLines &&
        auxSegments.map((seg, idx) => (
          <Segment3D
            key={idx}
            from={seg.from}
            to={seg.to}
            colorKey={seg.dashed ? "paramTertiary" : "accent"}
            dashed={seg.dashed}
            lineWidth={seg.dashed ? 1.8 : 2.2}
          />
        ))}
    </group>
  );
};
