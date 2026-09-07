/**
 * 模式：异面直线公垂线与距离动态极值 子场景
 * 特性：
 * 1. 异面直线 l1 与 l2 双实线导轨
 * 2. 动点 P(λ) 与 Q(μ) 3D 正交平滑拖拽
 * 3. 动线段 PQ (纯几何线段，公垂极值变色高亮)
 * 4. 极值命中触发两端点双垂直直角方框 (AngleArc3D isRight)
 * 5. 辅助平行平面 ACD1 (线面平行转化法，半透明填充与公垂向量)
 */
import {
  Segment3D,
  Point3D,
  PointLabel3D,
  CompoundLabel3D,
  FormulaLabel3D,
  AngleArc3D,
  Polygon3DFace,
  Vector3DArrow,
} from "@/components/Math3D";
import type { InteractionMode3D } from "@/components/Math3D";
import type { Vec3 } from "@/math3d/vector3";
import type { SkewLinesDistanceResult } from "@/math3d/spatialDistance";

interface SkewPerpendicularModeSceneProps {
  a: number;
  b: number;
  c: number;
  lambda?: number;
  mu?: number;
  skewData: SkewLinesDistanceResult;
  isSideEdgeModel?: boolean;
  showParallelPlane: boolean;
  showCommonPerpAlways: boolean;
  showNormals: boolean;
  showRightAngles: boolean;
  showCoordinates: boolean;
  interactionMode: InteractionMode3D;
  onPDrag: (lambda: number) => void;
  onQDrag: (mu: number) => void;
}

export default function SkewPerpendicularModeScene({
  a,
  b,
  c,
  skewData,
  isSideEdgeModel = false,
  showParallelPlane,
  showCommonPerpAlways,
  showNormals,
  showRightAngles,
  showCoordinates,
  interactionMode,
  onPDrag,
  onQDrag,
}: SkewPerpendicularModeSceneProps) {
  const {
    P,
    Q,
    footH1,
    footH2,
    isAtPerpendicular,
    parallelPlaneVertices,
    nUnit,
  } = skewData;

  const showPerpEffects = isAtPerpendicular || showCommonPerpAlways;

  // 直线 1 端点
  const line1Start: Vec3 = isSideEdgeModel
    ? { x: a, y: 0, z: 0 } // B
    : { x: 0, y: 0, z: c }; // A1
  const line1End: Vec3 = isSideEdgeModel
    ? { x: a, y: 0, z: c } // B1
    : { x: a, y: 0, z: 0 }; // B

  // 直线 2 端点 (底面对角线 AC)
  const line2Start: Vec3 = { x: 0, y: 0, z: 0 }; // A
  const line2End: Vec3 = { x: a, y: b, z: 0 }; // C

  // 拖拽投影反解参数
  const uLenSq = isSideEdgeModel ? c * c : a * a + c * c;
  const vLenSq = a * a + b * b;

  // 平行面中心点（用于规范布置法向量）
  const planeCenter: Vec3 = {
    x:
      (parallelPlaneVertices[0].x +
        parallelPlaneVertices[1].x +
        parallelPlaneVertices[2].x) /
      3,
    y:
      (parallelPlaneVertices[0].y +
        parallelPlaneVertices[1].y +
        parallelPlaneVertices[2].y) /
      3,
    z:
      (parallelPlaneVertices[0].z +
        parallelPlaneVertices[1].z +
        parallelPlaneVertices[2].z) /
      3,
  };

  const normalOrigin = showParallelPlane ? planeCenter : footH2;
  const normalLen = 1.0;
  const normalTarget: Vec3 = {
    x: normalOrigin.x + nUnit.x * normalLen,
    y: normalOrigin.y + nUnit.y * normalLen,
    z: normalOrigin.z + nUnit.z * normalLen,
  };

  return (
    <>
      {/* 异面直线 1 轨道 */}
      <Segment3D
        from={line1Start}
        to={line1End}
        colorKey="paramPrimary"
        lineWidth={3}
      />

      {/* 异面直线 2 轨道 */}
      <Segment3D
        from={line2Start}
        to={line2End}
        colorKey="paramSecondary"
        lineWidth={3}
      />

      {/* 动点 P：在直线 1 上正交拖拽 */}
      <Point3D
        position={P}
        draggable={interactionMode === "drag"}
        constrain={(raw) => {
          if (isSideEdgeModel) {
            const t = Math.min(1, Math.max(0, raw.z / c));
            return { x: a, y: 0, z: t * c };
          }
          // A1 -> B 向量 u = (a, 0, -c)
          const dotVal = raw.x * a + (c - raw.z) * c;
          const t = Math.min(1, Math.max(0, dotVal / uLenSq));
          return { x: t * a, y: 0, z: (1 - t) * c };
        }}
        onDrag={(next) => {
          if (isSideEdgeModel) {
            onPDrag(Math.min(1, Math.max(0, next.z / c)));
          } else {
            const dotVal = next.x * a + (c - next.z) * c;
            onPDrag(Math.min(1, Math.max(0, dotVal / uLenSq)));
          }
        }}
        colorKey="paramPrimary"
      />
      {showCoordinates ? (
        <FormulaLabel3D
          position={P}
          tex={`P(${P.x.toFixed(1)}, ${P.y.toFixed(1)}, ${P.z.toFixed(1)})`}
          offset={[0.15, -0.15, 0.15]}
        />
      ) : (
        <PointLabel3D position={P} text="P" offset={[0.15, -0.15, 0.15]} />
      )}

      {/* 动点 Q：在直线 2 上正交拖拽 */}
      <Point3D
        position={Q}
        draggable={interactionMode === "drag"}
        constrain={(raw) => {
          const dotVal = raw.x * a + raw.y * b;
          const t = Math.min(1, Math.max(0, dotVal / vLenSq));
          return { x: t * a, y: t * b, z: 0 };
        }}
        onDrag={(next) => {
          const dotVal = next.x * a + next.y * b;
          onQDrag(Math.min(1, Math.max(0, dotVal / vLenSq)));
        }}
        colorKey="paramSecondary"
      />
      {showCoordinates ? (
        <FormulaLabel3D
          position={Q}
          tex={`Q(${Q.x.toFixed(1)}, ${Q.y.toFixed(1)}, 0)`}
          offset={[0.15, 0.15, -0.12]}
        />
      ) : (
        <PointLabel3D position={Q} text="Q" offset={[0.15, 0.15, -0.12]} />
      )}

      {/* 动线段 PQ (几何连线) */}
      <Segment3D
        from={P}
        to={Q}
        colorKey={isAtPerpendicular ? "paramTertiary" : "highlight"}
        lineWidth={isAtPerpendicular ? 3.5 : 2.5}
      />

      {/* 始终展示公垂线段参考 (若开启开关或命中极值) */}
      {showPerpEffects && (
        <>
          {/* 公垂足固定点与矢量标签 (CompoundLabel3D 杜绝 Unicode 下标) */}
          <Point3D position={footH1} colorKey="paramTertiary" />
          <CompoundLabel3D
            position={footH1}
            base="H"
            subscript="1"
            offset={[-0.15, -0.15, 0.1]}
          />
          <Point3D position={footH2} colorKey="paramTertiary" />
          <CompoundLabel3D
            position={footH2}
            base="H"
            subscript="2"
            offset={[0.15, 0.15, -0.1]}
          />

          {/* 公垂线段 H1H2 (纯几何线段无箭头) */}
          <Segment3D
            from={footH1}
            to={footH2}
            colorKey="paramTertiary"
            lineWidth={3.5}
          />

          {/* 双垂直直角方框 */}
          {showRightAngles && (
            <>
              {/* 垂足 H1 直角方框 (垂直于直线 1 与 H1H2) */}
              <AngleArc3D
                vertex={footH1}
                dirA={
                  isSideEdgeModel ? { x: 0, y: 0, z: 1 } : { x: a, y: 0, z: -c }
                }
                dirB={{
                  x: footH2.x - footH1.x,
                  y: footH2.y - footH1.y,
                  z: footH2.z - footH1.z,
                }}
                radius={0.32}
                isRight
                colorKey="paramTertiary"
              />

              {/* 垂足 H2 直角方框 (垂直于直线 2 与 H2H1) */}
              <AngleArc3D
                vertex={footH2}
                dirA={{ x: a, y: b, z: 0 }}
                dirB={{
                  x: footH1.x - footH2.x,
                  y: footH1.y - footH2.y,
                  z: footH1.z - footH2.z,
                }}
                radius={0.32}
                isRight
                colorKey="paramTertiary"
              />
            </>
          )}
        </>
      )}

      {/* 平行平面 (化归线面平行法辅助面：面对角线为 ACD1，侧棱为 ACC1) */}
      {showParallelPlane && (
        <>
          <Polygon3DFace
            points={parallelPlaneVertices}
            colorKey="accent"
            opacity={0.22}
          />
          {/* 平行面边界棱线 */}
          <Segment3D
            from={parallelPlaneVertices[0]}
            to={parallelPlaneVertices[1]}
            dashed
            colorKey="accent"
            lineWidth={1.8}
          />
          <Segment3D
            from={parallelPlaneVertices[1]}
            to={parallelPlaneVertices[2]}
            dashed
            colorKey="accent"
            lineWidth={1.8}
          />
          <Segment3D
            from={parallelPlaneVertices[2]}
            to={parallelPlaneVertices[0]}
            dashed
            colorKey="accent"
            lineWidth={1.8}
          />
          <CompoundLabel3D
            position={parallelPlaneVertices[2]}
            base={isSideEdgeModel ? "C" : "D"}
            subscript="1"
            offset={[-0.15, 0.15, 0.15]}
          />
        </>
      )}

      {/* 公垂/平面法向量箭头 (独立呈现，不与纯几何公垂线段重叠) */}
      {showNormals && (
        <>
          <Vector3DArrow
            from={normalOrigin}
            to={normalTarget}
            colorKey="paramTertiary"
          />
          <FormulaLabel3D
            position={{
              x: (normalOrigin.x + normalTarget.x) / 2,
              y: (normalOrigin.y + normalTarget.y) / 2,
              z: (normalOrigin.z + normalTarget.z) / 2,
            }}
            tex="\vec{n}"
            offset={[0.15, 0.15, 0.1]}
          />
        </>
      )}
    </>
  );
}
