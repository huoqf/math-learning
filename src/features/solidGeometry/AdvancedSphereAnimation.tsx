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
  Toggle,
  TipCard,
} from "@/components/UI";
import type { ParamConfig } from "@/components/UI";
import { Legend3D, CameraRig } from "@/components/Math3D";
import type { LegendItem } from "@/components/Math3D";
import {
  AdvancedSphereScene,
  type AdvancedSphereModelType,
} from "@/components/Math3D/solids";
import { use3DViewport } from "@/hooks/use3DViewport";
import type { CameraPreset } from "@/hooks/use3DViewport";
import { buildMathQuantities } from "@/data/mathQuantities";
import { advancedSphereMeta } from "@/data/registries/solidGeometry";
import { MATH_COLORS } from "@/theme";

export default function AdvancedSphereAnimation() {
  const [modelType, setModelType] =
    useState<AdvancedSphereModelType>("perpPlanes");
  const [presetKey, setPresetKey] = useState<string>("free");

  const [showSphere, setShowSphere] = useState<boolean>(true);
  const [showAuxLines, setShowAuxLines] = useState<boolean>(true);
  const [showSection, setShowSection] = useState<boolean>(true);
  const [showTangentPoints, setShowTangentPoints] = useState<boolean>(true);

  const [params, setParams] = useState<Record<string, number>>({
    r1: 3,
    r2: 3.5,
    c: 3,
    a: 4,
    h: 4.24,
    R: 3,
    shapeType: 0,
  });

  const { preset, cameraPosition, setCameraPreset, controlsRef } =
    use3DViewport("iso");

  // 1. 右屏看板数据
  const mathData = useMemo(
    () =>
      buildMathQuantities("anim-solid-advanced-sphere", params, {
        modelType,
      }),
    [params, modelType],
  );

  // 2. 2×2 黄金预设定义（纯净单行加粗学术标题，纯粹自解释，等高对称，杜绝折行与冗余公式）
  const presetsByModel: Record<
    AdvancedSphereModelType,
    {
      key: string;
      label: string;
      values: Record<string, number>;
    }[]
  > = {
    perpPlanes: [
      {
        key: "free",
        label: "自由探索",
        values: { r1: 3, r2: 3.5, c: 3 },
      },
      {
        key: "perp_equal",
        label: "对称垂直面",
        values: { r1: 3, r2: 3, c: 3 },
      },
      {
        key: "perp_standard",
        label: "勾股截面",
        values: { r1: 2.5, r2: 3, c: 3 },
      },
      {
        key: "perp_critical",
        label: "交线极大临界",
        values: { r1: 3, r2: 4, c: 5.5 },
      },
    ],
    concentric: [
      {
        key: "free",
        label: "自由探索",
        values: { a: 4 },
      },
      {
        key: "tetra_std",
        label: "标准正四面体",
        values: { a: 4 },
      },
      {
        key: "tetra_small",
        label: "紧凑正四面体",
        values: { a: 2.5 },
      },
      {
        key: "tetra_large",
        label: "大尺寸正四面体",
        values: { a: 5.5 },
      },
    ],
    truncatedCone: [
      {
        key: "free",
        label: "自由探索",
        values: { r1: 1.5, r2: 3, h: 4.24 },
      },
      {
        key: "in_sphere",
        label: "内切临界圆台",
        values: { r1: 1, r2: 4, h: 4.0 },
      },
      {
        key: "cylinder_limit",
        label: "退化为圆柱",
        values: { r1: 2.8, r2: 3.0, h: 4.0 },
      },
      {
        key: "cone_limit",
        label: "退化为圆锥",
        values: { r1: 0.3, r2: 3.2, h: 4.5 },
      },
    ],
    extrema: [
      {
        key: "free",
        label: "自由探索",
        values: { R: 3, shapeType: 0, h: 3.46 },
      },
      {
        key: "cyl_opt",
        label: "圆柱最大体积",
        values: { R: 3, shapeType: 0, h: 3.46 },
      },
      {
        key: "cone_opt",
        label: "圆锥最大体积",
        values: { R: 3, shapeType: 1, h: 4.0 },
      },
      {
        key: "cyl_std",
        label: "等高圆柱",
        values: { R: 3, shapeType: 0, h: 3.0 },
      },
    ],
  };

  // 3. 模式切换处理（自动重置为该模式的基准参数）
  const handleModelTypeChange = (nextModel: AdvancedSphereModelType) => {
    setModelType(nextModel);
    setPresetKey("free");
    const freePreset = presetsByModel[nextModel]?.find((p) => p.key === "free");
    if (freePreset) {
      setParams((prev) => ({ ...prev, ...freePreset.values }));
    }
  };

  const handlePresetChange = (key: string) => {
    setPresetKey(key);
    const target = presetsByModel[modelType]?.find((p) => p.key === key);
    if (target) {
      setParams((prev) => ({ ...prev, ...target.values }));
    }
  };

  const handleParamChange = (key: string, value: number) => {
    setParams((prev) => {
      const next = { ...prev, [key]: value };
      if (presetKey === "perp_equal" && key === "r1") {
        next.r2 = value;
      }
      if (presetKey === "in_sphere" && (key === "r1" || key === "r2")) {
        const r1 = key === "r1" ? value : (prev.r1 ?? 1);
        const r2 = key === "r2" ? value : (prev.r2 ?? 4);
        next.h = Number((2 * Math.sqrt(r1 * r2)).toFixed(2));
      }
      if (key === "R") {
        if (presetKey === "cyl_opt") {
          next.h = Number((((2 * Math.sqrt(3)) / 3) * value).toFixed(2));
        } else if (presetKey === "cone_opt") {
          next.h = Number(((4 / 3) * value).toFixed(2));
        } else if (presetKey === "cyl_std") {
          next.h = value;
        }
      }
      return next;
    });
    setPresetKey("free");
  };

  const handleReset = () => {
    setPresetKey("free");
    const freePreset = presetsByModel[modelType]?.find((p) => p.key === "free");
    if (freePreset) {
      setParams((prev) => ({ ...prev, ...freePreset.values }));
    }
  };

  // 4. 按当前模式与预设动态裁剪展示参数（参数降维铁律）
  const paramConfigs = useMemo<ParamConfig[]>(() => {
    let activeKeys: string[] = [];

    if (modelType === "perpPlanes") {
      if (presetKey === "free") activeKeys = ["r1", "r2", "c"];
      else if (presetKey === "perp_equal") activeKeys = ["r1", "c"];
      else activeKeys = [];
    } else if (modelType === "concentric") {
      if (presetKey === "free") activeKeys = ["a"];
      else activeKeys = [];
    } else if (modelType === "truncatedCone") {
      if (presetKey === "free") activeKeys = ["r1", "r2", "h"];
      else if (presetKey === "in_sphere") activeKeys = ["r1", "r2"];
      else if (presetKey === "cylinder_limit") activeKeys = ["r1", "h"];
      else activeKeys = [];
    } else if (modelType === "extrema") {
      if (presetKey === "free") activeKeys = ["R", "h"];
      else if (
        presetKey === "cyl_opt" ||
        presetKey === "cone_opt" ||
        presetKey === "cyl_std"
      ) {
        activeKeys = ["R"];
      } else {
        activeKeys = [];
      }
    }

    return advancedSphereMeta
      .filter((meta) => activeKeys.includes(meta.key))
      .map((meta) => {
        let label = meta.label;
        let labelFormula = meta.labelFormula;

        if (modelType === "concentric" && meta.key === "a") {
          label = "正四面体棱长 a";
          labelFormula = `\\text{正四面体棱长 } \\color{${MATH_COLORS.paramPrimary}}{a}`;
        } else if (modelType === "truncatedCone") {
          if (meta.key === "r1") {
            label = "上底面半径 r₁";
            labelFormula = `\\text{上底半径 } \\color{${MATH_COLORS.paramPrimary}}{r_1}`;
          } else if (meta.key === "r2") {
            label = "下底面半径 r₂";
            labelFormula = `\\text{下底半径 } \\color{${MATH_COLORS.paramSecondary}}{r_2}`;
          }
        } else if (modelType === "extrema") {
          if (meta.key === "h") {
            label = "内接体高度 h";
            labelFormula = `\\text{内接体高度 } \\color{${MATH_COLORS.paramTertiary}}{h}`;
          }
        }

        return {
          key: meta.key,
          label,
          labelFormula,
          value: params[meta.key] ?? meta.defaultValue ?? 0,
          min: meta.min,
          max: meta.max,
          step: meta.step ?? 0.1,
          description: meta.description,
          marks: meta.marks,
        };
      });
  }, [params, modelType, presetKey]);

  // 图例
  const legendItems: LegendItem[] = useMemo(() => {
    if (modelType === "perpPlanes") {
      return [
        { label: "底面外接半径 r₁", colorKey: "paramPrimary" },
        { label: "侧面外接半径 r₂", colorKey: "paramSecondary" },
        { label: "双外心垂线空间矩形", colorKey: "paramTertiary" },
        { label: "外接球心 O 与外接球", colorKey: "sphereShell" },
      ];
    } else if (modelType === "concentric") {
      return [
        { label: "正四面体棱骨架", colorKey: "paramPrimary" },
        { label: "外接球 (R = √6/4 a)", colorKey: "sphereShell" },
        { label: "棱切球 (r_棱 = √2/4 a)", colorKey: "paramTertiary" },
        { label: "内切球 (r = √6/12 a)", colorKey: "inSphereShell" },
      ];
    } else if (modelType === "truncatedCone") {
      return [
        { label: "上/下底半径 r₁, r₂", colorKey: "paramPrimary" },
        { label: "轴截面母线 l", colorKey: "paramSecondary" },
        { label: "外接球心 O", colorKey: "sphereShell" },
        { label: "内切球心 I (临界时)", colorKey: "inSphereShell" },
      ];
    } else {
      return [
        { label: "外接球 (固定半径 R)", colorKey: "sphereShell" },
        { label: "内接旋转体 (圆柱/圆锥)", colorKey: "paramSecondary" },
        { label: "轴高与极值高度 h", colorKey: "paramTertiary" },
      ];
    }
  }, [modelType]);

  // 4. 左屏教学提示与题设导引（说明初始条件与探究设问，深度联动当前预设）
  const tipConfig = useMemo(() => {
    if (modelType === "perpPlanes") {
      if (presetKey === "perp_equal") {
        return {
          variant: "primary" as const,
          badge: "高考压轴 · 对称双垂直面截面圆",
          condition: "两垂直平面 α ⊥ β 内截面圆半径相等 r₁=r₂=r，交线长为 c。",
          question:
            "构造对称空间正方形，外接球半径公式简化为：R² = 2r² - (c/2)²。",
        };
      }
      if (presetKey === "perp_standard") {
        return {
          variant: "primary" as const,
          badge: "高考母题 · 3-4-5 勾股双垂直面",
          condition: "面 α ⊥ β，截面圆半径分别为 r₁=2.5, r₂=3，交线长 c=3。",
          question:
            "代入交心公式 R² = 2.5² + 3² - (1.5)² = 13，求得外接球半径 R = √13。",
        };
      }
      return {
        variant: "primary" as const,
        badge: "高考压轴 · 双垂直平面截面圆交心法",
        condition:
          "两平面 α ⊥ β 相交于交线 AB (长度为 c)，多面体在面 α, β 内截面外接圆半径分别为 r₁, r₂，外心分别为 O₁, O₂。",
        question:
          "分别过 O₁, O₂ 作面 α, β 的垂线，两垂线在空间相交于外接球球心 O，构造空间矩形推导外接球半径通式：R² = r₁² + r₂² - (c/2)²。",
      };
    }

    if (modelType === "concentric") {
      return {
        variant: "warning" as const,
        badge: "高考秒杀 · 正四面体三球同心模型",
        condition:
          "棱长为 a 的正四面体 ABCD，外接球球心、棱切球球心、内切球球心同心于中心 O。",
        question:
          "探究三球半径秒杀比例 r_内 : r_棱 : R_外 = 1 : √3 : 3（其中 r_内=√6/12 a, r_棱=√2/4 a, R_外=√6/4 a）。",
      };
    }

    if (modelType === "truncatedCone") {
      if (presetKey === "in_sphere") {
        return {
          variant: "success" as const,
          badge: "高考大题 · 圆台内切球临界存在条件",
          condition: "圆台上底半径 r₁、下底半径 r₂，高 h = 2√(r₁ r₂)。",
          question:
            "此时母线长 l = r₁ + r₂，轴截面等腰梯形对边和相等，恰好存在内切球，内切球半径 r_内 = h/2 = √(r₁ r₂)。",
        };
      }
      return {
        variant: "success" as const,
        badge: "高考大题 · 圆台轴截面切接球模型",
        condition: "圆台上底面半径为 r₁、下底面半径为 r₂、母线长为 l、高为 h。",
        question:
          "轴截面降维为等腰梯形，圆台内切球存在充要条件为梯形对边和相等：l = r₁ + r₂，内切球半径 r = h/2 = √(r₁ r₂)。",
      };
    }

    if (modelType === "extrema") {
      if (presetKey === "cyl_opt") {
        return {
          variant: "accent" as const,
          badge: "导数与立几压轴 · 球内接圆柱体积极大值",
          condition: "半径为 R 的球体内接圆柱，高为 h。",
          question:
            "体积函数 V(h) = π(R² - h²/4)h，求导得驻点 h = (2√3/3)R 时体积取得最大值 V_max = (4√3/9)πR³（占球体体积 57.7%）。",
        };
      }
      if (presetKey === "cone_opt") {
        return {
          variant: "accent" as const,
          badge: "导数与立几压轴 · 球内接圆锥体积极大值",
          condition: "半径为 R 的球体内接圆锥，高为 h (h ∈ (0, 2R))。",
          question:
            "底面半径 r² = h(2R - h)，体积 V(h) = (1/3)πh²(2R - h)，求导得驻点 h = (4/3)R 时体积取得最大值 V_max = (32/81)πR³（占球体体积 29.6%）。",
        };
      }
      return {
        variant: "accent" as const,
        badge: "导数与立几压轴 · 球内接体积极值模型",
        condition:
          "半径为 R 的球体内接圆柱或圆锥，内接体的高为 h (h ∈ (0, 2R))。",
        question:
          "建立体积函数 V(h) 并利用导数求极值：内接圆柱当 h = 2√3/3 R 时体积最大（占球体 57.7%）；内接圆锥当 h = 4/3 R 时体积最大（占球体 29.6%）。",
      };
    }

    return {
      variant: "info" as const,
      badge: "高阶空间切接模型",
      condition: "多面体或旋转体在空间中与球体相交或相切。",
      question: "探究外心垂线交轨、截面降维与函数极值求解通法。",
    };
  }, [modelType, presetKey]);

  return (
    <ThreePanel
      left={
        <LeftPanel>
          {/* Step 1: 探究模式 (2×2 黄金网格) */}
          <LeftPanelSection title="探究模式">
            <SelectGrid
              columns={2}
              items={[
                {
                  key: "perpPlanes",
                  label: "面面垂直",
                  formula: "R^2=r_1^2+r_2^2-(c/2)^2",
                },
                {
                  key: "concentric",
                  label: "三球同心",
                  formula: "1 : \\sqrt{3} : 3",
                },
                {
                  key: "truncatedCone",
                  label: "圆台切接",
                  formula: "l = r_1+r_2",
                },
                {
                  key: "extrema",
                  label: "体积极值",
                  formula: "V_{\\max}",
                },
              ]}
              value={modelType}
              onChange={(val) =>
                handleModelTypeChange(val as AdvancedSphereModelType)
              }
            />
          </LeftPanelSection>

          {/* Step 2: 典型模型预设 (2×2 黄金网格) */}
          <LeftPanelSection title="典型模型预设">
            <SelectGrid
              columns={2}
              items={presetsByModel[modelType]}
              value={presetKey}
              onChange={handlePresetChange}
            />
          </LeftPanelSection>

          {/* Step 3: 参数调节 */}
          <LeftPanelSection title="参数调节">
            {paramConfigs.length > 0 ? (
              <ParamControl
                params={paramConfigs}
                onParamChange={handleParamChange}
                onReset={handleReset}
              />
            ) : (
              <div className="rounded-xl bg-neutral-50/80 border border-neutral-200/80 p-3 text-xs text-neutral-600 flex items-center justify-between shadow-xs">
                <span className="flex items-center gap-1.5">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-500" />
                  题设基准数据已锁定
                </span>
                <button
                  type="button"
                  onClick={() => setPresetKey("free")}
                  className="text-blue-600 font-medium hover:underline text-[11px] cursor-pointer"
                >
                  切为自由探索
                </button>
              </div>
            )}
          </LeftPanelSection>

          {/* Step 4: 图层与标注显示控制 */}
          <LeftPanelSection title="图层与标注显示控制" compact>
            <div className="flex flex-col gap-2.5">
              <Toggle
                checked={showSphere}
                onChange={setShowSphere}
                label="显示外接球与赤道虚实轮廓"
              />
              {modelType === "perpPlanes" && (
                <Toggle
                  checked={showAuxLines}
                  onChange={setShowAuxLines}
                  label="显示双外心垂线与空间矩形"
                />
              )}
              {modelType === "concentric" && (
                <Toggle
                  checked={showTangentPoints}
                  onChange={setShowTangentPoints}
                  label="显示棱切点与面切点"
                />
              )}
              {modelType === "truncatedCone" && (
                <>
                  <Toggle
                    checked={showSection}
                    onChange={setShowSection}
                    label="显示轴截面等腰梯形"
                  />
                  <Toggle
                    checked={showTangentPoints}
                    onChange={setShowTangentPoints}
                    label="显示内切球与球心 I"
                  />
                </>
              )}
            </div>
          </LeftPanelSection>

          {/* Step 5: 3D 空间视角预设 */}
          <LeftPanelSection title="3D 空间视角预设">
            <TabSwitcher
              tabs={[
                { key: "iso", label: "轴测直观" },
                { key: "top", label: "俯视底面" },
                { key: "front", label: "主视正投" },
                { key: "side", label: "左视侧面" },
              ]}
              value={preset}
              onChange={(val) => setCameraPreset(val as CameraPreset)}
            />
          </LeftPanelSection>

          {/* Step 6: 教学提示与题设导引（置于左屏底部） */}
          <LeftPanelSection title="教学导引与题设背景" compact>
            <TipCard variant={tipConfig.variant}>
              <div className="flex items-center justify-between font-semibold text-xs mb-1.5 border-b border-black/5 pb-1">
                <span>{tipConfig.badge}</span>
              </div>
              <div className="space-y-1 text-[11px] leading-relaxed">
                <div>
                  <span className="font-semibold text-neutral-800">
                    【初始条件】
                  </span>
                  <span className="text-neutral-600">
                    {tipConfig.condition}
                  </span>
                </div>
                <div>
                  <span className="font-semibold text-neutral-800">
                    【探究设问】
                  </span>
                  <span className="text-neutral-600">{tipConfig.question}</span>
                </div>
              </div>
            </TipCard>
          </LeftPanelSection>
        </LeftPanel>
      }
      center={
        <ThreeDCanvas
          cameraPosition={cameraPosition}
          legend={<Legend3D items={legendItems} />}
        >
          <CameraRig ref={controlsRef} />
          <AdvancedSphereScene
            modelType={modelType}
            params={params}
            showSphere={showSphere}
            showAuxLines={showAuxLines}
            showSection={showSection}
            showTangentPoints={showTangentPoints}
          />
        </ThreeDCanvas>
      }
      right={
        <MathPanel
          quantities={mathData.quantities}
          theorems={mathData.theorems}
          gaokaoPoints={mathData.gaokaoPoints}
          warnings={mathData.warnings}
          title="进阶切接球数学看板"
        />
      }
    />
  );
}
