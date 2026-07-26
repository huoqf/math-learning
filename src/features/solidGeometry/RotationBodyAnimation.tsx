import { useEffect, useMemo, useRef, useState } from "react";
import { ThreePanel } from "@/components/Layout/ThreePanel";
import { ThreeDCanvas } from "@/components/Layout/ThreeDCanvas";
import {
  LeftPanel,
  LeftPanelSection,
  ParamControl,
  MathPanel,
  SelectGrid,
  TabSwitcher,
  Button,
} from "@/components/UI";
import type { ParamConfig } from "@/components/UI";
import {
  Scene3DGrid,
  CameraRig,
  Legend3D,
  ThreeViewsPanel,
} from "@/components/Math3D";
import { RotationSweep } from "@/components/Math3D/solids";
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
  const { cameraPosition, controlsRef } = use3DViewport("iso");
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
          labelFormula: meta.labelFormula,
          value: params[meta.key] ?? meta.defaultValue ?? 0,
          min: meta.min,
          max: meta.max,
          step: meta.step ?? 0.1,
          description: meta.description,
          descriptionFormula: meta.descriptionFormula,
          importance: meta.importance as any,
          marks: meta.marks,
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
            <Button
              variant={autoPlay ? "primary" : "secondary"}
              size="sm"
              className="w-full mt-3"
              onClick={() => setAutoPlay((v) => !v)}
            >
              {autoPlay ? "停止自动演示" : "自动演示旋转生成"}
            </Button>
          </LeftPanelSection>

          <LeftPanelSection title="显示模式">
            <TabSwitcher
              tabs={[
                { key: "3d", label: "3D 直观图" },
                { key: "orthographic", label: "三视图" },
              ]}
              value={displayMode}
              onChange={(k) => setDisplayMode(k as "3d" | "orthographic")}
            />
          </LeftPanelSection>
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
