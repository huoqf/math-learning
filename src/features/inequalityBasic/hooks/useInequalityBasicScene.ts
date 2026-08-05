import { useMemo, useCallback } from "react";
import type { SceneScale } from "@/hooks/useSceneScale";
import { mathToDesign } from "@/utils/coordinate";
import { avoidLabelOverlap } from "@/utils/labelOverlap";
import {
  calcMeans,
  getSemicircleGeometry,
  getSquareProofGeometry,
  getNikeExtremaGeometry,
} from "../math/inequalityBasic";

interface UseInequalityBasicSceneProps {
  params: {
    a: number;
    b: number;
    k: number;
  };
  scale: SceneScale;
  onParamChange: (key: string, value: number) => void;
  studyMode: "semicircle" | "square" | "nike";
}

export function useInequalityBasicScene({
  params,
  scale,
  onParamChange,
  studyMode,
}: UseInequalityBasicSceneProps) {
  const { a, b, k } = params;

  // 1. 四大均值纯数学计算结果
  const means = useMemo(() => calcMeans(a, b), [a, b]);

  // 2. 各模式几何数据
  const semicircleGeo = useMemo(() => getSemicircleGeometry(a, b), [a, b]);
  const squareGeo = useMemo(() => getSquareProofGeometry(a, b), [a, b]);
  const nikeGeo = useMemo(() => getNikeExtremaGeometry(k, a), [k, a]);

  // 3. 拖拽切分点 P (接收数学坐标 px)
  const handlePointPDrag = useCallback(
    (px: number) => {
      // P 点数学坐标 px = (a - b) / 2, 且直径为 a + b
      // 保持总直径 lenSum = a + b 不变
      const lenSum = a + b;
      let newA = lenSum / 2 + px;
      let newB = lenSum - newA;

      // 范围钳制在 [0.2, 9.8]
      newA = Math.min(Math.max(0.2, newA), 9.8);
      newB = Math.min(Math.max(0.2, newB), 9.8);

      onParamChange("a", Number(newA.toFixed(1)));
      onParamChange("b", Number(newB.toFixed(1)));
    },
    [a, b, onParamChange],
  );

  // 4. 标签定位与避让 (针对半圆几何模式)
  const labels = useMemo(() => {
    if (studyMode !== "semicircle") return [];

    const R = semicircleGeo.radius;

    const rawLabels = [
      {
        key: "A",
        x:
          mathToDesign(semicircleGeo.pointA.x, semicircleGeo.pointA.y, scale)
            .x - 12,
        y:
          mathToDesign(semicircleGeo.pointA.x, semicircleGeo.pointA.y, scale)
            .y + 16,
        text: `A (-${R.toFixed(1)})`,
        anchor: "end" as const,
      },
      {
        key: "B",
        x:
          mathToDesign(semicircleGeo.pointB.x, semicircleGeo.pointB.y, scale)
            .x + 12,
        y:
          mathToDesign(semicircleGeo.pointB.x, semicircleGeo.pointB.y, scale)
            .y + 16,
        text: `B (${R.toFixed(1)})`,
        anchor: "start" as const,
      },
      {
        key: "P",
        x: mathToDesign(semicircleGeo.pointP.x, semicircleGeo.pointP.y, scale)
          .x,
        y:
          mathToDesign(semicircleGeo.pointP.x, semicircleGeo.pointP.y, scale)
            .y + 18,
        text: `P(切分点)`,
        anchor: "middle" as const,
      },
      {
        key: "C",
        x: mathToDesign(semicircleGeo.pointC.x, semicircleGeo.pointC.y, scale)
          .x,
        y:
          mathToDesign(semicircleGeo.pointC.x, semicircleGeo.pointC.y, scale)
            .y - 12,
        text: `C (GM = ${means.gm.toFixed(2)})`,
        anchor: "middle" as const,
      },
      {
        key: "O",
        x: mathToDesign(0, 0, scale).x,
        y: mathToDesign(0, 0, scale).y + 18,
        text: `O (AM = ${means.am.toFixed(2)})`,
        anchor: "middle" as const,
      },
    ];

    return avoidLabelOverlap(rawLabels, 16);
  }, [semicircleGeo, scale, means, studyMode]);

  return {
    means,
    semicircleGeo,
    squareGeo,
    nikeGeo,
    handlePointPDrag,
    labels,
  };
}
