import React, { useEffect, useRef, useState, useLayoutEffect } from "react";
import katex from "katex";
import "katex/dist/katex.min.css";
import {
  splitAtTopLevelEquals,
  splitAtTopLevelImplies,
  splitAtTopLevelBinary,
  splitAtTopLevelPunctuation,
  normalizeFractionRowSpacing,
} from "./latexUtils";

/** 缩放兜底下限：低于此值公式过小，触发教材式换行 */
const MIN_SCALE = 0.75;
/** 教材式换行后仍溢出（仅见于选项按钮等极窄容器）时的硬底线，必须允许适度缩小以彻底杜绝文字两端被裁切 */
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
          // 在独立公式卡片 (isBlock) 模式下，统一执行分式满尺寸升级与多行环境行间距自动平衡
          const formattedSeg = isBlock ? normalizeFractionRowSpacing(seg) : seg;
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
    //    （< MIN_SCALE）时逐级触发教材式换行：优先等号、推出符号，次选加减号、标点
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
        const needed = (containerWidth - 6) / contentWidth;
        if (needed < MIN_SCALE) {
          if (!lines) {
            // 首选顶层等号/推导符换行；次选多项式 +/- 与标点
            const split =
              splitAtTopLevelEquals(formula) ??
              splitAtTopLevelImplies(formula) ??
              splitAtTopLevelBinary(formula) ??
              splitAtTopLevelPunctuation(formula);
            if (split) {
              setLines(split);
              return;
            }
          } else {
            // 多行模式下找出仍然超宽的行，继续按等号/推导符/加减号/标点拆分
            for (let i = 0; i < lineDivs.length; i++) {
              if (lineDivs[i].scrollWidth > containerWidth) {
                const further =
                  splitAtTopLevelEquals(lines[i]) ??
                  splitAtTopLevelImplies(lines[i]) ??
                  splitAtTopLevelBinary(lines[i]) ??
                  splitAtTopLevelPunctuation(lines[i]);
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
        setScaledHeight(Math.ceil(contentHeight * nextScale));
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

  const innerContent = (lines ?? [null]).map((_, i) => (
    <div
      key={i}
      className={
        lines && lines.length > 1
          ? i > 0
            ? "whitespace-nowrap"
            : "whitespace-nowrap"
          : "whitespace-nowrap"
      }
    />
  ));

  if (isBlock) {
    return (
      <div
        ref={outerRef}
        className={`w-full my-1 flex items-center justify-center overflow-hidden transition-all duration-150 ${className}`}
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
      className={`inline-flex items-center align-middle mx-0.5 my-0.5 max-w-full overflow-hidden ${className}`}
      style={{ height: scaledHeight ? `${scaledHeight}px` : "auto" }}
    >
      <div
        ref={innerRef}
        className={`text-neutral-800 font-medium ${
          lines && lines.length > 1
            ? "flex flex-col items-start gap-1.5"
            : "inline-block whitespace-nowrap"
        }`}
        style={{
          transform: scale < 1 ? `scale(${scale})` : undefined,
          transformOrigin: "center left",
        }}
      >
        {innerContent}
      </div>
    </div>
  );
};
