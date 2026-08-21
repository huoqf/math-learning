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
} from "@/components/UI";
import type { ParamConfig } from "@/components/UI";
import {
  Scene3DGrid,
  CameraRig,
  Legend3D,
  Point3D,
  CompoundLabel3D,
  FormulaLabel3D,
  ModeSwitchOverlay3D,
} from "@/components/Math3D";
import type { InteractionMode3D } from "@/components/Math3D";
import { Cuboid } from "@/components/Math3D/solids/Cuboid";
import { use3DViewport } from "@/hooks/use3DViewport";
import type { CameraPreset } from "@/hooks/use3DViewport";
import { buildMathQuantities } from "@/data/mathQuantities";
import { sectionMeta } from "@/data/registries/solidGeometry";
import { projectPointOnSegment } from "@/math3d/vector3";

type ModeType = "modeA" | "modeB" | "modeC";

export default function Template3DAnimation() {
  const [mode, setMode] = useState<ModeType>("modeA");
  const [subType, setSubType] = useState<string>("standard");
  const [showAxes, setShowAxes] = useState<boolean>(false);
  const [interactionMode, setInteractionMode] =
    useState<InteractionMode3D>("orbit");
  const [params, setParams] = useState<Record<string, number>>({
    a: 3,
    b: 2,
    c: 2,
    tParam: 0.5,
  });

  // 1. 初始化 3D 相机与视角 Preset
  const { preset, cameraPosition, setCameraPreset, controlsRef } =
    use3DViewport("iso");

  // 2. 组装右屏看板数据
  const mathData = useMemo(
    () => buildMathQuantities("anim-solid-template", params, { mode, subType }),
    [params, mode, subType],
  );

  // 3. 参数配置列表 (按当前模式过滤)
  const paramConfigs = useMemo<ParamConfig[]>(
    () =>
      sectionMeta
        .filter((meta) => ["posP", "posQ", "posR", "tParam"].includes(meta.key))
        .map((meta) => ({
          key: meta.key,
          label: meta.label,
          labelFormula: meta.labelFormula,
          value: params[meta.key] ?? meta.defaultValue ?? 0,
          min: meta.min,
          max: meta.max,
          step: meta.step ?? 0.1,
          description: meta.description,
          marks: meta.marks,
        })),
    [params, mode],
  );

  const handleParamChange = (key: string, value: number) => {
    setParams((prev) => ({ ...prev, [key]: value }));
  };

  const handleReset = () => {
    setParams({ a: 3, b: 2, c: 2, tParam: 0.5 });
  };

  // 侧棱端点 A0(0,0,0) -> A1(0,0,c)
  const A0 = { x: params.a, y: 0, z: 0 };
  const A1 = { x: params.a, y: 0, z: params.c };
  const P = {
    x: params.a,
    y: 0,
    z: params.c * (params.tParam ?? 0.5),
  };

  return (
    <ThreePanel
      left={
        <LeftPanel>
          {/* Step 1: 探究模式选择 */}
          <LeftPanelSection title="探究模式">
            <SelectGrid
              items={[
                { key: "modeA", label: "基本判定", formula: "l \\perp \\alpha" },
                { key: "modeB", label: "转化性质", formula: "a \\parallel b" },
                {
                  key: "modeC",
                  label: "极值探究",
                  formula: "S(t) \\to \\max",
                  fullWidth: true,
                },
              ]}
              value={mode}
              onChange={(m) => setMode(m as ModeType)}
              columns={2}
            />
          </LeftPanelSection>

          {/* Step 2: 几何模型 / 定理分支 */}
          <LeftPanelSection title="几何体模型">
            <SelectGrid
              items={[
                { key: "standard", label: "长方体模型" },
                { key: "pyramid", label: "四棱锥模型" },
              ]}
              value={subType}
              onChange={(v) => setSubType(v)}
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

          {/* Step 4: 视图与操作引导 */}
          <LeftPanelSection title="3D 视角与操作引导">
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
              <div className="p-2 bg-neutral-50 rounded-md border border-neutral-200/60 text-[11px] text-neutral-500 leading-relaxed">
                💡 鼠标左键按住拖拽可 360° 旋转视角，滚轮缩放；右上角可切换【👆 动点交互】模式。
              </div>
            </div>
          </LeftPanelSection>
                value={interactionMode}
                onChange={(m) => setInteractionMode(m as InteractionMode3D)}
              />
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
                { colorKey: "paramPrimary", swatch: "line", label: "动点 P" },
              ]}
            />
          }
        >
          <CameraRig
            ref={controlsRef}
            enabled={interactionMode === "orbit"}
          />
          <Scene3DGrid size={5} showLabels={showAxes} />

          {/* 3D 实体与几何元素 */}
          <Cuboid
            a={params.a}
            b={params.b}
            c={params.c}
            colorKey="primary"
            opacity={0.2}
          />

          {/* 不可交互几何基准顶点：纯净实心点 */}
          <Point3D position={{ x: 0, y: 0, z: 0 }} colorKey="secondary" />
          <CompoundLabel3D position={{ x: 0, y: 0, z: 0 }} base="A" offset={[-0.2, -0.2, 0]} />

          {/* 可拖拽 3D 动点：严格使用 projectPointOnSegment 进行侧棱正交投影 */}
          <Point3D
            position={P}
            draggable={interactionMode === "drag"}
            constrain={(raw) => projectPointOnSegment(raw, A0, A1).point}
            onDrag={(next) => {
              const { t } = projectPointOnSegment(next, A0, A1);
              handleParamChange("tParam", Number(t.toFixed(2)));
            }}
            colorKey="paramPrimary"
          />
          <CompoundLabel3D position={P} base="P" colorKey="paramPrimary" offset={[0.2, 0, 0.2]} />

          <FormulaLabel3D
            position={{ x: 1, y: 1, z: 1 }}
            tex="V=a \cdot b \cdot c"
          />
        </ThreeDCanvas>
      }
      right={
        <MathPanel
          quantities={mathData.quantities}
          theorems={mathData.theorems}
          gaokaoPoints={mathData.gaokaoPoints}
          warnings={mathData.warnings}
          title="3D 指标看板"
        />
      }
    />
  );
}
