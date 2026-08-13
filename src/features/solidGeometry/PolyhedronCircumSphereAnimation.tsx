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
} from "@/components/UI";
import type { ParamConfig } from "@/components/UI";
import { Scene3DGrid, Legend3D, CameraRig } from "@/components/Math3D";
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

  return (
    <ThreePanel
      left={
        <LeftPanel>
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
                },
              ]}
              value={modelType}
              onChange={(k) => handleModelTypeChange(k as ModelType)}
              variant="filled"
              columns={1}
            />
          </LeftPanelSection>

          <LeftPanelSection title="视图与透视辅助">
            <div className="space-y-3">
              <div>
                <label className="text-xs text-neutral-500 mb-1 block font-medium">
                  {modelType === "verticalEdge"
                    ? "套柱三棱柱框架"
                    : "补形长方体/柱体框架"}
                </label>
                <TabSwitcher
                  tabs={[
                    { key: "show", label: "显示框架" },
                    { key: "hide", label: "隐藏框架" },
                  ]}
                  value={showComplementFrame ? "show" : "hide"}
                  onChange={(v) => setShowComplementFrame(v === "show")}
                />
              </div>

              <div>
                <label className="text-xs text-neutral-500 mb-1 block font-medium">
                  {modelType === "inSphere"
                    ? "内切球透明球壳"
                    : "外接球透明球壳"}
                </label>
                <TabSwitcher
                  tabs={[
                    { key: "show", label: "显示球壳" },
                    { key: "hide", label: "隐藏球壳" },
                  ]}
                  value={showSphere ? "show" : "hide"}
                  onChange={(v) => setShowSphere(v === "show")}
                />
              </div>

              {modelType === "inSphere" && (
                <div>
                  <label className="text-xs text-neutral-500 mb-1 block font-medium">
                    切点 T₁~T₄ 与半径垂线 (r_in)
                  </label>
                  <TabSwitcher
                    tabs={[
                      { key: "show", label: "显示半径垂线" },
                      { key: "hide", label: "隐藏垂线" },
                    ]}
                    value={showRadiusLines ? "show" : "hide"}
                    onChange={(v) => setShowRadiusLines(v === "show")}
                  />
                </div>
              )}
            </div>
          </LeftPanelSection>

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

          <LeftPanelSection title="3D 视角选择">
            <TabSwitcher
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
          <Scene3DGrid size={5} />

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
