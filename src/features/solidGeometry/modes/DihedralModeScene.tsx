/**
 * 模式三：二面角 子场景（几何法平面角与重心法向量）
 */
import {
  Polygon3DFace,
  Point3D,
  PointLabel3D,
  FormulaLabel3D,
  Segment3D,
  AngleArc3D,
  Vector3DArrow,
} from "@/components/Math3D";
import type {
  CuboidVertices,
  DihedralAngleResult,
  TriangularPrismDihedralResult,
} from "@/math3d/spatialAngle";
import { sub, type Vec3 } from "@/math3d/vector3";
import { formatMathNumber } from "@/utils/mathFormat";

interface DihedralModeSceneProps {
  c: number;
  vertices: CuboidVertices;
  dihedralData: DihedralAngleResult;
  isTriPrism?: boolean;
  triPrismData?: TriangularPrismDihedralResult;
  showAxes: boolean;
  showCoordinates: boolean;
  showAuxiliary: boolean;
  showRightAngles: boolean;
  showAngles: boolean;
  showNormals: boolean;
  interactionMode: "orbit" | "drag";
  activeStep?: number;
  onEPointDrag: (next: Vec3) => void;
}

export default function DihedralModeScene({
  c,
  vertices,
  dihedralData,
  isTriPrism = false,
  triPrismData,
  showAxes,
  showCoordinates,
  showAuxiliary,
  showRightAngles,
  showAngles,
  showNormals,
  interactionMode,
  activeStep,
  onEPointDrag,
}: DihedralModeSceneProps) {
  if (isTriPrism && triPrismData) {
    const { O, A, B, C, A1, B1, C1, E } = triPrismData.vertices;
    const axisLenX = Math.max(2, Math.abs(C.x) + 0.8);
    const axisLenY = Math.max(2, triPrismData.triHeight + 0.8);
    const axisLenZ = Math.max(2, c + 0.8);

    return (
      <>
        {/* 正三棱柱底面、顶面与三条侧棱 */}
        <Segment3D
          from={A}
          to={B}
          colorKey="line"
          lineWidth={1.8}
          opacity={0.75}
        />
        <Segment3D from={B} to={C} colorKey="highlight" lineWidth={3} />
        <Segment3D
          from={C}
          to={A}
          colorKey="line"
          lineWidth={1.8}
          opacity={0.75}
        />
        <Segment3D
          from={A1}
          to={B1}
          colorKey="line"
          lineWidth={1.6}
          opacity={0.65}
        />
        <Segment3D
          from={B1}
          to={C1}
          colorKey="line"
          lineWidth={1.6}
          opacity={0.65}
        />
        <Segment3D
          from={C1}
          to={A1}
          colorKey="line"
          lineWidth={1.6}
          opacity={0.65}
        />
        <Segment3D
          from={A}
          to={A1}
          colorKey="line"
          lineWidth={1.8}
          opacity={0.75}
        />
        <Segment3D
          from={B}
          to={B1}
          colorKey="line"
          lineWidth={1.8}
          opacity={0.75}
        />
        <Segment3D
          from={C}
          to={C1}
          colorKey="line"
          lineWidth={1.8}
          opacity={0.75}
        />

        {/* 非长方体典型建系：BC 中点 O 为原点 */}
        {showAxes && (
          <>
            <Vector3DArrow
              from={O}
              to={{ x: axisLenX, y: 0, z: 0 }}
              colorKey="axis3D_X"
              headLength={0.22}
              headWidth={0.14}
            />
            <FormulaLabel3D
              position={{ x: axisLenX + 0.12, y: 0, z: 0 }}
              tex="x"
            />
            <Vector3DArrow
              from={O}
              to={{ x: 0, y: axisLenY, z: 0 }}
              colorKey="axis3D_Y"
              headLength={0.22}
              headWidth={0.14}
            />
            <FormulaLabel3D
              position={{ x: 0, y: axisLenY + 0.12, z: 0 }}
              tex="y"
            />
            <Vector3DArrow
              from={O}
              to={{ x: 0, y: 0, z: axisLenZ }}
              colorKey="axis3D_Z"
              headLength={0.22}
              headWidth={0.14}
            />
            <FormulaLabel3D
              position={{ x: 0, y: 0, z: axisLenZ + 0.12 }}
              tex="z"
            />
          </>
        )}

        {/* 顶点与原点标注 */}
        {showAxes && showCoordinates ? (
          <>
            <FormulaLabel3D
              position={O}
              tex="O(0,0,0)"
              offset={[0, -0.25, -0.1]}
            />
            <FormulaLabel3D
              position={A}
              tex={`A(0,${formatMathNumber(A.y)},0)`}
              offset={[0, 0.25, -0.1]}
            />
            <FormulaLabel3D
              position={B}
              tex={`B(${formatMathNumber(B.x)},0,0)`}
              offset={[-0.3, -0.22, -0.1]}
            />
            <FormulaLabel3D
              position={C}
              tex={`C(${formatMathNumber(C.x)},0,0)`}
              offset={[0.25, -0.22, -0.1]}
            />
            <FormulaLabel3D
              position={E}
              tex={`E(0,${formatMathNumber(E.y)},${formatMathNumber(E.z)})`}
              offset={[0.18, 0.22, 0.12]}
            />
          </>
        ) : (
          <>
            <PointLabel3D position={O} text="O" offset={[0, -0.22, -0.08]} />
            <PointLabel3D position={A} text="A" offset={[0, 0.22, -0.08]} />
            <PointLabel3D
              position={B}
              text="B"
              offset={[-0.22, -0.16, -0.08]}
            />
            <PointLabel3D position={C} text="C" offset={[0.22, -0.16, -0.08]} />
            <FormulaLabel3D position={A1} tex="A_1" offset={[0, 0.22, 0.12]} />
            <FormulaLabel3D
              position={B1}
              tex="B_1"
              offset={[-0.22, -0.16, 0.12]}
            />
            <FormulaLabel3D
              position={C1}
              tex="C_1"
              offset={[0.22, -0.16, 0.12]}
            />
            <PointLabel3D position={E} text="E" offset={[0.22, 0.18, 0.1]} />
          </>
        )}

        <Point3D position={O} colorKey="paramTertiary" />
        <Point3D
          position={E}
          draggable={interactionMode === "drag"}
          constrain={(raw) => ({
            x: A.x,
            y: A.y,
            z: Math.min(c, Math.max(0.1 * c, raw.z)),
          })}
          onDrag={onEPointDrag}
          colorKey="highlight"
        />

        {/* 底面 △ABC 与截面 △EBC */}
        <Polygon3DFace
          points={[A, B, C]}
          colorKey="secondary"
          opacity={activeStep === 1 || activeStep === 2 ? 0.24 : 0.14}
        />
        <Polygon3DFace
          points={[E, B, C]}
          colorKey="paramTertiary"
          opacity={activeStep === 2 ? 0.42 : 0.28}
        />
        <Segment3D
          from={E}
          to={B}
          colorKey="paramPrimary"
          lineWidth={activeStep === 2 ? 3.2 : 2}
        />
        <Segment3D
          from={E}
          to={C}
          colorKey="paramPrimary"
          lineWidth={activeStep === 2 ? 3.2 : 2}
        />

        {/* 几何法垂线 OA ⊥ BC 与 OE ⊥ BC */}
        {showAuxiliary && (
          <>
            <Segment3D
              from={O}
              to={A}
              dashed
              colorKey="secondary"
              lineWidth={activeStep === 1 || activeStep === 3 ? 3.5 : 2}
            />
            <Segment3D
              from={O}
              to={E}
              dashed
              colorKey="paramTertiary"
              lineWidth={activeStep === 3 ? 3.8 : 2.2}
            />
          </>
        )}

        {/* 直角符号与二面角平面角 ∠EOA */}
        {showRightAngles && showAuxiliary && (
          <>
            <AngleArc3D
              vertex={O}
              dirA={sub(A, O)}
              dirB={sub(C, O)}
              radius={0.25}
              colorKey="secondary"
              isRight
            />
            <AngleArc3D
              vertex={O}
              dirA={sub(E, O)}
              dirB={sub(B, O)}
              radius={0.28}
              colorKey="paramTertiary"
              isRight
            />
          </>
        )}

        {showAngles && showAuxiliary && (
          <>
            <AngleArc3D
              vertex={O}
              dirA={sub(A, O)}
              dirB={sub(E, O)}
              radius={0.55}
              colorKey="highlight"
            />
            <FormulaLabel3D
              position={{ x: 0.1, y: A.y * 0.42, z: E.z * 0.2 }}
              tex="\theta"
            />
          </>
        )}

        {/* 双法向量 n1 (底面) 与 n2 (截面) 进出方位对照 */}
        {showNormals && (
          <>
            <Vector3DArrow
              from={triPrismData.centroidBase}
              to={{
                x: triPrismData.centroidBase.x + triPrismData.n1.x * 1.3,
                y: triPrismData.centroidBase.y + triPrismData.n1.y * 1.3,
                z: triPrismData.centroidBase.z + triPrismData.n1.z * 1.3,
              }}
              colorKey="secondary"
            />
            <FormulaLabel3D
              position={{
                x: triPrismData.centroidBase.x + triPrismData.n1.x * 1.3,
                y: triPrismData.centroidBase.y + triPrismData.n1.y * 1.3,
                z: triPrismData.centroidBase.z + triPrismData.n1.z * 1.3,
              }}
              tex="\vec{n}_1"
              offset={[0.12, 0.1, 0.1]}
            />
            <Vector3DArrow
              from={triPrismData.centroidSection}
              to={{
                x: triPrismData.centroidSection.x + triPrismData.n2.x * 1.4,
                y: triPrismData.centroidSection.y + triPrismData.n2.y * 1.4,
                z: triPrismData.centroidSection.z + triPrismData.n2.z * 1.4,
              }}
              colorKey="primary"
            />
            <FormulaLabel3D
              position={{
                x: triPrismData.centroidSection.x + triPrismData.n2.x * 1.4,
                y: triPrismData.centroidSection.y + triPrismData.n2.y * 1.4,
                z: triPrismData.centroidSection.z + triPrismData.n2.z * 1.4,
              }}
              tex="\vec{n}_2"
              offset={[0.12, 0.1, 0.1]}
            />
          </>
        )}
      </>
    );
  }

  const { E, A, B, D } = vertices;

  return (
    <>
      {/* 动点 E 在 AA1 上 */}
      {showAxes && showCoordinates ? (
        <FormulaLabel3D
          position={E}
          tex={`E(0,0,${Number(E.z.toFixed(2))})`}
          offset={[-0.25, -0.2, 0.1]}
        />
      ) : (
        <PointLabel3D position={E} text="E" offset={[-0.2, -0.2, 0.1]} />
      )}
      <Point3D
        position={E}
        draggable={interactionMode === "drag"}
        constrain={(raw) => ({
          x: 0,
          y: 0,
          z: Math.min(c, Math.max(0.1 * c, raw.z)),
        })}
        onDrag={onEPointDrag}
        colorKey="highlight"
      />

      {/* 底面 ABD 与 截面 BDE */}
      <Polygon3DFace
        points={[A, B, D]}
        colorKey="secondary"
        opacity={activeStep === 1 ? 0.26 : 0.15}
      />
      <Polygon3DFace
        points={[B, D, E]}
        colorKey="paramTertiary"
        opacity={activeStep === 2 ? 0.42 : 0.28}
      />

      {/* 二面角的棱 BD (几何线段) */}
      <Segment3D
        from={B}
        to={D}
        colorKey="highlight"
        lineWidth={activeStep === 1 ? 4.4 : 3}
      />

      {/* 几何辅助线：垂足 M 及垂线 AM ⊥ BD, EM ⊥ BD（由线面垂直的判定与性质得出） */}
      {showAuxiliary && (
        <>
          <Segment3D
            from={A}
            to={dihedralData.edgeFootM}
            dashed
            colorKey="secondary"
            lineWidth={activeStep === 3 ? 3.5 : 2}
          />
          <Segment3D
            from={E}
            to={dihedralData.edgeFootM}
            dashed
            colorKey="paramTertiary"
            lineWidth={activeStep === 3 ? 3.5 : 2}
          />
          <Point3D position={dihedralData.edgeFootM} colorKey="paramTertiary" />
          <PointLabel3D
            position={dihedralData.edgeFootM}
            text="M"
            offset={[0.1, 0.1, 0.05]}
          />
        </>
      )}

      {/* 垂直直角符号 */}
      {showRightAngles && showAuxiliary && (
        <>
          {/* 垂足 M 处 AM ⊥ BD 直角标记 (落在底面 △ABD 内，朝向点 B) */}
          <AngleArc3D
            vertex={dihedralData.edgeFootM}
            dirA={{
              x: A.x - dihedralData.edgeFootM.x,
              y: A.y - dihedralData.edgeFootM.y,
              z: A.z - dihedralData.edgeFootM.z,
            }}
            dirB={{
              x: B.x - dihedralData.edgeFootM.x,
              y: B.y - dihedralData.edgeFootM.y,
              z: B.z - dihedralData.edgeFootM.z,
            }}
            radius={0.25}
            colorKey="secondary"
            isRight
          />

          {/* 垂足 M 处 EM ⊥ BD 直角标记 (落在截面 △BDE 内，朝向点 D) */}
          <AngleArc3D
            vertex={dihedralData.edgeFootM}
            dirA={{
              x: E.x - dihedralData.edgeFootM.x,
              y: E.y - dihedralData.edgeFootM.y,
              z: E.z - dihedralData.edgeFootM.z,
            }}
            dirB={{
              x: D.x - dihedralData.edgeFootM.x,
              y: D.y - dihedralData.edgeFootM.y,
              z: D.z - dihedralData.edgeFootM.z,
            }}
            radius={0.28}
            colorKey="paramTertiary"
            isRight
          />
        </>
      )}

      {/* 空间特征角弧 θ (二面角平面角) */}
      {showAngles && showAuxiliary && (
        <>
          <AngleArc3D
            vertex={dihedralData.edgeFootM}
            dirA={{
              x: A.x - dihedralData.edgeFootM.x,
              y: A.y - dihedralData.edgeFootM.y,
              z: A.z - dihedralData.edgeFootM.z,
            }}
            dirB={{
              x: E.x - dihedralData.edgeFootM.x,
              y: E.y - dihedralData.edgeFootM.y,
              z: E.z - dihedralData.edgeFootM.z,
            }}
            radius={0.55}
            colorKey="highlight"
          />
          <FormulaLabel3D
            position={{
              x: dihedralData.edgeFootM.x - 0.15,
              y: dihedralData.edgeFootM.y - 0.15,
              z: 0.25,
            }}
            tex="\theta"
          />
        </>
      )}

      {/* 截面法向量 n_2 与底面法向量 n_1 (代数向量箭头) */}
      {showNormals && (
        <>
          {(() => {
            const G2 = dihedralData.centroidSection;
            const n2Target: Vec3 = {
              x: G2.x + dihedralData.n2.x * 1.6,
              y: G2.y + dihedralData.n2.y * 1.6,
              z: G2.z + dihedralData.n2.z * 1.6,
            };
            return (
              <>
                <Vector3DArrow from={G2} to={n2Target} colorKey="primary" />
                <FormulaLabel3D
                  position={n2Target}
                  tex="\vec{n}_2"
                  offset={[0.1, 0.1, 0.1]}
                />
              </>
            );
          })()}

          {(() => {
            const G1 = dihedralData.centroidBase;
            const n1Height = Math.min(1.6, Math.max(0.8, c * 0.75));
            const n1Target: Vec3 = { x: G1.x, y: G1.y, z: G1.z + n1Height };
            return (
              <>
                <Vector3DArrow from={G1} to={n1Target} colorKey="secondary" />
                <FormulaLabel3D
                  position={n1Target}
                  tex="\vec{n}_1"
                  offset={[0.1, 0.1, 0.1]}
                />
              </>
            );
          })()}
        </>
      )}
    </>
  );
}
