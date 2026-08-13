import React, { useEffect, useRef } from "react";
import katex from "katex";
import "katex/dist/katex.min.css";

interface KatexFormulaProps {
  formula: string;
  mode?: "inline" | "block";
  className?: string;
}

export const KatexFormula: React.FC<KatexFormulaProps> = ({
  formula,
  mode = "inline",
  className = "",
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      try {
        katex.render(formula, containerRef.current, {
          throwOnError: false,
          displayMode: mode === "block",
        });
      } catch {
        containerRef.current.textContent = formula;
      }
    }
  }, [formula, mode]);

  const isBlock = mode === "block";

  const baseClass = isBlock
    ? "my-2 px-3 py-2 bg-primary-50/50 rounded-md text-center overflow-x-auto max-w-full text-neutral-800 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
    : "inline-block align-middle mx-1 my-0.5 whitespace-nowrap max-w-full overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]";

  return <div ref={containerRef} className={`${baseClass} ${className}`} />;
};
