import React, { useCallback, useState } from "react";
import type { SceneScale } from "@/hooks/useSceneScale";
import type { ViewportInfo } from "@/utils/useViewport";
import { mathToDesign, designToMath } from "@/utils/coordinate";
import { clientToSvgPoint } from "@/utils/useViewportPointer";
import { MATH_COLORS, withAlpha } from "@/theme";
import type { PlacedLabel } from "@/utils/labelAvoider";
import { INTERACTIVE_POINT_GEOMETRY } from "./pointGeometry";

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
  /**
   * 边缘投影手柄（Edge Clamp Projection），默认关闭。
   *
   * 开启后，当动点的设计纵坐标越出可见绘图区的上下边界时，手柄不再「飞出画布即失联」，
   * 而是沿垂直方向吸附到最近边界的内侧，并以「半透明实心点 + 虚线光环 + 指向边界的
   * 虚线引线」标记，表明真实位置位于画布之外。
   *
   * 关键在于：拖拽链路只依赖 `cx/cy + scale + vp`，与渲染位置完全解耦，因此投影手柄
   * 保有与真实手柄完全一致的拖拽能力，用户可直接按住投影点把动点拖回视口。
   *
   * 本开关只影响渲染，不改变任何拖拽约束语义；关闭时（默认）渲染结果与旧版逐像素一致。
   */
  edgeClampProjection?: boolean;
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
  r = INTERACTIVE_POINT_GEOMETRY.defaultR,
  label,
  labelKey,
  placedLabels,
  disabled = false,
  fontScale = (v) => v,
  edgeClampProjection = false,
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

  // ─── 边缘投影（Edge Clamp Projection）────────────────────────────────────────
  // plotTop / plotBottom / plotLeft / plotRight 由 SceneScale 反推，
  // 构成「可见绘图区」矩形边界设计坐标：
  //   designTop = originY - yMax * scaleY ；designBottom = originY - yMin * scaleY
  //   designLeft = originX + xMin * scaleX ；designRight = originX + xMax * scaleX
  // 注意这里钳制的是「渲染位置」，真实数学坐标 pt 原封不动，故：
  //   1) 拖拽链路（见 handlePointerDown）不读取 renderPt，投影手柄照样可拖；
  //   2) 若场景另有依赖 (cx, cy) 的辅助图形（连线、标签避让），其数据源不受影响。
  const plotTop = scale.originY - scale.yMax * scale.scaleY;
  const plotBottom = scale.originY - scale.yMin * scale.scaleY;
  const plotLeft = scale.originX + scale.xMin * scale.scaleX;
  const plotRight = scale.originX + scale.xMax * scale.scaleX;

  const overflowTop = edgeClampProjection && pt.y < plotTop;
  const overflowBottom = edgeClampProjection && pt.y > plotBottom;
  const overflowLeft = edgeClampProjection && pt.x < plotLeft;
  const overflowRight = edgeClampProjection && pt.x > plotRight;
  const isProjected =
    overflowTop || overflowBottom || overflowLeft || overflowRight;

  const inset = INTERACTIVE_POINT_GEOMETRY.edgeProjectionInset;
  const renderPt = {
    x: overflowLeft
      ? plotLeft + inset
      : overflowRight
        ? plotRight - inset
        : pt.x,
    y: overflowTop
      ? plotTop + inset
      : overflowBottom
        ? plotBottom - inset
        : pt.y,
  };

  // 引线目标点：指向被越过的外边界
  const targetEdgePt = {
    x: overflowLeft ? plotLeft : overflowRight ? plotRight : renderPt.x,
    y: overflowTop ? plotTop : overflowBottom ? plotBottom : renderPt.y,
  };

  // 从 placedLabels 中查找匹配的标签位置
  const placedLabel =
    placedLabels && labelKey
      ? placedLabels.find((p) => p.key === labelKey)
      : undefined;
  const labelDy = placedLabel
    ? placedLabel.finalDy
    : -(r + INTERACTIVE_POINT_GEOMETRY.labelDyOffset);

  const haloR = isDragging ? r + 7 : isHovered ? r + 5.5 : r + 4;
  const haloFillAlpha = isDragging ? 0.35 : isHovered ? 0.25 : 0.15;
  const haloStrokeAlpha = isDragging ? 0.7 : isHovered ? 0.55 : 0.35;
  // 投影态光环恒为虚线（表示「手柄是占位替身」），并适当降低填充不透明度；
  // 悬停/拖拽时仍保留虚线，避免用户误以为它就是真实位置。
  const haloDash = isProjected
    ? "3 2"
    : isHovered || isDragging
      ? undefined
      : "3 2";

  return (
    <g className="select-none">
      {/* 0. 边缘投影方向引线：由投影手柄指向被越过的绘图区边界，提示真实位置在画布之外 */}
      {isProjected && (
        <line
          x1={renderPt.x}
          y1={renderPt.y}
          x2={targetEdgePt.x}
          y2={targetEdgePt.y}
          stroke={withAlpha(color, 0.5)}
          strokeWidth={1.5}
          strokeDasharray="4 3"
          className="pointer-events-none"
        />
      )}

      {/* 1. 外层交互指示光环（可拖拽视觉线索） */}
      {!disabled && (
        <circle
          cx={renderPt.x}
          cy={renderPt.y}
          r={haloR}
          fill={withAlpha(
            color,
            isProjected ? haloFillAlpha * 0.7 : haloFillAlpha,
          )}
          stroke={withAlpha(color, isProjected ? 0.6 : haloStrokeAlpha)}
          strokeWidth={1.5}
          strokeDasharray={haloDash}
          className="pointer-events-none transition-all duration-200"
        />
      )}

      {/* 2. 核心圆点（投影态半透明，视觉上弱于真实手柄） */}
      <circle
        cx={renderPt.x}
        cy={renderPt.y}
        r={isDragging ? r + 0.5 : r}
        fill={color}
        fillOpacity={isProjected ? 0.55 : 1}
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
        cx={renderPt.x}
        cy={renderPt.y}
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

      {/* 4. 标签文字（跟随投影位置，避免随真实点一起飞出画布） */}
      {label && (
        <text
          x={renderPt.x}
          y={renderPt.y}
          dy={labelDy}
          textAnchor={placedLabel?.anchor ?? "middle"}
          fill={MATH_COLORS.labelText}
          fontSize={fontScale(INTERACTIVE_POINT_GEOMETRY.defaultFontSize)}
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
