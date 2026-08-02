import { r as reactExports, j as jsxRuntimeExports } from "./index-DT9BKSox.js";
import { u as useRadioGroup } from "./useRadioGroup-DJLu5uAU.js";
import { K as KatexFormula } from "./probabilityBayes-DNLi5nE3.js";
const COLOR_STYLES = {
  primary: {
    selected: {
      outline: "border-primary-500 bg-primary-50 text-primary-700 font-bold shadow-sm",
      filled: "bg-primary-500 text-white border-primary-500 shadow-sm"
    },
    unselected: "border-neutral-200 bg-white text-neutral-600",
    hover: "hover:border-primary-300 hover:bg-primary-50/30"
  },
  success: {
    selected: {
      outline: "border-success-500 bg-success-50 text-success-700 font-bold shadow-sm",
      filled: "bg-success-600 text-white border-success-600 shadow-sm"
    },
    unselected: "border-neutral-200 bg-white text-neutral-600",
    hover: "hover:border-success-300 hover:bg-success-50/30"
  }
};
const SelectGrid = ({
  items,
  value,
  onChange,
  variant = "outline",
  color = "primary",
  columns = 2,
  className = ""
}) => {
  const keys = items.map((i) => i.key);
  const { getItemProps, registerRef } = useRadioGroup({
    value,
    keys,
    onChange,
    direction: columns >= 2 ? "grid" : "linear",
    columns
  });
  const setRef = reactExports.useCallback(
    (key) => (el) => {
      registerRef(key, el);
    },
    [registerRef]
  );
  const colorStyle = COLOR_STYLES[color];
  const gridClass = columns === 3 ? "grid grid-cols-3 gap-1.5" : columns === 1 ? "grid grid-cols-1 gap-1.5" : "grid grid-cols-2 gap-1.5";
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    "div",
    {
      role: "radiogroup",
      className: [gridClass, className].filter(Boolean).join(" "),
      children: items.map((item) => {
        const isSelected = value === item.key;
        const itemProps = getItemProps(item.key);
        const selectedClass = isSelected ? colorStyle.selected[variant] : colorStyle.unselected;
        const hoverClass = isSelected ? "" : colorStyle.hover;
        const spanClass = item.fullWidth ? "col-span-2" : "";
        const ariaLabel = item.description ? `${item.label}, ${item.description}` : item.label;
        return /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            ref: setRef(item.key),
            ...itemProps,
            "aria-label": ariaLabel,
            onClick: () => onChange(item.key),
            className: [
              "py-2 px-2.5 text-[11px] font-semibold border-2 rounded-lg transition-all duration-200 whitespace-nowrap min-w-0 overflow-hidden",
              selectedClass,
              hoverClass,
              spanClass
            ].filter(Boolean).join(" "),
            children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col items-center justify-center gap-0.5 text-center w-full", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[12px] font-bold leading-tight whitespace-nowrap truncate w-full", children: item.label }),
              item.formula && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-full truncate whitespace-nowrap opacity-90", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                KatexFormula,
                {
                  formula: item.formula,
                  mode: "inline",
                  className: "!text-[10px] !my-0 !mx-0"
                }
              ) }),
              item.description && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] opacity-70 whitespace-nowrap truncate w-full", children: item.description })
            ] })
          },
          item.key
        );
      })
    }
  );
};
export {
  SelectGrid as S
};
