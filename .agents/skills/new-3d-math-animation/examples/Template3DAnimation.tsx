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
  KatexFormula,
} from "@/components/UI";
import type { ParamConfig } from "@/components/UI";
import {
  Scene3DGrid,
  CameraRig,
  Legend3D,
  Point3D,
  PointLabel3D,
  FormulaLabel3D,
} from "@/components/Math3D";
import { Cuboid } from "@/components/Math3D/solids/Cuboid";
import { use3DViewport } from "@/hooks/use3DViewport";
import type { CameraPreset } from "@/hooks/use3DViewport";
import { buildMathQuantities } from "@/data/mathQuantities";
import { spatialAngleMeta } from "@/data/registries/solidGeometry";

type ModeType = "modeA" | "modeB" | "modeC";

export default function Template3DAnimation() {
  const [mode, setMode] = useState<ModeType>("modeA");
  const [subType, setSubType] = useState<string>("standard");
  const [showAxes, setShowAxes] = useState<boolean>(false);
  const [params, setParams] = useState<Record<string, number>>({
    a: 3,
    b: 2,
    c: 2,
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
      spatialAngleMeta
        .filter((meta) => ["a", "b", "c"].includes(meta.key))
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
    setParams({ a: 3, b: 2, c: 2 });
  };

  return (
    <ThreePanel
      left={
        <LeftPanel>
          {/* Step 1: 探究模式选择 (3项模式推荐 2+1 SelectGrid 布局带公式) */}
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

          {/* Step 4: 教学提示 (统一使用 TipCard 配合 KatexFormula，加 compact) */}
          <LeftPanelSection title="教学提示" compact>
            <TipCard variant="info">
              <span className="font-bold">转化思维链</span>：线线垂直{" "}
              <KatexFormula formula="\Rightarrow" mode="inline" /> 线面垂直{" "}
              <KatexFormula formula="\Rightarrow" mode="inline" /> 面面垂直。
            </TipCard>
          </LeftPanelSection>

          {/* Step 5: 视图与视角 */}
          <LeftPanelSection title="视图与视角">
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
        </LeftPanel>
      }
      center={
        <ThreeDCanvas
          cameraPosition={cameraPosition}
          legend={
            <Legend3D
              title="图例"
              items={[
                { colorKey: "primary", swatch: "area", label: "几何体" },
                { colorKey: "secondary", swatch: "line", label: "基准面" },
              ]}
            />
          }
        >
          <CameraRig ref={controlsRef} />
          <Scene3DGrid size={5} showLabels={showAxes} />

          {/* 3D 实体与几何元素 */}
          <Cuboid
            a={params.a}
            b={params.b}
            c={params.c}
            colorKey="primary"
            opacity={0.2}
          />

          {/* 可拖拽 3D 交互点 */}
          <Point3D
            position={{ x: params.a, y: 0, z: params.c }}
            draggable
            constrain={(raw) => ({
              x: Math.max(0, raw.x),
              y: 0,
              z: Math.max(0, raw.z),
            })}
            onDrag={(next) =>
              setParams((p) => ({ ...p, a: next.x, c: next.z }))
            }
            colorKey="highlight"
          />

          <PointLabel3D position={{ x: 0, y: 0, z: 0 }} text="A" />
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
