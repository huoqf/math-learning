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
  KatexFormula,
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

  // 右屏看板数据
  const mathData = useMemo(
    () =>
      buildMathQuantities("anim-solid-ball-models", params, {
        modelType,
      }),
    [params, modelType],
  );

  const handleParamChange = (key: string, value: number) => {
    setParams((prev) => ({ ...prev, [key]: value }));
  };

  const handleModelTypeChange = (nextModel: ModelType) => {
    setModelType(nextModel);
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

  const handleReset = () => {
    setParams({ a: 3, b: 4, c: 5, h: 4 });
  };

  // 根据当前模型过滤展现参数
  const paramConfigs = useMemo<ParamConfig[]>(() => {
    const keysByModel: Record<ModelType, string[]> = {
      corner: ["a", "b", "c"],
      cylinder: ["a", "b", "h"],
      complement: ["a", "b", "c"],
      verticalEdge: ["a", "b", "h"],
      inSphere: ["a", "b", "c"],
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
              : modelType === "corner"
                ? meta.key === "a"
                  ? "侧棱长 PA"
                  : meta.key === "b"
                    ? "侧棱长 PB"
                    : "侧棱长 PC"
                : modelType === "cylinder"
                  ? meta.key === "a"
                    ? "底面直角边 a"
                    : meta.key === "b"
                      ? "底面直角边 b"
                      : "柱体高 h"
                  : meta.key === "a"
                    ? "对棱长 a"
                    : meta.key === "b"
                      ? "对棱长 b"
                      : "对棱长 c",
        labelFormula: meta.labelFormula,
        value: params[meta.key] ?? meta.defaultValue ?? 0,
        min: meta.min,
        max: meta.max,
        step: meta.step ?? 0.1,
        description: meta.description,
        descriptionFormula: meta.descriptionFormula,
        importance: meta.importance,
      }));
  }, [params, modelType]);

  // 教学提示配置
  const tipConfig = useMemo(() => {
    switch (modelType) {
      case "corner":
        return {
          variant: "primary" as const,
          formula: "2R = \\sqrt{a^2 + b^2 + c^2}",
          text: "墙角模型（三侧棱两两垂直）：将三棱锥补形成长方体，外接球直径等于体对角线长。",
        };
      case "cylinder":
        return {
          variant: "warning" as const,
          formula: "R^2 = r_{\\text{底}}^2 + \\left(\\frac{h}{2}\\right)^2",
          text: "柱体模型（直棱柱套柱）：底面外接圆半径 r_底 与半高 h/2 勾股合成外接球半径 R。",
        };
      case "complement":
        return {
          variant: "success" as const,
          formula: "8R^2 = a^2 + b^2 + c^2",
          text: "对棱相等四面体补形模型：嵌入长方体使得四面体 6 条棱为长方体 6 面对角线，2(x²+y²+z²)=a²+b²+c²。",
        };
      case "verticalEdge":
        return {
          variant: "warning" as const,
          formula: "R^2 = r_{\\text{底}}^2 + \\left(\\frac{h}{2}\\right)^2",
          text: "汉堡模型（侧棱垂直底面）：套柱转化法，高为垂直侧棱 h，底面外心正上方 h/2 处即球心。",
        };
      case "inSphere":
        return {
          variant: "danger" as const,
          formula: "r_{\\text{in}} = \\frac{3V}{S_1 + S_2 + S_3 + S_4}",
          text: "内切球等体积法：球心与各顶点连线剖分为 4 个同高三棱锥，体积和等于原三棱锥体积。",
        };
    }
  }, [modelType]);

  return (
    <ThreePanel
      left={
        <LeftPanel>
          {/* Step 1: 球切接模型选择 (2+1 布局防截断) */}
          <LeftPanelSection title="球切接模型选择">
            <SelectGrid
              items={[
                {
                  key: "corner",
                  label: "墙角模型",
                  description: "三侧棱两两垂直",
                },
                {
                  key: "cylinder",
                  label: "柱体模型",
                  description: "套柱勾股定理",
                },
                {
                  key: "complement",
                  label: "补形模型",
                  description: "对棱相等四面体",
                },
                {
                  key: "verticalEdge",
                  label: "汉堡模型 (高频)",
                  description: "侧棱垂直底面",
                },
                {
                  key: "inSphere",
                  label: "内切球模型",
                  description: "等体积法剖分",
                  fullWidth: true,
                },
              ]}
              value={modelType}
              onChange={(k) => handleModelTypeChange(k as ModelType)}
              columns={2}
            />
          </LeftPanelSection>

          {/* Step 2: 视图与透视辅助 (紧凑 Toggle) */}
          <LeftPanelSection title="几何图层与框架辅助" compact>
            <div className="space-y-2 bg-neutral-50/80 p-2 rounded-md border border-neutral-200/70">
              <Toggle
                label={
                  modelType === "verticalEdge"
                    ? "套柱三棱柱框架"
                    : "补形长方体/柱体框架"
                }
                checked={showComplementFrame}
                onChange={setShowComplementFrame}
              />
              <Toggle
                label={
                  modelType === "inSphere" ? "内切球透明球壳" : "外接球透明球壳"
                }
                checked={showSphere}
                onChange={setShowSphere}
              />
              {modelType === "inSphere" && (
                <Toggle
                  label="切点 T₁~T₄ 与半径垂线"
                  checked={showRadiusLines}
                  onChange={setShowRadiusLines}
                />
              )}
            </div>
          </LeftPanelSection>

          {/* Step 3: 参数调节 */}
          <LeftPanelSection
            title="几何参数调节"
            subtitle="拖动滑块改变棱长与高"
          >
            <ParamControl
              params={paramConfigs}
              onParamChange={handleParamChange}
              onReset={handleReset}
            />
          </LeftPanelSection>

          {/* Step 4: 教学提示 */}
          <LeftPanelSection title="教学提示与核心公式" compact>
            <TipCard variant={tipConfig.variant}>
              <div className="font-semibold text-xs mb-1">
                <KatexFormula mode="inline" formula={tipConfig.formula} />
              </div>
              <p className="text-xs text-neutral-600 leading-relaxed">
                {tipConfig.text}
              </p>
            </TipCard>
          </LeftPanelSection>

          {/* Step 5: 3D 视角选择 */}
          <LeftPanelSection title="3D 视角选择">
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
                  swatch: "area",
                  label: "三棱锥/多面体容器",
                },
                {
                  colorKey:
                    modelType === "inSphere" ? "inSphereShell" : "sphereShell",
                  swatch: "sphere",
                  label: modelType === "inSphere" ? "内切球" : "外接球",
                },
                {
                  colorKey: "secondary",
                  swatch: "point",
                  label:
                    modelType === "inSphere"
                      ? "切点 T₁~T₄"
                      : "补形长方体/柱体框架",
                },
                {
                  colorKey: "highlight",
                  swatch: "point",
                  label:
                    modelType === "inSphere"
                      ? "球心 O_in & 半径 r_in"
                      : "球心 O & 半径 R",
                },
              ]}
            />
          }
        >
          <CameraRig ref={controlsRef} />
          {/* 纯几何范式：严禁笛卡尔直角坐标系与地面网格 */}

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
                    ? "汉堡模型(侧棱垂直底面)"
                    : "内切球模型(等体积法)"
          }${modelType === "inSphere" ? "" : "外接球"}分析看板`}
        />
      }
    />
  );
}
