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
import { SceneLegend } from "@/components/Math";
import type { SceneLegendItem } from "@/components/Math";
import { useAnimationViewport, useSceneScale } from "@/hooks";
import { CANVAS_PRESETS, MATH_COLORS } from "@/theme";
import { LineCircleScene } from "./components/LineCircleScene";
import { buildMathQuantities } from "@/data/mathQuantities";
import { defaultParams, paramMeta } from "@/data/registries/lineCircle";
import { calculateLineCircle } from "@/math/lineCircle";
import { formatMathNumber } from "@/utils/mathFormat";

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

  // 参数更新处理器（学生手动调整时，若在锁定预设下则保持联动，若在free下则自由调整）
  const handleParamChange = useCallback(
    (key: string, value: number) => {
      setParams((prev) => {
        const next = {
          ...prev,
          [key]: value,
        };

        // 在特定预设下联动从属参数
        if (preset === "diameter") {
          if (key === "m") {
            setPreset("free");
          } else {
            const kVal = key === "k" ? value : next.k;
            const aVal = key === "a" ? value : next.a;
            const bVal = key === "b" ? value : next.b;
            next.m = Number((bVal - kVal * aVal).toFixed(2));
          }
        } else if (preset === "tangentCritical") {
          if (key === "m") {
            setPreset("free");
          } else {
            const kVal = key === "k" ? value : next.k;
            const aVal = key === "a" ? value : next.a;
            const bVal = key === "b" ? value : next.b;
            const rVal = key === "r" ? value : next.r;
            const offset = rVal * Math.hypot(1, kVal);
            next.m = Number((bVal - kVal * aVal - offset).toFixed(2));
          }
        } else if (preset === "minChord") {
          if (key === "k" || key === "m") {
            setPreset("free");
          } else {
            const mxVal = key === "mx" ? value : next.mx;
            const myVal = key === "my" ? value : next.my;
            const aVal = key === "a" ? value : next.a;
            const bVal = key === "b" ? value : next.b;
            const dx = mxVal - aVal;
            const dy = myVal - bVal;
            const perpK = Math.abs(dy) > 1e-4 ? -dx / dy : 0;
            next.k = Number(perpK.toFixed(2));
            next.m = Number((myVal - perpK * mxVal).toFixed(2));
          }
        } else {
          setPreset("free");
        }

        return next;
      });
    },
    [preset],
  );

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

  // 动态过滤与精简参数列表（严格遵循高中教学认知：对象化分组与主次分层，典型预设降维）
  const paramConfigs = useMemo<ParamConfig[]>(() => {
    let modeKeyGroups: Array<{ group: string; keys: string[] }> = [];

    if (studyMode === "tangent") {
      modeKeyGroups = [
        { group: "圆外极点 P₀(x₀, y₀) 坐标", keys: ["px", "py"] },
        { group: "目标圆半径 r", keys: ["r"] },
      ];
    } else if (studyMode === "midpoint") {
      modeKeyGroups = [
        { group: "弦中点 M(x₀, y₀) 坐标", keys: ["mx", "my"] },
        { group: "目标圆半径 r", keys: ["r"] },
      ];
    } else {
      if (preset === "diameter" || preset === "tangentCritical") {
        modeKeyGroups = [
          { group: "直线斜率 k", keys: ["k"] },
          { group: "目标圆半径 r", keys: ["r"] },
        ];
      } else if (preset === "minChord") {
        modeKeyGroups = [
          { group: "定点 M(x₀, y₀) 坐标", keys: ["mx", "my"] },
          { group: "目标圆半径 r", keys: ["r"] },
        ];
      } else {
        modeKeyGroups = [
          { group: "直线斜截式参数 (k, m)", keys: ["k", "m"] },
          { group: "目标圆半径 r", keys: ["r"] },
        ];
      }
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
  }, [params, studyMode, preset, showCenterParams]);

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
      lineStr = `y = ${formatMathNumber(mVal)}`;
    } else {
      const kStr =
        Math.abs(kVal - 1) < 1e-4
          ? "x"
          : Math.abs(kVal + 1) < 1e-4
            ? "-x"
            : `${formatMathNumber(kVal)}x`;
      if (Math.abs(mVal) < 1e-4) {
        lineStr = `y = ${kStr}`;
      } else if (mVal > 0) {
        lineStr = `y = ${kStr} + ${formatMathNumber(mVal)}`;
      } else {
        lineStr = `y = ${kStr} - ${formatMathNumber(Math.abs(mVal))}`;
      }
    }

    // 格式化圆方程
    const xTerm =
      Math.abs(aVal) < 1e-4
        ? "x^2"
        : aVal > 0
          ? `(x - ${formatMathNumber(aVal)})^2`
          : `(x + ${formatMathNumber(Math.abs(aVal))})^2`;
    const yTerm =
      Math.abs(bVal) < 1e-4
        ? "y^2"
        : bVal > 0
          ? `(y - ${formatMathNumber(bVal)})^2`
          : `(y + ${formatMathNumber(Math.abs(bVal))})^2`;
    const circleStr = `${xTerm} + ${yTerm} = ${formatMathNumber(rVal * rVal)}`;

    if (studyMode === "relation") {
      if (calcRes.relation === "tangent") {
        return `\\begin{cases} C: ${circleStr} \\\\ l: ${lineStr} \\end{cases} \\quad d = r = ${formatMathNumber(rVal)}, \\; \\Delta = 0 \\; (\\text{相切唯一公共点 } T)`;
      }
      return `\\begin{cases} C: ${circleStr} \\\\ l: ${lineStr} \\end{cases} \\quad d = ${formatMathNumber(calcRes.distance)}, \\; r = ${formatMathNumber(rVal)} \\implies ${calcRes.relationLabel}`;
    } else if (studyMode === "chord") {
      if (calcRes.relation === "disjoint") {
        return `\\text{直线与圆相离，无实数弦长} \\quad (d = ${formatMathNumber(calcRes.distance)} > r = ${formatMathNumber(rVal)})`;
      }
      if (calcRes.relation === "tangent") {
        return `\\text{相切临界状态，弦长退化为 } 0 \\quad (d = r = ${formatMathNumber(rVal)})`;
      }
      return `L = 2\\sqrt{r^2 - d^2} = 2\\sqrt{${formatMathNumber(rVal)}^2 - (${formatMathNumber(calcRes.distance)})^2} = ${formatMathNumber(calcRes.chordLengthGeom)}`;
    } else if (studyMode === "tangent") {
      const pxVal = params.px ?? 0;
      const pyVal = params.py ?? 0;
      return `\\begin{cases} C: ${circleStr} \\\\ P: (${formatMathNumber(pxVal)}, ${formatMathNumber(pyVal)}) \\end{cases} \\quad L_{\\text{切线}} = ${calcRes.tangentLength !== undefined ? formatMathNumber(calcRes.tangentLength) : "0"}`;
    } else {
      return `CH \\perp AB \\iff AH = HB \\quad (k_{CH} \\cdot k_{AB} = -1)`;
    }
  }, [params, studyMode, calcRes]);

  // 中屏右下角图例配置 (与绘制图元 1-to-1 严格匹配)
  const legendItems = useMemo<SceneLegendItem[]>(() => {
    const items: SceneLegendItem[] = [
      {
        label: "目标圆 $C$",
        color: MATH_COLORS.paramPrimary,
        style: "line",
      },
      {
        label: "割线 / 直线 $l$",
        color: MATH_COLORS.paramSecondary,
        style: "solid",
      },
    ];

    if (studyMode === "tangent") {
      items.push(
        {
          label: "切线与点 $P$",
          color: MATH_COLORS.complexNum,
          style: "solid",
        },
        {
          label: "切点弦 $T_1T_2$",
          color: MATH_COLORS.paramTertiary,
          style: "solid",
        },
      );
    } else if (calcRes.relation === "tangent") {
      items.push({
        label: "切点半径 $CT$ 与切点 $T$",
        color: MATH_COLORS.paramTertiary,
        style: "point",
      });
    } else {
      items.push({
        label: "弦心距垂线 $CH$ 与垂足 $H$",
        color: MATH_COLORS.paramTertiary,
        style: "dash",
      });
      if (calcRes.relation === "intersect") {
        items.push({
          label: "相交弦 $AB$",
          color: MATH_COLORS.paramTertiary,
          style: "solid",
        });
      }
    }

    if (studyMode === "chord") {
      items.push({
        label: "圆内定点 $M$",
        color: MATH_COLORS.paramSecondary,
        style: "point",
      });
    }

    return items;
  }, [studyMode, calcRes.relation]);

  // 左屏教学提示与题设导引（说明初始条件与探究设问，100%包裹单美元符号并直击高考考点）
  const tipConfig = useMemo(() => {
    const rVal = formatMathNumber(params.r ?? 3);
    const aVal = formatMathNumber(params.a ?? 0);
    const bVal = formatMathNumber(params.b ?? 0);
    const kVal = formatMathNumber(params.k ?? 0.75);
    const mVal = formatMathNumber(params.m ?? -1);

    if (preset === "diameter") {
      return {
        variant: "primary" as const,
        badge: "高考经典 · 直径最长弦",
        condition: `割线 $l$ 经过圆心 $C(${aVal}, ${bVal})$，斜率 $k = ${kVal}$。`,
        question:
          "如何证明过圆心的割线弦长最大且等于直径 $2r$，并求解其最大值？",
      };
    }
    if (preset === "tangentCritical") {
      return {
        variant: "warning" as const,
        badge: "高考经典 · 临界切线相切",
        condition: `直线 $l$ 与圆 $C$ 处于相切临界状态，圆心到直线的距离 $d = r = ${rVal}$。`,
        question:
          "直线与圆相切时，如何建立 $d = r$ 的充要等式求解直线截距 $m$？",
      };
    }
    if (preset === "minChord") {
      const mxVal = formatMathNumber(params.mx ?? 1);
      const myVal = formatMathNumber(params.my ?? 1);
      return {
        variant: "danger" as const,
        badge: "高考经典 · 垂径垂直最短弦",
        condition: `割线 $l$ 经过圆内定点 $M(${mxVal}, ${myVal})$ 且垂直于连心线 $CM$。`,
        question:
          "如何证明过圆内定点的所有弦中垂直于连心线的弦长最短，并求最小弦长？",
      };
    }

    if (studyMode === "relation") {
      return {
        variant: "info" as const,
        badge: "位置关系与几何判定",
        condition: `已知目标圆 $C$ 半径 $r = ${rVal}$，圆心 $C(${aVal}, ${bVal})$，直线 $l: y = ${kVal}x + (${mVal})$。`,
        question:
          "如何运用点到直线距离公式计算 $d$，并与半径 $r$ 比较判定公共点个数？",
      };
    }
    if (studyMode === "chord") {
      return {
        variant: "primary" as const,
        badge: "垂径定理与相交弦长",
        condition: `割线 $l: y = ${kVal}x + (${mVal})$ 与圆相交于 $A, B$ 两点，弦心距为 $d$。`,
        question:
          "如何利用勾股定理 $r^2 = d^2 + (L/2)^2$ 快速计算相交弦长 $L$？",
      };
    }
    if (studyMode === "tangent") {
      const pxVal = formatMathNumber(params.px ?? 5);
      const pyVal = formatMathNumber(params.py ?? 4);
      return {
        variant: "warning" as const,
        badge: "切线长定理与切点弦",
        condition: `从圆外点 $P(${pxVal}, ${pyVal})$ 向已知圆引两条切线，切点为 $T_1, T_2$。`,
        question:
          "如何应用切线直角三角形求切线长，并写出切点弦 $T_1T_2$ 的标准方程？",
      };
    }
    return {
      variant: "danger" as const,
      badge: "垂径定理与弦中点",
      condition: `已知动弦中点为 $H$，割线斜率为 $k_{AB} = ${kVal}$。`,
      question:
        "如何运用垂径定理垂直关系 $k_{CH} \\cdot k_{AB} = -1$（点差法）确定弦方程？",
    };
  }, [studyMode, preset, params]);

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
          <LeftPanelSection title="探究主题">
            <SelectGrid
              items={[
                { key: "relation", label: "位置关系" },
                { key: "chord", label: "相交弦长" },
                { key: "tangent", label: "切线系统" },
                { key: "midpoint", label: "垂径中点" },
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
          <LeftPanelSection title="典型预设">
            <SelectGrid
              items={[
                { key: "free", label: "自由探究" },
                { key: "diameter", label: "过圆心最大弦" },
                { key: "tangentCritical", label: "临界切线状态" },
                { key: "minChord", label: "垂直最短弦" },
              ]}
              value={preset}
              onChange={(k) => handlePresetSelect(k as LineCirclePresetKey)}
              variant="outline"
              columns={2}
            />
          </LeftPanelSection>

          {/* 3. 参数调节 Section */}
          <LeftPanelSection title="核心参数调节">
            <ParamControl
              params={paramConfigs}
              onParamChange={handleParamChange}
              onReset={handleReset}
            />

            {/* 展开/收起圆心平移辅助参数 (a, b) */}
            <div className="mt-2.5 pt-2 border-t border-neutral-100 flex items-center justify-between text-xs text-neutral-500">
              <span className="text-[11px]">圆心平移参数 (a, b)</span>
              <button
                type="button"
                onClick={() => setShowCenterParams((v) => !v)}
                className="text-primary-600 hover:text-primary-700 text-[11px] font-medium px-2 py-0.5 rounded bg-primary-50 hover:bg-primary-100 transition-colors cursor-pointer"
              >
                {showCenterParams ? "收起圆心" : "展开圆心"}
              </button>
            </div>
          </LeftPanelSection>

          {/* 4. 教学提示与题设导引（置于最底部） */}
          <TipCard
            variant={tipConfig.variant}
            badge={tipConfig.badge}
            condition={tipConfig.condition}
            question={tipConfig.question}
          />
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

          {/* 中屏右下角毛玻璃图例 (SceneLegend) */}
          <SceneLegend items={legendItems} title="几何图元图例" />
        </div>
      }
      right={
        <MathPanel
          quantities={mathData.quantities}
          theorems={mathData.theorems}
          gaokaoPoints={mathData.gaokaoPoints}
          warnings={mathData.warnings}
          reasoningSteps={mathData.reasoningSteps}
          examAnchor={mathData.examAnchor}
          mnemonic={mathData.mnemonic}
          title={panelTitle}
        />
      }
    />
  );
}
