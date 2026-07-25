import { useEffect, useMemo, useRef, useState } from "react";
import { ThreePanel } from "@/components/Layout/ThreePanel";
import { ThreeDCanvas } from "@/components/Layout/ThreeDCanvas";
import {
  LeftPanel,
  LeftPanelSection,
  ParamControl,
  MathPanel,
  SelectGrid,
} from "@/components/UI";
import type { ParamConfig } from "@/components/UI";
import { Scene3DGrid } from "@/components/Math3D/Scene3DGrid";
import { CameraRig } from "@/components/Math3D/CameraRig";
import { RotationSweep } from "@/components/Math3D/solids/RotationSweep";
import { Legend3D } from "@/components/Math3D/Legend3D";
import { ThreeViewsPanel } from "@/components/Math3D/ThreeViewsPanel";
import { use3DViewport } from "@/hooks/use3DViewport";
import { rotationBodyMeta } from "@/data/registries/solidGeometry";
import { buildMathQuantities } from "@/data/mathQuantities";
import {
  cylinderProfile,
  coneProfile,
  frustumProfile,
  sphereProfile,
} from "@/math3d/rotationProfiles";
import { buildSolidViews } from "./threeViews/buildSolidViews";
import type { SolidKind } from "./threeViews/buildSolidViews";

type ShapeType =
  "rectangle" | "rightTriangle" | "rightTrapezoid" | "semicircle";

export default function RotationBodyAnimation() {
  const [shape, setShape] = useState<ShapeType>("rectangle");
  const [params, setParams] = useState<Record<string, number>>({
    r1: 1.5,
    r2: 0.8,
    height: 3,
    sweepAngleDeg: 360,
  });
  const [autoPlay, setAutoPlay] = useState(false);
  const [displayMode, setDisplayMode] = useState<"3d" | "orthographic">("3d");
  const { cameraPosition, setCameraPreset, controlsRef } = use3DViewport("iso");
  const timerRef = useRef<number | null>(null);

  // 自动播放：定时递增扫描角度，模拟"旋转生成"动画
  useEffect(() => {
    if (autoPlay) {
      timerRef.current = window.setInterval(() => {
        setParams((p) => ({
          ...p,
          sweepAngleDeg: (p.sweepAngleDeg + 4) % 364,
        }));
      }, 40);
    }
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, [autoPlay]);

  const profile = useMemo(() => {
    switch (shape) {
      case "rectangle":
        return cylinderProfile(params.r1, params.height);
      case "rightTriangle":
        return coneProfile(params.r1, params.height);
      case "rightTrapezoid":
        return frustumProfile(params.r1, params.r2, params.height);
      case "semicircle":
        return sphereProfile(params.r1);
    }
  }, [shape, params.r1, params.r2, params.height]);

  const solidKind: SolidKind = useMemo(() => {
    switch (shape) {
      case "rectangle":
        return "cylinder";
      case "rightTriangle":
        return "cone";
      case "rightTrapezoid":
        return "frustum";
      case "semicircle":
        return "sphere";
    }
  }, [shape]);

  const solidViews = useMemo(
    () =>
      buildSolidViews(solidKind, {
        radius: params.r1,
        bottomRadius: params.r1,
        topRadius: params.r2,
        height: params.height,
      }),
    [solidKind, params.r1, params.r2, params.height],
  );

  const mathData = useMemo(
    () =>
      buildMathQuantities("anim-solid-rotation-body", {
        ...params,
        shape: shape as unknown as number,
      }),
    [params, shape],
  );

  const handleParamChange = (key: string, value: number) => {
    setParams((prev) => ({ ...prev, [key]: value }));
  };

  const handleReset = () => {
    setParams({ r1: 1.5, r2: 0.8, height: 3, sweepAngleDeg: 360 });
    setAutoPlay(false);
  };

  const paramConfigs = useMemo<ParamConfig[]>(
    () =>
      rotationBodyMeta
        .filter((meta) => {
          // 圆台特有参数 r2 仅在 rightTrapezoid 时显示
          if (meta.key === "r2" && shape !== "rightTrapezoid") return false;
          return true;
        })
        .map((meta) => ({
          key: meta.key,
          label: meta.label,
          value: params[meta.key] ?? meta.defaultValue ?? 0,
          min: meta.min,
          max: meta.max,
          step: meta.step ?? 0.1,
          description: meta.description,
        })),
    [params, shape],
  );

  return (
    <ThreePanel
      left={
        <LeftPanel>
          <LeftPanelSection
            title="母线形状选择"
            subtitle="选择旋转生成的平面图形"
          >
            <SelectGrid
              items={[
                { key: "rectangle", label: "矩形", description: "→ 圆柱" },
                {
                  key: "rightTriangle",
                  label: "直角三角形",
                  description: "→ 圆锥",
                },
                {
                  key: "rightTrapezoid",
                  label: "直角梯形",
                  description: "→ 圆台",
                },
                { key: "semicircle", label: "半圆", description: "→ 球" },
              ]}
              value={shape}
              onChange={(k) => {
                setShape(k as ShapeType);
                setParams((p) => ({ ...p, sweepAngleDeg: 360 }));
              }}
              variant="filled"
            />
          </LeftPanelSection>

          <LeftPanelSection
            title="参数调节"
            subtitle="调节旋转体尺寸与旋转角度"
          >
            <ParamControl
              params={paramConfigs}
              onParamChange={handleParamChange}
              onReset={handleReset}
            />
            <div className="mt-3">
              <button
                type="button"
                onClick={() => setAutoPlay((v) => !v)}
                className={[
                  "w-full py-2 text-xs font-semibold rounded-lg border-2 transition-all",
                  autoPlay
                    ? "bg-primary-500 text-white border-primary-500"
                    : "bg-white text-primary-600 border-primary-300 hover:bg-primary-50",
                ].join(" ")}
              >
                {autoPlay ? "停止自动演示" : "自动演示旋转生成"}
              </button>
            </div>
          </LeftPanelSection>

          <LeftPanelSection title="显示模式">
            <div className="flex gap-1 rounded-lg bg-slate-100 p-0.5">
              {[
                { key: "3d" as const, label: "3D 直观图" },
                { key: "orthographic" as const, label: "三视图" },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setDisplayMode(key)}
                  className={[
                    "flex-1 py-1.5 text-xs font-semibold rounded-md transition-all",
                    displayMode === key
                      ? "bg-white text-primary-600 shadow-sm"
                      : "text-slate-500 hover:text-slate-700",
                  ].join(" ")}
                >
                  {label}
                </button>
              ))}
            </div>
          </LeftPanelSection>

          {displayMode === "3d" && (
            <LeftPanelSection title="视角切换">
              <div className="flex gap-2">
                {(["iso", "front", "top", "side"] as const).map((p) => (
                  <button
                    key={p}
                    className="px-2 py-1 text-xs rounded bg-slate-100 hover:bg-slate-200 font-medium"
                    onClick={() => setCameraPreset(p)}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </LeftPanelSection>
          )}
        </LeftPanel>
      }
      center={
        displayMode === "3d" ? (
          <ThreeDCanvas
            cameraPosition={cameraPosition}
            frameloop={autoPlay ? "always" : "demand"}
            legend={
              <Legend3D
                title="图例"
                items={[
                  {
                    colorKey: "highlight",
                    swatch: "area",
                    label: "母线（平面图形）",
                  },
                  {
                    colorKey: "primary",
                    swatch: "area",
                    label: "已生成的旋转体",
                  },
                  { colorKey: "axis3D_Z", swatch: "dash", label: "旋转轴" },
                ]}
              />
            }
          >
            <CameraRig ref={controlsRef} />
            <Scene3DGrid size={4} />
            <RotationSweep
              profile={profile}
              sweepAngleDeg={params.sweepAngleDeg}
              axisHeight={params.height}
              hasTopCap={shape !== "semicircle"}
              hasBottomCap={shape !== "semicircle"}
            />
          </ThreeDCanvas>
        ) : (
          <ThreeViewsPanel
            views={solidViews.views}
            extent={solidViews.extent}
          />
        )
      }
      right={
        <MathPanel
          quantities={mathData.quantities}
          theorems={mathData.theorems}
          gaokaoPoints={mathData.gaokaoPoints}
          warnings={mathData.warnings}
          title="旋转体指标看板"
        />
      }
    />
  );
}
