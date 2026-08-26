/**
 * src/components/Math/SceneLegend.tsx
 * 2D 数学场景右下角统一定位图例组件 (SceneLegend)
 * 置于中屏右下角，杜绝遮挡左上角公式卡片与中央几何图象
 */

import { KatexFormula } from "@/components/UI/KatexFormula";
import { MATH_COLORS } from "@/theme/math/colors";

export interface SceneLegendItem {
  color?: string;
  colorKey?: keyof typeof MATH_COLORS;
  label?: string;
  formula?: string;
  style?: "solid" | "dash" | "dot" | "point" | "hollow-point" | "area";
}

interface SceneLegendProps {
  items: SceneLegendItem[];
  title?: string;
  className?: string;
}

export const SceneLegend = ({
  items,
  title = "图例说明",
  className = "",
}: SceneLegendProps) => {
  if (!items || items.length === 0) return null;

  return (
    <div
      className={`absolute bottom-4 right-4 z-10 bg-white/90 backdrop-blur-md border border-neutral-200/80 rounded-lg shadow-sm px-3 py-2 pointer-events-none select-none transition-all duration-200 ${className}`}
    >
      {title && (
        <div className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1.5 border-b border-black/5 pb-1">
          {title}
        </div>
      )}
      <div className="space-y-1.5">
        {items.map((item, i) => {
          const resolvedColor =
            item.color ||
            (item.colorKey ? MATH_COLORS[item.colorKey] : MATH_COLORS.function);

          return (
            <div
              key={i}
              className="flex items-center gap-2 text-[11px] text-neutral-700 font-medium leading-none"
            >
              <LegendSwatch
                color={resolvedColor}
                style={item.style ?? "solid"}
              />
              {item.formula ? (
                <KatexFormula
                  formula={item.formula}
                  mode="inline"
                  className="!text-[11px] !my-0"
                />
              ) : (
                <span>{item.label}</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const LegendSwatch = ({
  color,
  style,
}: {
  color: string;
  style: NonNullable<SceneLegendItem["style"]>;
}) => {
  switch (style) {
    case "point":
      return (
        <span
          className="inline-block w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
          style={{ background: color }}
        />
      );
    case "hollow-point":
      return (
        <span
          className="inline-block w-2.5 h-2.5 rounded-full shrink-0 border-2 bg-white"
          style={{ borderColor: color }}
        />
      );
    case "dash":
      return (
        <span
          className="inline-block w-4 border-t-2 border-dashed shrink-0"
          style={{ borderColor: color }}
        />
      );
    case "dot":
      return (
        <span
          className="inline-block w-4 border-t-2 border-dotted shrink-0"
          style={{ borderColor: color }}
        />
      );
    case "area":
      return (
        <span
          className="inline-block w-3.5 h-2.5 rounded-sm shrink-0 border"
          style={{
            background: `${color}33`,
            borderColor: color,
          }}
        />
      );
    default:
      return (
        <span
          className="inline-block w-4 h-[2.5px] rounded-full shrink-0"
          style={{ background: color }}
        />
      );
  }
};
