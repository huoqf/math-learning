import React, { useCallback, useState } from "react";
import type { SceneScale } from "@/hooks/useSceneScale";
import type { ViewportInfo } from "@/utils/useViewport";
import { mathToDesign, designToMath } from "@/utils/coordinate";
import { clientToSvgPoint } from "@/utils/useViewportPointer";
import { MATH_COLORS, withAlpha } from "@/theme";
import type { PlacedLabel } from "@/utils/labelAvoider";

interface InteractivePointProps {
  /** 数学坐标 x */
  cx: number;
  /** 数学坐标 y */
  cy: number;
  /** 场景比例尺 */
  scale: SceneScale;
  /** 视口信息（用于坐标逆转换） */
  vp?: ViewportInfo;
  /**
   * 拖拽原生回调，返回受约束后的数学坐标 { x, y }。
   * 注意：参数已是数学坐标，业务层严禁再次调用 designToMath。
   */
  onDrag?: (mathPt: { x: number; y: number }) => void;
  /**
   * 自由度约束轴：
   * - 'x': 仅允许水平平移（如卡位检验垂线探针），纵坐标自动锁定不变；
   * - 'y': 仅允许垂直平移，横坐标自动锁定不变；
   * - 'both': 全向平面自由拖拽（默认）。
   */
  axis?: "x" | "y" | "both";
  /**
   * 曲线吸附函数：拖拽时纵坐标由 y = snapTo(x) 强制驱动计算，动点绝对不脱轨。
   */
  snapTo?: (x: number) => number;
  /**
   * 横向数学有效取值区间 [min, max]。
   * 拖拽时由底层自动进行 Clamp 截断，业务层无需重复手写 Math.max / Math.min。
   */
  xRange?: [number, number];
  /**
   * 纵向数学有效取值区间 [min, max]。
   */
  yRange?: [number, number];
  /**
   * 单自变量变化快捷回调 (newX: number) => void。
   * 当配置了 axis="x" 或 snapTo 时，直接派发受约束的有效横坐标，业务代码极简。
   */
  onChangeX?: (newX: number) => void;
  /**
   * 单因变量变化快捷回调 (newY: number) => void。
   */
  onChangeY?: (newY: number) => void;
  /** 圆点颜色，默认红色 focusPoint */
  color?: string;
  /** 核心圆点半径，默认 6 */
  r?: number;
  /** 标签文字 */
  label?: string;
  /** 标签唯一标识（用于匹配 placedLabels） */
  labelKey?: string;
  /** 预计算的避让标签位置（来自 avoidLabels()），传入后覆盖默认 dy */
  placedLabels?: PlacedLabel[];
  /** 是否禁用拖拽 */
  disabled?: boolean;
  /** 字号与尺寸缩放函数，默认原样返回 */
  fontScale?: (v: number) => number;
}

/**
 * 可拖拽数学交互控制点 (InteractivePoint)
 * 专用于中屏由鼠标交互拖拽的特征控制点：
 * - 底层防呆：内建 axis 单向锁定、snapTo 曲线吸附与 xRange 范围截断，杜绝脱轨与参数打架；
 * - 双环设计：外层半透明交互指示光环（交互手柄标识） + 核心实心圆点 + 白色描边；
 * - 明确的 Hover / Active 交互反馈与光晕扩散；
 * - 纯数学静态特征点请使用 `MathPoint`，二者在视觉上有明确的分工。
 */
export const InteractivePoint: React.FC<InteractivePointProps> = ({
  cx,
  cy,
  scale,
  vp = {
    tx: 0,
    ty: 0,
    scale: 1,
    svgWidth: 840,
    svgHeight: 650,
    transform: "",
  },
  onDrag,
  axis = "both",
  snapTo,
  xRange,
  yRange,
  onChangeX,
  onChangeY,
  color = MATH_COLORS.focusPoint,
  r = 6,
  label,
  labelKey,
  placedLabels,
  disabled = false,
  fontScale = (v) => v,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<SVGCircleElement>) => {
      if (disabled) return;
      e.preventDefault();
      e.stopPropagation();

      setIsDragging(true);
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
        const rawPt = designToMath(designX, designY, scale);

        let targetX = rawPt.x;
        let targetY = rawPt.y;

        // 1. 横坐标 clamp 约束
        if (xRange) {
          targetX = Math.max(xRange[0], Math.min(xRange[1], targetX));
        }

        // 2. 纵坐标 clamp 约束
        if (yRange) {
          targetY = Math.max(yRange[0], Math.min(yRange[1], targetY));
        }

        // 3. 自由度与几何吸附模式
        if (snapTo) {
          targetY = snapTo(targetX);
        } else if (axis === "x") {
          targetY = cy; // 锁定初始纵坐标，横向移动绝不上下跳动
        } else if (axis === "y") {
          targetX = cx; // 锁定初始横坐标
        }

        // 4. 派发回调
        onChangeX?.(targetX);
        onChangeY?.(targetY);
        onDrag?.({ x: targetX, y: targetY });
      };

      const handlePointerUp = () => {
        setIsDragging(false);
        circle.releasePointerCapture(e.pointerId);
        window.removeEventListener("pointermove", handlePointerMove);
        window.removeEventListener("pointerup", handlePointerUp);
      };

      window.addEventListener("pointermove", handlePointerMove);
      window.addEventListener("pointerup", handlePointerUp);
    },
    [
      disabled,
      vp.tx,
      vp.ty,
      vp.scale,
      scale,
      axis,
      snapTo,
      xRange,
      yRange,
      cx,
      cy,
      onChangeX,
      onChangeY,
      onDrag,
    ],
  );

  const pt = mathToDesign(cx, cy, scale);

  // 从 placedLabels 中查找匹配的标签位置
  const placedLabel =
    placedLabels && labelKey
      ? placedLabels.find((p) => p.key === labelKey)
      : undefined;
  const labelDy = placedLabel ? placedLabel.finalDy : -(r + 8);

  const haloR = isDragging ? r + 7 : isHovered ? r + 5.5 : r + 4;
  const haloFillAlpha = isDragging ? 0.35 : isHovered ? 0.25 : 0.15;
  const haloStrokeAlpha = isDragging ? 0.7 : isHovered ? 0.55 : 0.35;

  return (
    <g className="select-none">
      {/* 1. 外层交互指示光环（可拖拽视觉线索） */}
      {!disabled && (
        <circle
          cx={pt.x}
          cy={pt.y}
          r={haloR}
          fill={withAlpha(color, haloFillAlpha)}
          stroke={withAlpha(color, haloStrokeAlpha)}
          strokeWidth={1.5}
          strokeDasharray={isHovered || isDragging ? undefined : "3 2"}
          className="pointer-events-none transition-all duration-200"
        />
      )}

      {/* 2. 核心圆点 */}
      <circle
        cx={pt.x}
        cy={pt.y}
        r={isDragging ? r + 0.5 : r}
        fill={color}
        stroke={MATH_COLORS.white}
        strokeWidth={2}
        className="pointer-events-none transition-all duration-150"
        style={{
          filter: isDragging
            ? "drop-shadow(0 3px 6px rgba(0,0,0,0.35))"
            : isHovered
              ? "drop-shadow(0 2px 5px rgba(0,0,0,0.3))"
              : "drop-shadow(0 1px 3px rgba(0,0,0,0.2))",
        }}
      />

      {/* 3. 扩大点击与手势响应区域的透明交互圆 */}
      <circle
        cx={pt.x}
        cy={pt.y}
        r={r + 10}
        fill="transparent"
        className={
          disabled
            ? "cursor-default"
            : isDragging
              ? "cursor-grabbing"
              : "cursor-grab"
        }
        onPointerDown={handlePointerDown}
        onPointerEnter={() => !disabled && setIsHovered(true)}
        onPointerLeave={() => setIsHovered(false)}
      />

      {/* 4. 标签文字 */}
      {label && (
        <text
          x={pt.x}
          y={pt.y}
          dy={labelDy}
          textAnchor={placedLabel?.anchor ?? "middle"}
          fill={MATH_COLORS.labelText}
          fontSize={fontScale(11)}
          fontFamily="system-ui, -apple-system, sans-serif"
          fontWeight="600"
          className="select-none pointer-events-none"
        >
          {label}
        </text>
      )}
    </g>
  );
};
