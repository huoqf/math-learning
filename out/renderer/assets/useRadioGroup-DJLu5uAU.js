import { r as reactExports } from "./index-DT9BKSox.js";
function useRadioGroup({
  value,
  keys,
  onChange,
  direction = "linear",
  columns = 2
}) {
  const itemRefs = reactExports.useRef(/* @__PURE__ */ new Map());
  const registerRef = reactExports.useCallback(
    (key, el) => {
      if (el) {
        itemRefs.current.set(key, el);
      } else {
        itemRefs.current.delete(key);
      }
    },
    []
  );
  const focusItem = reactExports.useCallback((key) => {
    itemRefs.current.get(key)?.focus();
  }, []);
  const handleKeyDown = reactExports.useCallback(
    (e) => {
      const currentIndex = keys.indexOf(value);
      if (currentIndex === -1) return;
      let nextIndex = currentIndex;
      switch (e.key) {
        case "ArrowRight":
          e.preventDefault();
          nextIndex = Math.min(currentIndex + 1, keys.length - 1);
          break;
        case "ArrowLeft":
          e.preventDefault();
          nextIndex = Math.max(currentIndex - 1, 0);
          break;
        case "ArrowDown":
          e.preventDefault();
          if (direction === "grid") {
            nextIndex = Math.min(currentIndex + columns, keys.length - 1);
          } else {
            nextIndex = Math.min(currentIndex + 1, keys.length - 1);
          }
          break;
        case "ArrowUp":
          e.preventDefault();
          if (direction === "grid") {
            nextIndex = Math.max(currentIndex - columns, 0);
          } else {
            nextIndex = Math.max(currentIndex - 1, 0);
          }
          break;
        case "Home":
          e.preventDefault();
          nextIndex = 0;
          break;
        case "End":
          e.preventDefault();
          nextIndex = keys.length - 1;
          break;
        default:
          return;
      }
      if (nextIndex !== currentIndex) {
        onChange(keys[nextIndex]);
        focusItem(keys[nextIndex]);
      }
    },
    [value, keys, onChange, direction, columns, focusItem]
  );
  const getItemProps = reactExports.useCallback(
    (key) => ({
      role: "radio",
      "aria-checked": value === key,
      tabIndex: value === key ? 0 : -1,
      onKeyDown: handleKeyDown
    }),
    [value, handleKeyDown]
  );
  return { getItemProps, registerRef };
}
export {
  useRadioGroup as u
};
