import React, { useEffect, useRef, useState, useLayoutEffect } from "react";
import katex from "katex";
import "katex/dist/katex.min.css";
import { normalizeFractionRowSpacing, findOptimalSplit } from "./latexUtils";

/**
 * 换行后仍溢出时的硬底线：提升至 0.78，确保高清晰度与大字号，
 * 绝不允许暴跌至不可读的微小字体（优先多行教材式排版展开）
 */
const HARD_MIN_SCALE = 0.78;

interface KatexFormulaProps {
  formula: string;
  mode?: "inline" | "block";
  className?: string;
  /** 是否开启自适应缩放（默认开启） */
  responsive?: boolean;
}

export const KatexFormula: React.FC<KatexFormulaProps> = ({
  formula,
  mode = "inline",
  className = "",
  responsive = true,
}) => {
  const outerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState<number>(1);
  const [scaledHeight, setScaledHeight] = useState<number | undefined>(
    undefined,
  );
  /**
   * 非空时按教材式多行渲染（缩放触底后的兜底策略）：
   * 首行左端，后续行以 = / \Rightarrow / + / - 起头并缩进，与教材推导书写习惯一致
   */
  const [lines, setLines] = useState<string[] | null>(null);

  const isBlock = mode === "block";

  // 1+2. 渲染 KaTeX 并测量（合并到同一个 layout effect）：
  //    - 始终先渲染、后测量，保证测量拿到真实内容宽度，
  //      避免"内容注入后缩放测量未重跑"导致的裁切/错位。
  //    - scale / scaledHeight 不在此依赖数组：缩放触发的重渲染不会重跑本 effect，
  //      也就不会重复注入 KaTeX（子节点 props 不变时 React 不动其 innerHTML）。
  useLayoutEffect(() => {
    const inner = innerRef.current;

    // A. 渲染 KaTeX（先于测量；即便 responsive=false 也需正常注入内容）
    if (inner) {
      const segments = lines ?? [formula];
      const renderDivs = Array.from(inner.children) as HTMLElement[];
      try {
        segments.forEach((seg, i) => {
          const target = renderDivs[i];
          if (!target) return;
          // 统一执行分式满尺寸升级与多行环境行间距自动平衡：
          // 行内模式（SelectGrid/ParamControl/MathPanel/renderMixedLatex 等）不再跳过，
          // 使 \frac 全部提升为 \dfrac，分子分母保持 100% 原文字号；多行环境自动补 [0.65em] 行距防挤压。
          // （displayMode 仅决定整体数学样式；\dfrac 在两种模式下都强制分式满尺寸）
          const formattedSeg = normalizeFractionRowSpacing(seg);
          katex.render(formattedSeg, target, {
            throwOnError: false,
            displayMode: isBlock,
            // 容忍教学场景中的非严格 LaTeX 写法（如 \text 内 unicode），避免控制台刷屏
            strict: false,
          });
        });
      } catch {
        if (renderDivs[0] && segments[0])
          renderDivs[0].textContent = segments[0];
      }
    }

    // B. 测量实际内容尺寸并执行精准 Scale-to-Fit 缩放（此刻内容已渲染完成，测量必然准确）；
    //    公式超宽优先触发全局最优教材式拆行（推导符/语义间距/等号/二元加减），极大降低行宽并保全大字号
    if (!responsive || !outerRef.current || !inner) {
      setScale(1);
      setScaledHeight(undefined);
      return;
    }

    const updateScale = () => {
      if (!outerRef.current || !innerRef.current) return;
      const containerWidth =
        !isBlock && outerRef.current.parentElement
          ? Math.min(
              outerRef.current.clientWidth ||
                outerRef.current.parentElement.clientWidth,
              outerRef.current.parentElement.clientWidth,
            )
          : outerRef.current.clientWidth;
      const innerBox = innerRef.current;
      // 行盒可能被外层 flex 挤压而低报宽度，须取各行容器 scrollWidth 的最大值
      // （行容器的 scrollWidth 包含其溢出的 KaTeX 内容，是真实自然宽度）
      const lineDivs = Array.from(innerBox.children) as HTMLElement[];
      const contentWidth = lineDivs.length
        ? Math.max(...lineDivs.map((d) => d.scrollWidth))
        : innerBox.scrollWidth;
      const contentHeight = innerBox.scrollHeight;

      if (containerWidth > 0 && contentWidth > containerWidth) {
        // 核心原则：只要公式超宽，优先尝试按高中数学教材语义拆行，绝不盲目暴力缩小
        if (!lines) {
          const split = findOptimalSplit(formula);
          if (split) {
            setLines(split);
            return;
          }
        } else {
          // 多行模式下找出仍然超宽的行，继续按最优规则拆分（最多拆至 4 行）
          if (lines.length < 4) {
            for (let i = 0; i < lineDivs.length; i++) {
              if (lineDivs[i].scrollWidth > containerWidth) {
                const targetLine = lines[i];
                const further = findOptimalSplit(targetLine);
                if (further) {
                  const next = [...lines];
                  next.splice(i, 1, further[0], further[1]);
                  setLines(next);
                  return;
                }
              }
            }
          }
        }

        // 仅当公式已无法继续按高中数学习惯拆行时，才进行兜底微幅 Scale-to-Fit 缩放
        const needed = (containerWidth - 4) / contentWidth;
        const nextScale = Math.max(HARD_MIN_SCALE, needed);
        setScale(nextScale);
        if (lines && lines.length > 1) {
          setScaledHeight(Math.ceil(contentHeight * nextScale));
        } else {
          setScaledHeight(undefined);
        }
      } else {
        setScale(1);
        setScaledHeight(undefined);
      }
    };

    updateScale();

    const resizeObserver = new ResizeObserver(updateScale);
    resizeObserver.observe(outerRef.current);
    if (outerRef.current.parentElement) {
      resizeObserver.observe(outerRef.current.parentElement);
    }
    if (innerRef.current) {
      resizeObserver.observe(innerRef.current);
    }

    return () => resizeObserver.disconnect();
  }, [formula, isBlock, responsive, lines]);

  // 3. 公式变化时重置换行状态
  useEffect(() => {
    setLines(null);
  }, [formula]);

  // innerContent: 每行一个 div 容器，供 KaTeX 注入内容。
  // whitespace-nowrap 确保 KaTeX 自身不被 CSS 文字折行打断。
  const innerContent = (lines ?? [null]).map((_, i) => (
    <div key={i} className="whitespace-nowrap" />
  ));

  if (isBlock) {
    const isMultiLine = Boolean(lines && lines.length > 1);
    return (
      <div
        ref={outerRef}
        className={`w-full my-1 flex ${
          isMultiLine
            ? "items-start justify-start"
            : "items-center justify-center"
        } overflow-visible transition-all duration-150 ${className}`}
        style={{ height: scaledHeight ? `${scaledHeight}px` : "auto" }}
      >
        <div
          ref={innerRef}
          className={`text-neutral-800 font-medium ${
            lines && lines.length > 1
              ? "flex flex-col items-start gap-3.5"
              : "inline-block text-center whitespace-nowrap"
          }`}
          style={{
            transform: scale < 1 ? `scale(${scale})` : undefined,
            transformOrigin: isMultiLine ? "center left" : "center center",
          }}
        >
          {innerContent}
        </div>
      </div>
    );
  }

  return (
    <div
      ref={outerRef}
      className={`inline-flex items-center justify-start align-middle mx-0.5 my-0.5 max-w-full overflow-hidden ${className}`}
      style={{ height: scaledHeight ? `${scaledHeight}px` : "auto" }}
    >
      <div
        ref={innerRef}
        className={`text-neutral-800 font-medium ${
          lines && lines.length > 1
            ? "flex flex-col items-start gap-1.5"
            : "inline-block text-left whitespace-nowrap"
        }`}
        style={{
          transform: scale < 1 ? `scale(${scale})` : undefined,
          transformOrigin: "left center",
        }}
      >
        {innerContent}
      </div>
    </div>
  );
};
