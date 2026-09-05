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
  const [showSectionCircles, setShowSectionCircles] = useState<boolean>(true);
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
        { label: "底面截面圆 ⊙O₁ (半径 r₁)", colorKey: "paramPrimary" },
        { label: "侧面截面圆 ⊙O₂ (半径 r₂)", colorKey: "paramSecondary" },
        { label: "双外心垂线空间矩形", colorKey: "paramTertiary" },
        { label: "外接球心 O 与外接球 (半径 R)", colorKey: "sphereShell" },
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
  // 4. 左屏教学提示与题设导引（规范双要素：【初始条件】题设背景 + 【核心设问】探究目标；解题定理与公式全部归位右屏）
  const tipConfig = useMemo(() => {
    if (modelType === "perpPlanes") {
      if (presetKey === "perp_equal") {
        return {
          variant: "primary" as const,
          badge: "高考真题构型 · 对称双垂直截面",
          condition:
            "空间两平面 α ⊥ β，底面与侧面截面外接圆半径相等（r₁ = r₂ = r），公共交线弦长为 c。",
          question:
            "观察空间直角矩形 H-O₁-O-O₂ 退化为何种特殊四边形？思考此时外接球半径与 r, c 的简化关系。",
        };
      }
      if (presetKey === "perp_standard") {
        return {
          variant: "primary" as const,
          badge: "高考经典构型 · 3-4-5 勾股截面",
          condition:
            "平面 α ⊥ β，两截面圆半径分别为 r₁ = 2.5, r₂ = 3，公共交线弦长 c = 3。",
          question:
            "观察空间垂线矩形与勾股弦心距，如何在三维场景中逐层定位外心 O₁, O₂ 与外接球心 O？",
        };
      }
      if (presetKey === "perp_critical") {
        return {
          variant: "warning" as const,
          badge: "临界演化构型 · 交线弦长极大值",
          condition:
            "两截面圆公共交线弦长 c 逼近截面圆直径上限（c → 2·min(r₁, r₂)）。",
          question:
            "观察弦心距 d₁ 与截面圆心的极限位置，当交线为直径时，外接球心与截面的空间位置关系如何？",
        };
      }
      return {
        variant: "primary" as const,
        badge: "高考压轴母题 · 双垂直平面截面交心模型",
        condition:
          "两平面 α ⊥ β 相交于交线 AC (长度为 c)，多面体在面 α, β 内截面外接圆半径分别为 r₁, r₂，外心分别为 O₁, O₂。",
        question:
          "如何由两截面外心 O₁, O₂ 构造空间直角矩形确定球心 O？探究外接球半径 R 与截面半径 r₁, r₂ 及交线长 c 的内在规律。",
      };
    }

    if (modelType === "concentric") {
      return {
        variant: "warning" as const,
        badge: "新高考极高频 · 正四面体三球同心模型",
        condition:
          "正四面体 ABCD 的棱长为 a，内部同时存在外接球、棱切球与面内切球。",
        question:
          "观察外接球（过4顶点）、棱切球（切6棱中点）与内切球（切4面重心）的几何特征，探究三球同心性质与固定的半径比例关系。",
      };
    }

    if (modelType === "truncatedCone") {
      if (presetKey === "in_sphere") {
        return {
          variant: "success" as const,
          badge: "高考真题探究 · 圆台内切球临界构型",
          condition:
            "圆台上底半径 r₁ = 1、下底半径 r₂ = 4，圆台轴高达到临界值 h = 4。",
          question:
            "观察轴截面等腰梯形与内切球大圆的切点分布，检验此时梯形母线与两底半径满足何种等量关系？",
        };
      }
      if (presetKey === "cylinder_limit") {
        return {
          variant: "info" as const,
          badge: "极限退化探究 · 退化为圆柱",
          condition:
            "圆台上底半径 r₁ 逼近下底半径 r₂（r₁ → r₂），侧母线趋于平行。",
          question:
            "观察此时外接球心与上下底面的对称位置关系，旋转体退化为直圆柱时的几何性质如何演变？",
        };
      }
      if (presetKey === "cone_limit") {
        return {
          variant: "info" as const,
          badge: "极限退化探究 · 退化为圆锥",
          condition:
            "圆台上底半径 r₁ 逼近于 0（r₁ → 0），上底面退化为单点顶点。",
          question:
            "观察轴截面等腰梯形退化为等腰三角形的临界过程，圆锥切接球模型与圆台模型的几何统一性如何体现？",
        };
      }
      return {
        variant: "success" as const,
        badge: "高考经典大题 · 圆台轴截面切接球模型",
        condition:
          "圆台上底面半径为 r₁、下底面半径为 r₂、轴高为 h，轴截面为对称等腰梯形。",
        question:
          "如何通过轴截面降维求解圆台外接球半径？在什么参数条件下圆台内部恰好存在内切球？",
      };
    }

    if (modelType === "extrema") {
      if (presetKey === "cyl_opt") {
        return {
          variant: "accent" as const,
          badge: "导数与立几压轴 · 内接圆柱体积极大值",
          condition:
            "固定半径为 R 的球体内接圆柱，圆柱的高 h 可在区间 (0, 2R) 内连续调节。",
          question:
            "拖动滑块观察圆柱体积的变化趋势，观察内接圆柱体积何时达到全局最大值？对应的高与球半径呈何种比例？",
        };
      }
      if (presetKey === "cone_opt") {
        return {
          variant: "accent" as const,
          badge: "导数与立几压轴 · 内接圆锥体积极大值",
          condition:
            "固定半径为 R 的球体内接圆锥，圆锥底面在球体内、顶点位于球面上，高为 h。",
          question:
            "探究内接圆锥体积随高 h 的单调变化规律，何时内接圆锥体积最大？其体积分数占外接球的多少？",
        };
      }
      return {
        variant: "accent" as const,
        badge: "导数综合应用 · 球内接旋转体体积极值模型",
        condition:
          "半径为 R 的外接球内内接圆柱或圆锥，内接体的高为 h (h ∈ (0, 2R))。",
        question:
          "如何建立内接几何体体积关于高 h 的函数关系？结合导数求驻点探究体积取得极大值时的空间几何特征。",
      };
    }

    return {
      variant: "info" as const,
      badge: "高中立体几何进阶切接球模型",
      condition: "空间几何体与球体相接（外接）或相切（内切）。",
      question: "通过数形结合探究球心空间定位、轴截面降维与函数极值求解方法。",
    };
  }, [modelType, presetKey]);

  return (
    <ThreePanel
      left={
        <LeftPanel>
          {/* Step 1: 探究模式 (2×2 黄金网格，纯净学术标题，无冗余碎片公式) */}
          <LeftPanelSection title="探究模式">
            <SelectGrid
              columns={2}
              items={[
                {
                  key: "perpPlanes",
                  label: "面面垂直",
                },
                {
                  key: "concentric",
                  label: "三球同心",
                },
                {
                  key: "truncatedCone",
                  label: "圆台切接",
                },
                {
                  key: "extrema",
                  label: "体积极值",
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
                <>
                  <Toggle
                    checked={showSectionCircles}
                    onChange={setShowSectionCircles}
                    label="显示截面外接圆 ⊙O₁ 与 ⊙O₂"
                  />
                  <Toggle
                    checked={showAuxLines}
                    onChange={setShowAuxLines}
                    label="显示双外心垂线与空间矩形"
                  />
                </>
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
              layout="horizontal"
              tabs={[
                { key: "iso", label: "轴测" },
                { key: "front", label: "主视" },
                { key: "top", label: "俯视" },
                { key: "side", label: "左视" },
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
            showSectionCircles={showSectionCircles}
          />
        </ThreeDCanvas>
      }
      right={
        <MathPanel
          quantities={mathData.quantities}
          theorems={mathData.theorems}
          gaokaoPoints={mathData.gaokaoPoints}
          warnings={mathData.warnings}
          reasoningSteps={mathData.reasoningSteps}
          examAnchor={mathData.examAnchor}
          title="进阶切接球高考破题看板"
        />
      }
    />
  );
}
