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

interface UseSceneScaleOptions {
  vp: ViewportInfo;
  xRange: [number, number];
  yRange: [number, number];
}

export function useSceneScale({
  vp,
  xRange,
  yRange,
}: UseSceneScaleOptions): SceneScale {
  return useMemo(() => {
    const [xMinInput, xMaxInput] = xRange;
    const [yMinInput, yMaxInput] = yRange;

    // 直接复用 VIEWPORT 既有的设计坐标属性
    const designW = vp.designVisibleW;
    const designH = vp.designVisibleH;
    const left = vp.designLeft;
    const top = vp.designTop;

    // 计算等比缩放因子，取较小值保持 1:1 纵横比
    const scaleX = designW / (xMaxInput - xMinInput);
    const scaleY = designH / (yMaxInput - yMinInput);
    const scale = Math.min(scaleX, scaleY);

    // 计算设计坐标系下的视口中心点与数学区间的中心点
    const designCenterX = left + designW / 2;
    const designCenterY = top + designH / 2;
    const mathCenterX = (xMinInput + xMaxInput) / 2;
    const mathCenterY = (yMinInput + yMaxInput) / 2;

    // 定位数学原点 (0, 0) 在设计坐标系中的像素位置
    const originX = designCenterX - mathCenterX * scale;
    const originY = designCenterY + mathCenterY * scale;

    // 动态向外推导出覆盖整个可见设计视口物理边界的实际数学范围
    const xMin = (left - originX) / scale;
    const xMax = (left + designW - originX) / scale;
    const yMin = (originY - (top + designH)) / scale;
    const yMax = (originY - top) / scale;

    return {
      scaleX: scale,
      scaleY: scale,
      scale,
      originX,
      originY,
      xMin,
      xMax,
      yMin,
      yMax,
    };
  }, [
    vp.designVisibleW,
    vp.designVisibleH,
    vp.designLeft,
    vp.designTop,
    xRange,
    yRange,
  ]);
}
