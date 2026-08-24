import { useState, useMemo, useCallback } from "react";
import { ThreePanel, AnimationSvgCanvas } from "@/components/Layout";
import {
  ParamControl,
  MathPanel,
  KatexFormula,
  LeftPanel,
  LeftPanelSection,
  SelectGrid,
} from "@/components/UI";
import type { ParamConfig } from "@/components/UI";
import { useAnimationViewport, useSceneScale } from "@/hooks";
import { CANVAS_PRESETS } from "@/theme";
import { LineCircleScene } from "./components/LineCircleScene";
import { buildMathQuantities } from "@/data/mathQuantities";
import { defaultParams, paramMeta } from "@/data/registries/lineCircle";
import { calculateLineCircle } from "@/math/lineCircle";

export type LineCircleStudyMode = "relation" | "chord" | "tangent" | "midpoint";
export type LineCirclePresetKey =
  "free" | "diameter" | "tangentCritical" | "minChord";

export function LineCircleAnimation() {
  // 1. 研究模式状态
  const [studyMode, setStudyMode] = useState<LineCircleStudyMode>("relation");

  // 2. 典型预设状态 (黄金2x2)
  const [preset, setPreset] = useState<LineCirclePresetKey>("free");

  // 3. 本地几何参数管理
  const [params, setParams] = useState<Record<string, number>>(() => ({
    a: defaultParams.a,
    b: defaultParams.b,
    r: defaultParams.r,
    k: defaultParams.k,
    m: defaultParams.m,
    px: defaultParams.px,
    py: defaultParams.py,
    mx: defaultParams.mx,
    my: defaultParams.my,
  }));

  // 4. 视口尺寸测量
  const { containerRef, canvasSize, vp } = useAnimationViewport({
    preset: CANVAS_PRESETS.full,
  });

  // 5. 直角坐标系比例尺 X [-7, 7], Y [-5, 5]
  const scale = useSceneScale({
    vp,
    xRange: [-7, 7],
    yRange: [-5, 5],
  });

  // 6. 数学量看板数据组装
  const mathData = useMemo(() => {
    return buildMathQuantities("anim-line-circle", params, { studyMode });
  }, [params, studyMode]);

  // 7. 纯数学模型中间量（用于悬浮卡片与预设计算）
  const calcRes = useMemo(
    () =>
      calculateLineCircle({
        a: params.a ?? defaultParams.a,
        b: params.b ?? defaultParams.b,
        r: params.r ?? defaultParams.r,
        k: params.k ?? defaultParams.k,
        m: params.m ?? defaultParams.m,
        px: params.px ?? defaultParams.px,
        py: params.py ?? defaultParams.py,
        mx: params.mx ?? defaultParams.mx,
        my: params.my ?? defaultParams.my,
      }),
    [params],
  );

  // 参数更新处理器（学生手动调整时自动回退为自由探究）
  const handleParamChange = useCallback((key: string, value: number) => {
    setPreset("free");
    setParams((prev) => ({
      ...prev,
      [key]: value,
    }));
  }, []);

  // 典型预设切换处理器
  const handlePresetSelect = useCallback(
    (key: LineCirclePresetKey) => {
      setPreset(key);
      if (key === "free") return;

      if (key === "diameter") {
        // 直径最大弦：令直线过圆心 C(a, b) => m = b - k*a
        const currentK = 0.5;
        const currentM = params.b - currentK * params.a;
        setParams((prev) => ({
          ...prev,
          k: currentK,
          m: Number(currentM.toFixed(2)),
        }));
      } else if (key === "tangentCritical") {
        // 临界相切：d = r => 直线 kx - y + m = 0, d = |k*a - b + m| / sqrt(1+k^2) = r
        // => m = b - k*a - r * sqrt(1+k^2)
        const currentK = 0.75;
        const offset = (params.r ?? 3.0) * Math.hypot(1, currentK);
        const currentM = (params.b ?? 0) - currentK * (params.a ?? 0) - offset;
        setParams((prev) => ({
          ...prev,
          k: currentK,
          m: Number(currentM.toFixed(2)),
        }));
      } else if (key === "minChord") {
        // 定点垂直最短弦：过定点 M(1, 1)，k = -(mx-a)/(my-b)
        const mx = 1.0;
        const my = 1.0;
        const dx = mx - params.a;
        const dy = my - params.b;
        const perpK = Math.abs(dy) > 1e-4 ? -dx / dy : 0;
        const perpM = my - perpK * mx;
        setParams((prev) => ({
          ...prev,
          mx,
          my,
          k: Number(perpK.toFixed(2)),
          m: Number(perpM.toFixed(2)),
        }));
      }
    },
    [params.a, params.b, params.r],
  );

  // 重置参数
  const handleReset = () => {
    setPreset("free");
    setParams({
      a: defaultParams.a,
      b: defaultParams.b,
      r: defaultParams.r,
      k: defaultParams.k,
      m: defaultParams.m,
      px: defaultParams.px,
      py: defaultParams.py,
      mx: defaultParams.mx,
      my: defaultParams.my,
    });
  };

  // 控制是否展开次要的圆心平移参数 (a, b)
  const [showCenterParams, setShowCenterParams] = useState(false);

  // 动态过滤与精简参数列表（严格遵循高中教学认知：对象化分组与主次分层）
  const paramConfigs = useMemo<ParamConfig[]>(() => {
    let modeKeyGroups: Array<{ group: string; keys: string[] }> = [];

    if (studyMode === "tangent") {
      modeKeyGroups = [
        { group: "圆外极点 P(x_P, y_P) 坐标", keys: ["px", "py"] },
        { group: "目标圆半径 r", keys: ["r"] },
      ];
    } else {
      modeKeyGroups = [
        { group: "直线斜截式参数 (k, m)", keys: ["k", "m"] },
        { group: "目标圆半径 r", keys: ["r"] },
      ];
    }

    if (showCenterParams) {
      modeKeyGroups.push({
        group: "圆心 C(a, b) 平移",
        keys: ["a", "b"],
      });
    }

    const configs: ParamConfig[] = [];
    modeKeyGroups.forEach(({ group, keys }) => {
      keys.forEach((key) => {
        if (key in paramMeta) {
          const meta = paramMeta[key];
          configs.push({
            key,
            label: meta.label,
            labelFormula: meta.labelFormula,
            value: params[key as keyof typeof params] ?? meta.defaultValue ?? 0,
            min: meta.min,
            max: meta.max,
            step: meta.step ?? 0.1,
            group,
            description: meta.description,
            descriptionFormula: meta.descriptionFormula,
            importance: meta.importance,
            marks: meta.marks,
          });
        }
      });
    });

    return configs;
  }, [params, studyMode, showCenterParams]);

  // 悬浮公式 KaTeX（严谨数学格式化，消除 0 项与 + - 瑕疵）
  const formulaLatex = useMemo(() => {
    const kVal = params.k ?? 0.75;
    const mVal = params.m ?? -1.0;
    const aVal = params.a ?? 0;
    const bVal = params.b ?? 0;
    const rVal = params.r ?? 3.0;

    // 格式化直线方程
    let lineStr = "";
    if (Math.abs(kVal) < 1e-4) {
      lineStr = `y = ${mVal.toFixed(1)}`;
    } else {
      const kStr =
        Math.abs(kVal - 1) < 1e-4
          ? "x"
          : Math.abs(kVal + 1) < 1e-4
            ? "-x"
            : `${kVal.toFixed(2)}x`;
      if (Math.abs(mVal) < 1e-4) {
        lineStr = `y = ${kStr}`;
      } else if (mVal > 0) {
        lineStr = `y = ${kStr} + ${mVal.toFixed(1)}`;
      } else {
        lineStr = `y = ${kStr} - ${Math.abs(mVal).toFixed(1)}`;
      }
    }

    // 格式化圆方程
    const xTerm =
      Math.abs(aVal) < 1e-4
        ? "x^2"
        : aVal > 0
          ? `(x - ${aVal.toFixed(1)})^2`
          : `(x + ${Math.abs(aVal).toFixed(1)})^2`;
    const yTerm =
      Math.abs(bVal) < 1e-4
        ? "y^2"
        : bVal > 0
          ? `(y - ${bVal.toFixed(1)})^2`
          : `(y + ${Math.abs(bVal).toFixed(1)})^2`;
    const circleStr = `${xTerm} + ${yTerm} = ${(rVal * rVal).toFixed(1)}`;

    if (studyMode === "relation") {
      if (calcRes.relation === "tangent") {
        return `\\begin{cases} C: ${circleStr} \\\\ l: ${lineStr} \\end{cases} \\quad d = r = ${rVal.toFixed(1)}, \\; \\Delta = 0 \\; (\\text{相切唯一公共点 } T)`;
      }
      return `\\begin{cases} C: ${circleStr} \\\\ l: ${lineStr} \\end{cases} \\quad d = ${calcRes.distance.toFixed(2)}, \\; r = ${rVal.toFixed(1)} \\implies ${calcRes.relationLabel}`;
    } else if (studyMode === "chord") {
      if (calcRes.relation === "disjoint") {
        return `\\text{直线与圆相离，无实数弦长} \\quad (d = ${calcRes.distance.toFixed(2)} > r = ${rVal.toFixed(1)})`;
      }
      if (calcRes.relation === "tangent") {
        return `\\text{相切临界状态，弦长退化为 } 0 \\quad (d = r = ${rVal.toFixed(1)})`;
      }
      return `L = 2\\sqrt{r^2 - d^2} = 2\\sqrt{${rVal.toFixed(1)}^2 - ${calcRes.distance.toFixed(2)}^2} = ${calcRes.chordLengthGeom.toFixed(2)}`;
    } else if (studyMode === "tangent") {
      if (calcRes.tangentLength !== undefined) {
        return `P(${params.px?.toFixed(1)}, ${params.py?.toFixed(1)}), \\; PT = \\sqrt{|PC|^2 - r^2} = ${calcRes.tangentLength.toFixed(2)}, \\; \\text{切点弦: } (x_P - a)(x - a) + (y_P - b)(y - b) = r^2`;
      }
      return `P(${params.px?.toFixed(1)}, ${params.py?.toFixed(1)}) \\text{ 在圆内或圆上，无法引两条切线}`;
    } else {
      return `\\text{垂径定理: } CH \\perp AB \\iff H \\text{ 为弦 } AB \\text{ 中点} \\quad (k_{CH} \\cdot k_{AB} = -1)`;
    }
  }, [params, studyMode, calcRes]);

  const panelTitle = useMemo(() => {
    switch (studyMode) {
      case "relation":
        return "位置关系判定看板";
      case "chord":
        return "相交弦长计算看板";
      case "tangent":
        return "切线与切线长看板";
      case "midpoint":
        return "垂径定理与弦中点看板";
    }
  }, [studyMode]);

  return (
    <ThreePanel
      left={
        <LeftPanel>
          {/* 1. 探究主题 Section */}
          <LeftPanelSection title="探究主题" subtitle="选择直线与圆探讨方向">
            <SelectGrid
              items={[
                { key: "relation", label: "位置关系与判定" },
                { key: "chord", label: "相交弦长与极值" },
                { key: "tangent", label: "切线长与切点弦" },
                { key: "midpoint", label: "垂径定理与中点" },
              ]}
              value={studyMode}
              onChange={(k) => {
                setStudyMode(k as LineCircleStudyMode);
                setPreset("free");
              }}
              variant="filled"
              columns={2}
            />
          </LeftPanelSection>

          {/* 2. 典型预设 Section (黄金2x2规范) */}
          <LeftPanelSection title="典型预设" subtitle="新高考经典几何构型">
            <SelectGrid
              items={[
                { key: "free", label: "自由探究", description: "全参数开放" },
                {
                  key: "diameter",
                  label: "过圆心最大弦",
                  description: "直线过圆心d=0",
                },
                {
                  key: "tangentCritical",
                  label: "临界切线状态",
                  description: "d=r切线Δ=0",
                },
                {
                  key: "minChord",
                  label: "垂直最短弦",
                  description: "垂直CM垂弦",
                },
              ]}
              value={preset}
              onChange={(k) => handlePresetSelect(k as LineCirclePresetKey)}
              variant="outline"
              columns={2}
            />
          </LeftPanelSection>

          {/* 3. 参数调节 Section */}
          <LeftPanelSection
            title="核心参数调节"
            subtitle="聚焦动直线与半径主参数"
          >
            <ParamControl
              params={paramConfigs}
              onParamChange={handleParamChange}
              onReset={handleReset}
            />

            {/* 展开/收起圆心平移辅助参数 (a, b) */}
            <div className="mt-3 pt-2.5 border-t border-neutral-100 flex items-center justify-between text-xs text-neutral-500">
              <span>圆心平移参数 (a, b)</span>
              <button
                type="button"
                onClick={() => setShowCenterParams((v) => !v)}
                className="text-blue-600 hover:text-blue-700 font-medium px-2 py-0.5 rounded bg-blue-50 hover:bg-blue-100 transition-colors cursor-pointer"
              >
                {showCenterParams ? "收起圆心参数" : "展开圆心参数"}
              </button>
            </div>
          </LeftPanelSection>
        </LeftPanel>
      }
      center={
        <div className="w-full h-full relative flex flex-col bg-white">
          {/* KaTeX 悬浮公式展示 */}
          <div className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur border border-neutral-200 rounded-lg px-3 py-1.5 shadow-sm max-w-[90%] overflow-x-auto">
            <KatexFormula formula={formulaLatex} mode="inline" />
          </div>

          {/* SVG 自适应画布 */}
          <AnimationSvgCanvas
            containerRef={containerRef}
            transform={vp.transform}
          >
            <LineCircleScene
              params={params}
              scale={scale}
              vp={vp}
              onParamChange={handleParamChange}
              fontScale={canvasSize.font}
              studyMode={studyMode}
            />
          </AnimationSvgCanvas>
        </div>
      }
      right={
        <MathPanel
          quantities={mathData.quantities}
          theorems={mathData.theorems}
          gaokaoPoints={mathData.gaokaoPoints}
          warnings={mathData.warnings}
          mnemonic={mathData.mnemonic}
          title={panelTitle}
        />
      }
    />
  );
}
