import { useMemo, useState } from "react";
import {
  SectionPlane3D,
  CameraRig,
  Scene3DGrid,
  PointLabel3D,
  ThreeViewsPanel,
} from "@/components/Math3D";
import { mathToThree } from "@/math3d/coordinateConvention";
import {
  Cuboid,
  RegularPyramid,
  RegularPrism,
} from "@/components/Math3D/solids";
import {
  buildCuboidPolyhedron,
  buildRegularPyramidPolyhedron,
  buildRegularPrismPolyhedron,
  intersectConvexPolyhedronPlane,
} from "@/math3d/sectionIntersection";
import { computeSectionProjectionDetails } from "@/math3d/sectionArea";
import { planeFromPoints } from "@/math3d/plane";
import type { Vec3 } from "@/math3d/vector3";
import type { Plane } from "@/math3d/plane";
import { ThreeDCanvas } from "@/components/Layout/ThreeDCanvas";
import { ThreePanel } from "@/components/Layout/ThreePanel";
import {
  LeftPanel,
  LeftPanelSection,
  ParamControl,
  MathPanel,
  TabSwitcher,
  SelectGrid,
  type ParamConfig,
} from "@/components/UI";
import { Legend3D } from "@/components/Math3D/Legend3D";
import { use3DViewport } from "@/hooks/use3DViewport";
import { buildMathQuantities } from "@/data/mathQuantities";
import { sectionMeta } from "@/data/registries/solidGeometry";
import { buildSolidViews } from "@/features/solidGeometry/threeViews/buildSolidViews";
import { MATH_COLORS } from "@/theme";

type SectionMode = "continuous" | "threePoints";
type SolidKind = "cuboid" | "pyramid" | "prism";
type ViewMode = "3d" | "views";

/**
 * 侧棱动点精确求值纯函数
 */
function getEdgePoint(
  kind: SolidKind,
  edgeIdx: number,
  t: number,
  width: number,
  depth: number,
  height: number,
): Vec3 {
  const clampT = Math.max(0.05, Math.min(0.95, t));

  if (kind === "pyramid") {
    const r = 2.2;
    const angles = [0, Math.PI / 2, Math.PI];
    const angle = angles[edgeIdx % 3];
    const bx = r * Math.cos(angle);
    const by = r * Math.sin(angle);
    return {
      x: (1 - clampT) * bx,
      y: (1 - clampT) * by,
      z: clampT * height,
    };
  } else if (kind === "prism") {
    const r = 2.0;
    const angles = [0, (2 * Math.PI) / 3, (4 * Math.PI) / 3];
    const angle = angles[edgeIdx % 3];
    return {
      x: r * Math.cos(angle),
      y: r * Math.sin(angle),
      z: clampT * height,
    };
  } else {
    // cuboid: 底面顶点 (width, 0), (width, depth), (0, depth), (0, 0)
    const basePts = [
      { x: width, y: 0 },
      { x: width, y: depth },
      { x: 0, y: depth },
    ];
    const pt = basePts[edgeIdx % 3];
    return {
      x: pt.x,
      y: pt.y,
      z: clampT * height,
    };
  }
}

export default function SectionCuboidDemo() {
  const [mode, setMode] = useState<SectionMode>("continuous");
  const [solidKind, setSolidKind] = useState<SolidKind>("cuboid");
  const [viewMode, setViewMode] = useState<ViewMode>("3d");

  // 1. 连续切面参数
  const [cutHeight, setCutHeight] = useState(2);
  const [tiltDeg, setTiltDeg] = useState(0);
  const [azimuthDeg, setAzimuthDeg] = useState(0);

  // 2. 三点作图模式在三条棱上的拖拽高度比例 [0.05, 0.95]
  const [posP, setPosP] = useState(0.4);
  const [posQ, setPosQ] = useState(0.7);
  const [posR, setPosR] = useState(0.5);

  const { cameraPosition, controlsRef } = use3DViewport("iso");

  // 多面体几何尺寸
  const width = 3;
  const depth = 3;
  const height = 4;

  // 构造当前多面体 Polyhedron 数据结构（与 3D Mesh 完全 100% 对齐）
  const currentPolyhedron = useMemo(() => {
    if (solidKind === "pyramid") {
      return buildRegularPyramidPolyhedron(4, 2.2, height);
    }
    if (solidKind === "prism") {
      return buildRegularPrismPolyhedron(3, 2.0, height);
    }
    return buildCuboidPolyhedron(width, depth, height);
  }, [solidKind, width, depth, height]);

  // 三点作图模式下侧棱上的 3D 控制点
  const pointPPos = useMemo<Vec3>(
    () => getEdgePoint(solidKind, 0, posP, width, depth, height),
    [solidKind, posP, width, depth, height],
  );

  const pointQPos = useMemo<Vec3>(
    () => getEdgePoint(solidKind, 1, posQ, width, depth, height),
    [solidKind, posQ, width, depth, height],
  );

  const pointRPos = useMemo<Vec3>(
    () => getEdgePoint(solidKind, 2, posR, width, depth, height),
    [solidKind, posR, width, depth, height],
  );

  // 计算切割平面 (Plane)
  const plane = useMemo((): Plane => {
    if (mode === "threePoints") {
      return planeFromPoints(pointPPos, pointQPos, pointRPos);
    } else {
      const tilt = (tiltDeg * Math.PI) / 180;
      const azim = (azimuthDeg * Math.PI) / 180;
      const nx = Math.sin(tilt) * Math.cos(azim);
      const ny = Math.sin(tilt) * Math.sin(azim);
      const nz = Math.cos(tilt);

      const px = solidKind === "cuboid" ? width / 2 : 0;
      const py = solidKind === "cuboid" ? depth / 2 : 0;

      return {
        point: { x: px, y: py, z: cutHeight },
        normal: { x: nx, y: ny, z: nz },
      };
    }
  }, [
    mode,
    solidKind,
    width,
    depth,
    pointPPos,
    pointQPos,
    pointRPos,
    cutHeight,
    tiltDeg,
    azimuthDeg,
  ]);

  // 求交点多边形
  const sectionPoints = useMemo(() => {
    return intersectConvexPolyhedronPlane(currentPolyhedron, plane);
  }, [currentPolyhedron, plane]);

  // 射影面积及几何细节计算
  const projDetails = useMemo(() => {
    return computeSectionProjectionDetails(sectionPoints, plane.normal);
  }, [sectionPoints, plane]);

  // 三点作图模式下的辅助线段
  const constructionLines = useMemo(() => {
    if (mode !== "threePoints" || sectionPoints.length < 3) return [];

    return [
      { from: pointPPos, to: pointQPos, color: MATH_COLORS.highlight },
      { from: pointQPos, to: pointRPos, color: MATH_COLORS.highlight },
      {
        from: pointRPos,
        to: pointPPos,
        color: MATH_COLORS.highlight,
        dashed: true,
      },
    ];
  }, [mode, sectionPoints, pointPPos, pointQPos, pointRPos]);

  // 组装 MathPanel 右屏看板数据
  const mathData = useMemo(() => {
    const paramsMap = {
      cutHeight,
      tiltDeg,
      azimuthDeg,
      posP,
      posQ,
      posR,
    };

    const normalStr = `(${plane.normal.x.toFixed(2)}, ${plane.normal.y.toFixed(2)}, ${plane.normal.z.toFixed(2)})`;

    return buildMathQuantities("anim-solid-section", paramsMap, {
      vertexCount: sectionPoints.length,
      area3D: projDetails.area3D,
      areaProj: projDetails.areaProj,
      cosTheta: projDetails.cosTheta,
      thetaDeg: projDetails.thetaDeg,
      normalStr,
    });
  }, [
    cutHeight,
    tiltDeg,
    azimuthDeg,
    posP,
    posQ,
    posR,
    plane,
    sectionPoints,
    projDetails,
  ]);

  // 组装左屏参数配置
  const paramConfigs = useMemo<ParamConfig[]>(() => {
    const currentKeys =
      mode === "continuous"
        ? ["cutHeight", "tiltDeg", "azimuthDeg"]
        : ["posP", "posQ", "posR"];

    return sectionMeta
      .filter((meta) => currentKeys.includes(meta.key))
      .map((meta) => {
        let val = 0;
        if (meta.key === "cutHeight") val = cutHeight;
        else if (meta.key === "tiltDeg") val = tiltDeg;
        else if (meta.key === "azimuthDeg") val = azimuthDeg;
        else if (meta.key === "posP") val = posP;
        else if (meta.key === "posQ") val = posQ;
        else if (meta.key === "posR") val = posR;

        return {
          key: meta.key,
          label: meta.label,
          labelFormula: meta.labelFormula,
          min: meta.min,
          max: meta.max,
          step: meta.step ?? 0.1,
          value: val,
          description: meta.description,
          descriptionFormula: meta.descriptionFormula,
          importance: meta.importance as any,
          marks: meta.marks,
        };
      });
  }, [mode, cutHeight, tiltDeg, azimuthDeg, posP, posQ, posR]);

  const handleParamChange = (key: string, value: number) => {
    if (key === "cutHeight") setCutHeight(value);
    else if (key === "tiltDeg") setTiltDeg(value);
    else if (key === "azimuthDeg") setAzimuthDeg(value);
    else if (key === "posP") setPosP(value);
    else if (key === "posQ") setPosQ(value);
    else if (key === "posR") setPosR(value);
  };

  const handleReset = () => {
    setCutHeight(2);
    setTiltDeg(0);
    setAzimuthDeg(0);
    setPosP(0.4);
    setPosQ(0.7);
    setPosR(0.5);
  };

  // 生成三视图
  const viewsData = useMemo(() => {
    let solidType: "cuboid" | "pyramid" | "prism" = "cuboid";
    if (solidKind === "pyramid") solidType = "pyramid";

    return buildSolidViews(solidType as any, {
      width,
      depth,
      height,
      sides: 4,
      baseRadius: 2,
    });
  }, [solidKind, width, depth, height]);

  return (
    <ThreePanel
      left={
        <LeftPanel>
          {/* 模式选择 */}
          <LeftPanelSection title="教学模式" subtitle="选择截面生成与作图机制">
            <TabSwitcher
              layout="horizontal"
              tabs={[
                { key: "continuous", label: "连续切面" },
                { key: "threePoints", label: "三点作图" },
              ]}
              value={mode}
              onChange={(m) => setMode(m as SectionMode)}
            />
          </LeftPanelSection>

          {/* 立体模型选择 */}
          <LeftPanelSection title="几何体选择" subtitle="切换高考经典多面体">
            <SelectGrid
              items={[
                { key: "cuboid", label: "正方体/长方体" },
                { key: "pyramid", label: "正四棱锥" },
                { key: "prism", label: "正三棱柱" },
              ]}
              value={solidKind}
              onChange={(k) => setSolidKind(k as SolidKind)}
              columns={2}
            />
          </LeftPanelSection>

          {/* 视图模式选择 */}
          <LeftPanelSection title="显示模式">
            <TabSwitcher
              layout="horizontal"
              tabs={[
                { key: "3d", label: "3D 直观图" },
                { key: "views", label: "2D 三视图" },
              ]}
              value={viewMode}
              onChange={(v) => setViewMode(v as ViewMode)}
            />
          </LeftPanelSection>

          {/* 动态参数调节 */}
          <LeftPanelSection
            title="参数调节"
            subtitle={
              mode === "continuous"
                ? "滑动调节切割平面的位置与倾角"
                : "拖动棱上控制点或滑动比例"
            }
          >
            <ParamControl
              params={paramConfigs}
              onParamChange={handleParamChange}
              onReset={handleReset}
            />
          </LeftPanelSection>
        </LeftPanel>
      }
      center={
        viewMode === "views" ? (
          <ThreeViewsPanel views={viewsData.views} extent={viewsData.extent} />
        ) : (
          <ThreeDCanvas
            cameraPosition={cameraPosition}
            legend={
              <Legend3D
                title="图例"
                items={[
                  { colorKey: "primary", swatch: "area", label: "多面体" },
                  { colorKey: "accent", swatch: "area", label: "截面多边形" },
                  { colorKey: "highlight", swatch: "line", label: "作图连线" },
                ]}
              />
            }
          >
            <CameraRig ref={controlsRef} />
            <Scene3DGrid size={5} />

            {/* 3D 实体渲染 */}
            {solidKind === "cuboid" && (
              <Cuboid a={width} b={depth} c={height} opacity={0.15} />
            )}
            {solidKind === "pyramid" && (
              <RegularPyramid
                sides={4}
                baseRadius={2.2}
                height={height}
                opacity={0.15}
              />
            )}
            {solidKind === "prism" && (
              <RegularPrism
                sides={3}
                baseRadius={2.0}
                height={height}
                opacity={0.15}
              />
            )}

            {/* 3D 截面与作图线渲染 */}
            <SectionPlane3D
              sectionPoints={sectionPoints}
              plane={plane}
              planeExtent={Math.max(width, depth, height) * 0.75}
              constructionLines={constructionLines}
            />

            {/* 三点作图模式下的静态标注点与标签 (通过左屏 ParamControl 精确调控) */}
            {mode === "threePoints" && (
              <>
                <mesh position={mathToThree(pointPPos)}>
                  <sphereGeometry args={[0.08, 16, 16]} />
                  <meshBasicMaterial color="#DC2626" />
                </mesh>
                <PointLabel3D
                  position={pointPPos}
                  text="P"
                  offset={[0, 0, 0.2]}
                />

                <mesh position={mathToThree(pointQPos)}>
                  <sphereGeometry args={[0.08, 16, 16]} />
                  <meshBasicMaterial color="#DC2626" />
                </mesh>
                <PointLabel3D
                  position={pointQPos}
                  text="Q"
                  offset={[0, 0, 0.2]}
                />

                <mesh position={mathToThree(pointRPos)}>
                  <sphereGeometry args={[0.08, 16, 16]} />
                  <meshBasicMaterial color="#DC2626" />
                </mesh>
                <PointLabel3D
                  position={pointRPos}
                  text="R"
                  offset={[0, 0, 0.2]}
                />
              </>
            )}
          </ThreeDCanvas>
        )
      }
      right={
        <MathPanel
          quantities={mathData.quantities}
          theorems={mathData.theorems}
          gaokaoPoints={mathData.gaokaoPoints}
          warnings={mathData.warnings}
          title="截面几何看板"
        />
      }
    />
  );
}
