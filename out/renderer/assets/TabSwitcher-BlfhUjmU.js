import { r as reactExports, j as jsxRuntimeExports } from "./index-Bz0Bjl36.js";
import { u as useRadioGroup } from "./useRadioGroup-jCNJTR-s.js";
import { K as KatexFormula } from "./probabilityBayes-BWtGIkMp.js";
const TabSwitcher = ({
  tabs,
  value,
  onChange,
  layout = "vertical",
  className = ""
}) => {
  const keys = tabs.map((t) => t.key);
  const { getItemProps, registerRef } = useRadioGroup({
    value,
    keys,
    onChange,
    direction: "linear"
  });
  const setRef = reactExports.useCallback(
    (key) => (el) => {
      registerRef(key, el);
    },
    [registerRef]
  );
  const isHorizontal = layout === "horizontal";
  const containerClass = isHorizontal ? "grid grid-flow-col auto-cols-fr bg-neutral-100 p-1 rounded-xl gap-1" : "flex flex-col bg-neutral-100 p-1.5 rounded-xl gap-1";
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    "div",
    {
      role: "radiogroup",
      className: [containerClass, className].filter(Boolean).join(" "),
      children: tabs.map((tab) => {
        const isSelected = value === tab.key;
        const itemProps = getItemProps(tab.key);
        return /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            ref: setRef(tab.key),
            ...itemProps,
            onClick: () => onChange(tab.key),
            className: [
              "py-2 px-2 text-xs font-bold rounded-lg transition-all duration-200 whitespace-nowrap overflow-hidden text-center",
              isHorizontal ? "flex justify-center items-center" : "text-left",
              isSelected ? "bg-white text-primary-600 shadow-md ring-1 ring-primary-200" : "text-neutral-500 hover:text-neutral-700 hover:bg-white/50"
            ].join(" "),
            children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "div",
              {
                className: [
                  "flex flex-row items-center gap-1.5 w-full",
                  isHorizontal ? "justify-center text-center" : ""
                ].join(" "),
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[12px] font-bold leading-tight whitespace-nowrap truncate", children: tab.label }),
                  tab.formula && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "whitespace-nowrap opacity-80", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                    KatexFormula,
                    {
                      formula: tab.formula,
                      mode: "inline",
                      className: "!text-[11px] !my-0 !mx-0"
                    }
                  ) })
                ]
              }
            )
          },
          tab.key
        );
      })
    }
  );
};
export {
  TabSwitcher as T
};
