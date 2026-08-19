import { memo } from "react";

export type InteractionMode3D = "orbit" | "drag";

interface ModeSwitchOverlay3DProps {
  mode: InteractionMode3D;
  onModeChange: (next: InteractionMode3D) => void;
  pointCount?: number;
  className?: string;
}

/**
 * 3D 画布右上角交互模式切换浮层
 *
 * 核心解决 3D 鼠标拖拽调整动点与 OrbitControls 视角旋转缩放冲突：
 * 1. 【视角漫游 🔄】：启用相机轨道旋转缩放，动点锁定防误触
 * 2. 【动点交互 👆】：禁用相机控制器，动点激活外光晕，专注鼠标单手拖拽调参
 */
export const ModeSwitchOverlay3D = memo(function ModeSwitchOverlay3D({
  mode,
  onModeChange,
  pointCount,
  className = "",
}: ModeSwitchOverlay3DProps) {
  return (
    <div
      className={`absolute top-3 right-3 z-20 flex items-center gap-1.5 p-1 bg-white/85 backdrop-blur-md border border-neutral-200/80 rounded-lg shadow-sm ${className}`}
    >
      <button
        type="button"
        onClick={() => onModeChange("orbit")}
        className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md transition-all duration-150 ${
          mode === "orbit"
            ? "bg-blue-600 text-white shadow-xs"
            : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100"
        }`}
        title="允许 360° 旋转、缩放与观察模型视角（动点已锁定防误触）"
      >
        <span className="text-sm">🔄</span>
        <span>视角漫游</span>
      </button>

      <button
        type="button"
        onClick={() => onModeChange("drag")}
        className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md transition-all duration-150 ${
          mode === "drag"
            ? "bg-amber-600 text-white shadow-xs"
            : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100"
        }`}
        title="按住鼠标左键直接在 3D 模型上拖拽动点（已禁用视角旋转防冲突）"
      >
        <span className="text-sm">👆</span>
        <span>动点交互</span>
        {pointCount !== undefined && pointCount > 0 && (
          <span
            className={`ml-0.5 px-1.5 py-0.2 text-[10px] rounded-full ${
              mode === "drag"
                ? "bg-amber-700/80 text-amber-100"
                : "bg-neutral-200 text-neutral-600"
            }`}
          >
            {pointCount}
          </span>
        )}
      </button>
    </div>
  );
});
