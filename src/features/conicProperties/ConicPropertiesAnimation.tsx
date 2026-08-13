import { useState, useMemo } from "react";
import { ThreePanel, AnimationSvgCanvas } from "@/components/Layout";
import {
  ParamControl,
  MathPanel,
  LeftPanel,
  LeftPanelSection,
  TabSwitcher,
  SelectGrid,
} from "@/components/UI";
import type { ParamConfig } from "@/components/UI";
import { useAnimationViewport, useSceneScale } from "@/hooks";
import { CANVAS_PRESETS } from "@/theme";
import { ConicPropertiesScene } from "./components/ConicPropertiesScene";
import { buildMathQuantities } from "@/data/mathQuantities";
import { defaultParams, paramMeta } from "@/data/registries/conicProperties";
import {
  deriveBFromEccentricity,
  calculateConicProperties,
  type ConicType,
} from "./math/conicProperties";

export function ConicPropertiesAnimation() {
  // 1. 研究模式
  const [studyMode, setStudyMode] = useState<
    "basicProperties" | "eccentricity" | "focusTriangle"
  >("basicProperties");

  // 2. 曲线类型
  const [conicType, setConicType] = useState<ConicType>("ellipse");

  // 3. 参数状态
  const [params, setParams] = useState({
    a: defaultParams.a,
    b: defaultParams.b,
    e: defaultParams.e,
    t: defaultParams.t,
  });

  // 4. 视口尺寸 Hook
  const { containerRef, canvasSize, vp } = useAnimationViewport({
    preset: CANVAS_PRESETS.full,
  });

  // 5. 坐标映射比例尺: X [-6, 6], Y [-4.5, 4.5]
  const scale = useSceneScale({
    vp,
    xRange: [-6, 6],
    yRange: [-4.5, 4.5],
  });

  // 6. 右屏看板数据
  const mathData = useMemo(() => {
    return buildMathQuantities("anim-conic-properties", params, {
      studyMode,
      conicType,
    });
  }, [params, studyMode, conicType]);

  // 7. 参数回调处理 (在 e 改变时自动倒推 b，在 a/b 改变时自动倒推 e)
  const handleParamChange = (key: string, value: number) => {
    setParams((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "e") {
        // 调节离心率 e -> 自动计算对应的 b
        next.b = deriveBFromEccentricity(conicType, next.a, value);
      } else if (key === "a" || key === "b") {
        // 调节 a 或 b -> 自动更新离心率 e
        const calc = calculateConicProperties(
          conicType,
          next.a,
          next.b,
          next.t,
        );
        next.e = calc.e;
      }
      return next;
    });
  };

  // 8. 重置参数
  const handleReset = () => {
    setParams({
      a: defaultParams.a,
      b: defaultParams.b,
      e: defaultParams.e,
      t: defaultParams.t,
    });
  };

  // 9. 切换圆锥曲线类型 handler
  const handleConicTypeChange = (newType: ConicType) => {
    setConicType(newType);
    setParams((prev) => {
      let nextB = prev.b;
      if (newType === "ellipse" && prev.b >= prev.a) {
        nextB = prev.a - 0.5;
      }
      const calc = calculateConicProperties(newType, prev.a, nextB, prev.t);
      return {
        ...prev,
        b: nextB,
        e: calc.e,
      };
    });
  };

  // 10. 左屏声明式参数配置按 activeMode 过滤
  const paramConfigs = useMemo<ParamConfig[]>(() => {
    const keysByMode: Record<string, string[]> = {
      basicProperties: ["a", "b", "t"],
      eccentricity: ["a", "e", "t"],
      focusTriangle: ["a", "b", "t"],
    };

    const activeKeys = keysByMode[studyMode] ?? Object.keys(paramMeta);

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
          min: key === "e" ? (conicType === "ellipse" ? 0.05 : 1.05) : meta.min,
          max: key === "e" ? (conicType === "ellipse" ? 0.98 : 2.8) : meta.max,
          step: meta.step ?? 0.1,
          description: meta.description,
          descriptionFormula: meta.descriptionFormula,
          importance: meta.importance,
          marks: meta.marks,
        };
      });
  }, [params, studyMode, conicType]);

  return (
    <ThreePanel
      left={
        <LeftPanel>
          <LeftPanelSection title="研究模式" subtitle="选择视角与圆锥曲线类型">
            <TabSwitcher
              tabs={[
                { key: "basicProperties", label: "几何特征" },
                { key: "eccentricity", label: "离心率演变" },
                { key: "focusTriangle", label: "焦点三角形" },
              ]}
              value={studyMode}
              onChange={(key) => setStudyMode(key as typeof studyMode)}
            />

            <div className="mt-3">
              <SelectGrid
                items={[
                  {
                    key: "ellipse",
                    label: "椭圆",
                    formula: "\\frac{x^2}{a^2}+\\frac{y^2}{b^2}=1",
                  },
                  {
                    key: "hyperbola",
                    label: "双曲线",
                    formula: "\\frac{x^2}{a^2}-\\frac{y^2}{b^2}=1",
                  },
                ]}
                value={conicType}
                onChange={(key) =>
                  handleConicTypeChange(key as typeof conicType)
                }
                columns={2}
              />
            </div>
          </LeftPanelSection>

          <LeftPanelSection
            title="参数调节"
            subtitle="拖动滑块观察图形与量值响应"
          >
            <ParamControl
              params={paramConfigs}
              onParamChange={handleParamChange}
              onReset={handleReset}
            />
          </LeftPanelSection>
        </LeftPanel>
      }
      center={
        <AnimationSvgCanvas
          containerRef={containerRef}
          transform={vp.transform}
        >
          <ConicPropertiesScene
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
          title="高考解析几何看板"
        />
      }
    />
  );
}
