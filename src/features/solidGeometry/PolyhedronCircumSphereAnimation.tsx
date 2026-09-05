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
import { PolyhedronSphereScene } from "@/components/Math3D/solids";
import { use3DViewport } from "@/hooks/use3DViewport";
import type { CameraPreset } from "@/hooks/use3DViewport";
import { buildMathQuantities } from "@/data/mathQuantities";
import { polyhedronSphereMeta } from "@/data/registries/solidGeometry";
import { MATH_COLORS } from "@/theme";

type ModelType =
  "corner" | "cylinder" | "complement" | "verticalEdge" | "inSphere";

export default function PolyhedronCircumSphereAnimation() {
  const [modelType, setModelType] = useState<ModelType>("corner");
  const [presetKey, setPresetKey] = useState<string>("free");

  const [showComplementFrame, setShowComplementFrame] = useState<boolean>(true);
  const [showSphere, setShowSphere] = useState<boolean>(true);
  const [showRadiusLines, setShowRadiusLines] = useState<boolean>(true);

  const [params, setParams] = useState<Record<string, number>>({
    a: 3,
    b: 4,
    c: 5,
    h: 4,
  });

  const { preset, cameraPosition, setCameraPreset, controlsRef } =
    use3DViewport("iso");

  // 1. 右屏看板数据
  const mathData = useMemo(
    () =>
      buildMathQuantities("anim-solid-ball-models", params, {
        modelType,
      }),
    [params, modelType],
  );

  // 2. 2×2 黄金预设定义（纯净单行加粗学术标题，纯粹自解释，等高对称，杜绝折行与冗余公式）
  const presetsByModel: Record<
    ModelType,
    {
      key: string;
      label: string;
      values: Record<string, number>;
    }[]
  > = {
    corner: [
      {
        key: "free",
        label: "自由探索",
        values: { a: 3, b: 4, c: 5 },
      },
      {
        key: "corner_cube",
        label: "正方体直角角",
        values: { a: 3, b: 3, c: 3 },
      },
      {
        key: "corner_std",
        label: "勾股墙角",
        values: { a: 1.5, b: 2, c: 6 },
      },
      {
        key: "corner_flat",
        label: "扁平墙角",
        values: { a: 5, b: 4, c: 1.5 },
      },
    ],
    cylinder: [
      {
        key: "free",
        label: "自由探索",
        values: { a: 3, b: 4, h: 4 },
      },
      {
        key: "cyl_regular",
        label: "正三棱柱",
        values: { a: 3, b: 3, h: 4 },
      },
      {
        key: "cyl_high",
        label: "细高三棱柱",
        values: { a: 3, b: 4, h: 5 },
      },
      {
        key: "cyl_flat",
        label: "扁三棱柱",
        values: { a: 4, b: 5, h: 1.5 },
      },
    ],
    complement: [
      {
        key: "free",
        label: "自由探索",
        values: { a: 4, b: 5, c: 6 },
      },
      {
        key: "comp_regular",
        label: "正四面体",
        values: { a: 4, b: 4, c: 4 },
      },
      {
        key: "comp_std",
        label: "对棱四面体",
        values: { a: 3.5, b: 4.2, c: 5.1 },
      },
      {
        key: "comp_flat",
        label: "扁平四面体",
        values: { a: 5, b: 5, c: 2.5 },
      },
    ],
    verticalEdge: [
      {
        key: "free",
        label: "自由探索",
        values: { a: 3, b: 4, h: 4 },
      },
      {
        key: "vert_equal",
        label: "等腰直角底面",
        values: { a: 3, b: 3, h: 4 },
      },
      {
        key: "vert_high",
        label: "细高侧棱锥",
        values: { a: 3, b: 4, h: 6 },
      },
      {
        key: "vert_std",
        label: "勾股底面",
        values: { a: 3, b: 4, h: 3 },
      },
    ],
    inSphere: [
      {
        key: "free",
        label: "自由探索",
        values: { a: 3, b: 4, c: 5 },
      },
      {
        key: "in_cube",
        label: "正方体角内切",
        values: { a: 3, b: 3, c: 3 },
      },
      {
        key: "in_std",
        label: "勾股四面体内切",
        values: { a: 1.5, b: 2, c: 6 },
      },
      {
        key: "in_large",
        label: "对称大尺寸棱锥",
        values: { a: 5, b: 5, c: 6 },
      },
    ],
  };

  const handleModelTypeChange = (nextModel: ModelType) => {
    setModelType(nextModel);
    setPresetKey("free");
    const freeP = presetsByModel[nextModel]?.find((p) => p.key === "free");
    if (freeP) {
      setParams((prev) => ({ ...prev, ...freeP.values }));
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
      if (
        (presetKey === "corner_cube" ||
          presetKey === "comp_regular" ||
          presetKey === "in_cube") &&
        key === "a"
      ) {
        next.a = value;
        next.b = value;
        next.c = value;
      } else if (
        (presetKey === "cyl_regular" || presetKey === "vert_equal") &&
        key === "a"
      ) {
        next.b = value;
      } else if (presetKey !== "free") {
        // 其他非联动参数被单独调节时，才自动脱离预设切为自由探索
        setPresetKey("free");
      }
      return next;
    });
  };

  const handleReset = () => {
    setPresetKey("free");
    setParams({ a: 3, b: 4, c: 5, h: 4 });
  };

  // 3. 根据当前模型与预设过滤展现参数
  const paramConfigs = useMemo<ParamConfig[]>(() => {
    if (
      presetKey !== "free" &&
      presetKey !== "corner_cube" &&
      presetKey !== "cyl_regular" &&
      presetKey !== "comp_regular" &&
      presetKey !== "vert_equal" &&
      presetKey !== "in_cube"
    ) {
      return [];
    }

    const keysByModel: Record<ModelType, string[]> = {
      corner: presetKey === "corner_cube" ? ["a"] : ["a", "b", "c"],
      cylinder: presetKey === "cyl_regular" ? ["a", "h"] : ["a", "b", "h"],
      complement: presetKey === "comp_regular" ? ["a"] : ["a", "b", "c"],
      verticalEdge: presetKey === "vert_equal" ? ["a", "h"] : ["a", "b", "h"],
      inSphere: presetKey === "in_cube" ? ["a"] : ["a", "b", "c"],
    };

    const activeKeys = keysByModel[modelType] ?? ["a", "b", "c"];

    return polyhedronSphereMeta
      .filter((meta) => activeKeys.includes(meta.key))
      .map((meta) => {
        let label = meta.label;
        let labelFormula = meta.labelFormula;

        if (modelType === "corner") {
          if (presetKey === "corner_cube") {
            label = "正方体棱长 a (PA=PB=PC)";
            labelFormula = `\\text{正方体棱长 } PA=PB=PC=\\color{${MATH_COLORS.paramPrimary}}{a}`;
          } else if (meta.key === "a") {
            label = "垂直侧棱 PA (a)";
            labelFormula = `\\text{侧棱 } PA = \\color{${MATH_COLORS.paramPrimary}}{a}`;
          } else if (meta.key === "b") {
            label = "垂直侧棱 PB (b)";
            labelFormula = `\\text{侧棱 } PB = \\color{${MATH_COLORS.paramSecondary}}{b}`;
          } else if (meta.key === "c") {
            label = "垂直侧棱 PC (c)";
            labelFormula = `\\text{侧棱 } PC = \\color{${MATH_COLORS.paramTertiary}}{c}`;
          }
        } else if (modelType === "complement") {
          if (presetKey === "comp_regular") {
            label = "正四面体棱长 a";
            labelFormula = `\\text{正四面体棱长 } \\color{${MATH_COLORS.paramPrimary}}{a}`;
          } else if (meta.key === "a") {
            label = "对棱长 a (AB, CD)";
            labelFormula = `\\text{对棱 } AB=CD=\\color{${MATH_COLORS.paramPrimary}}{a}`;
          } else if (meta.key === "b") {
            label = "对棱长 b (AC, BD)";
            labelFormula = `\\text{对棱 } AC=BD=\\color{${MATH_COLORS.paramSecondary}}{b}`;
          } else if (meta.key === "c") {
            label = "对棱长 c (AD, BC)";
            labelFormula = `\\text{对棱 } AD=BC=\\color{${MATH_COLORS.paramTertiary}}{c}`;
          }
        } else if (modelType === "verticalEdge") {
          if (meta.key === "a") {
            label =
              presetKey === "vert_equal"
                ? "等腰直角边 a (CA=CB)"
                : "底面直角边 a (CA)";
            labelFormula =
              presetKey === "vert_equal"
                ? `\\text{等腰直角边 } CA=CB=\\color{${MATH_COLORS.paramPrimary}}{a}`
                : `\\text{底面直角边 } CA=\\color{${MATH_COLORS.paramPrimary}}{a}`;
          } else if (meta.key === "b") {
            label = "底面直角边 b (CB)";
            labelFormula = `\\text{底面直角边 } CB=\\color{${MATH_COLORS.paramSecondary}}{b}`;
          } else if (meta.key === "h") {
            label = "垂直侧棱长 h (PA)";
            labelFormula = `\\text{垂直侧棱 } PA=\\color{${MATH_COLORS.paramTertiary}}{h}`;
          }
        } else if (modelType === "inSphere") {
          if (presetKey === "in_cube") {
            label = "直角等棱长 a (CA=CB=CP)";
            labelFormula = `\\text{直角等棱 } CA=CB=CP=\\color{${MATH_COLORS.paramPrimary}}{a}`;
          } else if (meta.key === "a") {
            label = "底面直角棱 a (CA)";
            labelFormula = `\\text{底面直角棱 } CA=\\color{${MATH_COLORS.paramPrimary}}{a}`;
          } else if (meta.key === "b") {
            label = "底面直角棱 b (CB)";
            labelFormula = `\\text{底面直角棱 } CB=\\color{${MATH_COLORS.paramSecondary}}{b}`;
          } else if (meta.key === "c") {
            label = "垂直直角棱 c (CP)";
            labelFormula = `\\text{垂直直角棱 } CP=\\color{${MATH_COLORS.paramTertiary}}{c}`;
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

  // 4. 左屏教学提示与题设导引（说明初始条件与探究设问，深度联动当前预设与中屏几何体）
  const tipConfig = useMemo(() => {
    if (modelType === "corner") {
      if (presetKey === "corner_cube") {
        return {
          variant: "primary" as const,
          badge: "高考母题 · 正方体角墙角外接球",
          condition: "三棱锥原点 P 处三侧棱两两垂直且等长 PA=PB=PC=a。",
          question:
            "补形为边长为 a 的正方体，体对角线 PP' 即外接球直径：2R = √3 a，R = (√3/2)a，球心 O 为 PP' 中点。",
        };
      }
      if (presetKey === "corner_std") {
        return {
          variant: "primary" as const,
          badge: "高考经典 · 勾股墙角模型 (3-4-12 等比放缩)",
          condition:
            "三棱锥直角顶点在 P，垂直侧棱长分别取 PA=1.5, PB=2, PC=6。",
          question:
            "由墙角公式 (2R)² = PA² + PB² + PC² = 1.5² + 2² + 6² = 42.25，秒解外接球直径 2R = 6.5 (R = 3.25)。",
        };
      }
      return {
        variant: "primary" as const,
        badge: "高考母题 · 三棱直角墙角模型",
        condition:
          "三棱锥 P-ABC 直角在原点 P，三条侧棱两两垂直 (PA ⊥ PB, PB ⊥ PC, PC ⊥ PA)，棱长分别为 PA=a, PB=b, PC=c。",
        question:
          "补全为以 a, b, c 为长宽高的长方体，长方体体对角线 PP' 即外接球直径：(2R)² = a² + b² + c²，球心 O 为体对角线中点。",
      };
    }

    if (modelType === "verticalEdge") {
      if (presetKey === "vert_equal") {
        return {
          variant: "warning" as const,
          badge: "高考经典 · 等腰直角底面侧棱垂直",
          condition:
            "三棱锥底面 △ABC 为等腰直角三角形 (直角顶点在 C，CA=CB=a)，侧棱 PA ⊥ 底面 ABC (高 PA=h)。",
          question:
            "底面外心 O₁ 为斜边 AB 中点，底面半径 r_底 = (√2/2)a；球心 O 到底面距离为 h/2，由勾股定理求得 R² = a²/2 + (h/2)²。",
        };
      }
      return {
        variant: "warning" as const,
        badge: "高考经典 · 侧棱垂直底面模型",
        condition:
          "三棱锥 P-ABC 底面 △ABC 中 ∠C=90° (直角边 CA=a, CB=b)，侧棱 PA ⊥ 底面 ABC (高 PA=h)。",
        question:
          "斜边 AB 中点即为底面外心 O₁ (r_底 = AB/2)；外接球球心 O 在过 O₁ 且垂直底面的轴线上，球心距为 h/2，勾股定理列式：R² = r_底² + (h/2)²。",
      };
    }

    if (modelType === "complement") {
      if (presetKey === "comp_regular") {
        return {
          variant: "success" as const,
          badge: "高考母题 · 正四面体对棱相等补形",
          condition:
            "正四面体 A-BCD 各棱长均为 a，对棱等长 (AB=CD=a, AC=BD=a, AD=BC=a)。",
          question:
            "嵌入边长为 x = (√2/2)a 的正方体（对棱为面对角线），由 8R² = 3a² 求得外接球半径 R = (√6/4)a。",
        };
      }
      return {
        variant: "success" as const,
        badge: "高考大招 · 对棱相等补形模型",
        condition:
          "四面体 A-BCD 中三组对棱分别相等 (红色 AB=CD=a, 橙色 AC=BD=b, 绿色 AD=BC=c)。",
        question:
          "补全为长宽高为 x, y, z 的长方体（四面体 6 条棱为长方体 6 个面的面对角线）：三式联立解得 8R² = a² + b² + c²。",
      };
    }

    if (modelType === "inSphere") {
      if (presetKey === "in_cube") {
        return {
          variant: "accent" as const,
          badge: "高考必备 · 正方体角内切球",
          condition:
            "三棱锥直角在 C，三直角侧棱等长 CA=CB=CP=a，三个侧面为等腰直角三角形。",
          question:
            "等体积法：总体积 V = a³/6，表面积 S_表 = (3 + √3)a²/2，解得内切球半径 r = 3V/S_表 = a / (3 + √3)。",
        };
      }
      return {
        variant: "accent" as const,
        badge: "高考必备 · 多面体内切球等体积法",
        condition:
          "三棱锥直角在 C（直角棱 CA=a, CB=b, CP=c），斜面为 △PAB；内切球心为 O(in)，切点分别为 T₁~T₄。",
        question:
          "以球心 O(in) 为共同顶点剖分为 4 个以各面为底面、高为 r 的小棱锥，由等体积法求解内切球半径：r = 3V/S(表)。",
      };
    }

    return {
      variant: "info" as const,
      badge: "高考多面体切接球模型",
      condition: "多面体几何顶点均在球面上（外接）或各面与球相切（内切）。",
      question: "探究多面体对称特征与切接球球心位置、半径计算通法。",
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
                  key: "corner",
                  label: "墙角模型",
                },
                {
                  key: "verticalEdge",
                  label: "侧棱垂直",
                },
                {
                  key: "complement",
                  label: "补形模型",
                },
                {
                  key: "inSphere",
                  label: "内切球模型",
                },
              ]}
              value={modelType}
              onChange={(k) => handleModelTypeChange(k as ModelType)}
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
              {modelType !== "inSphere" && (
                <Toggle
                  label={
                    modelType === "verticalEdge"
                      ? "显示套柱三棱柱框架"
                      : "显示补形长方体框架"
                  }
                  checked={showComplementFrame}
                  onChange={setShowComplementFrame}
                />
              )}
              <Toggle
                label={
                  modelType === "inSphere"
                    ? "显示内切球与赤道虚实轮廓"
                    : "显示外接球与赤道虚实轮廓"
                }
                checked={showSphere}
                onChange={setShowSphere}
              />
              {modelType === "inSphere" && (
                <Toggle
                  label="显示切点 T₁~T₄ 与公垂半径"
                  checked={showRadiusLines}
                  onChange={setShowRadiusLines}
                />
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
              onChange={(p) => setCameraPreset(p as CameraPreset)}
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
          legend={
            <Legend3D
              title={
                modelType === "inSphere"
                  ? "内切球模型图例"
                  : "多面体外接球模型图例"
              }
              items={[
                {
                  colorKey: "primary",
                  label: "三棱锥/多面体容器",
                },
                {
                  colorKey:
                    modelType === "inSphere" ? "inSphereShell" : "sphereShell",
                  label:
                    modelType === "inSphere"
                      ? "内切球 (前实后虚)"
                      : "外接球 (前实后虚)",
                },
                {
                  colorKey: "paramTertiary",
                  label:
                    modelType === "inSphere"
                      ? "切点 T₁~T₄"
                      : "补形长方体/柱体框架",
                },
                {
                  colorKey: "accent",
                  label:
                    modelType === "inSphere"
                      ? "球心 I & 半径 r"
                      : "球心 O & 半径 R",
                },
              ]}
            />
          }
        >
          <CameraRig ref={controlsRef} />
          <PolyhedronSphereScene
            modelType={modelType}
            params={params}
            showComplementFrame={showComplementFrame}
            showSphere={showSphere}
            showRadiusLines={showRadiusLines}
          />
        </ThreeDCanvas>
      }
      right={
        <MathPanel
          quantities={mathData.quantities}
          theorems={mathData.theorems}
          gaokaoPoints={mathData.gaokaoPoints}
          warnings={mathData.warnings}
          title={`${
            modelType === "corner"
              ? "墙角模型"
              : modelType === "cylinder"
                ? "柱体模型"
                : modelType === "complement"
                  ? "补形模型"
                  : modelType === "verticalEdge"
                    ? "侧棱垂直底面模型"
                    : "内切球等体积法模型"
          }${modelType === "inSphere" ? "" : "外接球"}分析看板`}
        />
      }
    />
  );
}
