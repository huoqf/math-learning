import { useState, useMemo, useEffect, useRef } from "react";
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
import type { InteractionMode3D } from "@/components/Math3D";
import { use3DViewport, type CameraPreset } from "@/hooks/use3DViewport";
import { buildMathQuantities } from "@/data/mathQuantities";
import { MATH_COLORS } from "@/theme";
import {
  SphereDerivationScene,
  type ZuxuanStep,
} from "./SphereDerivationScene";
import {
  buildSphereDerivationLegend,
  type SphereDerivationMode,
} from "./scenePalette";

export default function SphereDerivationAnimation() {
  const [mode, setMode] = useState<SphereDerivationMode>("zuxuan");
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
  const [autoSweep, setAutoSweep] = useState(false);
  const [autoPop, setAutoPop] = useState(false);

  const { preset, cameraPosition, setCameraPreset, controlsRef } =
    use3DViewport("iso");

  const handleParamChange = (key: string, value: number) => {
    // 用户一旦手动拖动对应滑块，就视为「接管」，立即停掉对应自动动效
    if (key === "heightCut" && autoSweep) setAutoSweep(false);
    if (key === "popRatio" && autoPop) setAutoPop(false);
    setParams((prev) => ({
      ...prev,
      [key]: value,
      ...(key === "radius" && prev.heightCut > value
        ? { heightCut: value }
        : {}),
    }));
  };

  /**
   * 自动扫掠：让 h 在 0 ⇄ R 之间连续往复。
   *
   * 祖暅原理的命题是「**任意**高度 h 的截面面积都相等」（∀h），
   * 手动拖滑块只能验证有限几个点，学生极易误读成「验了几个高度就证明了」。
   * 连续扫掠把 ∀ 语义变成看得见的过程，同时也顺带演示了 h→R 时截面退化为点。
   */
  const sweepDirRef = useRef(1);
  useEffect(() => {
    if (!autoSweep || mode !== "zuxuan" || zuxuanStep !== "slice") return;
    const timer = window.setInterval(() => {
      setParams((prev) => {
        const R = prev.radius ?? 2.0;
        const step = Math.max(0.02, R / 36);
        let next = (prev.heightCut ?? 0) + sweepDirRef.current * step;
        if (next >= R) {
          next = R;
          sweepDirRef.current = -1;
        } else if (next <= 0) {
          next = 0;
          sweepDirRef.current = 1;
        }
        return { ...prev, heightCut: Number(next.toFixed(3)) };
      });
    }, 70);
    return () => window.clearInterval(timer);
  }, [autoSweep, mode, zuxuanStep]);

  /**
   * 微锥动态抽离/复位动画：让 popRatio 在 0 ⇄ 1 之间连续缓动。
   * λ = 0: 原位嵌在球体内部（体现微锥源于球心连出）
   * λ = 1: 完全抽出特写（展现高 h_i ≈ R 与底面 ΔS_i）
   */
  const popDirRef = useRef(1);
  useEffect(() => {
    if (!autoPop || mode !== "micropyramid") return;
    const timer = window.setInterval(() => {
      setParams((prev) => {
        const current = prev.popRatio ?? 0.8;
        const step = 0.04;
        let next = current + popDirRef.current * step;
        if (next >= 1.0) {
          next = 1.0;
          popDirRef.current = -1;
        } else if (next <= 0) {
          next = 0;
          popDirRef.current = 1;
        }
        return { ...prev, popRatio: Number(next.toFixed(2)) };
      });
    }, 40);
    return () => window.clearInterval(timer);
  }, [autoPop, mode]);

  const handleReset = () => {
    setAutoSweep(false);
    setAutoPop(false);
    sweepDirRef.current = 1;
    popDirRef.current = 1;
    setParams({
      radius: 2.0,
      heightCut: 1.0,
      subdivisions: 16,
      popRatio: 0.8,
    });
  };

  const paramConfigs: ParamConfig[] = useMemo(() => {
    if (mode === "zuxuan") {
      const configs: ParamConfig[] = [
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
      ];
      // 第二档做的是「体积相减」，与截面高度无关 ⇒ 不显示 h 滑块，避免拖着没反应的死交互
      if (zuxuanStep === "slice") {
        configs.push({
          key: "heightCut",
          label: "截面高度 h",
          labelFormula: `\\text{高度 } \\color{${MATH_COLORS.paramSecondary}}{h}`,
          value: params.heightCut ?? 1.0,
          min: 0,
          max: params.radius ?? 2.0,
          step: 0.05,
          description: "水平截面高度 (0 ≤ h ≤ R)",
        });
      }
      return configs;
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
        // 符号用**小写 n**（网格密度），把大写 N 让给"微锥总数 = n×2n"，
        // 与右屏「球面分割微锥总数 N」及推导式 ∑_{i=1}^{N} 保持同一个 N。
        // 历史缺陷：左屏"密度 N"=16、右屏"总数 N"=512，同一屏上一个符号两个值。
        label: "球面网格细分密度 n",
        labelFormula: `\\text{密度 } \\color{${MATH_COLORS.paramSecondary}}{n}`,
        value: params.subdivisions ?? 16,
        min: 8,
        max: 32,
        step: 2,
        description: "经纬网格密度：生成 n×2n 个微锥，总数记为 N",
      },
      {
        key: "popRatio",
        label: "微锥抽离比例 λ",
        labelFormula: `\\text{抽离 } \\color{${MATH_COLORS.paramTertiary}}{\\lambda}`,
        value: params.popRatio ?? 0.8,
        min: 0,
        max: 1,
        step: 0.05,
        description: "λ=0 原位嵌入球内，λ=1 完全抽出特写",
      },
    ];
  }, [mode, zuxuanStep, params]);

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

  // 3D 图例：由调色板生成，与中屏画布同源（见 ./scenePalette.ts）
  const legendItems = useMemo(() => buildSphereDerivationLegend(mode), [mode]);

  const tipData = useMemo(() => {
    if (mode === "zuxuan") {
      return {
        badge: "祖暅原理 · 幂势既同则积不容异",
        background:
          "公元五世纪南北朝数学家祖暅提出名扬中外的“祖暅原理”（卡瓦列里原理）：“幂势既同，则积不容异”。刘徽先提出“牟合方盖”设想以求球体积而未能完成，祖冲之、祖暅父子最终借这一原理攻克了球体积的严密推导。",
        condition:
          "在同一水平面上并排放置两个等高几何体：底半径为 $R$ 的半球，以及底半径与高均为 $R$ 且内部挖去倒圆锥的圆柱。作任意高度 $h$（$0 \\le h \\le R$）处的平行截面。",
        question:
          zuxuanStep === "slice"
            ? "求证：在任意高度 $h$ 处，半球截面圆面积与挖锥柱体截面圆环面积严格相等，即 $S_1(h) \\equiv S_2(h)$。"
            : "根据祖暅原理，由 $V_{\\text{半球}} = V_{\\text{柱}} - V_{\\text{锥}}$ 推导完整球体体积公式 $V = \\frac{4}{3}\\pi R^3$。",
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
              onChange={(k) => {
                // 切模式都退出自动动效：扫掠属于模式一，抽离动效属于模式二
                setAutoSweep(false);
                setAutoPop(false);
                setMode(k as SphereDerivationMode);
              }}
            />
          </LeftPanelSection>

          {mode === "micropyramid" && (
            <LeftPanelSection title="微锥抽离动效">
              <div className="space-y-1.5">
                <button
                  type="button"
                  className={`w-full py-1.5 px-3 text-xs rounded-lg transition-colors border ${
                    autoPop
                      ? "bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800"
                      : "bg-neutral-50 text-neutral-600 border-neutral-200 dark:bg-neutral-900 dark:text-neutral-400 dark:border-neutral-700"
                  }`}
                  onClick={() => {
                    popDirRef.current =
                      (params.popRatio ?? 0.8) >= 0.95 ? -1 : 1;
                    setAutoPop((v) => !v);
                  }}
                >
                  {autoPop ? "⏸ 暂停抽离演示" : "▶ 动态抽离/复位演示"}
                </button>
                <p className="text-[11px] leading-snug text-neutral-500 dark:text-neutral-400">
                  {autoPop
                    ? "演示中：微锥沿法向从球体原位缓缓抽出，高线与底面平滑拉开。拖动滑块随时接管。"
                    : "演示呈现：λ=0 微锥原位嵌于球内；λ=1 完全抽出特写高 hᵢ ≈ R 与底面 ΔSᵢ。"}
                </p>
              </div>
            </LeftPanelSection>
          )}

          {mode === "zuxuan" && (
            <LeftPanelSection title="探究阶段">
              <SelectGrid
                columns={1}
                items={[
                  { key: "slice", label: "等高切片面积对比" },
                  { key: "subtract", label: "柱锥体积反向相减" },
                ]}
                value={zuxuanStep}
                onChange={(k) => {
                  setAutoSweep(false);
                  setZuxuanStep(k as ZuxuanStep);
                }}
                variant="filled"
              />
              {/* 第二档做的是「柱锥体积相减」，与截面高度 h 无关 ⇒ 不提供扫掠，避免拖着没反应的死交互 */}
              {zuxuanStep === "slice" && (
                <div className="mt-2 space-y-1.5">
                  <button
                    type="button"
                    className={`w-full py-1.5 px-3 text-xs rounded-lg transition-colors border ${
                      autoSweep
                        ? "bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800"
                        : "bg-neutral-50 text-neutral-600 border-neutral-200 dark:bg-neutral-900 dark:text-neutral-400 dark:border-neutral-700"
                    }`}
                    onClick={() => {
                      // 每次开启都从当前 h 出发、方向朝上，避免上一轮停在极值处的方向记忆造成"点了不动"
                      sweepDirRef.current = 1;
                      setAutoSweep((v) => !v);
                    }}
                  >
                    {autoSweep ? "⏸ 暂停自动扫掠" : "▶ 自动扫掠截面 h（0 ⇄ R）"}
                  </button>
                  <p className="text-[11px] leading-snug text-neutral-500 dark:text-neutral-400">
                    {autoSweep
                      ? "扫掠中：盯住左右两个截面——它们在任意高度都同步同面积，这就是 S₁(h) ≡ S₂(h)。拖动滑块可随时接管。"
                      : "祖暅原理要求对「任意高度 h」都成立，手拖滑块只能验证有限几个点。扫掠把 ∀h 变成看得见的过程。"}
                  </p>
                </div>
              )}
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
              {/* 「截面」是模式一独有的对象；模式二没有截面概念，留着这个按钮只会空转误导 */}
              {mode === "zuxuan" && (
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
              )}
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
              zuxuanStep={zuxuanStep}
              popRatio={params.popRatio ?? 0.8}
            />
          </ThreeDCanvas>
        </div>
      }
      right={<MathPanel {...mathPanelData} title="球公式推导数学看板" />}
    />
  );
}
