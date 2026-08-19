import { useMemo, useState } from "react";
import {
  SectionPlane3D,
  CameraRig,
  Scene3DGrid,
  CompoundLabel3D,
  ThreeViewsPanel,
  Legend3D,
  Point3D,
  ModeSwitchOverlay3D,
} from "@/components/Math3D";
import type { InteractionMode3D } from "@/components/Math3D";
import {
  buildCuboidPolyhedron,
  buildRegularPyramidPolyhedron,
  buildRegularPrismPolyhedron,
  buildTetrahedronPolyhedron,
  buildFrustumPolyhedron,
  intersectConvexPolyhedronPlane,
  type Polyhedron,
} from "@/math3d/sectionIntersection";
import { computeSectionProjectionDetails } from "@/math3d/sectionArea";
import { buildPolyhedronConstructionSteps } from "@/math3d/sectionConstruction";
import { planeFromPoints } from "@/math3d/plane";
import type { Vec3 } from "@/math3d/vector3";
import { projectPointOnSegment } from "@/math3d/vector3";
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
  TipCard,
  KatexFormula,
  type ParamConfig,
} from "@/components/UI";
import { use3DViewport, type CameraPreset } from "@/hooks/use3DViewport";
import { buildMathQuantities } from "@/data/mathQuantities";
import { sectionMeta } from "@/data/registries/solidGeometry";
import { buildSolidViews } from "@/features/solidGeometry/threeViews/buildSolidViews";
import { MATH_COLORS } from "@/theme";
import * as THREE from "three";
import { Line } from "@react-three/drei";
import { mathToThree } from "@/math3d/coordinateConvention";
import { getPolyhedronEdgeEndpoints } from "@/math3d/sectionConstruction";

type SectionMode = "continuous" | "construction" | "extrema";
type SolidKind = "cuboid" | "pyramid" | "prism" | "tetrahedron" | "frustum";
type ViewMode = "3d" | "views";

/**
 * 通用多面体 3D 实体与边线渲染组件
 * 直接消费 Polyhedron 拓扑结构，确保 3D 视觉与数学算法绝对一致
 */
function PolyhedronSolid({
  polyhedron,
  colorKey = "primary",
  opacity = 0.15,
}: {
  polyhedron: Polyhedron;
  colorKey?: keyof typeof MATH_COLORS;
  opacity?: number;
}) {
  const geometry = useMemo(() => {
    const positions: number[] = [];
    polyhedron.faces.forEach((face) => {
      if (face.length < 3) return;
      const v0 = polyhedron.vertices[face[0]];
      for (let i = 1; i < face.length - 1; i++) {
        const v1 = polyhedron.vertices[face[i]];
        const v2 = polyhedron.vertices[face[i + 1]];
        const p0 = mathToThree(v0);
        const p1 = mathToThree(v1);
        const p2 = mathToThree(v2);
        positions.push(...p0, ...p1, ...p2);
      }
    });
    const geo = new THREE.BufferGeometry();
    geo.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(positions, 3),
    );
    geo.computeVertexNormals();
    return geo;
  }, [polyhedron]);

  return (
    <group>
      <mesh geometry={geometry}>
        <meshStandardMaterial
          color={MATH_COLORS[colorKey]}
          transparent
          opacity={opacity}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
      {polyhedron.edges.map((e, idx) => {
        const p1 = mathToThree(polyhedron.vertices[e.a]);
        const p2 = mathToThree(polyhedron.vertices[e.b]);
        return (
          <Line
            key={`poly-edge-${idx}`}
            points={[new THREE.Vector3(...p1), new THREE.Vector3(...p2)]}
            color={MATH_COLORS.line}
            lineWidth={1.2}
          />
        );
      })}
    </group>
  );
}

/**
 * 侧棱动点位置解算纯函数 (严格基于 Polyhedron 真实侧棱端点)
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
  const { baseVertices, topVertices } = getPolyhedronEdgeEndpoints(
    kind,
    width,
    depth,
    height,
  );
  const i = edgeIdx % baseVertices.length;
  const A = baseVertices[i];
  const B = topVertices[i];
  return {
    x: (1 - clampT) * A.x + clampT * B.x,
    y: (1 - clampT) * A.y + clampT * B.y,
    z: (1 - clampT) * A.z + clampT * B.z,
  };
}

export default function SectionCuboidDemo() {
  const [mode, setMode] = useState<SectionMode>("continuous");
  const [solidKind, setSolidKind] = useState<SolidKind>("cuboid");
  const [viewMode, setViewMode] = useState<ViewMode>("3d");

  // 1. 连续切面参数
  const [cutHeight, setCutHeight] = useState(2);
  const [tiltDeg, setTiltDeg] = useState(0);
  const [azimuthDeg, setAzimuthDeg] = useState(0);

  // 2. 三点交轨推演参数与步骤
  const [posP, setPosP] = useState(0.35);
  const [posQ, setPosQ] = useState(0.7);
  const [posR, setPosR] = useState(0.45);
  const [step, setStep] = useState(1);

  // 3. 动点极值探究参数
  const [tParam, setTParam] = useState(0.5);

  // 3D 交互防冲突模式（视角漫游 vs 动点交互）
  const [interactionMode, setInteractionMode] =
    useState<InteractionMode3D>("orbit");

  const { preset, cameraPosition, setCameraPreset, controlsRef } =
    use3DViewport("iso");

  // 多面体几何尺寸
  const width = 3;
  const depth = 3;
  const height = 3.5;

  // 构造当前多面体 Polyhedron 数据结构
  const currentPolyhedron = useMemo(() => {
    if (solidKind === "pyramid") {
      return buildRegularPyramidPolyhedron(4, 2.2, height);
    }
    if (solidKind === "tetrahedron") {
      return buildTetrahedronPolyhedron(2.2, height);
    }
    if (solidKind === "prism") {
      return buildRegularPrismPolyhedron(3, 2.0, height);
    }
    if (solidKind === "frustum") {
      return buildFrustumPolyhedron(4, 2.2, 1.2, height);
    }
    return buildCuboidPolyhedron(width, depth, height);
  }, [solidKind, width, depth, height]);

  // 三点控制点坐标
  const pointPPos = useMemo<Vec3>(
    () =>
      getEdgePoint(
        solidKind,
        0,
        mode === "extrema" ? tParam : posP,
        width,
        depth,
        height,
      ),
    [solidKind, mode, tParam, posP, width, depth, height],
  );

  const pointQPos = useMemo<Vec3>(
    () => getEdgePoint(solidKind, 1, posQ, width, depth, height),
    [solidKind, posQ, width, depth, height],
  );

  const pointRPos = useMemo<Vec3>(
    () => getEdgePoint(solidKind, 2, posR, width, depth, height),
    [solidKind, posR, width, depth, height],
  );

  // 作图推演步骤数据 (仅在 construction 模式下，针对所有几何体模型动态求解)
  const constructionData = useMemo(() => {
    return buildPolyhedronConstructionSteps(
      solidKind,
      width,
      depth,
      height,
      posP,
      posQ,
      posR,
      step,
    );
  }, [solidKind, width, depth, height, posP, posQ, posR, step]);

  // 计算切割平面 (Plane)
  const plane = useMemo((): Plane => {
    if (mode === "construction" || mode === "extrema") {
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

  // 构造多面体几何基准顶点标准标注 (A, B, C, D, S, A1, B1...)
  const polyhedronVertexLabels = useMemo(() => {
    const { baseVertices, topVertices } = getPolyhedronEdgeEndpoints(
      solidKind,
      width,
      depth,
      height,
    );
    const labels: {
      position: Vec3;
      base: string;
      subscript?: string;
      offset: [number, number, number];
    }[] = [];

    if (solidKind === "pyramid" || solidKind === "tetrahedron") {
      const baseNames = ["A", "B", "C", "D"];
      baseVertices.forEach((v, i) => {
        const signX = v.x >= 0 ? 0.2 : -0.2;
        const signY = v.y >= 0 ? 0.2 : -0.2;
        labels.push({
          position: v,
          base: baseNames[i] ?? `A_${i}`,
          offset: [signX, signY, -0.15],
        });
      });
      labels.push({
        position: topVertices[0],
        base: "S",
        offset: [0, 0, 0.22],
      });
    } else if (solidKind === "prism") {
      const baseNames = ["A", "B", "C"];
      baseVertices.forEach((v, i) => {
        const signX = v.x >= 0 ? 0.2 : -0.2;
        const signY = v.y >= 0 ? 0.2 : -0.2;
        labels.push({
          position: v,
          base: baseNames[i],
          offset: [signX, signY, -0.15],
        });
        labels.push({
          position: topVertices[i],
          base: baseNames[i],
          subscript: "1",
          offset: [signX, signY, 0.15],
        });
      });
    } else {
      // cuboid & frustum: 底面 A, B, C, D 与顶面 A1, B1, C1, D1
      const baseNames = ["A", "B", "C", "D"];
      baseVertices.forEach((v, i) => {
        const signX = v.x > width / 2 ? 0.2 : -0.2;
        const signY = v.y > depth / 2 ? 0.2 : -0.2;
        labels.push({
          position: v,
          base: baseNames[i],
          offset: [signX, signY, -0.15],
        });
        labels.push({
          position: topVertices[i],
          base: baseNames[i],
          subscript: "1",
          offset: [signX, signY, 0.15],
        });
      });
    }
    return labels;
  }, [solidKind, width, depth, height]);

  // 动点极值探究：采样 S(t) 在 t in [0.05, 0.95] 范围内的最值
  const extremaAnalysis = useMemo(() => {
    if (mode !== "extrema") return { minArea: 0, maxArea: 0 };
    let minA = Infinity;
    let maxA = -Infinity;
    for (let t = 0.05; t <= 0.95; t += 0.05) {
      const pP = getEdgePoint(solidKind, 0, t, width, depth, height);
      const pl = planeFromPoints(pP, pointQPos, pointRPos);
      const pts = intersectConvexPolyhedronPlane(currentPolyhedron, pl);
      const d = computeSectionProjectionDetails(pts, pl.normal);
      if (d.area3D > 0) {
        minA = Math.min(minA, d.area3D);
        maxA = Math.max(maxA, d.area3D);
      }
    }
    return {
      minArea: Number.isFinite(minA) ? minA : 0,
      maxArea: Number.isFinite(maxA) ? maxA : 0,
    };
  }, [
    mode,
    solidKind,
    width,
    depth,
    height,
    pointQPos,
    pointRPos,
    currentPolyhedron,
  ]);

  // 组装 MathPanel 右屏看板数据
  const mathData = useMemo(() => {
    const paramsMap = {
      cutHeight,
      tiltDeg,
      azimuthDeg,
      posP,
      posQ,
      posR,
      step,
      tParam,
    };

    const solidNames: Record<SolidKind, string> = {
      cuboid: "长方体 / 正方体",
      pyramid: "正四棱锥",
      tetrahedron: "正四面体",
      prism: "正三棱柱",
      frustum: "正四棱台",
    };

    const normalStr = `(${plane.normal.x.toFixed(2)}, ${plane.normal.y.toFixed(2)}, ${plane.normal.z.toFixed(2)})`;

    return buildMathQuantities("anim-solid-section", paramsMap, {
      mode,
      solidKind,
      solidName: solidNames[solidKind],
      vertexCount: sectionPoints.length,
      area3D: projDetails.area3D,
      areaProj: projDetails.areaProj,
      cosTheta: projDetails.cosTheta,
      thetaDeg: projDetails.thetaDeg,
      shapeName: projDetails.shapeName,
      perimeter: projDetails.perimeter,
      normalStr,
      rationale:
        mode === "construction" ? constructionData.rationale : undefined,
      stepTitle: mode === "construction" ? constructionData.title : undefined,
      minArea: extremaAnalysis.minArea,
      maxArea: extremaAnalysis.maxArea,
    });
  }, [
    mode,
    solidKind,
    cutHeight,
    tiltDeg,
    azimuthDeg,
    posP,
    posQ,
    posR,
    step,
    tParam,
    plane,
    sectionPoints,
    projDetails,
    constructionData,
    extremaAnalysis,
  ]);

  // 组装左屏参数配置（仅保留纯连续数值参数，步骤控制独立为推演组件）
  const paramConfigs = useMemo<ParamConfig[]>(() => {
    let currentKeys: string[] = [];
    if (mode === "continuous") {
      currentKeys = ["cutHeight", "tiltDeg", "azimuthDeg"];
    } else if (mode === "construction") {
      currentKeys = ["posP", "posQ", "posR"];
    } else if (mode === "extrema") {
      currentKeys = ["tParam"];
    }

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
        else if (meta.key === "tParam") val = tParam;

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
          importance: meta.importance,
          marks: meta.marks,
        };
      });
  }, [mode, cutHeight, tiltDeg, azimuthDeg, posP, posQ, posR, tParam]);

  const handleParamChange = (key: string, value: number) => {
    if (key === "cutHeight") setCutHeight(value);
    else if (key === "tiltDeg") setTiltDeg(value);
    else if (key === "azimuthDeg") setAzimuthDeg(value);
    else if (key === "posP") setPosP(value);
    else if (key === "posQ") setPosQ(value);
    else if (key === "posR") setPosR(value);
    else if (key === "step") setStep(value);
    else if (key === "tParam") setTParam(value);
  };

  const handleReset = () => {
    setCutHeight(2);
    setTiltDeg(0);
    setAzimuthDeg(0);
    setPosP(0.35);
    setPosQ(0.7);
    setPosR(0.45);
    setStep(1);
    setTParam(0.5);
  };

  // 生成三视图
  const viewsData = useMemo(() => {
    let solidType: "cuboid" | "pyramid" | "frustum" = "cuboid";
    if (solidKind === "pyramid" || solidKind === "tetrahedron")
      solidType = "pyramid";
    if (solidKind === "frustum") solidType = "frustum";

    return buildSolidViews(solidType, {
      width,
      depth,
      height,
      sides: solidKind === "tetrahedron" ? 3 : 4,
      baseRadius: 2.2,
    });
  }, [solidKind, width, depth, height]);

  return (
    <ThreePanel
      left={
        <LeftPanel>
          {/* 1. 探究模式选择 */}
          <LeftPanelSection title="探究模式">
            <SelectGrid
              items={[
                {
                  key: "continuous",
                  label: "连续切面",
                  formula: "S = \\frac{S'}{\\cos\\theta}",
                },
                {
                  key: "construction",
                  label: "作图推演",
                  formula: "P, Q, R \\text{ 交轨}",
                },
                {
                  key: "extrema",
                  label: "动点极值探究",
                  formula: "S(t) \\to \\max / \\min",
                  fullWidth: true,
                },
              ]}
              value={mode}
              onChange={(m) => setMode(m as SectionMode)}
              columns={2}
            />
          </LeftPanelSection>

          {/* 2. 几何体模型选择 */}
          <LeftPanelSection title="几何体模型">
            <SelectGrid
              items={[
                {
                  key: "cuboid",
                  label: "正方体 / 长方体",
                  fullWidth: true,
                },
                { key: "pyramid", label: "正四棱锥" },
                { key: "tetrahedron", label: "正四面体" },
                { key: "prism", label: "正三棱柱" },
                { key: "frustum", label: "正四棱台" },
              ]}
              value={solidKind}
              onChange={(k) => setSolidKind(k as SolidKind)}
              columns={2}
            />
          </LeftPanelSection>

          {/* 3. 作图推演步骤控制器 (仅在 construction 模式下呈现) */}
          {mode === "construction" && (
            <LeftPanelSection
              title="作图推演步骤"
              subtitle={constructionData.title}
            >
              <SelectGrid
                items={[
                  { key: "1", label: "Step 1", description: "同面连线" },
                  { key: "2", label: "Step 2", description: "延长求交" },
                  { key: "3", label: "Step 3", description: "底面交线" },
                  { key: "4", label: "Step 4", description: "封闭截面" },
                ]}
                value={String(step)}
                onChange={(s) => setStep(Number(s))}
                columns={2}
              />
            </LeftPanelSection>
          )}

          {/* 4. 动态参数调节 */}
          <LeftPanelSection title="参数调节">
            <ParamControl
              params={paramConfigs}
              onParamChange={handleParamChange}
              onReset={handleReset}
            />
          </LeftPanelSection>

          {/* 5. 教学提示 */}
          <LeftPanelSection title="教学提示" compact>
            {mode === "continuous" && (
              <TipCard variant="info">
                <span className="font-bold">面积射影定理</span>：
                <KatexFormula
                  formula="S_{\text{截}} = \frac{S_{\text{射}}}{\cos\theta}"
                  mode="inline"
                />
                。截面面积等于底面投影面积除以法向量与天顶夹角余弦。
              </TipCard>
            )}
            {mode === "construction" && (
              <TipCard variant="warning">
                <span className="font-bold">截面作图通法</span>
                ：同面两点直接连线；异面点延长棱线与切线求交点，利用共面交线封闭多边形。
              </TipCard>
            )}
            {mode === "extrema" && (
              <TipCard variant="success">
                <span className="font-bold">动点极值追踪</span>：动点{" "}
                <KatexFormula formula="P" mode="inline" /> 沿棱滑动（参数{" "}
                <KatexFormula formula="t" mode="inline" />
                ），动态观察截面形状突变与面积极值点。
              </TipCard>
            )}
          </LeftPanelSection>

          {/* 6. 视图与视角 */}
          <LeftPanelSection title="视图与视角">
            <div className="space-y-2">
              <TabSwitcher
                layout="horizontal"
                tabs={[
                  { key: "3d", label: "3D 直观图" },
                  { key: "views", label: "2D 三视图" },
                ]}
                value={viewMode}
                onChange={(v) => setViewMode(v as ViewMode)}
              />
              {viewMode === "3d" && (
                <>
                  {mode !== "continuous" && (
                    <TabSwitcher
                      layout="horizontal"
                      tabs={[
                        { key: "orbit", label: "🔄 视角漫游" },
                        { key: "drag", label: "👆 动点交互" },
                      ]}
                      value={interactionMode}
                      onChange={(m) =>
                        setInteractionMode(m as InteractionMode3D)
                      }
                    />
                  )}
                  <TabSwitcher
                    layout="horizontal"
                    tabs={[
                      { key: "iso", label: "轴测" },
                      { key: "front", label: "主视" },
                      { key: "top", label: "俯视" },
                      { key: "side", label: "左视" },
                    ]}
                    value={preset}
                    onChange={(p) => setCameraPreset(p as CameraPreset)}
                  />
                </>
              )}
            </div>
          </LeftPanelSection>
        </LeftPanel>
      }
      center={
        viewMode === "views" ? (
          <ThreeViewsPanel views={viewsData.views} extent={viewsData.extent} />
        ) : (
          <ThreeDCanvas
            cameraPosition={cameraPosition}
            overlay={
              (mode === "construction" || mode === "extrema") &&
              viewMode === "3d" ? (
                <ModeSwitchOverlay3D
                  mode={interactionMode}
                  onModeChange={setInteractionMode}
                  pointCount={mode === "extrema" ? 1 : 3}
                />
              ) : undefined
            }
            legend={
              <Legend3D
                title="截面图例"
                items={[
                  { colorKey: "primary", swatch: "area", label: "多面体表面" },
                  {
                    colorKey: "accent",
                    swatch: "area",
                    label: "截面多边形 S_截",
                  },
                  {
                    colorKey: "secondary",
                    swatch: "area",
                    label: "底面射影阴影 S_投",
                  },
                  {
                    colorKey: "highlight",
                    swatch: "line",
                    label: "作图截线 / 交轨线",
                  },
                ]}
              />
            }
          >
            <CameraRig
              ref={controlsRef}
              enabled={interactionMode === "orbit" || mode === "continuous"}
            />
            <Scene3DGrid size={5} />

            {/* 3D 几何实体与边线渲染 (严格基于 Polyhedron 拓扑结构，100% 精确吻合) */}
            <PolyhedronSolid polyhedron={currentPolyhedron} opacity={0.15} />

            {/* 3D 截面、底面投影与作图辅助线渲染 */}
            <SectionPlane3D
              sectionPoints={
                mode === "construction"
                  ? step === 4
                    ? sectionPoints
                    : []
                  : sectionPoints
              }
              plane={plane}
              planeExtent={Math.max(width, depth, height) * 0.75}
              showPlaneQuad={mode !== "construction" || step === 4}
              showProjection={mode !== "construction" || step === 4}
              constructionLines={
                mode === "construction"
                  ? constructionData.activeLines.map((l) => ({
                      from: l.from,
                      to: l.to,
                      color:
                        l.colorKey === "warning"
                          ? MATH_COLORS.paramSecondary
                          : l.colorKey === "secondary"
                            ? MATH_COLORS.secondary
                            : MATH_COLORS.highlight,
                      dashed: l.type === "dashed" || l.type === "extension",
                    }))
                  : mode === "extrema"
                    ? [
                        {
                          from: pointPPos,
                          to: pointQPos,
                          color: MATH_COLORS.highlight,
                        },
                        {
                          from: pointQPos,
                          to: pointRPos,
                          color: MATH_COLORS.highlight,
                        },
                        {
                          from: pointRPos,
                          to: pointPPos,
                          color: MATH_COLORS.highlight,
                          dashed: true,
                        },
                      ]
                    : []
              }
            />

            {/* 多面体几何基准顶点标准标注 (A, B, C, D, S, A1, B1...) 与精美实体顶点 */}
            {polyhedronVertexLabels.map((vl, idx) => (
              <group key={`solid-vtx-${idx}`}>
                <Point3D
                  position={vl.position}
                  colorKey="secondary"
                  radius={0.045}
                />
                <CompoundLabel3D
                  position={vl.position}
                  base={vl.base}
                  subscript={vl.subscript}
                  offset={vl.offset}
                  fontSize={0.24}
                />
              </group>
            ))}

            {/* 控制点交互渲染与标签 (P, Q, R，严格使用空间侧棱正交投影 projectPointOnSegment) */}
            {(mode === "construction" || mode === "extrema") &&
              (() => {
                const { baseVertices, topVertices } =
                  getPolyhedronEdgeEndpoints(solidKind, width, depth, height);
                const A0 = baseVertices[0];
                const A1 = topVertices[0];
                const B0 = baseVertices[1];
                const B1 = topVertices[1];
                const C0 = baseVertices[2];
                const C1 = topVertices[2];

                return (
                  <>
                    {/* 点 P (绑定 paramPrimary 鲜红，严格在第 1 条侧棱上滑动) */}
                    <Point3D
                      position={pointPPos}
                      draggable={interactionMode === "drag"}
                      constrain={(raw) =>
                        projectPointOnSegment(raw, A0, A1).point
                      }
                      onDrag={(next) => {
                        const proj = projectPointOnSegment(next, A0, A1);
                        const tVal = Number(proj.t.toFixed(2));
                        if (mode === "extrema") setTParam(tVal);
                        else setPosP(tVal);
                      }}
                      colorKey="paramPrimary"
                    />
                    <CompoundLabel3D
                      position={pointPPos}
                      base="P"
                      colorKey="paramPrimary"
                      offset={[0, 0, 0.25]}
                    />

                    {/* 点 Q (绑定 paramSecondary 暖橙，严格在第 2 条侧棱上滑动) */}
                    <Point3D
                      position={pointQPos}
                      draggable={interactionMode === "drag"}
                      constrain={(raw) =>
                        projectPointOnSegment(raw, B0, B1).point
                      }
                      onDrag={(next) => {
                        const proj = projectPointOnSegment(next, B0, B1);
                        setPosQ(Number(proj.t.toFixed(2)));
                      }}
                      colorKey="paramSecondary"
                    />
                    <CompoundLabel3D
                      position={pointQPos}
                      base="Q"
                      colorKey="paramSecondary"
                      offset={[0, 0, 0.25]}
                    />

                    {/* 点 R (绑定 paramTertiary 翠绿，严格在第 3 条侧棱上滑动) */}
                    <Point3D
                      position={pointRPos}
                      draggable={interactionMode === "drag"}
                      constrain={(raw) =>
                        projectPointOnSegment(raw, C0, C1).point
                      }
                      onDrag={(next) => {
                        const proj = projectPointOnSegment(next, C0, C1);
                        setPosR(Number(proj.t.toFixed(2)));
                      }}
                      colorKey="paramTertiary"
                    />
                    <CompoundLabel3D
                      position={pointRPos}
                      base="R"
                      colorKey="paramTertiary"
                      offset={[0, 0, 0.25]}
                    />
                  </>
                );
              })()}

            {/* construction 模式下的外点与截棱交点标记 (K1, K2, M, N，严格排重与避让) */}
            {mode === "construction" &&
              constructionData.activePoints
                .filter(
                  (pt, idx, self) =>
                    !["P", "Q", "R"].includes(pt.label) &&
                    self.findIndex((p) => p.label === pt.label) === idx,
                )
                .map((pt, idx) => {
                  const isK = pt.label.startsWith("K");
                  const base = isK ? "K" : pt.label;
                  const subscript = isK ? pt.label.slice(1) : undefined;
                  return (
                    <group key={`ext-pt-${idx}`}>
                      <Point3D
                        position={pt.position}
                        colorKey={pt.isExternal ? "secondary" : "paramTertiary"}
                        radius={0.05}
                      />
                      <CompoundLabel3D
                        position={pt.position}
                        base={base}
                        subscript={subscript}
                        colorKey={pt.isExternal ? "secondary" : "paramTertiary"}
                        offset={[0, 0, pt.isExternal ? -0.2 : 0.2]}
                      />
                    </group>
                  );
                })}
          </ThreeDCanvas>
        )
      }
      right={
        <MathPanel
          quantities={mathData.quantities}
          theorems={mathData.theorems}
          gaokaoPoints={mathData.gaokaoPoints}
          warnings={mathData.warnings}
          mnemonic={mathData.mnemonic}
          title="多面体截面数学看板"
        />
      }
    />
  );
}
