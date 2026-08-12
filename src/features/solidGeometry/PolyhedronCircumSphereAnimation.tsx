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
import { buildMathQuantities } from "@/data/mathQuantities";
import { polyhedronSphereMeta } from "@/data/registries/solidGeometry";

type ModelType = "corner" | "cylinder" | "complement";

export default function PolyhedronCircumSphereAnimation() {
  const [modelType, setModelType] = useState<ModelType>("corner");
  const [showComplementFrame, setShowComplementFrame] = useState<boolean>(true);
  const [showSphere, setShowSphere] = useState<boolean>(true);

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
    if (modelType === "corner") {
      setParams({ a: 3, b: 4, c: 5, h: 4 });
    } else if (modelType === "cylinder") {
      setParams({ a: 3, b: 4, c: 5, h: 4 });
    } else {
      setParams({ a: 4, b: 5, c: 6, h: 4 });
    }
  };

  // 根据当前模型过滤展现参数
  const paramConfigs = useMemo<ParamConfig[]>(() => {
    const keysByModel: Record<ModelType, string[]> = {
      corner: ["a", "b", "c"],
      cylinder: ["a", "b", "h"],
      complement: ["a", "b", "c"],
    };

    const activeKeys = keysByModel[modelType] ?? ["a", "b", "c"];

    return polyhedronSphereMeta
      .filter((meta) => activeKeys.includes(meta.key))
      .map((meta) => ({
        key: meta.key,
        label:
          modelType === "corner"
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
          <LeftPanelSection title="外接球三大模型选择">
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
                  补形长方体/柱体框架
                </label>
                <TabSwitcher
                  tabs={[
                    { key: "show", label: "显示补形框架" },
                    { key: "hide", label: "隐藏框架" },
                  ]}
                  value={showComplementFrame ? "show" : "hide"}
                  onChange={(v) => setShowComplementFrame(v === "show")}
                />
              </div>

              <div>
                <label className="text-xs text-neutral-500 mb-1 block font-medium">
                  外接球透明球壳
                </label>
                <TabSwitcher
                  tabs={[
                    { key: "show", label: "显示外接球" },
                    { key: "hide", label: "隐藏球壳" },
                  ]}
                  value={showSphere ? "show" : "hide"}
                  onChange={(v) => setShowSphere(v === "show")}
                />
              </div>
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
              onChange={(p) => setCameraPreset(p as any)}
            />
          </LeftPanelSection>
        </LeftPanel>
      }
      center={
        <ThreeDCanvas
          cameraPosition={cameraPosition}
          legend={
            <Legend3D
              title="外接球三大模型图例"
              items={[
                {
                  colorKey: "primary",
                  swatch: "area",
                  label: "几何主体/四面体",
                },
                {
                  colorKey: "secondary",
                  swatch: "line",
                  label: "补形长方体框架",
                },
                { colorKey: "sphereShell", swatch: "sphere", label: "外接球" },
                {
                  colorKey: "highlight",
                  swatch: "point",
                  label: "球心 O & 半径 R",
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
                : "补形模型"
          }外接球分析看板`}
        />
      }
    />
  );
}
