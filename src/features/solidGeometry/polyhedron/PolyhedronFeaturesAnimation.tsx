import { useState, useMemo, useCallback } from "react";
import { ThreePanel } from "@/components/Layout/ThreePanel";
import { ThreeDCanvas } from "@/components/Layout/ThreeDCanvas";
import {
  LeftPanel,
  LeftPanelSection,
  ParamControl,
  MathPanel,
  TabSwitcher,
  TipCard,
} from "@/components/UI";
import type { ParamConfig } from "@/components/UI";
import { CameraRig, CameraFit, Legend3D } from "@/components/Math3D";
import type { LegendItem } from "@/components/Math3D";
import { use3DViewport, type CameraPreset } from "@/hooks/use3DViewport";
import { buildMathQuantities } from "@/data/mathQuantities";
import {
  defaultParams as solidDefaultParams,
  polyhedronFeaturesMeta,
} from "@/data/registries/solidGeometry";
import {
  FRUSTUM_A1_MARGIN,
  frustumA1UpperBound,
  frustumApexGuide,
  polyhedronSceneBounds,
} from "@/math3d/polyhedronFeatures";
import { MATH_COLORS } from "@/theme";
import { PolyhedronFeaturesScene } from "./PolyhedronFeaturesScene";

/** 参数域只有一处声明：`registries/solidGeometry.ts` 的 polyhedronFeaturesMeta。 */
const PARAM_DEFAULTS = solidDefaultParams.polyhedronFeatures;

export default function PolyhedronFeaturesAnimation() {
  const [mode, setMode] = useState<
    "prism" | "pyramid" | "frustum" | "equalVolume"
  >("prism");

  const [params, setParams] = useState<Record<string, number>>(() => ({
    ...PARAM_DEFAULTS,
  }));

  const { preset, viewToken, cameraPosition, setCameraPreset, controlsRef } =
    use3DViewport("iso");

  const metaByKey = useMemo(
    () => new Map(polyhedronFeaturesMeta.map((meta) => [meta.key, meta])),
    [],
  );

  /**
   * 由 registry 的 `paramMeta` 组装左屏参数控件：min/max/step/marks/label 全部来自
   * 单一数据源，页面只负责"当前模式要暴露哪几个键"与"个别键的动态上界"。
   * 键未登记时直接抛错，避免又出现"页面自建参数域、与 registry 悄悄漂移"。
   */
  const buildParam = useCallback(
    (key: string, patch: Partial<ParamConfig> = {}): ParamConfig => {
      const meta = metaByKey.get(key);
      if (!meta) {
        throw new Error(
          `参数 "${key}" 未在 registries/solidGeometry.polyhedronFeaturesMeta 登记`,
        );
      }
      return {
        key: meta.key,
        label: meta.label,
        labelFormula: meta.labelFormula,
        min: meta.min,
        max: meta.max,
        step: meta.step,
        marks: meta.marks,
        group: meta.group,
        value: params[key] ?? meta.defaultValue ?? 0,
        ...patch,
      };
    },
    [metaByKey, params],
  );

  const mathData = useMemo(
    () =>
      buildMathQuantities("anim-solid-polyhedron", params, {
        mode,
      }),
    [params, mode],
  );

  const paramConfigs = useMemo<ParamConfig[]>(() => {
    if (mode === "prism" || mode === "pyramid") {
      return [buildParam("a"), buildParam("h")];
    }
    if (mode === "frustum") {
      // 上底必须严格小于下底，否则 k→1 使补全大锥高 H 发散；
      // 动态上界会同时约束滑块、数字输入框与刻度（见 ParamControl 的 clamp 通道）。
      // 上界规则本身在数学层（与回归测试共用同一实现）。
      const a1Meta = metaByKey.get("a1");
      const a1Cap = a1Meta
        ? frustumA1UpperBound(params.a2 ?? PARAM_DEFAULTS.a2, {
            min: a1Meta.min,
            max: a1Meta.max,
          })
        : PARAM_DEFAULTS.a1;
      return [
        buildParam("a2"),
        buildParam("a1", {
          max: a1Cap,
          value: Math.min(params.a1 ?? PARAM_DEFAULTS.a1, a1Cap),
        }),
        buildParam("h", {
          labelFormula: `\\text{台体高 } \\color{${MATH_COLORS.paramTertiary}}{h}`,
        }),
      ];
    }
    return [
      buildParam("a", {
        labelFormula: `\\text{底面边 } \\color{${MATH_COLORS.paramPrimary}}{AB=a}`,
      }),
      buildParam("b", {
        labelFormula: `\\text{底面边 } \\color{${MATH_COLORS.paramSecondary}}{AC=b}`,
      }),
      buildParam("h", {
        labelFormula: `\\text{垂直棱 } \\color{${MATH_COLORS.paramTertiary}}{PA=h}`,
      }),
    ];
  }, [mode, buildParam, metaByKey, params]);

  const handleParamChange = (key: string, value: number) => {
    setParams((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "a2" && mode === "frustum") {
        const a1Meta = metaByKey.get("a1");
        const a1Cap = a1Meta
          ? frustumA1UpperBound(value, { min: a1Meta.min, max: a1Meta.max })
          : value - FRUSTUM_A1_MARGIN;
        if ((next.a1 ?? PARAM_DEFAULTS.a1) > a1Cap) {
          next.a1 = a1Cap;
        }
      }
      return next;
    });
  };

  const handleReset = () => {
    setParams({ ...PARAM_DEFAULTS });
  };

  /** 中屏内容包围盒（与 Scene 同源）——交给 CameraFit 保证关键装置不被裁出画布 */
  const sceneBounds = useMemo(
    () =>
      polyhedronSceneBounds(mode, {
        a: params.a ?? PARAM_DEFAULTS.a,
        b: params.b ?? PARAM_DEFAULTS.b,
        h: params.h ?? PARAM_DEFAULTS.h,
        a1: params.a1 ?? PARAM_DEFAULTS.a1,
        a2: params.a2 ?? PARAM_DEFAULTS.a2,
      }),
    [mode, params],
  );

  /** 棱台模式：补全大棱锥是否因 H 过远而按比例截断显示 */
  const apexGuide = useMemo(
    () =>
      mode === "frustum"
        ? frustumApexGuide(params.a2, params.a1, params.h)
        : null,
    [mode, params.a2, params.a1, params.h],
  );

  const tipData = useMemo(() => {
    if (mode === "prism") {
      return {
        background: "基本立体图形 · 棱柱结构特征与表面积体积",
        condition: "正四棱柱底面边长为 $a$，高为 $h$",
        question:
          "探究底面全等多边形平行与侧棱平行的几何特征，验证直棱柱全面积与体积计算公式。",
      };
    }
    if (mode === "pyramid") {
      return {
        background: "正棱锥几何性质 · 两个特征直角三角形",
        condition: "正四棱锥底面为边长 $a$ 的正方形，高 $PO = h$",
        question:
          "剖析由高、斜高、底面内切半径构成的 $\\text{Rt}\\triangle POE$ 与由高、侧棱、外接半径构成的 $\\text{Rt}\\triangle POA$，掌握高考求解空间角与侧面积的黄金工具。",
      };
    }
    if (mode === "frustum") {
      return {
        background: "台体体积推导 · 相似截割与大锥减小锥",
        condition: "棱台上下底面相似，边长分别为 $a_1, a_2$，高为 $h$",
        question:
          "动态观察还原大棱锥的过程，理解通过相似比展开化简导出通用台体体积公式 $V = \\frac{1}{3}h(S_1 + \\sqrt{S_1S_2} + S_2)$ 的严谨演绎过程。",
      };
    }
    return {
      background: "高考解答题通法 · 三棱锥等体积换底法求点面距",
      condition:
        "四面体 $P\\text{-}ABC$ 中 $PA \\perp \\text{底面 } ABC$，$\\angle BAC = 90^\\circ$",
      question:
        "无需建系求法向量，转换顶点利用 $V_{P\\text{-}ABC} = V_{B\\text{-}PAC}$ 快速反解点 $B$ 到侧面 $PAC$ 的垂直距离 $h_B$。",
    };
  }, [mode]);

  const legendItems = useMemo<LegendItem[]>(() => {
    if (mode === "prism") {
      return [
        { label: "平行底面", colorKey: "primary", swatch: "area" },
        { label: "底面多边形边", colorKey: "paramPrimary", swatch: "line" },
        { label: "相等侧棱", colorKey: "paramTertiary", swatch: "line" },
      ];
    }
    if (mode === "pyramid") {
      return [
        { label: "底面多边形", colorKey: "primary", swatch: "area" },
        { label: "棱锥高 PO", colorKey: "paramTertiary", swatch: "line" },
        { label: "侧面斜高 PE", colorKey: "paramSecondary", swatch: "line" },
        { label: "侧棱 PA", colorKey: "secondary", swatch: "line" },
      ];
    }
    if (mode === "frustum") {
      const items: LegendItem[] = [
        { label: "下底面 S₂", colorKey: "primary", swatch: "area" },
        { label: "上底面 S₁", colorKey: "paramSecondary", swatch: "area" },
        { label: "棱台侧棱", colorKey: "paramTertiary", swatch: "line" },
        { label: "补全大锥延长线", colorKey: "textMuted", swatch: "line" },
      ];
      if (apexGuide?.isTruncated) {
        // 延长线未画到真实顶点时必须显式说明，否则学生会把截断面误认为原锥顶点
        items.push({
          label: `延长线按比例截断：真实 H = ${apexGuide.trueHeight.toFixed(2)}（见右屏）`,
          colorKey: "textMuted",
          swatch: "line",
        });
      }
      return items;
    }
    return [
      { label: "原始底面 △ABC", colorKey: "primary", swatch: "area" },
      { label: "换底侧面 △PAC", colorKey: "paramSecondary", swatch: "area" },
      { label: "垂直侧棱 PA", colorKey: "paramTertiary", swatch: "line" },
    ];
  }, [mode, apexGuide]);

  return (
    <ThreePanel
      left={
        <LeftPanel>
          <LeftPanelSection title="多面体专题">
            <TabSwitcher
              tabs={[
                { key: "prism", label: "棱柱特征" },
                { key: "pyramid", label: "正棱锥性质" },
                { key: "frustum", label: "台体体积推导" },
                { key: "equalVolume", label: "等体积换底法" },
              ]}
              value={mode}
              onChange={(k) => setMode(k as typeof mode)}
            />
          </LeftPanelSection>

          <LeftPanelSection title="几何尺寸调节">
            <ParamControl
              params={paramConfigs}
              onParamChange={handleParamChange}
              onReset={handleReset}
            />
          </LeftPanelSection>

          <LeftPanelSection title="观察视角" compact>
            <TabSwitcher
              layout="horizontal"
              tabs={[
                { key: "iso", label: "立体" },
                { key: "front", label: "正视" },
                { key: "top", label: "俯视" },
                { key: "side", label: "侧视" },
              ]}
              value={preset}
              onChange={(p) => setCameraPreset(p as CameraPreset)}
            />
          </LeftPanelSection>

          <TipCard
            background={tipData.background}
            condition={tipData.condition}
            question={tipData.question}
          />
        </LeftPanel>
      }
      center={
        <ThreeDCanvas
          cameraPosition={cameraPosition}
          legend={<Legend3D title="图例" items={legendItems} />}
        >
          <CameraRig ref={controlsRef} />
          {/* 场景适配：h/a2 拉大时把相机退到"恰好装得下"，杜绝关键装置被裁出画布 */}
          <CameraFit bounds={sceneBounds} token={viewToken} />
          <PolyhedronFeaturesScene
            mode={mode}
            a={params.a ?? 3}
            b={params.b ?? 4}
            h={params.h ?? 4}
            a1={params.a1 ?? 2}
            a2={params.a2 ?? 4}
          />
        </ThreeDCanvas>
      }
      right={<MathPanel {...mathData} title="多面体特征与台体体积看板" />}
    />
  );
}
