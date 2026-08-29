/**
 * src/features/conicDefinition/ConicDefinitionAnimation.tsx
 * 高中数学圆锥曲线定义与特征实验室
 * 严格遵循项目规范：
 * - 仅聚焦高考核心两大范式：第一定义 (和/差/准线) 与 统一定义 (离心率 e 焦准比法)
 * - 左屏纯净声明式控制，杜绝冗余嵌套与杂乱线条
 * - 中屏纯净 SVG 画布，零多余虚线干扰
 * - 右屏标准 MathPanel 数据看板
 */

import { useState, useMemo } from "react";
import { ThreePanel, AnimationSvgCanvas } from "@/components/Layout";
import {
  ParamControl,
  MathPanel,
  LeftPanel,
  LeftPanelSection,
  TabSwitcher,
  SelectGrid,
  TipCard,
} from "@/components/UI";
import type { ParamConfig } from "@/components/UI";
import { useAnimationViewport, useSceneScale } from "@/hooks";
import { CANVAS_PRESETS } from "@/theme";
import { ConicDefinitionScene } from "./components/ConicDefinitionScene";
import { buildMathQuantities } from "@/data/mathQuantities";
import {
  defaultParams,
  paramMeta,
  conicPresetsByMode,
  firstDefPresetsByType,
} from "@/data/registries/conicDefinition";

export function ConicDefinitionAnimation() {
  // 研究模式: 'firstDef' (第一定义) | 'unifiedDef' (统一定义 e)
  const [studyMode, setStudyMode] = useState<"firstDef" | "unifiedDef">(
    "firstDef",
  );

  // 圆锥曲线子类型 (仅在第一定义下展开): 'ellipse' | 'hyperbola' | 'parabola'
  const [conicType, setConicType] = useState<
    "ellipse" | "hyperbola" | "parabola"
  >("ellipse");

  // 典型预设 key (默认 'free')
  const [activePreset, setActivePreset] = useState<string>("free");

  // 参数状态
  const [params, setParams] = useState({
    a: defaultParams.a as number,
    c: defaultParams.c as number,
    e: defaultParams.e as number,
    p: defaultParams.p as number,
    theta: defaultParams.theta as number,
  });

  // 视口尺寸测量与 Hook
  const { containerRef, canvasSize, vp } = useAnimationViewport({
    preset: CANVAS_PRESETS.full,
  });

  // 数学坐标系比例尺: X [-6, 6], Y [-4.5, 4.5]
  const scale = useSceneScale({
    vp,
    xRange: [-6, 6],
    yRange: [-4.5, 4.5],
  });

  // 当前模式的预设列表
  const currentPresets = useMemo(() => {
    if (studyMode === "firstDef") {
      return firstDefPresetsByType[conicType] || [];
    }
    return conicPresetsByMode[studyMode] || [];
  }, [studyMode, conicType]);

  // 右屏看板数据组装
  const mathData = useMemo(() => {
    return buildMathQuantities("anim-conic-definition", params, {
      studyMode,
      conicType,
    });
  }, [params, studyMode, conicType]);

  // 参数更新 (当在特定预设下联动从属参数，当在自由模式下直接更新)
  const handleParamChange = (key: string, value: number) => {
    setParams((prev) => {
      const next = {
        ...prev,
        [key]: value,
      };

      if (studyMode === "firstDef") {
        if (
          activePreset === "critical_degenerate" ||
          activePreset === "hyperbola_degenerate"
        ) {
          if (key === "a") next.c = value;
        } else if (activePreset === "equilateral_hyperbola") {
          if (key === "a") next.c = Number((value * Math.SQRT2).toFixed(2));
        } else if (activePreset === "wide_hyperbola") {
          if (key === "a") next.c = Number((value * 2).toFixed(2));
        } else {
          setActivePreset("free");
        }
      } else {
        if (activePreset !== "parabola_e") {
          setActivePreset("free");
        }
      }

      return next;
    });
  };

  // 典型预设切换
  const handlePresetSelect = (presetKey: string) => {
    setActivePreset(presetKey);
    const target = currentPresets.find((p) => p.key === presetKey);
    if (target) {
      if (target.conicType) {
        setConicType(target.conicType);
      }
      setParams((prev) => ({
        ...prev,
        ...target.params,
      }));
    }
  };

  // 模式切换
  const handleModeChange = (modeKey: string) => {
    const newMode = modeKey as typeof studyMode;
    setStudyMode(newMode);
    setActivePreset("free");
    if (newMode === "unifiedDef") {
      setParams((prev) => ({
        ...prev,
        e: 0.66,
        p: 2.0,
        theta: 0.8,
      }));
    } else {
      setParams((prev) => ({
        ...prev,
        a: conicType === "hyperbola" ? 2.0 : 3.0,
        c: conicType === "hyperbola" ? 3.0 : 2.0,
        p: 2.0,
        theta: conicType === "parabola" ? 3.14 : 0.8,
      }));
    }
  };

  // 参数重置
  const handleReset = () => {
    setActivePreset("free");
    setParams({
      a: defaultParams.a,
      c: defaultParams.c,
      e: defaultParams.e,
      p: defaultParams.p,
      theta: defaultParams.theta,
    });
  };

  // 左屏声明式参数过滤 (根据 activeMode 与预设降维过滤)
  const paramConfigs = useMemo<ParamConfig[]>(() => {
    let activeKeys: string[] = [];

    if (studyMode === "firstDef") {
      if (conicType === "parabola") {
        activeKeys = ["p", "theta"];
      } else {
        // 在退化或等轴双曲线等典型预设下，隐藏已绑定的焦距 c，仅保留长半轴 a 与动点参数 theta
        if (
          activePreset === "critical_degenerate" ||
          activePreset === "equilateral_hyperbola" ||
          activePreset === "wide_hyperbola" ||
          activePreset === "hyperbola_degenerate"
        ) {
          activeKeys = ["a", "theta"];
        } else {
          activeKeys = ["a", "c", "theta"];
        }
      }
    } else {
      // 统一定义：若为抛物线预设 (e=1 锁定)，隐藏离心率 e 滑块
      if (activePreset === "parabola_e") {
        activeKeys = ["p", "theta"];
      } else {
        activeKeys = ["e", "p", "theta"];
      }
    }

    return activeKeys
      .filter((key) => key in paramMeta)
      .map((key) => {
        const meta = paramMeta[key];
        return {
          key,
          label: meta.label,
          labelFormula: meta.labelFormula,
          value:
            (params as Record<string, number>)[key] ?? meta.defaultValue ?? 0,
          min: meta.min,
          max: meta.max,
          step: meta.step ?? 0.1,
          description: meta.description,
          descriptionFormula: meta.descriptionFormula,
          importance: meta.importance,
          marks: meta.marks,
        };
      });
  }, [params, studyMode, conicType, activePreset]);

  // 左屏教学提示与题设导引（说明初始条件与探究设问）
  const tipConfig = useMemo(() => {
    if (activePreset !== "free") {
      if (studyMode === "firstDef") {
        if (activePreset === "critical_degenerate") {
          return {
            variant: "danger" as const,
            badge: "高考退化临界 · 椭圆退化为线段",
            condition: "动点 P 到两焦点的距离之和等于两焦点间距。",
            question:
              "为什么当距离之和等于焦距时，动点轨迹退化为线段而非椭圆？",
          };
        }
        if (activePreset === "equilateral_hyperbola") {
          return {
            variant: "primary" as const,
            badge: "高考经典 · 等轴双曲线",
            condition: "双曲线实轴长与虚轴长相等，渐近线互相垂直。",
            question: "如何证明等轴双曲线的离心率为定值，且两渐近线互相垂直？",
          };
        }
        if (activePreset === "hyperbola_degenerate") {
          return {
            variant: "danger" as const,
            badge: "高考退化临界 · 双曲线退化为射线",
            condition: "动点 P 到两焦点的距离之差绝对值等于两焦点间距。",
            question:
              "为什么当距离之差等于焦距时，动点轨迹退化为两条射线而非双曲线？",
          };
        }
      } else {
        if (activePreset === "parabola_e") {
          return {
            variant: "warning" as const,
            badge: "高考经典 · 统一定义抛物线形态",
            condition: "动点到焦点的距离与到准线的距离严格相等（焦准比为 1）。",
            question:
              "离心率等于 1 时，曲线形态如何由封闭椭圆演变为开口无限延伸的抛物线？",
          };
        }
      }
    }

    if (studyMode === "firstDef") {
      if (conicType === "ellipse") {
        return {
          variant: "info" as const,
          badge: "椭圆第一定义 · 距离和为常数",
          condition:
            "平面内动点 P 到两定点 F₁, F₂ 的距离之和为大于焦距的常数 2a。",
          question:
            "如何由距离之和建立椭圆轨迹方程，并探究常数和与焦距大小关系对形态的影响？",
        };
      }
      if (conicType === "hyperbola") {
        return {
          variant: "warning" as const,
          badge: "双曲线第一定义 · 距离差为常数",
          condition:
            "平面内动点 P 到两定点 F₁, F₂ 的距离之差绝对值为小于焦距的正实数 2a。",
          question:
            "为什么要取距离差的绝对值？绝对值如何决定双曲线的左右两个分支？",
        };
      }
      return {
        variant: "primary" as const,
        badge: "抛物线定义 · 到定点等于到定直线",
        condition:
          "平面内动点 P 到定焦点 F 的距离与到定准线 l 的垂直距离相等。",
        question:
          "如何利用抛物线定义实现折线距离最值问题中的焦半径与准线转化？",
      };
    }
    return {
      variant: "danger" as const,
      badge: "圆锥曲线统一定义 · 焦准比法",
      condition:
        "平面内动点 P 到定焦点 F 的距离与到定准线 l 的距离之比为常数 e。",
      question:
        "探究离心率 e 在小于 1、等于 1、大于 1 时，如何统一决定曲线的几何形态？",
    };
  }, [studyMode, conicType, activePreset]);

  return (
    <ThreePanel
      left={
        <LeftPanel>
          <LeftPanelSection title="定义与研究模式">
            <TabSwitcher
              tabs={[
                { key: "firstDef", label: "第一定义 (距离和差)" },
                { key: "unifiedDef", label: "统一定义 (离心率e)" },
              ]}
              value={studyMode}
              onChange={handleModeChange}
            />

            {/* 仅在第一定义下展示曲线类型切换 */}
            {studyMode === "firstDef" && (
              <div className="mt-3">
                <SelectGrid
                  items={[
                    { key: "ellipse", label: "椭圆" },
                    { key: "hyperbola", label: "双曲线" },
                    { key: "parabola", label: "抛物线" },
                  ]}
                  value={conicType}
                  onChange={(key) => {
                    const newType = key as typeof conicType;
                    setConicType(newType);
                    setActivePreset("free");
                    if (newType === "ellipse" && params.a <= params.c) {
                      setParams((prev) => ({ ...prev, a: 3.0, c: 2.0 }));
                    } else if (
                      newType === "hyperbola" &&
                      params.c <= params.a
                    ) {
                      setParams((prev) => ({ ...prev, a: 2.0, c: 3.0 }));
                    }
                  }}
                  columns={3}
                />
              </div>
            )}
          </LeftPanelSection>

          {/* 黄金 2×2 典型预设 */}
          <LeftPanelSection title="典型高考预设">
            <SelectGrid
              items={currentPresets.map((p) => ({
                key: p.key,
                label: p.label,
                formula: p.formula,
                description: p.description,
              }))}
              value={activePreset}
              onChange={handlePresetSelect}
              columns={2}
            />
          </LeftPanelSection>

          <LeftPanelSection title="参数调节">
            <ParamControl
              params={paramConfigs}
              onParamChange={handleParamChange}
              onReset={handleReset}
            />
          </LeftPanelSection>

          {/* 教学提示与题设导引（置于参数调节下方） */}
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
        <AnimationSvgCanvas
          containerRef={containerRef}
          transform={vp.transform}
        >
          <ConicDefinitionScene
            params={params}
            scale={scale}
            vp={vp}
            fontScale={canvasSize.font}
            studyMode={studyMode}
            conicType={conicType}
            onParamChange={handleParamChange}
          />
        </AnimationSvgCanvas>
      }
      right={
        <MathPanel
          quantities={mathData.quantities}
          theorems={mathData.theorems}
          gaokaoPoints={mathData.gaokaoPoints}
          warnings={mathData.warnings}
          mnemonic={mathData.mnemonic}
          title="圆锥曲线定义看板"
        />
      }
    />
  );
}
