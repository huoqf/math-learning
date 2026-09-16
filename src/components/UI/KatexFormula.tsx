import React, {
  useEffect,
  useRef,
  useState,
  useLayoutEffect,
  useMemo,
} from "react";
import katex from "katex";
import "katex/dist/katex.min.css";
import {
  normalizeFractionRowSpacing,
  findOptimalSplit,
  extractLatexLines,
  getAlignmentPrefix,
  startsWithRelation,
} from "./latexUtils";

/**
 * 已允许拆行（块级 / 多行排版）时的缩放硬底线：设为 0.55，
 * 既保证公式在常规下具备高清晰度字号，又杜绝在右屏 270px 窄容器中因卡死在 0.78 而溢出截断
 */
const HARD_MIN_SCALE = 0.55;

/**
 * 行内公式（严格不断行）的缩放硬底线。
 * 当所需缩放比低于此值时不再硬夹，而是降级为「可拆行多行堆叠」，
 * 彻底消除"缩到硬底线仍被裁掉两端"的静默截断。
 */
const INLINE_MIN_SCALE = 0.65;

interface KatexFormulaProps {
  formula: string;
  mode?: "inline" | "block";
  className?: string;
  /** 是否开启自适应缩放（默认开启） */
  responsive?: boolean;
  /** 是否允许自动语义拆行（默认仅 block 块级公式开启，inline 行内公式优先保持单行不断行） */
  allowLineBreak?: boolean;
  /**
   * 是否将普通单行公式的 \frac 提升为满尺寸 \dfrac。
   * 默认 true（沿用既有教学规范：行内/块级统一分式满字号）。
   * 若某处正文行内公式需要恢复标准 textstyle 排版以避免行高膨胀，可显式传入 false。
   */
  forceDisplayFraction?: boolean;
}

export const KatexFormula: React.FC<KatexFormulaProps> = ({
  formula,
  mode = "inline",
  className = "",
  responsive = true,
  allowLineBreak,
  forceDisplayFraction = true,
}) => {
  const outerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState<number>(1);
  /**
   * 公式的「自然宽度」（未经拆行、未经缩放时的布局宽度）。
   * 与容器宽度无关，因此可用于在任何时刻重新裁决行内降级，
   * 而不必依赖「容器宽度是否变化」这类易被滚动条抖动干扰的状态记忆
   * （后者会与滚动条的出现/消失形成 setState 死循环）。
   */
  const naturalWidthRef = useRef<number>(0);
  const lastFormulaRef = useRef<string>(formula);

  const isBlock = mode === "block";
  const canLineBreak = allowLineBreak ?? isBlock;

  /**
   * 非空时按教材式多行渲染：
   * 若输入公式本身包含原生多行（\\\\ 或 \\begin{aligned} 等），优先解构为独立多行；
   * 若超宽则经 findOptimalSplit 最优语义拆行，与教材推导书写习惯一致。
   *
   * 行内公式在硬底线下仍超宽时也会写入该状态（降级为多行堆叠），
   * 因此 lines 非空即代表「本公式已进入可拆行排版」。
   */
  const [lines, setLines] = useState<string[] | null>(() =>
    canLineBreak ? extractLatexLines(formula) : null,
  );

  const hasNativeLineBreaks = useMemo(
    () =>
      formula.includes("\\\\") ||
      formula.includes("\\begin{aligned}") ||
      formula.includes("\\begin{cases}") ||
      formula.includes("\\begin{matrix}") ||
      formula.includes("\\begin{gathered}") ||
      formula.includes("&"),
    [formula],
  );

  /**
   * 教材续行悬挂对齐基准：仅对「引擎自动语义拆行」产生的多行生效。
   * 原生 aligned/cases 等环境由 KaTeX 自身完成列对齐，绝不可二次干预。
   */
  const alignPrefix = useMemo(() => {
    if (!lines || lines.length <= 1 || hasNativeLineBreaks) return null;
    return getAlignmentPrefix(lines[0]);
  }, [lines, hasNativeLineBreaks]);

  /** 实际送入 KaTeX 的片段：续行以 \\phantom 占位，使关系符与首行纵向对齐 */
  const renderSegments = useMemo(() => {
    const segs = lines ?? [formula];
    if (!alignPrefix) return segs;
    return segs.map((seg, i) =>
      i > 0 && startsWithRelation(seg)
        ? `\\phantom{${alignPrefix}}${seg}`
        : seg,
    );
  }, [lines, formula, alignPrefix]);

  // 1+2. 渲染 KaTeX 并测量（合并到同一个 layout effect）：
  //    - 始终先渲染、后测量，保证测量拿到真实内容宽度，
  //      避免"内容注入后缩放测量未重跑"导致的裁切/错位。
  //    - scale / scaledHeight 不在此依赖数组：缩放触发的重渲染不会重跑本 effect，
  //      也就不会重复注入 KaTeX（子节点 props 不变时 React 不动其 innerHTML）。
  useLayoutEffect(() => {
    // 公式内容变更：自然宽度缓存作废，需按新公式重新测量
    if (lastFormulaRef.current !== formula) {
      lastFormulaRef.current = formula;
      naturalWidthRef.current = 0;
    }

    const inner = innerRef.current;

    // A. 渲染 KaTeX（先于测量；即便 responsive=false 也需正常注入内容）
    if (inner) {
      const segments = renderSegments;
      const renderDivs = Array.from(inner.children) as HTMLElement[];
      try {
        segments.forEach((seg, i) => {
          const target = renderDivs[i];
          if (!target) return;
          // 统一执行分式满尺寸升级与多行环境行间距自动平衡：
          // 升级范围由 forceDisplayFraction 显式声明；多行环境始终升级并补 [0.65em] 行距防挤压。
          // （displayMode 仅决定整体数学样式；\dfrac 在两种模式下都强制分式满尺寸）
          const formattedSeg = normalizeFractionRowSpacing(
            seg,
            forceDisplayFraction,
          );
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
      return;
    }

    const updateScale = () => {
      if (!outerRef.current || !innerRef.current) return;
      /*
       * 可用宽度取「自身盒宽与父容器宽度的较小值」。
       * 自身盒宽在行内上下文中等于裁切宿主的可用宽度，因此以它为准
       * 可保证缩放结果一定落在可见区域内，即「绝不裁切」这条硬不变量。
       * （曾尝试改用父容器宽度作为可用宽度，会放宽基准，
       *   导致 /conic-line 等路由出现 8~9px 的真实裁切，故维持原判定。）
       */
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

      // 仅在未拆行状态下测量才代表「整条公式的自然宽度」；取历史最大值以防抖动
      if (!lines && contentWidth > naturalWidthRef.current) {
        naturalWidthRef.current = contentWidth;
      }
      const naturalWidth = naturalWidthRef.current || contentWidth;

      /*
       * 行内降级裁决（纯函数，仅依赖公式自然宽度与当前容器宽度）：
       * 行内公式在 0.65 硬底线下依然放不下时，转入可拆行排版（保持行内流，多行堆叠），
       * 彻底消除"缩到硬底线仍被裁掉两端"的静默截断，且不会产生 setState 循环。
       */
      const shouldDegrade =
        !canLineBreak &&
        naturalWidth > 0 &&
        (containerWidth - 4) / naturalWidth < INLINE_MIN_SCALE;

      // 已进入可拆行排版（块级、显式允许，或行内因极端超宽已降级）
      const breakable = canLineBreak || lines !== null || shouldDegrade;

      // clientWidth/scrollWidth 均为四舍五入整数，在微型容器（10~15px）中由于 4px 安全边距占比过大，
      // 极易因 1~2px 取整误差触发触底缩放。微型容器加 2px 容差可安全消除误判；
      // 普通及大容器（>=32px）保持严格 0 容差，确保临界长公式按设计正常拆行或缩放，杜绝亚像素级裁切。
      const tolerance = containerWidth < 32 ? 2 : 0;
      if (containerWidth > 0 && contentWidth > containerWidth + tolerance) {
        // 核心原则：只有明确允许拆行（块级推导或已降级的行内公式）时才尝试教材式拆行
        if (breakable) {
          if (!lines) {
            const split = findOptimalSplit(formula);
            if (split) {
              setLines(split);
              return;
            }
          } else {
            // 多行模式下找出仍然超宽的行，继续按最优规则拆分（最多拆至 6 行）。
            // 优先以「增加垂直行数」换取字号不缩小，仅当行数用尽后才退回缩放。
            if (lines.length < 6) {
              for (let i = 0; i < lineDivs.length; i++) {
                if (lineDivs[i].scrollWidth > containerWidth) {
                  const targetLine = lines[i];
                  if (!targetLine) continue;
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
        }

        // 不允许拆行或拆行后仍超宽时，进行等比 Scale-to-Fit 缩放
        const needed = (containerWidth - 4) / contentWidth;
        const minScale = breakable ? HARD_MIN_SCALE : INLINE_MIN_SCALE;
        const nextScale = Math.max(minScale, needed);
        if (nextScale > needed && import.meta.env.DEV) {
          // 缩到硬底线仍无法容纳：属于数据侧公式过长的信号，开发期显式提示而非静默裁切
          console.warn(
            `[KatexFormula] 公式宽度 ${contentWidth}px 超出容器 ${containerWidth}px，` +
              `已缩至硬底线 ${minScale}，仍有约 ${Math.ceil(contentWidth * minScale - containerWidth + 4)}px 被裁切：`,
            formula,
          );
        }
        setScale(nextScale);
      } else {
        setScale(1);
        // 容器已足以容纳原始公式（或已降至可接受的缩放下限）→ 撤销行内降级，恢复单行排版。
        // 该判断同样是纯函数：shouldDegrade 转假才有意义，因此不存在往复触发。
        if (!canLineBreak && !shouldDegrade && lines !== null) {
          setLines(null);
        }
      }
    };

    updateScale();

    // KaTeX 使用 woff2 字体，字形异步换入后内容宽度会发生变化，
    // 若首次测量发生在换入之前，缩放比会偏大、留下几像素溢出且不会自愈。
    // 因此在下一帧与字体就绪后各补测一次，保证「测量-缩放」与最终排版一致。
    const rafId =
      typeof requestAnimationFrame === "function"
        ? requestAnimationFrame(updateScale)
        : 0;
    let cancelled = false;
    const fontsReady: Promise<unknown> | undefined = (
      document as Document & { fonts?: { ready?: Promise<unknown> } }
    ).fonts?.ready;
    fontsReady?.then(() => {
      if (!cancelled) updateScale();
    });

    const resizeObserver = new ResizeObserver(updateScale);
    resizeObserver.observe(outerRef.current);
    if (outerRef.current.parentElement) {
      resizeObserver.observe(outerRef.current.parentElement);
    }
    if (innerRef.current) {
      resizeObserver.observe(innerRef.current);
    }

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafId);
      resizeObserver.disconnect();
    };
  }, [
    formula,
    isBlock,
    responsive,
    lines,
    canLineBreak,
    renderSegments,
    forceDisplayFraction,
  ]);

  // 3. 公式变化时初始化换行状态（若包含原生多行且允许拆行，优先解构为多行）
  useEffect(() => {
    setLines(canLineBreak ? extractLatexLines(formula) : null);
  }, [formula, canLineBreak]);

  // innerContent: 每行一个 div 容器，供 KaTeX 注入内容。
  // whitespace-nowrap 确保 KaTeX 自身不被 CSS 文字折行打断。
  const innerContent = renderSegments.map((_, i) => (
    <div key={i} className="whitespace-nowrap" />
  ));

  const isMultiLine = Boolean(
    (lines && lines.length > 1) || hasNativeLineBreaks,
  );
  const shouldAlignLeft = isMultiLine || scale < 1;

  if (isBlock) {
    return (
      <div
        ref={outerRef}
        className={`w-full my-1 flex ${
          shouldAlignLeft
            ? "items-start justify-start text-left"
            : "items-center justify-center text-center"
        } overflow-x-clip max-w-full transition-all duration-150 ${className}`}
      >
        <div
          ref={innerRef}
          className={`text-neutral-800 font-medium ${
            isMultiLine
              ? "flex flex-col items-start gap-2.5 text-left w-max min-w-0"
              : "inline-block text-center whitespace-nowrap"
          }`}
          style={{
            transform: scale < 1 ? `scale(${scale})` : undefined,
            transformOrigin: shouldAlignLeft ? "top left" : "center center",
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
      className={`inline-flex items-center justify-center align-middle mx-0.5 my-0.5 max-w-full overflow-x-clip ${className}`}
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
          transformOrigin: "center center",
        }}
      >
        {innerContent}
      </div>
    </div>
  );
};
