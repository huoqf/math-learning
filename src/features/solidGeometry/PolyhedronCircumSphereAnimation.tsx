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
} from "@/components/UI";
import type { ParamConfig } from "@/components/UI";
import { Legend3D, CameraRig } from "@/components/Math3D";
import { PolyhedronSphereScene } from "@/components/Math3D/solids";
import { use3DViewport } from "@/hooks/use3DViewport";
import type { CameraPreset } from "@/hooks/use3DViewport";
import { buildMathQuantities } from "@/data/mathQuantities";
import { polyhedronSphereMeta } from "@/data/registries/solidGeometry";

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

  // 2. 2×2 黄金预设定义（严格遵循微描述 <= 4 字）
  const presetsByModel: Record<
    ModelType,
    {
      key: string;
      label: string;
      formula?: string;
      description: string;
      values: Record<string, number>;
    }[]
  > = {
    corner: [
      {
        key: "free",
        label: "自由探究",
        formula: "a, b, c",
        description: "全参开放",
        values: { a: 3, b: 4, c: 5 },
      },
      {
        key: "corner_cube",
        label: "正方体角",
        formula: "a = b = c",
        description: "对称直角",
        values: { a: 3, b: 3, c: 3 },
      },
      {
        key: "corner_std",
        label: "3-4-12",
        formula: "2R = 13",
        description: "整数秒杀",
        values: { a: 3, b: 4, c: 12 },
      },
      {
        key: "corner_flat",
        label: "扁平底面",
        formula: "c \\ll a, b",
        description: "极限观察",
        values: { a: 5, b: 4, c: 1.5 },
      },
    ],
    cylinder: [
      {
        key: "free",
        label: "自由探究",
        formula: "a, b, h",
        description: "全参开放",
        values: { a: 3, b: 4, h: 4 },
      },
      {
        key: "cyl_regular",
        label: "正三棱柱",
        formula: "a = b",
        description: "正棱柱套",
        values: { a: 3, b: 3, h: 4 },
      },
      {
        key: "cyl_high",
        label: "高棱柱",
        formula: "h = 2r_{\\text{底}}",
        description: "双球同心",
        values: { a: 3, b: 4, h: 5 },
      },
      {
        key: "cyl_flat",
        label: "扁棱柱",
        formula: "h \\to 1.5",
        description: "底大高小",
        values: { a: 4, b: 5, h: 1.5 },
      },
    ],
    complement: [
      {
        key: "free",
        label: "自由探究",
        formula: "a, b, c",
        description: "全参开放",
        values: { a: 4, b: 5, c: 6 },
      },
      {
        key: "comp_regular",
        label: "正四面体",
        formula: "a = b = c",
        description: "对棱等长",
        values: { a: 4, b: 4, c: 4 },
      },
      {
        key: "comp_std",
        label: "高考经典",
        formula: "\\sqrt{5},\\sqrt{10},\\sqrt{13}",
        description: "面对角线",
        values: { a: 3.5, b: 4.2, c: 5.1 },
      },
      {
        key: "comp_flat",
        label: "扁平四面",
        formula: "a, b \\gg c",
        description: "临界构型",
        values: { a: 5, b: 5, c: 2.5 },
      },
    ],
    verticalEdge: [
      {
        key: "free",
        label: "自由探究",
        formula: "a, b, h",
        description: "全参开放",
        values: { a: 3, b: 4, h: 4 },
      },
      {
        key: "vert_equal",
        label: "等腰直角",
        formula: "a = b",
        description: "对称底面",
        values: { a: 3, b: 3, h: 4 },
      },
      {
        key: "vert_high",
        label: "垂直高线",
        formula: "h = 6",
        description: "高侧棱锥",
        values: { a: 3, b: 4, h: 6 },
      },
      {
        key: "vert_std",
        label: "3-4-5 底",
        formula: "r_{\\text{底}} = 2.5",
        description: "勾股底面",
        values: { a: 3, b: 4, h: 3 },
      },
    ],
    inSphere: [
      {
        key: "free",
        label: "自由探究",
        formula: "a, b, c",
        description: "全参开放",
        values: { a: 3, b: 4, c: 5 },
      },
      {
        key: "in_cube",
        label: "正方体角",
        formula: "a = b = c",
        description: "对称内切",
        values: { a: 3, b: 3, c: 3 },
      },
      {
        key: "in_std",
        label: "3-4-12",
        formula: "r_{\\text{in}} \\approx 0.8",
        description: "等体积法",
        values: { a: 3, b: 4, c: 12 },
      },
      {
        key: "in_large",
        label: "大尺寸锥",
        formula: "a = b = 5",
        description: "清晰切点",
        values: { a: 5, b: 5, c: 6 },
      },
    ],
  };

  const handleModelTypeChange = (nextModel: ModelType) => {
    setModelType(nextModel);
    setPresetKey("free");
    if (nextModel === "complement") {
      const a = params.a ?? 3;
      const b = params.b ?? 4;
      const c = params.c ?? 5;
      if (
        a * a + b * b <= c * c ||
        a * a + c * c <= b * b ||
        b * b + c * c <= a * a
      ) {
        setParams((prev) => ({ ...prev, a: 4, b: 5, c: 6 }));
      }
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
    setParams((prev) => ({ ...prev, [key]: value }));
    setPresetKey("free");
  };

  const handleReset = () => {
    setPresetKey("free");
    setParams({ a: 3, b: 4, c: 5, h: 4 });
  };

  // 3. 根据当前模型与预设过滤展现参数
  const paramConfigs = useMemo<ParamConfig[]>(() => {
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
      .map((meta) => ({
        key: meta.key,
        label:
          modelType === "verticalEdge"
            ? meta.key === "a"
              ? "底面直角边 a"
              : meta.key === "b"
                ? "底面直角边 b"
                : "垂直侧棱长 h"
            : modelType === "inSphere"
              ? meta.key === "a"
                ? "直角棱 a"
                : meta.key === "b"
                  ? "直角棱 b"
                  : "直角棱 c"
              : meta.label,
        labelFormula: meta.labelFormula,
        value: params[meta.key] ?? meta.defaultValue ?? 0,
        min: meta.min,
        max: meta.max,
        step: meta.step ?? 0.1,
        description: meta.description,
        descriptionFormula: meta.descriptionFormula,
        marks: meta.marks,
      }));
  }, [params, modelType, presetKey]);

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
                  formula: "2R=\\sqrt{a^2+b^2+c^2}",
                  description: "三棱直角",
                },
                {
                  key: "verticalEdge",
                  label: "侧棱垂直",
                  formula: "R^2=r_{\\text{底}}^2+(h/2)^2",
                  description: "套柱转化",
                },
                {
                  key: "complement",
                  label: "补形模型",
                  formula: "8R^2=a^2+b^2+c^2",
                  description: "对棱相等",
                },
                {
                  key: "inSphere",
                  label: "内切球模型",
                  formula: "r=3V/S_{\\text{表}}",
                  description: "等体积法",
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
            <ParamControl
              params={paramConfigs}
              onParamChange={handleParamChange}
              onReset={handleReset}
            />
          </LeftPanelSection>

          {/* Step 4: 图层与标注显示控制 */}
          <LeftPanelSection title="图层与标注显示控制" compact>
            <div className="flex flex-col gap-2.5">
              <Toggle
                label={
                  modelType === "verticalEdge"
                    ? "显示套柱三棱柱框架"
                    : "显示补形长方体框架"
                }
                checked={showComplementFrame}
                onChange={setShowComplementFrame}
              />
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
              tabs={[
                { key: "iso", label: "轴测直观" },
                { key: "top", label: "俯视底面" },
                { key: "front", label: "主视正投" },
                { key: "side", label: "左视侧面" },
              ]}
              value={preset}
              onChange={(p) => setCameraPreset(p as CameraPreset)}
            />
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
