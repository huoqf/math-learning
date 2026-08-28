/**
 * src/features/statPercentile/components/StatPercentileScene.tsx
 * 纯 SVG 渲染分发器：根据 studyMode 分派到三个子场景子组件
 * 零 React/DOM/window 副作用
 */

import React from "react";
import type { SceneScale } from "@/hooks/useSceneScale";
import type { ViewportInfo } from "@/utils/useViewport";
import {
  generateHistogramBins,
  calculateHistogramStats,
  calculateStratifiedSampling,
  calculatePercentileShadeBins,
} from "@/math/statPercentile";
import { StatPercentileHistogramScene } from "./StatPercentileHistogramScene";
import { StatPercentileCumulativeScene } from "./StatPercentileCumulativeScene";
import { StatPercentileStratifiedScene } from "./StatPercentileStratifiedScene";

interface StatPercentileSceneProps {
  params: {
    percentileP: number;
    shift: number;
    sampleN: number;
    N1: number;
    N2: number;
    N3: number;
    mean1: number;
    mean2: number;
    mean3: number;
    var1: number;
    var2: number;
    var3: number;
  };
  scale: SceneScale;
  vp: ViewportInfo;
  onParamChange: (key: string, value: number) => void;
  fontScale?: (v: number) => number;
  studyMode?: "histogram" | "cumulative" | "stratified";
}

export const StatPercentileScene: React.FC<StatPercentileSceneProps> = ({
  params,
  scale,
  vp,
  onParamChange,
  fontScale = (v) => v,
  studyMode = "histogram",
}) => {
  const {
    percentileP,
    shift,
    sampleN,
    N1,
    N2,
    N3,
    mean1,
    mean2,
    mean3,
    var1,
    var2,
    var3,
  } = params;

  const bins = React.useMemo(() => generateHistogramBins(shift), [shift]);
  const stats = React.useMemo(
    () => calculateHistogramStats(bins, percentileP),
    [bins, percentileP],
  );
  const shadeBins = React.useMemo(
    () => calculatePercentileShadeBins(bins, stats.percentileVal),
    [bins, stats.percentileVal],
  );

  const strat = React.useMemo(
    () =>
      calculateStratifiedSampling(
        sampleN,
        N1,
        N2,
        N3,
        mean1,
        mean2,
        mean3,
        var1,
        var2,
        var3,
      ),
    [sampleN, N1, N2, N3, mean1, mean2, mean3, var1, var2, var3],
  );

  if (studyMode === "cumulative") {
    return (
      <StatPercentileCumulativeScene
        percentileP={percentileP}
        bins={bins}
        stats={stats}
        scale={scale}
        vp={vp}
        onParamChange={onParamChange}
        fontScale={fontScale}
      />
    );
  }

  if (studyMode === "stratified") {
    return (
      <StatPercentileStratifiedScene
        strat={strat}
        scale={scale}
        vp={vp}
        onParamChange={onParamChange}
        fontScale={fontScale}
      />
    );
  }

  return (
    <StatPercentileHistogramScene
      percentileP={percentileP}
      bins={bins}
      stats={stats}
      shadeBins={shadeBins}
      scale={scale}
      vp={vp}
      onParamChange={onParamChange}
      fontScale={fontScale}
    />
  );
};
