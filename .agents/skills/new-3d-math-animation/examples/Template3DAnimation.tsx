import { useState, useMemo } from "react";
import { ThreePanel } from "@/components/Layout/ThreePanel";
import { ThreeDCanvas } from "@/components/Layout/ThreeDCanvas";
import {
  LeftPanel,
  LeftPanelSection,
  ParamControl,
  MathPanel,
  TabSwitcher,
  SelectGrid,
  TipCard,
} from "@/components/UI";
import type { ParamConfig } from "@/components/UI";
import {
  Scene3DGrid,
  CameraRig,
  Legend3D,
  Point3D,
  PointLabel3D,
  CompoundLabel3D,
  FormulaLabel3D,
  ModeSwitchOverlay3D,
} from "@/components/Math3D";
import type { InteractionMode3D } from "@/components/Math3D";
import { Cuboid } from "@/components/Math3D/solids/Cuboid";
import { use3DViewport, useScenario } from "@/hooks";
import type { CameraPreset } from "@/hooks";
import type { ScenarioSpec } from "@/types/scenario";
import { buildMathQuantities } from "@/data/mathQuantities";
import { sectionMeta } from "@/data/registries/solidGeometry";
import { projectPointOnSegment } from "@/math3d/vector3";

type ModeType = "triangle" | "trapezoid" | "hexagon";

type Template3DParams = {
  tParam: number;
};

const DEFAULT_PARAMS: Template3DParams = {
  tParam: 0.5,
};

const SOLID_SCENARIOS: Record<
  "free" | "midpoint",
  ScenarioSpec<Template3DParams>
> = {
  free: {
    id: "free",
    name: "自由探究",
    badge: "自主探究 · 棱上动点",
    background: "空间长方体棱上动点构型与比例参数在线交互实验。",
    condition:
      "在长方体 $ABCD-A_1B_1C_1D_1$ 中，$AB=3, AD=2, AA_1=2$，动点 $P$ 在侧棱 $BB_1$ 上满足 $BP = t \\cdot BB_1$。",
    question:
      "(1) 求截面特征参数随比例 $t$ 的变化范围；(2) 判定 $t=0.5$ 时相关几何量的最值状态。",
    variant: "primary",
  },
  midpoint: {
    id: "midpoint",
    name: "侧棱中点",
    badge: "高考母题 · 中点截面",
    background: "长方体侧棱中点常用于构造平行平面与对称截面。",
    condition: "固定比例参数 $t = 0.5$，点 $P$ 为侧棱 $BB_1$ 中点。",
    question: "(1) 证明截面多边形的对称性并求解截面面积。",
    presetParams: { tParam: 0.5 },
    lockedParamKeys: ["tParam"],
    variant: "accent",
  },
};

export default function Template3DAnimation() {
  const [mode, setMode] = useState<ModeType>("triangle");
  const [subType, setSubType] = useState<"free" | "midpoint">("free");
  const [showAxes, setShowAxes] = useState<boolean>(false);
  const [interactionMode, setInteractionMode] =
    useState<InteractionMode3D>("orbit");
  const [params, setParams] = useState<Template3DParams>(DEFAULT_PARAMS);

  // 1. 统一使用 useScenario 驱动情景与题设闭环
  const { tipProps, selectScenario, isParamLocked } = useScenario<
    "free" | "midpoint",
    Template3DParams
  >({
    scenarios: SOLID_SCENARIOS,
    activeKey: subType,
    params,
    onParamsChange: setParams,
  });

  // 2. 初始化 3D 相机与视角 Preset
  const { preset, cameraPosition, setCameraPreset, controlsRef } =
    use3DViewport("iso");

  // 3. 组装右屏看板数据 (SSOT: 统一通过 buildMathQuantities 获取)
  const mathData = useMemo(
    () =>
      buildMathQuantities("anim-solid-section", params, {
        mode,
        subType,
      }),
    [params, mode, subType],
  );

  // 4. 参数配置列表
  const paramConfigs = useMemo<ParamConfig[]>(
    () =>
      sectionMeta
        .filter((meta) => meta.key === "tParam")
        .map((meta) => ({
          key: meta.key,
          label: meta.label,
          labelFormula: meta.labelFormula,
          value: params.tParam,
          min: meta.min,
          max: meta.max,
          step: meta.step ?? 0.05,
          description: meta.description,
          marks: meta.marks,
          group: meta.group,
          disabled: isParamLocked("tParam"),
        })),
    [params.tParam, isParamLocked],
  );

  const handleParamChange = (key: string, value: number) => {
    if (key !== "tParam") return;
    setParams({ tParam: value });
    setSubType("free");
  };

  const handleReset = () => {
    setParams(DEFAULT_PARAMS);
    setSubType("free");
  };

  const handlePresetChange = (nextKey: string) => {
    const typed = nextKey as "free" | "midpoint";
    setSubType(typed);
    selectScenario(typed);
  };

  // 长方体底模尺寸及侧棱端点 B(3,0,0) -> B1(3,0,2)
  const [a, b, c] = [3, 2, 2];
  const B0 = { x: a, y: 0, z: 0 };
  const B1 = { x: a, y: 0, z: c };
  const P = { x: a, y: 0, z: c * params.tParam };

  return (
    <ThreePanel
      left={
        <LeftPanel>
          {/* Step 1: 探究模式 */}
          <LeftPanelSection title="探究模式">
            <TabSwitcher
              tabs={[
                { key: "triangle", label: "三角形截面" },
                { key: "trapezoid", label: "梯形截面" },
                { key: "hexagon", label: "六边形截面" },
              ]}
              value={mode}
              onChange={(m) => setMode(m as ModeType)}
              layout="horizontal"
            />
          </LeftPanelSection>

          {/* Step 2: 典型模型预设（纯净中文标题，严禁堆砌公式） */}
          <LeftPanelSection title="典型模型预设">
            <SelectGrid
              items={Object.values(SOLID_SCENARIOS).map((s) => ({
                key: s.id,
                label: s.name,
              }))}
              value={subType}
              onChange={handlePresetChange}
              columns={2}
            />
          </LeftPanelSection>

          {/* Step 3: 参数调节 */}
          <LeftPanelSection title="参数调节">
            <ParamControl
              params={paramConfigs}
              onParamChange={handleParamChange}
              onReset={handleReset}
            />
          </LeftPanelSection>

          {/* Step 4 & 5: 图层与视角控制 */}
          <LeftPanelSection title="视角与坐标系" compact>
            <div className="space-y-2">
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
              <SelectGrid
                items={[
                  { key: "0", label: "隐藏坐标轴" },
                  { key: "1", label: "显示坐标轴" },
                ]}
                value={showAxes ? "1" : "0"}
                onChange={(v) => setShowAxes(v === "1")}
                columns={2}
              />
            </div>
          </LeftPanelSection>

          {/* Step 6: 教学导引与题设背景（置于最底部） */}
          {tipProps && (
            <div className="mt-auto">
              <TipCard
                key={subType}
                variant={tipProps.variant}
                badge={tipProps.badge}
                background={tipProps.background}
                condition={tipProps.condition}
                question={tipProps.question}
              />
            </div>
          )}
        </LeftPanel>
      }
      center={
        <ThreeDCanvas
          cameraPosition={cameraPosition}
          overlay={
            <ModeSwitchOverlay3D
              mode={interactionMode}
              onModeChange={setInteractionMode}
              pointCount={1}
            />
          }
          legend={
            <Legend3D
              title="图例"
              items={[
                { colorKey: "primary", swatch: "area", label: "几何体" },
                { colorKey: "paramPrimary", swatch: "point", label: "动点 P" },
              ]}
            />
          }
        >
          <CameraRig ref={controlsRef} enabled={interactionMode === "orbit"} />
          {showAxes && <Scene3DGrid size={5} showLabels />}

          {/* 3D 实体与几何元素 */}
          <Cuboid a={a} b={b} c={c} colorKey="primary" opacity={0.2} />

          {/* 单字母基准顶点使用 PointLabel3D，带下标顶点使用 CompoundLabel3D */}
          <Point3D position={{ x: 0, y: 0, z: 0 }} colorKey="secondary" />
          <PointLabel3D
            position={{ x: 0, y: 0, z: 0 }}
            text="A"
            offset={[-0.2, -0.2, 0]}
          />
          <CompoundLabel3D
            position={B1}
            base="B"
            subscript="1"
            offset={[0.2, -0.2, 0.2]}
          />

          {/* 可拖拽 3D 动点：严格使用 projectPointOnSegment 进行侧棱正交投影 */}
          <Point3D
            position={P}
            draggable={interactionMode === "drag"}
            constrain={(raw) => projectPointOnSegment(raw, B0, B1).point}
            onDrag={(next) => {
              const { t } = projectPointOnSegment(next, B0, B1);
              handleParamChange("tParam", Number(t.toFixed(2)));
            }}
            colorKey="paramPrimary"
          />
          <PointLabel3D
            position={P}
            text="P"
            colorKey="paramPrimary"
            offset={[0.2, 0, 0.2]}
          />

          <FormulaLabel3D
            position={{ x: a / 2, y: b / 2, z: c + 0.3 }}
            tex="V = a \cdot b \cdot c"
            plain
          />
        </ThreeDCanvas>
      }
      right={
        <MathPanel
          title="3D 指标看板"
          quantities={mathData.quantities}
          theorems={mathData.theorems}
          gaokaoPoints={mathData.gaokaoPoints}
          warnings={mathData.warnings}
          reasoningSteps={mathData.reasoningSteps}
          examAnchor={mathData.examAnchor}
          mnemonic={mathData.mnemonic}
        />
      }
    />
  );
}
