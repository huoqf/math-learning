import { useCallback, useRef } from "react";

interface UseRadioGroupOptions {
  /** 当前选中值 */
  value: string;
  /** 所有选项的 key 列表 */
  keys: string[];
  /** 选中变更回调 */
  onChange: (key: string) => void;
  /** 布局模式：linear（一维 flex）或 grid（二维网格） */
  direction?: "linear" | "grid";
  /** grid 模式下的列数，仅 direction="grid" 时生效 */
  columns?: number;
}

interface RadioItemProps {
  role: "radio";
  "aria-checked": boolean;
  tabIndex: number;
  onKeyDown: (e: React.KeyboardEvent) => void;
}

/**
 * 互斥单选组的 radiogroup + roving tabindex hook。
 *
 * - direction="linear"：← → Home End
 * - direction="grid"：← → ↑ ↓ Home End，按 columns 计算跨行
 */
export function useRadioGroup({
  value,
  keys,
  onChange,
  direction = "linear",
  columns = 2,
}: UseRadioGroupOptions) {
  const itemRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

  const registerRef = useCallback(
    (key: string, el: HTMLButtonElement | null) => {
      if (el) {
        itemRefs.current.set(key, el);
      } else {
        itemRefs.current.delete(key);
      }
    },
    [],
  );

  const focusItem = useCallback((key: string) => {
    itemRefs.current.get(key)?.focus();
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
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
    [value, keys, onChange, direction, columns, focusItem],
  );

  const getItemProps = useCallback(
    (key: string): RadioItemProps => ({
      role: "radio",
      "aria-checked": value === key,
      tabIndex: value === key ? 0 : -1,
      onKeyDown: handleKeyDown,
    }),
    [value, handleKeyDown],
  );

  return { getItemProps, registerRef };
}
