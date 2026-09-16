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
    <div className="border-b border-neutral-200 pb-2.5">
      {/*
        首行仅承载「图标 + 标题」与兜底文案，标题可省略，
        题型定位徽标不再与标题争夺这 295px 横向空间。
      */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Award className="w-4 h-4 text-primary-600 shrink-0" />
          <h3
            className="font-bold text-neutral-800 text-sm truncate"
            title={title}
          >
            {title}
          </h3>
        </div>
        {!examAnchor && (
          <span className="text-xs text-neutral-500 font-medium shrink-0">
            数学解析看板
          </span>
        )}
      </div>
      {/*
        题型定位徽标独占一行：文案多为 20~28 个汉字，整行自然换行，
        避免先前 shrink-0 造成越出右屏右边界被静默截断（实测越界 6~45px）。
      */}
      {examAnchor && (
        <span
          className="mt-2 flex w-full items-start gap-1 text-[11px] px-2 py-1 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 font-semibold leading-snug shadow-2xs"
          title={examAnchor}
        >
          <Sparkles className="w-3 h-3 text-amber-500 shrink-0 mt-0.5" />
          <span className="min-w-0 break-words">{examAnchor}</span>
        </span>
      )}
    </div>
  );
};
