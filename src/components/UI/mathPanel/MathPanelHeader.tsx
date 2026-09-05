import React from "react";
import { Award, Sparkles } from "lucide-react";

interface MathPanelHeaderProps {
  title?: string;
  examAnchor?: string;
}

export const MathPanelHeader: React.FC<MathPanelHeaderProps> = ({
  title = "高考破题与推演看板",
  examAnchor,
}) => {
  return (
    <div className="flex items-center justify-between border-b border-neutral-200 pb-2.5">
      <div className="flex items-center gap-2 min-w-0">
        <Award className="w-4 h-4 text-primary-600 shrink-0" />
        <h3 className="font-bold text-neutral-800 text-sm truncate">{title}</h3>
      </div>
      {examAnchor ? (
        <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-semibold shrink-0 flex items-center gap-1 shadow-2xs">
          <Sparkles className="w-3 h-3 text-amber-500" />
          {examAnchor}
        </span>
      ) : (
        <span className="text-xs text-neutral-500 font-medium shrink-0">
          数学解析看板
        </span>
      )}
    </div>
  );
};
