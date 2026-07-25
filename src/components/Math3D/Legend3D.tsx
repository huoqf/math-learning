import { KatexFormula } from "@/components/UI/KatexFormula";
import { MATH_COLORS } from "@/theme/math/colors";

export interface LegendItem {
  colorKey: keyof typeof MATH_COLORS;
  label?: string;
  tex?: string;
  swatch?: "line" | "dash" | "area" | "point" | "sphere";
}

interface Legend3DProps {
  items: LegendItem[];
  title?: string;
}

export const Legend3D = ({ items, title = "图例" }: Legend3DProps) => (
  <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-sm rounded-lg shadow-md px-3 py-2 pointer-events-none select-none">
    <div className="text-[11px] font-medium text-slate-500 mb-1">{title}</div>
    <div className="space-y-1">
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-2 text-xs text-slate-700">
          <LegendSwatch
            colorKey={item.colorKey}
            swatch={item.swatch ?? "line"}
          />
          {item.tex ? (
            <KatexFormula
              formula={item.tex}
              mode="inline"
              className="!text-xs !my-0"
            />
          ) : (
            <span>{item.label}</span>
          )}
        </div>
      ))}
    </div>
  </div>
);

const LegendSwatch = ({
  colorKey,
  swatch,
}: {
  colorKey: keyof typeof MATH_COLORS;
  swatch: NonNullable<LegendItem["swatch"]>;
}) => {
  const color = MATH_COLORS[colorKey];
  switch (swatch) {
    case "point":
      return (
        <span
          className="inline-block w-2.5 h-2.5 rounded-full shrink-0"
          style={{ background: color }}
        />
      );
    case "sphere":
      return (
        <span
          className="inline-block w-3.5 h-3.5 rounded-full shrink-0"
          style={{ border: `1.5px solid ${color}`, background: `${color}33` }}
        />
      );
    case "area":
      return (
        <span
          className="inline-block w-4 h-3 rounded-sm shrink-0"
          style={{ background: `${color}44`, border: `1px solid ${color}` }}
        />
      );
    case "dash":
      return (
        <span
          className="inline-block w-4 border-t-2 border-dashed shrink-0"
          style={{ borderColor: color }}
        />
      );
    default:
      return (
        <span
          className="inline-block w-4 h-[2px] shrink-0"
          style={{ background: color }}
        />
      );
  }
};
