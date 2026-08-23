import React, { useEffect, useRef, useState, useLayoutEffect } from "react";
import katex from "katex";
import "katex/dist/katex.min.css";
import {
  splitAtTopLevelEquals,
  splitAtTopLevelImplies,
  splitAtTopLevelSpacing,
  splitAtTopLevelBinary,
  splitAtTopLevelPunctuation,
  normalizeFractionRowSpacing,
  getEffectiveLatexLength,
} from "./latexUtils";

/**
 * 优先换行阈值：
 * 当单行所需缩放比例低于此阈值（空间极窄且公式较长）时，优先尝试按高中数学教材语义换行；
 * 在此阈值之上，优先保持单行高保真完整呈现。
 */
const MIN_SCALE = 0.72;
/** 换行后仍溢出（仅见于选项按鈕等极窄容器）时的硬底线，必须允许适度缩小以彻底杜绝文字两端被裁切 */
const HARD_MIN_SCALE = 0.45;

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

    // B. 测量实际内容尺寸并执行精准 Scale-to-Fit 缩放（此刻内容已渲染完成，测量必然准确）；缩放触底
    //    （< MIN_SCALE）时逐级触发教材式换行：优先推出符号、语义间距，次选等号、加减号、标点
    if (!responsive || !outerRef.current || !inner) {
      setScale(1);
      setScaledHeight(undefined);
      return;
    }

    const updateScale = () => {
      if (!outerRef.current || !innerRef.current) return;
      const containerWidth = outerRef.current.clientWidth;
      const innerBox = innerRef.current;
      // 行盒可能被外层 flex 挤压而低报宽度，须取各行容器 scrollWidth 的最大值
      // （行容器的 scrollWidth 包含其溢出的 KaTeX 内容，是真实自然宽度）
      const lineDivs = Array.from(innerBox.children) as HTMLElement[];
      const contentWidth = lineDivs.length
        ? Math.max(...lineDivs.map((d) => d.scrollWidth))
        : innerBox.scrollWidth;
      const contentHeight = innerBox.scrollHeight;

      if (containerWidth > 0 && contentWidth > containerWidth) {
        const needed = (containerWidth - 4) / contentWidth;
        if (needed < MIN_SCALE) {
          if (!lines) {
            // 换行优先级：推导符 → 语义间距\quad/\; → 等号 → 二元运算符+/- → 标点
            const split =
              splitAtTopLevelImplies(formula) ??
              splitAtTopLevelSpacing(formula) ??
              splitAtTopLevelEquals(formula) ??
              splitAtTopLevelBinary(formula) ??
              splitAtTopLevelPunctuation(formula);

            // 断行有效性验证：拆分出来的较长子段必须实质性短于原式
            if (split) {
              const origLen = getEffectiveLatexLength(formula);
              const maxSubLen = Math.max(
                getEffectiveLatexLength(split[0]),
                getEffectiveLatexLength(split[1]),
              );
              // 如果最长子段相较于原式减少了至少 15% 的有效长度，断行才具备实质降宽价值
              if (maxSubLen <= origLen * 0.85 || split.length > 2) {
                setLines(split);
                return;
              }
            }
          } else {
            // 多行模式下找出仍然超宽的行，继续按同一优先级拆分
            for (let i = 0; i < lineDivs.length; i++) {
              if (lineDivs[i].scrollWidth > containerWidth) {
                const targetLine = lines[i];
                const further =
                  splitAtTopLevelImplies(targetLine) ??
                  splitAtTopLevelSpacing(targetLine) ??
                  splitAtTopLevelEquals(targetLine) ??
                  splitAtTopLevelBinary(targetLine) ??
                  splitAtTopLevelPunctuation(targetLine);
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
        // 动态保底缩放：不论是否换行，绝不刚性截断，确保 100% 完整可见不丢字
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
    return (
      <div
        ref={outerRef}
        className={`w-full my-1 flex items-center justify-center overflow-x-hidden transition-all duration-150 ${className}`}
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
            transformOrigin: "center center",
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
      className={`inline-flex items-center justify-center align-middle mx-0.5 my-0.5 max-w-full overflow-hidden ${className}`}
      style={{ height: scaledHeight ? `${scaledHeight}px` : "auto" }}
    >
      <div
        ref={innerRef}
        className={`text-neutral-800 font-medium ${
          lines && lines.length > 1
            ? "flex flex-col items-start gap-1.5"
            : "inline-block text-center whitespace-nowrap"
        }`}
        style={{
          transform: scale < 1 ? `scale(${scale})` : undefined,
          transformOrigin:
            lines && lines.length > 1 ? "center left" : "center center",
        }}
      >
        {innerContent}
      </div>
    </div>
  );
};
