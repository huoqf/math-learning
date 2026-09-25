import { useState, useMemo } from "react";
import { ThreePanel } from "@/components/Layout/ThreePanel";
import { ThreeDCanvas } from "@/components/Layout/ThreeDCanvas";
import {
  LeftPanel,
  LeftPanelSection,
  ParamControl,
  MathPanel,
  SelectGrid,
  TabSwitcher,
  TipCard,
} from "@/components/UI";
import type { ParamConfig } from "@/components/UI";
import { CameraRig, Legend3D, ModeSwitchOverlay3D } from "@/components/Math3D";
import type { LegendItem, InteractionMode3D } from "@/components/Math3D";
import { use3DViewport, type CameraPreset } from "@/hooks/use3DViewport";
import { buildMathQuantities } from "@/data/mathQuantities";
import { MATH_COLORS } from "@/theme";
import { SphereDerivationScene } from "./SphereDerivationScene";

type DerivationMode = "zuxuan" | "micropyramid";
type ZuxuanStep = "slice" | "subtract";

export default function SphereDerivationAnimation() {
  const [mode, setMode] = useState<DerivationMode>("zuxuan");
  const [zuxuanStep, setZuxuanStep] = useState<ZuxuanStep>("slice");
  const [interactionMode, setInteractionMode] =
    useState<InteractionMode3D>("orbit");

  const [params, setParams] = useState<Record<string, number>>({
    radius: 2.0,
    heightCut: 1.0,
    subdivisions: 16,
  });

  const [showAuxLines, setShowAuxLines] = useState(true);
  const [showSection, setShowSection] = useState(true);

  const { preset, cameraPosition, setCameraPreset, controlsRef } =
    use3DViewport("iso");

  const handleParamChange = (key: string, value: number) => {
    setParams((prev) => ({
      ...prev,
      [key]: value,
      ...(key === "radius" && prev.heightCut > value
        ? { heightCut: value }
        : {}),
    }));
  };

  const handleReset = () => {
    setParams({
      radius: 2.0,
      heightCut: 1.0,
      subdivisions: 16,
    });
  };

  const paramConfigs: ParamConfig[] = useMemo(() => {
    if (mode === "zuxuan") {
      return [
        {
          key: "radius",
          label: "几何体底半径 R",
          labelFormula: `\\text{底半径 } \\color{${MATH_COLORS.paramPrimary}}{R}`,
          value: params.radius ?? 2.0,
          min: 1.2,
          max: 3.0,
          step: 0.1,
          description: "半球与圆柱的公共底面半径与高度 R",
        },
        {
          key: "heightCut",
          label: "截面高度 h",
          labelFormula: `\\text{高度 } \\color{${MATH_COLORS.paramSecondary}}{h}`,
          value: params.heightCut ?? 1.0,
          min: 0,
          max: params.radius ?? 2.0,
          step: 0.05,
          description: "水平截面高度 (0 ≤ h ≤ R)",
        },
      ];
    }
    return [
      {
        key: "radius",
        label: "球体半径 R",
        labelFormula: `\\text{球半径 } \\color{${MATH_COLORS.paramPrimary}}{R}`,
        value: params.radius ?? 2.0,
        min: 1.2,
        max: 3.0,
        step: 0.1,
        description: "球体半径 (同时为微小锥体的高)",
      },
      {
        key: "subdivisions",
        label: "球面网格细分密度 N",
        labelFormula: `\\text{密度 } \\color{${MATH_COLORS.paramSecondary}}{N}`,
        value: params.subdivisions ?? 16,
        min: 8,
        max: 32,
        step: 2,
        description: "经纬度细分密度 (生成 N×2N 个小棱锥)",
      },
    ];
  }, [mode, params]);

  // 右屏数据 SSOT
  const mathPanelData = useMemo(() => {
    return buildMathQuantities(
      "anim-solid-sphere-derivation",
      {
        ...params,
        mode: mode as unknown as number,
        zuxuanStep: zuxuanStep as unknown as number,
      },
      { mode, zuxuanStep },
    );
  }, [params, mode, zuxuanStep]);

  // 3D 图例
  const legendItems: LegendItem[] = useMemo(() => {
    if (mode === "zuxuan") {
      return [
        {
          colorKey: "paramPrimary",
          swatch: "line",
          label: "公共半径 R",
        },
        {
          colorKey: "paramSecondary",
          swatch: "line",
          label: "切片高度 h",
        },
        {
          colorKey: "paramTertiary",
          swatch: "line",
          label: "半球截面半径 r_半",
        },
        {
          colorKey: "accent",
          swatch: "area",
          label: "等面积截面 S(h)",
        },
      ];
    }
    return [
      {
        colorKey: "paramPrimary",
        swatch: "line",
        label: "球半径 (微锥高) R",
      },
      {
        colorKey: "highlight",
        swatch: "area",
        label: "微底面 ΔS",
      },
      {
        colorKey: "paramPrimary",
        swatch: "line",
        label: "微锥侧棱",
      },
    ];
  }, [mode]);

  const tipData = useMemo(() => {
    if (mode === "zuxuan") {
      return {
        badge: "祖暅原理 · 幂势既同则积不容异",
        background:
          "公元五世纪南北朝数学家祖暅提出名扬中外的“祖暅原理”（卡瓦列里原理）：“幂势既同，则积不容异”。中国古代数学家刘徽、祖冲之父子借此完美攻克了球体积的严密推导。",
        condition:
          "在同一水平面上并排放置两个等高几何体：底半径为 $R$ 的半球，以及底半径与高均为 $R$ 且内部挖去倒圆锥的圆柱。作任意高度 $h$（$0 \\le h \\le R$）处的平行截面。",
        question:
          zuxuanStep === "slice"
            ? "求证：在任意高度 $h$ 处，半球截面圆面积与挖锥柱体截面圆环面积严格相等，即 $S_1(h) \\equiv S_2(h)$。"
            : "根据祖暅原理，由 $V_{\\text{半球}} = V_{\\text{圆柱}} - V_{\\text{倒圆锥}}$ 推导完整球体体积公式 $V = \\frac{4}{3}\\pi R^3$。",
      };
    }
    return {
      badge: "以平代曲 · 以锥积球分割求和",
      background:
        "人教A版必修二课标探究思想：球体无法沿平面无褶皱展开。阿基米德与现代数学采用“以锥积球、以平代曲”的网格分割逼近思想，将三维几何体积与二维表面积形成深刻桥梁。",
      condition:
        "将半径为 $R$ 的球面细分成 $N$ 块微小多边形（面积为 $\\Delta S_i$），连接球心与各小块顶点，将球体分割为无数个以球心为顶点、高近似为 $R$ 的细小微锥体。",
      question:
        "求证：通过所有微锥体体积求和 $\\sum \\Delta V_i \\approx \\frac{1}{3}R \\sum \\Delta S_i$，由球体积公式推导出球表面积公式 $S = 4\\pi R^2$。",
    };
  }, [mode, zuxuanStep]);

  return (
    <ThreePanel
      left={
        <LeftPanel>
          <LeftPanelSection title="推导演示模式">
            <TabSwitcher
              tabs={[
                { key: "zuxuan", label: "祖暅原理求体积" },
                { key: "micropyramid", label: "以锥积球求表面积" },
              ]}
              value={mode}
              onChange={(k) => setMode(k as DerivationMode)}
            />
          </LeftPanelSection>

          {mode === "zuxuan" && (
            <LeftPanelSection title="探究阶段">
              <SelectGrid
                columns={1}
                items={[
                  { key: "slice", label: "等高切片面积对比" },
                  { key: "subtract", label: "柱锥体积反向相减" },
                ]}
                value={zuxuanStep}
                onChange={(k) => setZuxuanStep(k as ZuxuanStep)}
                variant="filled"
              />
            </LeftPanelSection>
          )}

          <LeftPanelSection title="几何尺寸与参数">
            <ParamControl
              params={paramConfigs}
              onParamChange={handleParamChange}
              onReset={handleReset}
            />
          </LeftPanelSection>

          <LeftPanelSection title="空间视角与视角预设">
            <div className="space-y-2">
              <TabSwitcher
                layout="horizontal"
                tabs={[{ key: "orbit", label: "🔄 视角漫游" }]}
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
            </div>
          </LeftPanelSection>

          <LeftPanelSection title="图层可见性">
            <div className="flex gap-2">
              <button
                type="button"
                className={`flex-1 py-1.5 px-3 text-xs rounded-lg transition-colors border ${
                  showSection
                    ? "bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800"
                    : "bg-neutral-50 text-neutral-600 border-neutral-200 dark:bg-neutral-900 dark:text-neutral-400 dark:border-neutral-700"
                }`}
                onClick={() => setShowSection((v) => !v)}
              >
                {showSection ? "隐藏截面" : "显示截面"}
              </button>
              <button
                type="button"
                className={`flex-1 py-1.5 px-3 text-xs rounded-lg transition-colors border ${
                  showAuxLines
                    ? "bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800"
                    : "bg-neutral-50 text-neutral-600 border-neutral-200 dark:bg-neutral-900 dark:text-neutral-400 dark:border-neutral-700"
                }`}
                onClick={() => setShowAuxLines((v) => !v)}
              >
                {showAuxLines ? "隐藏辅助线" : "显示辅助线"}
              </button>
            </div>
          </LeftPanelSection>

          <div className="mt-auto pt-3">
            <TipCard
              badge={tipData.badge}
              background={tipData.background}
              condition={tipData.condition}
              question={tipData.question}
            />
          </div>
        </LeftPanel>
      }
      center={
        <div className="relative w-full h-full">
          <ThreeDCanvas
            cameraPosition={cameraPosition}
            legend={<Legend3D title="图例" items={legendItems} />}
            overlay={
              <ModeSwitchOverlay3D
                mode={interactionMode}
                onModeChange={setInteractionMode}
              />
            }
          >
            <CameraRig ref={controlsRef} />
            <ambientLight intensity={0.8} />
            <directionalLight position={[5, 10, 7]} intensity={1.2} />
            <directionalLight position={[-5, 5, -5]} intensity={0.4} />

            <SphereDerivationScene
              mode={mode}
              radius={params.radius ?? 2.0}
              heightCut={params.heightCut ?? 1.0}
              subdivisions={params.subdivisions ?? 16}
              showAuxLines={showAuxLines}
              showSection={showSection}
            />
          </ThreeDCanvas>
        </div>
      }
      right={<MathPanel {...mathPanelData} title="球公式推导数学看板" />}
    />
  );
}
