import { useState, useMemo, useCallback } from "react";
import { ThreePanel } from "@/components/Layout/ThreePanel";
import { ThreeDCanvas } from "@/components/Layout/ThreeDCanvas";
import {
  LeftPanel,
  LeftPanelSection,
  ParamControl,
  MathPanel,
  TabSwitcher,
  SelectGrid,
  TipCard,
} from "@/components/UI";
import type { ParamConfig } from "@/components/UI";
import { CameraRig, CameraFit, Legend3D } from "@/components/Math3D";
import type { LegendItem } from "@/components/Math3D";
import { use3DViewport, type CameraPreset } from "@/hooks/use3DViewport";
import { buildMathQuantities } from "@/data/mathQuantities";
import {
  defaultParams as solidDefaultParams,
  solidAxiomsMeta,
} from "@/data/registries/solidGeometry";
import { solidAxiomsSceneBounds } from "@/math3d/solidAxioms";
import { SolidAxiomsScene } from "./SolidAxiomsScene";

/** 参数域只有一处声明：`registries/solidGeometry.ts` 的 solidAxiomsMeta。 */
const PARAM_DEFAULTS = solidDefaultParams.solidAxioms;

type AxiomsMode = "determination" | "intersection" | "spatialLines";
type AxiomsSubType =
  "threePoints" | "lineAndPoint" | "intersectingLines" | "parallelLines";

export default function SolidAxiomsAnimation() {
  const [mode, setMode] = useState<AxiomsMode>("determination");
  const [subType, setSubType] = useState<AxiomsSubType>("threePoints");
  /** 等角定理的"对应边反向"开关：关闭时展示"两角相等"，开启时展示"两角互补" */
  const [flipSecondRay, setFlipSecondRay] = useState(false);

  const [params, setParams] = useState<Record<string, number>>(() => ({
    ...PARAM_DEFAULTS,
  }));

  const { preset, viewToken, cameraPosition, setCameraPreset, controlsRef } =
    use3DViewport("iso");

  const metaByKey = useMemo(
    () => new Map(solidAxiomsMeta.map((meta) => [meta.key, meta])),
    [],
  );

  /**
   * 由 registry 的 `paramMeta` 组装左屏参数控件：min/max/step/marks/label 全部来自
   * 单一数据源；键未登记时直接抛错，避免"页面自建参数域、与 registry 悄悄漂移"。
   */
  const buildParam = useCallback(
    (key: string, patch: Partial<ParamConfig> = {}): ParamConfig => {
      const meta = metaByKey.get(key);
      if (!meta) {
        throw new Error(
          `参数 "${key}" 未在 registries/solidGeometry.solidAxiomsMeta 登记`,
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
      buildMathQuantities("anim-solid-axioms", params, {
        mode,
        subType,
        flipSecondRay,
      }),
    [params, mode, subType, flipSecondRay],
  );

  const paramConfigs = useMemo<ParamConfig[]>(() => {
    if (mode === "determination") return [buildParam("tParam")];
    if (mode === "intersection") return [buildParam("tiltDeg")];
    return [buildParam("angleParamDeg")];
  }, [mode, buildParam]);

  const handleParamChange = (key: string, value: number) => {
    setParams((prev) => ({ ...prev, [key]: value }));
  };

  const handleReset = () => {
    setParams({ ...PARAM_DEFAULTS });
  };

  /**
   * 切模式/切构型时把参数复位到当前模式的默认值。
   * 否则 `tParam` / `tiltDeg` / `angleParamDeg` 会跨模式残留，
   * 造成"进入新专题时看板已是极端值"的观感问题。
   */
  const handleModeChange = (next: AxiomsMode) => {
    setMode(next);
    setParams({ ...PARAM_DEFAULTS });
    setFlipSecondRay(false);
  };

  const handleSubTypeChange = (next: AxiomsSubType) => {
    setSubType(next);
    setParams({ ...PARAM_DEFAULTS });
  };

  /** 中屏内容包围盒（与 Scene 同一份 `buildAxiomsElements` 输出）→ 交给 CameraFit 取景 */
  const sceneBounds = useMemo(
    () =>
      solidAxiomsSceneBounds(mode, subType, {
        tParam: params.tParam ?? PARAM_DEFAULTS.tParam,
        tiltDeg: params.tiltDeg ?? PARAM_DEFAULTS.tiltDeg,
        angleParamDeg: params.angleParamDeg ?? PARAM_DEFAULTS.angleParamDeg,
        flipSecondRay,
      }),
    [mode, subType, params, flipSecondRay],
  );

  const tipData = useMemo(() => {
    if (mode === "determination") {
      return {
        background: "空间点线面公理体系 · 唯一确定平面的充要条件",
        condition:
          subType === "threePoints"
            ? "已知三点 $A, B, C$ 不在同一直线上"
            : subType === "lineAndPoint"
              ? "已知直线 $l$ 和直线外一点 $C$"
              : subType === "intersectingLines"
                ? "已知两条相交直线 $l_1 \\cap l_2 = A$"
                : "已知两条平行直线 $l_1 \\parallel l_2$",
        question:
          "调节动点 $P$ 的高度偏移量 $\\Delta z$，探究四点共面成立的充要条件，掌握基本事实 1 与三大推论在高考命题真假判断中的规范应用。",
      };
    }
    if (mode === "intersection") {
      return {
        background: "基本事实 3 · 两平面公共交线唯一定理",
        condition: "两平面 $\\alpha$ 与 $\\beta$ 存在至少一个公共点 $P$",
        question:
          "探究为何两相交平面的交集必定是一条直线，理解基本事实 3 在多面体截面辅助线作图与三线共点证明中的核心纽带作用。",
      };
    }
    return {
      background: "基本事实 4 与空间等角定理 · 异面直线所成角",
      condition:
        "空间中角 $\\angle AOB$ 与 $\\angle A'O'B'$ 的两边分别对应平行",
      question: flipSecondRay
        ? "两对应边平行且射线方向相反时，$\\angle A'O'B' = 180^\\circ - \\angle AOB$ —— 这就是等角定理中「或互补」的那一半。"
        : "两对应边平行且射线方向相同时，$\\angle A'O'B' = \\angle AOB$ —— 这是等角定理中「相等」的那一半；切换为「反向」可查看互补情形。",
    };
  }, [mode, subType, flipSecondRay]);

  const legendItems = useMemo<LegendItem[]>(() => {
    if (mode === "determination") {
      return [
        { label: "基准确定平面 α", colorKey: "primary", swatch: "area" },
        { label: "确定平面的基准线", colorKey: "paramPrimary", swatch: "line" },
        { label: "测试动点 P", colorKey: "highlight", swatch: "point" },
      ];
    }
    if (mode === "intersection") {
      return [
        { label: "水平基准面 α", colorKey: "primary", swatch: "area" },
        { label: "倾斜交截面 β", colorKey: "paramSecondary", swatch: "area" },
        { label: "唯一公共交线 l", colorKey: "highlight", swatch: "line" },
      ];
    }
    return [
      { label: "空间基准角 ∠AOB", colorKey: "paramPrimary", swatch: "line" },
      {
        label: flipSecondRay
          ? "平移角 ∠A'O'B'（对应边反向 ⇒ 互补）"
          : "平移角 ∠A'O'B'（对应边同向 ⇒ 相等）",
        colorKey: "paramSecondary",
        swatch: "line",
      },
      { label: "平行传递性直线 l₃", colorKey: "highlight", swatch: "line" },
    ];
  }, [mode, flipSecondRay]);

  return (
    <ThreePanel
      left={
        <LeftPanel>
          <LeftPanelSection title="公理探究专题">
            <TabSwitcher
              tabs={[
                { key: "determination", label: "平面的确定" },
                { key: "intersection", label: "两面相交交线" },
                { key: "spatialLines", label: "平行与等角" },
              ]}
              value={mode}
              onChange={(k) => handleModeChange(k as AxiomsMode)}
            />
          </LeftPanelSection>

          {mode === "determination" && (
            <LeftPanelSection title="确定平面构型分类">
              <SelectGrid
                items={[
                  { key: "threePoints", label: "不共线三点" },
                  { key: "lineAndPoint", label: "线与线外一点" },
                  { key: "intersectingLines", label: "两条相交直线" },
                  { key: "parallelLines", label: "两条平行直线" },
                ]}
                value={subType}
                onChange={(k) => handleSubTypeChange(k as AxiomsSubType)}
              />
            </LeftPanelSection>
          )}

          {mode === "spatialLines" && (
            <LeftPanelSection title="对应边方向（等角定理两分支）">
              <TabSwitcher
                layout="horizontal"
                tabs={[
                  { key: "same", label: "同向 · 两角相等" },
                  { key: "opposite", label: "反向 · 两角互补" },
                ]}
                value={flipSecondRay ? "opposite" : "same"}
                onChange={(k) => setFlipSecondRay(k === "opposite")}
              />
            </LeftPanelSection>
          )}

          <LeftPanelSection title="空间几何参数调节">
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
          {/* 场景适配：α 面片与三条平行线跨度变化时保证全部装进画布 */}
          <CameraFit bounds={sceneBounds} token={viewToken} />
          <SolidAxiomsScene
            mode={mode}
            subType={subType}
            tParam={params.tParam ?? PARAM_DEFAULTS.tParam}
            tiltDeg={params.tiltDeg ?? PARAM_DEFAULTS.tiltDeg}
            angleParamDeg={params.angleParamDeg ?? PARAM_DEFAULTS.angleParamDeg}
            flipSecondRay={flipSecondRay}
          />
        </ThreeDCanvas>
      }
      right={<MathPanel {...mathData} title="空间公理与基本事实看板" />}
    />
  );
}
