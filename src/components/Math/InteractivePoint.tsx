import React, { useCallback } from "react";
import type { SceneScale } from "@/hooks/useSceneScale";
import type { ViewportInfo } from "@/utils/useViewport";
import { mathToDesign, designToMath } from "@/utils/coordinate";
import { clientToSvgPoint } from "@/utils/useViewportPointer";
import { MATH_COLORS } from "@/theme";

interface InteractivePointProps {
  /** 数学坐标 x */
  cx: number;
  /** 数学坐标 y */
  cy: number;
  /** 场景比例尺 */
  scale: SceneScale;
  /** 视口信息（用于坐标逆转换） */
  vp: ViewportInfo;
  /** 拖拽回调，返回新的数学坐标 */
  onDrag: (mathPt: { x: number; y: number }) => void;
  /** 圆点颜色 */
  color?: string;
  /** 圆点半径 */
  r?: number;
  /** 标签文字 */
  label?: string;
  /** 是否禁用拖拽 */
  disabled?: boolean;
  /** 字号缩放函数，默认原样返回 */
  fontScale?: (v: number) => number;
}

export const InteractivePoint: React.FC<InteractivePointProps> = ({
  cx,
  cy,
  scale,
  vp,
  onDrag,
  color = MATH_COLORS.focusPoint,
  r = 6,
  label,
  disabled = false,
  fontScale = (v) => v,
}) => {
  const handlePointerDown = useCallback(
    (e: React.PointerEvent<SVGCircleElement>) => {
      if (disabled) return;
      e.preventDefault();
      e.stopPropagation();

      const circle = e.currentTarget;
      circle.setPointerCapture(e.pointerId);

      const svg = circle.ownerSVGElement;
      if (!svg) return;

      const handlePointerMove = (moveEvent: PointerEvent) => {
        const svgPt = clientToSvgPoint(
          moveEvent.clientX,
          moveEvent.clientY,
          svg,
        );
        if (!svgPt) return;

        // SVG 视口坐标 → 设计坐标 → 数学坐标
        const designX = (svgPt.x - vp.tx) / vp.scale;
        const designY = (svgPt.y - vp.ty) / vp.scale;
        const mathPt = designToMath(designX, designY, scale);
        onDrag(mathPt);
      };

      const handlePointerUp = () => {
        circle.releasePointerCapture(e.pointerId);
        window.removeEventListener("pointermove", handlePointerMove);
        window.removeEventListener("pointerup", handlePointerUp);
      };

      window.addEventListener("pointermove", handlePointerMove);
      window.addEventListener("pointerup", handlePointerUp);
    },
    [disabled, vp.tx, vp.ty, vp.scale, scale, onDrag],
  );

  const pt = mathToDesign(cx, cy, scale);

  return (
    <g>
      {/* 扩大点击区域的透明圆 */}
      <circle
        cx={pt.x}
        cy={pt.y}
        r={r + 6}
        fill="transparent"
        className={
          disabled ? "cursor-default" : "cursor-grab active:cursor-grabbing"
        }
        onPointerDown={handlePointerDown}
      />
      {/* 可见圆点 */}
      <circle
        cx={pt.x}
        cy={pt.y}
        r={r}
        fill={color}
        stroke={MATH_COLORS.white}
        strokeWidth={2}
        className="pointer-events-none transition-transform duration-100"
        style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.2))" }}
      />
      {/* 标签 */}
      {label && (
        <text
          x={pt.x}
          y={pt.y - r - 6}
          textAnchor="middle"
          fill={MATH_COLORS.labelText}
          fontSize={fontScale(10)}
          fontFamily="monospace"
          fontWeight="600"
          className="select-none pointer-events-none"
        >
          {label}
        </text>
      )}
    </g>
  );
};
