import { useMemo, useState } from "react";
import {
  SectionPlane3D,
  CameraRig,
  CompoundLabel3D,
  FormulaLabel3D,
  ThreeViewsPanel,
  Legend3D,
  Point3D,
  Segment3D,
  ModeSwitchOverlay3D,
  CameraFit,
} from "@/components/Math3D";
import { getSectionCuboidBounds } from "@/math3d/legacy3dBounds";
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
import {
  buildPolyhedronConstructionSteps,
  getControlEdgeEndpoints,
  getPolyhedronEdgeEndpoints,
  type SectionPresetKind,
} from "@/math3d/sectionConstruction";
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
  ParamPlayBar,
  StepNavigator,
  MathPanel,
  TabSwitcher,
  SelectGrid,
  TipCard,
  type ParamConfig,
  type AnswerStepItem,
} from "@/components/UI";
import { use3DViewport, type CameraPreset } from "@/hooks/use3DViewport";
import { useParamPlay } from "@/hooks/useParamPlay";
import { AnswerStepOverlay3D } from "@/components/Math3D/AnswerStepOverlay3D";
import { ParamCurveOverlay2D } from "@/components/Math3D/ParamCurveOverlay2D";
import { sampleSectionAreaCurve } from "@/math3d/overlaySamplers";
import { buildMathQuantities } from "@/data/mathQuantities";
import { sectionMeta } from "@/data/registries/solidGeometry";
import { buildSolidViews } from "@/features/solidGeometry/threeViews/buildSolidViews";
import { MATH_COLORS } from "@/theme";
import * as THREE from "three";
import { mathToThree } from "@/math3d/coordinateConvention";

type SectionMode = "construction" | "extrema";
type SolidKind = "cuboid" | "pyramid" | "prism" | "tetrahedron" | "frustum";
type ViewMode = "3d" | "views";
type PresetScenario = SectionPresetKind;

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
      {polyhedron.edges.map((e, idx) => (
        <Segment3D
          key={`poly-edge-${idx}`}
          from={polyhedron.vertices[e.a]}
          to={polyhedron.vertices[e.b]}
          colorKey="line"
          lineWidth={1.2}
        />
      ))}
    </group>
  );
}

/**
 * 棱上动点位置解算纯函数（严格基于 Polyhedron 与当前情境选棱端点）
 */
function getPointOnControlEdge(start: Vec3, end: Vec3, t: number): Vec3 {
  const clampT = Math.max(0.05, Math.min(0.95, t));
  return {
    x: (1 - clampT) * start.x + clampT * end.x,
    y: (1 - clampT) * start.y + clampT * end.y,
    z: (1 - clampT) * start.z + clampT * end.z,
  };
}

export default function SectionCuboidDemo() {
  const [mode, setMode] = useState<SectionMode>("construction");
  const [scenario, setScenario] = useState<PresetScenario>("free");
  const [solidKind, setSolidKind] = useState<SolidKind>("cuboid");
  const [viewMode, setViewMode] = useState<ViewMode>("3d");

  // 1. 三点交轨与作图参数 (P, Q, R 分别位于前三条侧棱)
  const [posP, setPosP] = useState(0.35);
  const [posQ, setPosQ] = useState(0.7);
  const [posR, setPosR] = useState(0.45);
  const [step, setStep] = useState(1);

  // 2. 动点极值探究参数 (P(t) 沿第一侧棱滑动)
  const [tParam, setTParam] = useState(0.5);

  // 高考典型情景切换处理（同步设置预设选棱与典型比例，保证几何形态严格吻合）
  const handleScenarioChange = (sc: PresetScenario) => {
    setScenario(sc);
    if (sc === "cubeHexagon") {
      setSolidKind("cuboid");
      setPosP(0.5);
      setPosQ(0.5);
      setPosR(0.5);
      setStep(4);
    } else if (sc === "cubeTrapezoid") {
      setSolidKind("cuboid");
      setPosP(0.5);
      setPosQ(0.5);
      setPosR(0.8);
      setStep(3);
    } else if (sc === "cubeTriangle") {
      setSolidKind("cuboid");
      setPosP(0.6);
      setPosQ(0.6);
      setPosR(0.6);
      setStep(2);
    } else if (sc === "tetraSection") {
      setSolidKind("tetrahedron");
      setPosP(0.5);
      setPosQ(0.5);
      setPosR(0.5);
      setStep(2);
    } else {
      setSolidKind("cuboid");
      setPosP(0.35);
      setPosQ(0.7);
      setPosR(0.45);
      setStep(1);
    }
  };

  // 3D 交互防冲突模式（视角漫游 vs 动点交互）
  const [interactionMode, setInteractionMode] =
    useState<InteractionMode3D>("orbit");

  const { preset, viewToken, cameraPosition, setCameraPreset, controlsRef } =
    use3DViewport("iso");

  // 多面体几何尺寸（正方体情景严格取 3×3×3）
  const isCubeScenario =
    scenario === "cubeHexagon" ||
    scenario === "cubeTrapezoid" ||
    scenario === "cubeTriangle";
  const width = 3;
  const depth = 3;
  const height = isCubeScenario ? 3 : 3.5;
  const currentHeight = solidKind === "tetrahedron" ? 2.2 * Math.SQRT2 : height;

  const sceneBounds = useMemo(
    () => getSectionCuboidBounds({ a: width, b: depth, c: currentHeight }),
    [width, depth, currentHeight],
  );

  // 构造当前多面体 Polyhedron 数据结构
  const currentPolyhedron = useMemo(() => {
    if (solidKind === "pyramid") {
      return buildRegularPyramidPolyhedron(4, 2.2, currentHeight);
    }
    if (solidKind === "tetrahedron") {
      return buildTetrahedronPolyhedron(2.2, currentHeight);
    }
    if (solidKind === "prism") {
      return buildRegularPrismPolyhedron(3, 2.0, currentHeight);
    }
    if (solidKind === "frustum") {
      return buildFrustumPolyhedron(4, 2.2, 1.2, currentHeight);
    }
    return buildCuboidPolyhedron(width, depth, currentHeight);
  }, [solidKind, width, depth, currentHeight]);

  // 当前情景 P, Q, R 控制棱（SSOT）
  const controlEdges = useMemo(
    () =>
      getControlEdgeEndpoints(solidKind, width, depth, currentHeight, scenario),
    [solidKind, width, depth, currentHeight, scenario],
  );

  // 三点控制点坐标
  const pointPPos = useMemo<Vec3>(
    () =>
      getPointOnControlEdge(
        controlEdges[0].start,
        controlEdges[0].end,
        mode === "extrema" ? tParam : posP,
      ),
    [controlEdges, mode, tParam, posP],
  );

  const pointQPos = useMemo<Vec3>(
    () =>
      getPointOnControlEdge(controlEdges[1].start, controlEdges[1].end, posQ),
    [controlEdges, posQ],
  );

  const pointRPos = useMemo<Vec3>(
    () =>
      getPointOnControlEdge(controlEdges[2].start, controlEdges[2].end, posR),
    [controlEdges, posR],
  );

  // 作图推演步骤数据 (仅在 construction 模式下，针对所有几何体模型动态求解)
  const constructionData = useMemo(() => {
    return buildPolyhedronConstructionSteps(
      solidKind,
      width,
      depth,
      currentHeight,
      posP,
      posQ,
      posR,
      step,
      scenario,
    );
  }, [
    solidKind,
    width,
    depth,
    currentHeight,
    posP,
    posQ,
    posR,
    step,
    scenario,
  ]);

  // 计算切割平面 (Plane) 严格由空间三点 P, Q, R 唯一确定（符合高中立体几何三点确定平面基本事实）
  const plane = useMemo((): Plane => {
    return planeFromPoints(pointPPos, pointQPos, pointRPos);
  }, [pointPPos, pointQPos, pointRPos]);

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
      currentHeight,
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
  }, [solidKind, width, depth, currentHeight]);

  // 动点极值探究：采样 S(t) 在 t in [0.05, 0.95] 范围内的最值
  const extremaAnalysis = useMemo(() => {
    if (mode !== "extrema") return { minArea: 0, maxArea: 0 };
    let minA = Infinity;
    let maxA = -Infinity;
    for (let t = 0.05; t <= 0.95; t += 0.05) {
      const pP = getPointOnControlEdge(
        controlEdges[0].start,
        controlEdges[0].end,
        t,
      );
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
  }, [mode, controlEdges, pointQPos, pointRPos, currentPolyhedron]);

  // 组装 MathPanel 右屏看板数据
  const mathData = useMemo(() => {
    const paramsMap = {
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

    const externalPoints =
      mode === "construction"
        ? constructionData.activePoints
            .filter((p) => p.isExternal)
            .map((p) => p.label)
        : [];
    const externalPointsStr =
      externalPoints.length > 0
        ? externalPoints.join(", ")
        : "无 (截线与底棱平行)";

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
      stepNum: mode === "construction" ? constructionData.step : undefined,
      methodName:
        mode === "construction" ? constructionData.methodName : undefined,
      externalPointsStr,
      minArea: extremaAnalysis.minArea,
      maxArea: extremaAnalysis.maxArea,
    });
  }, [
    mode,
    solidKind,
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

  const [activeAnswerStep, setActiveAnswerStep] = useState(1);
  const answerSteps = useMemo<AnswerStepItem[]>(
    () =>
      (mathData.reasoningSteps ?? []).map((rs) => ({
        step: rs.step,
        title: rs.title,
        sceneHint: rs.rubric,
      })),
    [mathData.reasoningSteps],
  );
  const effectiveAnswerStep =
    answerSteps.length > 0 ? Math.min(activeAnswerStep, answerSteps.length) : 1;

  const extremaPlay = useParamPlay({
    min: 0.05,
    max: 0.95,
    ratePerSecond: 0.3,
    step: 0.02,
    mode: "bounce",
    getValue: () => tParam,
    onChange: setTParam,
  });

  const constructionPlay = useParamPlay({
    min: 1,
    max: Math.max(2, constructionData.totalSteps),
    ratePerSecond: 0.7,
    step: 1,
    mode: "loop",
    getValue: () => step,
    onChange: (nextStep) => setStep(Math.round(nextStep)),
  });

  // 组装左屏参数配置（仅保留纯连续数值参数，步骤控制独立为推演组件）
  const paramConfigs = useMemo<ParamConfig[]>(() => {
    const currentKeys: string[] =
      mode === "construction" ? ["posP", "posQ", "posR"] : ["tParam"];

    return sectionMeta
      .filter((meta) => currentKeys.includes(meta.key))
      .map((meta) => {
        let val = 0;
        if (meta.key === "posP") val = posP;
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
          group: meta.group,
        };
      });
  }, [mode, posP, posQ, posR, tParam]);

  const handleParamChange = (key: string, value: number) => {
    if (key === "tParam" && extremaPlay.isPlaying) extremaPlay.pause();
    if (key === "step" && constructionPlay.isPlaying) constructionPlay.pause();
    if (key === "posP") setPosP(value);
    else if (key === "posQ") setPosQ(value);
    else if (key === "posR") setPosR(value);
    else if (key === "step") setStep(value);
    else if (key === "tParam") setTParam(value);
  };

  const handleReset = () => {
    extremaPlay.pause();
    constructionPlay.pause();
    setActiveAnswerStep(1);
    setScenario("free");
    setSolidKind("cuboid");
    setPosP(0.35);
    setPosQ(0.7);
    setPosR(0.45);
    setStep(1);
    setTParam(0.5);
  };

  // 生成三视图
  const viewsData = useMemo(() => {
    let solidType: "cuboid" | "pyramid" | "prism" | "frustum" = "cuboid";
    if (solidKind === "pyramid" || solidKind === "tetrahedron")
      solidType = "pyramid";
    if (solidKind === "prism") solidType = "prism";
    if (solidKind === "frustum") solidType = "frustum";

    return buildSolidViews(solidType, {
      width,
      depth,
      height: currentHeight,
      sides: solidKind === "tetrahedron" || solidKind === "prism" ? 3 : 4,
      baseRadius: solidKind === "prism" ? 2.0 : 2.2,
    });
  }, [solidKind, width, depth, currentHeight]);

  // 左屏教学提示与题设导引（说明初始条件与探究设问）
  const tipConfig = useMemo(() => {
    const solidNames: Record<SolidKind, string> = {
      cuboid: isCubeScenario ? "正方体" : "长方体 / 正方体",
      pyramid: "正四棱锥",
      tetrahedron: "正四面体",
      prism: "正三棱柱",
      frustum: "正四棱台",
    };
    const sName = solidNames[solidKind] ?? "多面体";

    const scenarioConditionMap: Record<PresetScenario, string> = {
      free: `已知${sName}的三条侧棱上各给定定点 $P, Q, R$（支持沿棱自由调节比例）。`,
      cubeHexagon:
        "在正方体 $ABCD-A_1B_1C_1D_1$（棱长 $a=3$）中，点 $P \\in AB$、$Q \\in BC$、$R \\in CC_1$（默认取各棱中点）。",
      cubeTrapezoid:
        "在正方体 $ABCD-A_1B_1C_1D_1$（棱长 $a=3$）中，点 $P \\in D_1A_1$、$Q \\in D_1C_1$、$R \\in DA$（满足 $DR > D_1P$）。",
      cubeTriangle:
        "在正方体 $ABCD-A_1B_1C_1D_1$（棱长 $a=3$）中，点 $P \\in AA_1$、$Q \\in AB$、$R \\in AD$ 位于共顶点 $A$ 的三条邻棱上。",
      tetraSection:
        "在正四面体 $S-ABC$ 中，点 $P, Q, R$ 分别位于三条侧棱 $SA, SB, SC$ 上。",
    };

    const scenarioQuestionMap: Record<PresetScenario, string> = {
      free: "(1) 作图破题：运用基本事实与平行性质顺次求解交线；(2) 面积求解：建立空间直角坐标系求法向量，用面积射影公式 $S_{\\text{截}} = S_{\\text{投}}/\\cos\\theta$ 求截面积。",
      cubeHexagon:
        "(1) 利用基本事实 3 延长 $PQ$ 求出外点 $K_1, K_2$ 并作出正六边形截面；(2) 证明各对边平行且六边相等，求解截面正六边形面积。",
      cubeTrapezoid:
        "(1) 运用面面平行性质定理过 $R$ 作 $RS \\parallel PQ$ 封闭梯形截面；(2) 当 $D_1P=D_1Q$ 时求证截面为等腰梯形并计算其面积。",
      cubeTriangle:
        "(1) 直接利用基本事实 1 连结相邻表面截线封闭 $\\triangle PQR$；(2) 当 $AP=AQ=AR$ 时求正三角形截面积与到顶点 $A$ 的距离。",
      tetraSection:
        "(1) 运用基本事实 1 直接连结封闭截面三角形；(2) 当 $P,Q,R$ 为各棱中点时求截面面积与底面面积之比。",
    };

    switch (mode) {
      case "construction":
        return {
          variant: "warning" as const,
          badge: `高考必考 · ${sName}截面作图通法 (${constructionData.methodName})`,
          condition: scenarioConditionMap[scenario],
          question: scenarioQuestionMap[scenario],
        };
      case "extrema":
        return {
          variant: "success" as const,
          badge: `高考压轴 · ${sName}动点截面面积极值探究`,
          condition: `定点 $Q, R$ 保持固定，动点 $P(t)$ 沿选定棱滑动（$t \\in [0.05, 0.95]$）。`,
          question:
            "(1) 判定动点滑动过程中截面图形的边数退化临界；(2) 求解截面面积函数 $S(t)$ 在棱上的最小值点与最大值点。",
        };
    }
    // 依赖中保留二级选项变量：TipCard 教学提示须随二级选项切换同步特化（项目纪律 left/tipcard-secondary-sync）
  }, [mode, solidKind, scenario, isCubeScenario, constructionData.methodName]);

  return (
    <ThreePanel
      left={
        <LeftPanel>
          {/* 1. 探究模式维度 */}
          <LeftPanelSection title="探究模式">
            <TabSwitcher
              tabs={[
                { key: "construction", label: "三点定截面 (作图与面积)" },
                { key: "extrema", label: "动点截面 (极值探究)" },
              ]}
              value={mode}
              onChange={(m) => {
                extremaPlay.pause();
                constructionPlay.pause();
                setMode(m as SectionMode);
                setActiveAnswerStep(1);
              }}
            />
          </LeftPanelSection>

          {/* 2. 高考典型情境预设 (SelectGrid) */}
          <LeftPanelSection title="高考典型情境">
            <SelectGrid
              columns={2}
              items={[
                { key: "free", label: "自由探索" },
                { key: "cubeHexagon", label: "正方体正六边形" },
                { key: "cubeTrapezoid", label: "正方体等腰梯形" },
                { key: "cubeTriangle", label: "正方体正三角形" },
                { key: "tetraSection", label: "正四面体截面" },
              ]}
              value={scenario}
              onChange={(sc) => {
                extremaPlay.pause();
                constructionPlay.pause();
                setActiveAnswerStep(1);
                handleScenarioChange(sc as PresetScenario);
              }}
            />
          </LeftPanelSection>

          {/* 3. 几何体模型选择 (自由探索下开放全量模型) */}
          {scenario === "free" && (
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
                onChange={(k) => {
                  extremaPlay.pause();
                  constructionPlay.pause();
                  setSolidKind(k as SolidKind);
                  setActiveAnswerStep(1);
                }}
                columns={2}
              />
            </LeftPanelSection>
          )}

          {/* 4. 作图推演步骤控制器 (自适应高中三大作图通法：直接法 2 步、平行法 3 步、交轨法 4 步) */}
          {mode === "construction" && (
            <LeftPanelSection
              title={`作图步骤 · ${constructionData.methodName}`}
            >
              <SelectGrid
                items={constructionData.stepOptions.map((opt) => ({
                  key: String(opt.step),
                  label: opt.label,
                  description: opt.description,
                }))}
                value={String(Math.min(step, constructionData.totalSteps))}
                onChange={(s) => {
                  constructionPlay.pause();
                  setStep(Number(s));
                }}
                columns={2}
              />
            </LeftPanelSection>
          )}

          {/* 5. 动态参数调节 */}
          <LeftPanelSection title="参数调节">
            <ParamControl
              params={paramConfigs}
              onParamChange={handleParamChange}
              onReset={handleReset}
            />
            <div className="mt-2.5">
              {mode === "construction" ? (
                <ParamPlayBar
                  isPlaying={constructionPlay.isPlaying}
                  onToggle={constructionPlay.toggle}
                  speed={constructionPlay.speed}
                  onSpeedChange={constructionPlay.setSpeed}
                  label="演示截面交线作图"
                />
              ) : (
                <ParamPlayBar
                  isPlaying={extremaPlay.isPlaying}
                  onToggle={extremaPlay.toggle}
                  speed={extremaPlay.speed}
                  onSpeedChange={extremaPlay.setSpeed}
                  label="连续扫掠截面积极值"
                />
              )}
            </div>
          </LeftPanelSection>

          {answerSteps.length > 0 && (
            <LeftPanelSection title="分步作答导航">
              <StepNavigator
                steps={answerSteps}
                active={effectiveAnswerStep}
                onChange={setActiveAnswerStep}
                hint="右屏已同步高亮对应采分步卡片"
              />
            </LeftPanelSection>
          )}

          {/* 6. 空间视角 */}
          <LeftPanelSection title="空间视角">
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
              )}
            </div>
          </LeftPanelSection>

          {/* 7. 教学提示与题设导引（置于左屏底部） */}
          <TipCard
            variant={tipConfig.variant}
            badge={tipConfig.badge}
            condition={tipConfig.condition}
            question={tipConfig.question}
          />
        </LeftPanel>
      }
      center={
        viewMode === "views" ? (
          <ThreeViewsPanel views={viewsData.views} extent={viewsData.extent} />
        ) : (
          <ThreeDCanvas
            cameraPosition={cameraPosition}
            frameloop={
              extremaPlay.isPlaying || constructionPlay.isPlaying
                ? "always"
                : "demand"
            }
            overlay={
              <>
                {(mode === "construction" || mode === "extrema") &&
                  viewMode === "3d" && (
                    <ModeSwitchOverlay3D
                      mode={interactionMode}
                      onModeChange={setInteractionMode}
                      pointCount={mode === "extrema" ? 1 : 3}
                    />
                  )}
                <AnswerStepOverlay3D
                  steps={answerSteps}
                  activeStep={
                    answerSteps.length > 0 ? effectiveAnswerStep : undefined
                  }
                />
                {mode === "extrema" && viewMode === "3d" && (
                  <ParamCurveOverlay2D
                    {...sampleSectionAreaCurve(
                      currentPolyhedron,
                      controlEdges[0].start,
                      controlEdges[0].end,
                      pointQPos,
                      pointRPos,
                      tParam,
                    )}
                    position="bottom-left"
                  />
                )}
              </>
            }
            legend={
              <Legend3D
                title="截面图例"
                items={[
                  { colorKey: "primary", swatch: "area", label: "多面体表面" },
                  {
                    colorKey: "paramPrimary",
                    swatch: "area",
                    label: "截面多边形",
                  },
                  {
                    colorKey: "secondary",
                    swatch: "area",
                    label: "底面射影阴影",
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
              enabled={interactionMode === "orbit"}
            />
            <CameraFit bounds={sceneBounds} token={viewToken} />

            {/* 3D 几何实体与边线渲染 (严格基于 Polyhedron 拓扑结构，100% 精确吻合) */}
            <PolyhedronSolid polyhedron={currentPolyhedron} opacity={0.15} />

            {/* 3D 截面、底面投影与作图辅助线渲染 (强制绑定 paramPrimary 色彩) */}
            <SectionPlane3D
              sectionPoints={
                mode === "construction"
                  ? step >= constructionData.totalSteps
                    ? sectionPoints
                    : []
                  : sectionPoints
              }
              plane={plane}
              color={MATH_COLORS.paramPrimary}
              planeExtent={Math.max(width, depth, height) * 0.75}
              showPlaneQuad={
                mode === "extrema" || step >= constructionData.totalSteps
              }
              showProjection={
                mode === "extrema" || step >= constructionData.totalSteps
              }
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

            {/* 控制点交互渲染与标签 (P, Q, R，严格使用当前选棱正交投影 projectPointOnSegment) */}
            {(mode === "construction" || mode === "extrema") &&
              (() => {
                const [edgeP, edgeQ, edgeR] = controlEdges;

                return (
                  <>
                    {/* 点 P (绑定 paramPrimary 鲜红，严格在对应选棱上滑动) */}
                    <Point3D
                      position={pointPPos}
                      draggable={interactionMode === "drag"}
                      constrain={(raw) =>
                        projectPointOnSegment(raw, edgeP.start, edgeP.end).point
                      }
                      onDrag={(next) => {
                        const proj = projectPointOnSegment(
                          next,
                          edgeP.start,
                          edgeP.end,
                        );
                        const tVal = Number(
                          Math.max(0.05, Math.min(0.95, proj.t)).toFixed(2),
                        );
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

                    {/* 点 Q (绑定 paramSecondary 暖橙，严格在对应选棱上滑动) */}
                    <Point3D
                      position={pointQPos}
                      draggable={interactionMode === "drag"}
                      constrain={(raw) =>
                        projectPointOnSegment(raw, edgeQ.start, edgeQ.end).point
                      }
                      onDrag={(next) => {
                        const proj = projectPointOnSegment(
                          next,
                          edgeQ.start,
                          edgeQ.end,
                        );
                        setPosQ(
                          Number(
                            Math.max(0.05, Math.min(0.95, proj.t)).toFixed(2),
                          ),
                        );
                      }}
                      colorKey="paramSecondary"
                    />
                    <CompoundLabel3D
                      position={pointQPos}
                      base="Q"
                      colorKey="paramSecondary"
                      offset={[0, 0, 0.25]}
                    />

                    {/* 点 R (绑定 paramTertiary 翠绿，严格在对应选棱上滑动) */}
                    <Point3D
                      position={pointRPos}
                      draggable={interactionMode === "drag"}
                      constrain={(raw) =>
                        projectPointOnSegment(raw, edgeR.start, edgeR.end).point
                      }
                      onDrag={(next) => {
                        const proj = projectPointOnSegment(
                          next,
                          edgeR.start,
                          edgeR.end,
                        );
                        setPosR(
                          Number(
                            Math.max(0.05, Math.min(0.95, proj.t)).toFixed(2),
                          ),
                        );
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

            {/* 截面封闭或动点探究模式下的截面中心与底面射影纯学术代数标签 (杜绝跳动数值，收纳至右屏) */}
            {sectionPoints.length >= 3 &&
              (mode === "extrema" || step >= constructionData.totalSteps) &&
              (() => {
                const cx =
                  sectionPoints.reduce((sum, p) => sum + p.x, 0) /
                  sectionPoints.length;
                const cy =
                  sectionPoints.reduce((sum, p) => sum + p.y, 0) /
                  sectionPoints.length;
                const cz =
                  sectionPoints.reduce((sum, p) => sum + p.z, 0) /
                  sectionPoints.length;
                return (
                  <group>
                    <FormulaLabel3D
                      position={{ x: cx, y: cy, z: cz + 0.15 }}
                      tex={`\\color{${MATH_COLORS.paramPrimary}}{S_{\\text{截}}}`}
                    />
                    {projDetails.areaProj > 0.05 && (
                      <FormulaLabel3D
                        position={{ x: cx, y: cy, z: 0.08 }}
                        tex={`\\color{${MATH_COLORS.secondary}}{S_{\\text{射}}}`}
                      />
                    )}
                  </group>
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
                        radius={0.045}
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
          {...mathData}
          focusStep={answerSteps.length > 0 ? effectiveAnswerStep : undefined}
          focusTarget="reasoning"
          title="多面体截面数学看板"
        />
      }
    />
  );
}
