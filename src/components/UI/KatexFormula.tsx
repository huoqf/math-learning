import React, { useEffect, useRef, useState, useLayoutEffect } from "react";
import katex from "katex";
import "katex/dist/katex.min.css";

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

  const isBlock = mode === "block";

  // 1. 渲染 KaTeX
  useEffect(() => {
    if (innerRef.current) {
      try {
        katex.render(formula, innerRef.current, {
          throwOnError: false,
          displayMode: isBlock,
        });
      } catch {
        innerRef.current.textContent = formula;
      }
    }
  }, [formula, isBlock]);

  // 2. 测量实际内容尺寸并执行精准 Scale-to-Fit 缩放
  useLayoutEffect(() => {
    if (!responsive || !outerRef.current || !innerRef.current) {
      setScale(1);
      setScaledHeight(undefined);
      return;
    }

    const updateScale = () => {
      if (!outerRef.current || !innerRef.current) return;
      const containerWidth = outerRef.current.clientWidth;
      const contentWidth = innerRef.current.scrollWidth;
      const contentHeight = innerRef.current.scrollHeight;

      if (containerWidth > 0 && contentWidth > containerWidth) {
        // 计算缩放比，最小缩放到 0.72 避免极度变小
        const nextScale = Math.max(0.72, (containerWidth - 6) / contentWidth);
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
  }, [formula, isBlock, responsive]);

  if (isBlock) {
    return (
      <div
        ref={outerRef}
        className={`w-full my-1.5 flex items-center justify-center overflow-hidden transition-all duration-150 ${className}`}
        style={{ height: scaledHeight ? `${scaledHeight}px` : "auto" }}
      >
        <div
          ref={innerRef}
          className="inline-block text-neutral-800 text-center font-medium whitespace-nowrap"
          style={{
            transform: scale < 1 ? `scale(${scale})` : undefined,
            transformOrigin: "center center",
          }}
        />
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
        className="inline-block text-neutral-800 font-medium whitespace-nowrap"
        style={{
          transform: scale < 1 ? `scale(${scale})` : undefined,
          transformOrigin: "center left",
        }}
      />
    </div>
  );
};
