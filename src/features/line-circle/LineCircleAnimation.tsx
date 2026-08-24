import { useState, useMemo, useCallback } from "react";
import { ThreePanel, AnimationSvgCanvas } from "@/components/Layout";
import {
  ParamControl,
  MathPanel,
  KatexFormula,
  LeftPanel,
  LeftPanelSection,
  SelectGrid,
  TipCard,
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
      const pxVal = params.px ?? 0;
      const pyVal = params.py ?? 0;
      return `\\begin{cases} C: ${circleStr} \\\\ P: (${pxVal.toFixed(1)}, ${pyVal.toFixed(1)}) \\end{cases} \\quad L_{\\text{切线}} = ${calcRes.tangentLength?.toFixed(2) ?? "0"}`;
    } else {
      return `\\text{垂径定理: } CH \\perp AB \\iff H \\text{ 为弦 } AB \\text{ 中点} \\quad (k_{CH} \\cdot k_{AB} = -1)`;
    }
  }, [params, studyMode, calcRes]);

  // 左屏教学提示与题设导引（说明初始条件、设问目标与高考通法）
  const tipConfig = useMemo(() => {
    if (preset === "diameter") {
      return {
        variant: "primary" as const,
        badge: "高考经典 · 直径最长弦",
        condition: "直线过圆心 C，此时弦心距 d = 0。",
        question: "求解过圆心的弦长最大值。",
        method:
          "弦长最大为直径 |AB| = 2r = " +
          (2 * (params.r ?? 3)).toFixed(1) +
          "，此时弦与直径完全重合。",
      };
    }
    if (preset === "tangentCritical") {
      return {
        variant: "warning" as const,
        badge: "高考经典 · 临界切线相切",
        condition: "直线与圆满足圆心距等于半径 d = r，判别式 Δ = 0。",
        question: "探究切点坐标 T 与切线斜率截距关系。",
        method: "切线垂直于切点半径 CT ⊥ l，切点唯一，弦长收缩为 0。",
      };
    }
    if (preset === "minChord") {
      return {
        variant: "danger" as const,
        badge: "高考经典 · 垂径垂直最短弦",
        condition: "割线垂直于圆心与定点连线 CM ⊥ l。",
        question: "探究过圆内定点的动弦长极小值。",
        method:
          "当割线垂直于 CM 时弦心距 d 取得最大值 |CM|，此时弦长最短 L = 2√(r² - |CM|²)。",
      };
    }

    if (studyMode === "relation") {
      return {
        variant: "info" as const,
        badge: "几何法判定位置关系 (d 与 r)",
        condition: `圆心 C(${(params.a ?? 0).toFixed(1)}, ${(params.b ?? 0).toFixed(1)})，半径 r = ${(params.r ?? 3).toFixed(1)}，直线斜率 k = ${(params.k ?? 0).toFixed(2)}。`,
        question: "如何快速判定直线与圆的交点个数与相交状态？",
        method:
          "高考优先用几何法计算弦心距 d，比较 d 与 r 的大小（d < r 相交，d = r 相切，d > r 相离），避免联立二次方程求 Δ。",
      };
    }
    if (studyMode === "chord") {
      return {
        variant: "primary" as const,
        badge: "垂径定理与勾股弦长法",
        condition: `直线与圆相交于 A, B 两点，弦心距为 d = ${calcRes.distance.toFixed(2)}。`,
        question: "求解相交弦长 |AB|，探究过定点的最长与最短弦长。",
        method:
          "勾股弦长公式 |AB| = 2√(r² - d²)；最长弦为过圆心的直径 (2r)，最短弦为垂直于弦心距的垂弦。",
      };
    }
    if (studyMode === "tangent") {
      return {
        variant: "warning" as const,
        badge: "切线长定理与切点弦方程",
        condition: `从圆外一点 P(${(params.px ?? 0).toFixed(1)}, ${(params.py ?? 0).toFixed(1)}) 引圆的两条切线 PA, PB。`,
        question: "求解切线长 |PA|，求两切点所连切点弦 AB 的直线方程。",
        method:
          "切线长公式 |PA| = √(d(P,C)² - r²)；以 PC 为直径的圆与原圆相减（作差法）即得切点弦方程。",
      };
    }
    return {
      variant: "danger" as const,
      badge: "中点弦与垂径垂直定理",
      condition: `已知动弦 AB 的中点为 M(${(params.mx ?? 0).toFixed(1)}, ${(params.my ?? 0).toFixed(1)})。`,
      question: "求解割线 AB 的斜率与直线方程。",
      method:
        "由垂径定理知 CM ⊥ AB，故割线斜率 k_{AB} = -1 / k_{CM}，点斜式直接秒出弦所在直线方程。",
    };
  }, [studyMode, preset, params, calcRes]);

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

          {/* 教学提示与题设导引 */}
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
                <div>
                  <span className="font-semibold text-neutral-800">
                    【秒杀通法】
                  </span>
                  <span className="text-neutral-600">{tipConfig.method}</span>
                </div>
              </div>
            </TipCard>
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
