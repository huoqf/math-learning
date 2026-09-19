import { useMemo } from "react";
import type { ViewportInfo } from "@/utils/useViewport";

export interface SceneScale {
  scaleX: number;
  scaleY: number;
  scale: number;
  originX: number;
  originY: number;
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
}

export interface CalculateSceneScaleParams {
  designVisibleW: number;
  designVisibleH: number;
  designLeft: number;
  designTop: number;
  xRange: [number, number];
  yRange: [number, number];
  keepAspectRatio?: boolean;
}

export interface SceneScaleOptions {
  vp: Pick<
    ViewportInfo,
    "designVisibleW" | "designVisibleH" | "designLeft" | "designTop"
  >;
  xRange: [number, number];
  yRange: [number, number];
  keepAspectRatio?: boolean;
}

/**
 * 纯数学计算场景比例尺与坐标系原点（零 hook 依赖，供组件与单测同源调用）
 */
export function calculateSceneScale({
  designVisibleW,
  designVisibleH,
  designLeft,
  designTop,
  xRange,
  yRange,
  keepAspectRatio = true,
}: CalculateSceneScaleParams): SceneScale {
  const [xMinInput, xMaxInput] = xRange;
  const [yMinInput, yMaxInput] = yRange;

  // 计算缩放因子 (keepAspectRatio=true 时保持 1:1 纵横比，等于 false 时各自填满视口)
  const rawScaleX = designVisibleW / (xMaxInput - xMinInput);
  const rawScaleY = designVisibleH / (yMaxInput - yMinInput);
  const minScale = Math.min(rawScaleX, rawScaleY);

  const scaleX = keepAspectRatio ? minScale : rawScaleX;
  const scaleY = keepAspectRatio ? minScale : rawScaleY;

  // 计算设计坐标系下的视口中心点与数学区间的中心点
  const designCenterX = designLeft + designVisibleW / 2;
  const designCenterY = designTop + designVisibleH / 2;
  const mathCenterX = (xMinInput + xMaxInput) / 2;
  const mathCenterY = (yMinInput + yMaxInput) / 2;

  // 定位数学原点 (0, 0) 在设计坐标系中的像素位置
  const originX = designCenterX - mathCenterX * scaleX;
  const originY = designCenterY + mathCenterY * scaleY;

  // 动态向外推导出覆盖整个可见设计视口物理边界的实际数学范围
  const xMin = (designLeft - originX) / scaleX;
  const xMax = (designLeft + designVisibleW - originX) / scaleX;
  const yMin = (originY - (designTop + designVisibleH)) / scaleY;
  const yMax = (originY - designTop) / scaleY;

  return {
    scaleX,
    scaleY,
    scale: minScale,
    originX,
    originY,
    xMin,
    xMax,
    yMin,
    yMax,
  };
}

export function useSceneScale({
  vp,
  xRange,
  yRange,
  keepAspectRatio = true,
}: SceneScaleOptions): SceneScale {
  const { designVisibleW, designVisibleH, designLeft, designTop } = vp;
  return useMemo(
    () =>
      calculateSceneScale({
        designVisibleW,
        designVisibleH,
        designLeft,
        designTop,
        xRange,
        yRange,
        keepAspectRatio,
      }),
    [
      designVisibleW,
      designVisibleH,
      designLeft,
      designTop,
      xRange,
      yRange,
      keepAspectRatio,
    ],
  );
}
