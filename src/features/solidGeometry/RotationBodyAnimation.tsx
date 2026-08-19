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
  TipCard,
  KatexFormula,
} from "@/components/UI";
import type { ParamConfig } from "@/components/UI";
import {
  Scene3DGrid,
  CameraRig,
  Legend3D,
  ThreeViewsPanel,
  ModeSwitchOverlay3D,
} from "@/components/Math3D";
import type { LegendItem, InteractionMode3D } from "@/components/Math3D";
import { RotationSweep, SphereCutSection } from "@/components/Math3D/solids";
import { use3DViewport, type CameraPreset } from "@/hooks/use3DViewport";
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

type FeatureMode = "generation" | "section" | "sphereCut";

export default function RotationBodyAnimation() {
  const [shape, setShape] = useState<ShapeType>("rectangle");
  const [featureMode, setFeatureMode] = useState<FeatureMode>("generation");
  const [interactionMode, setInteractionMode] =
    useState<InteractionMode3D>("orbit");
  const [params, setParams] = useState<Record<string, number>>({
    r1: 1.5,
    r2: 0.8,
    height: 3,
    sweepAngleDeg: 360,
    cutDistance: 0.8,
  });
  const [autoPlay, setAutoPlay] = useState(false);
  const [displayMode, setDisplayMode] = useState<"3d" | "orthographic">("3d");
  const { preset, cameraPosition, setCameraPreset, controlsRef } =
    use3DViewport("iso");
  const timerRef = useRef<number | null>(null);

  // 自动播放：定时递增扫描角度，模拟"旋转生成"动画
  useEffect(() => {
    if (autoPlay) {
      timerRef.current = window.setInterval(() => {
        setParams((p) => {
          const next = p.sweepAngleDeg + 4;
          if (next > 360) {
            // 完成一整圈扫掠后定格在 360° 并自动完成演示
            setAutoPlay(false);
            return { ...p, sweepAngleDeg: 360 };
          }
          return { ...p, sweepAngleDeg: next };
        });
      }, 30);
    }
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, [autoPlay]);

  const toggleAutoPlay = () => {
    setAutoPlay((prev) => {
      if (!prev) {
        // 开始播放：如果已经在 360°，从 0° 重新开始流畅扫掠
        setParams((p) => ({
          ...p,
          sweepAngleDeg: p.sweepAngleDeg >= 359 ? 0 : p.sweepAngleDeg,
        }));
      }
      return !prev;
    });
  };

  const handleParamChange = (key: string, value: number) => {
    if (key === "sweepAngleDeg" && autoPlay) {
      setAutoPlay(false);
    }
    setParams((prev) => ({ ...prev, [key]: value }));
  };

  const handleReset = () => {
    setParams({
      r1: 1.5,
      r2: 0.8,
      height: 3,
      sweepAngleDeg: 360,
      cutDistance: 0.8,
    });
    setAutoPlay(false);
  };

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
      buildMathQuantities(
        "anim-solid-rotation-body",
        {
          ...params,
          shape: shape as unknown as number,
        },
        { shape, mode: featureMode },
      ),
    [params, shape, featureMode],
  );

  // 根据当前形状和探究模式过滤参数
  const paramConfigs = useMemo<ParamConfig[]>(() => {
    const isSphere = shape === "semicircle";
    const isTrapezoid = shape === "rightTrapezoid";

    return rotationBodyMeta
      .filter((meta) => {
        // 圆台上底半径 r2 仅在直角梯形时展示
        if (meta.key === "r2" && !isTrapezoid) return false;
        // 高度 h 在球体时由半径 R 决定，不展示独立高滑块
        if (meta.key === "height" && isSphere) return false;
        // 扫掠角仅在 generation 模式有效
        if (meta.key === "sweepAngleDeg" && featureMode !== "generation") {
          return false;
        }
        // 球心距 d 仅在球体且 sphereCut 模式展示
        if (meta.key === "cutDistance") {
          return isSphere && featureMode === "sphereCut";
        }
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
        importance: meta.importance,
        marks: meta.marks,
      }));
  }, [params, shape, featureMode]);

  // 可选的探究模式 Tab
  const modeTabs = useMemo(() => {
    const base = [
      { key: "generation", label: "旋转生成" },
      { key: "section", label: "轴截面降维" },
    ];
    if (shape === "semicircle") {
      base.push({ key: "sphereCut", label: "球截面小圆模型" });
    }
    return base;
  }, [shape]);

  // 图例配置
  const legendItems = useMemo<LegendItem[]>(() => {
    if (featureMode === "sphereCut") {
      return [
        {
          colorKey: "paramPrimary",
          swatch: "line",
          label: "球半径 R",
        },
        {
          colorKey: "paramSecondary",
          swatch: "line",
          label: "球心距 d",
        },
        {
          colorKey: "paramTertiary",
          swatch: "line",
          label: "截面半径 r_截",
        },
        {
          colorKey: "secondary",
          swatch: "area",
          label: "截面小圆",
        },
      ];
    }

    const items: LegendItem[] = [
      {
        colorKey: "highlight",
        swatch: "area",
        label: "母线 / 生成面",
      },
      {
        colorKey: "primary",
        swatch: "area",
        label: "已生成的旋转体",
      },
      {
        colorKey: "axis3D_Z",
        swatch: "dash",
        label: "旋转轴",
      },
    ];

    if (featureMode === "section") {
      items.push({
        colorKey: "accent",
        swatch: "area",
        label: "轴截面 (2D 降维)",
      });
    }

    return items;
  }, [featureMode]);

  return (
    <ThreePanel
      left={
        <LeftPanel>
          {/* 1. 探究模式选择 */}
          <LeftPanelSection title="探究模式">
            <TabSwitcher
              tabs={modeTabs}
              value={featureMode}
              onChange={(k) => {
                const nextMode = k as FeatureMode;
                setFeatureMode(nextMode);
                if (nextMode === "sphereCut" && shape !== "semicircle") {
                  setShape("semicircle");
                }
              }}
            />
          </LeftPanelSection>

          {/* 2. 旋转体模型选择 */}
          <LeftPanelSection title="几何体模型">
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
                { key: "semicircle", label: "半圆", description: "→ 球体" },
              ]}
              value={shape}
              onChange={(k) => {
                const nextShape = k as ShapeType;
                setShape(nextShape);
                if (nextShape !== "semicircle" && featureMode === "sphereCut") {
                  setFeatureMode("generation");
                }
                setParams((p) => ({ ...p, sweepAngleDeg: 360 }));
              }}
              variant="filled"
              columns={2}
            />
          </LeftPanelSection>

          {/* 3. 参数调节 */}
          <LeftPanelSection title="参数调节">
            <ParamControl
              params={paramConfigs}
              onParamChange={handleParamChange}
              onReset={handleReset}
            />
            {featureMode === "generation" && (
              <Button
                variant={autoPlay ? "primary" : "secondary"}
                size="sm"
                className="w-full mt-2.5"
                onClick={toggleAutoPlay}
              >
                {autoPlay ? "停止自动演示" : "自动演示旋转生成"}
              </Button>
            )}
          </LeftPanelSection>

          {/* 4. 教学提示 */}
          {featureMode === "section" && (
            <LeftPanelSection title="教学提示" compact>
              <TipCard variant="warning">
                <span className="font-bold">轴截面法</span>：过旋转轴截面将 3D
                问题降维为 2D 对称平面几何图形快速求解。
              </TipCard>
            </LeftPanelSection>
          )}

          {featureMode === "sphereCut" && (
            <LeftPanelSection title="教学提示" compact>
              <TipCard variant="info">
                <span className="font-bold">球截面小圆</span>：球心距{" "}
                <KatexFormula formula="d" mode="inline" />
                、截面半径 <KatexFormula
                  formula="r"
                  mode="inline"
                /> 与球半径 <KatexFormula formula="R" mode="inline" />{" "}
                满足勾股定理：
                <KatexFormula formula="R^2 = d^2 + r^2" mode="inline" />。
              </TipCard>
            </LeftPanelSection>
          )}

          {/* 5. 视图与视角 */}
          <LeftPanelSection title="视图与视角">
            <div className="space-y-2">
              <TabSwitcher
                layout="horizontal"
                tabs={[
                  { key: "3d", label: "3D 直观图" },
                  { key: "orthographic", label: "2D 三视图" },
                ]}
                value={displayMode}
                onChange={(k) => setDisplayMode(k as "3d" | "orthographic")}
              />
              {displayMode === "3d" && (
                <>
                  {shape === "semicircle" && featureMode === "sphereCut" && (
                    <TabSwitcher
                      layout="horizontal"
                      tabs={[
                        { key: "orbit", label: "🔄 视角漫游" },
                        { key: "drag", label: "👆 动点交互" },
                      ]}
                      value={interactionMode}
                      onChange={(m) =>
                        setInteractionMode(m as InteractionMode3D)
                      }
                    />
                  )}
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
                </>
              )}
            </div>
          </LeftPanelSection>
        </LeftPanel>
      }
      center={
        displayMode === "3d" ? (
          <ThreeDCanvas
            cameraPosition={cameraPosition}
            frameloop={autoPlay ? "always" : "demand"}
            legend={<Legend3D title="图例" items={legendItems} />}
            overlay={
              shape === "semicircle" && featureMode === "sphereCut" ? (
                <ModeSwitchOverlay3D
                  mode={interactionMode}
                  onModeChange={setInteractionMode}
                  pointCount={1}
                />
              ) : undefined
            }
          >
            <CameraRig
              ref={controlsRef}
              enabled={
                interactionMode === "orbit" ||
                shape !== "semicircle" ||
                featureMode !== "sphereCut"
              }
            />
            <Scene3DGrid size={4} />

            {shape === "semicircle" && featureMode === "sphereCut" ? (
              <SphereCutSection
                radius={params.r1}
                cutDistance={params.cutDistance}
                draggable={interactionMode === "drag"}
                onDragCutDistance={(d) => handleParamChange("cutDistance", d)}
              />
            ) : (
              <RotationSweep
                profile={profile}
                sweepAngleDeg={
                  featureMode === "generation" ? params.sweepAngleDeg : 360
                }
                axisHeight={params.height}
                hasTopCap={shape === "rectangle" || shape === "rightTrapezoid"}
                hasBottomCap={shape !== "semicircle"}
                showAxialSection={featureMode === "section"}
                showLabels={featureMode === "section"}
                r1={params.r1}
                r2={params.r2}
                height={params.height}
              />
            )}
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
          title="旋转体数学看板"
        />
      }
    />
  );
}
