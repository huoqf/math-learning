/**
 * src/features/vectorPolarizationApollonius/hooks/useVectorPolarizationApolloniusScene.ts
 * 向量极化恒等式与阿波罗尼斯圆 Scene 逻辑 Hook
 */

import { useMemo } from "react";
import type { SceneScale } from "@/hooks/useSceneScale";
import { mathToDesign } from "@/utils/coordinate";
import {
  calcPolarizationIdentity,
  calcApolloniusCircle,
  calcCombinedModel,
} from "@/math/vectorPolarizationApollonius";
import type { VectorPolarizationApolloniusParams } from "@/data/registries/vectorPolarizationApollonius";

interface UseVectorPolarizationApolloniusSceneProps {
  params: VectorPolarizationApolloniusParams;
  scale: SceneScale;
  onParamChange: (key: string, value: number) => void;
  studyMode: "polarization" | "apollonius" | "combined";
}

export function useVectorPolarizationApolloniusScene({
  params,
  scale,
  onParamChange,
  studyMode,
}: UseVectorPolarizationApolloniusSceneProps) {
  const { bcLength, lambda, pointAngle, pointX, pointY } = params;

  // 1. 模式计算
  const polarizationData = useMemo(() => {
    return calcPolarizationIdentity(pointX, pointY, bcLength);
  }, [pointX, pointY, bcLength]);

  const apolloniusData = useMemo(() => {
    return calcApolloniusCircle(bcLength, lambda, pointAngle);
  }, [bcLength, lambda, pointAngle]);

  const combinedData = useMemo(() => {
    return calcCombinedModel(bcLength, lambda, pointAngle);
  }, [bcLength, lambda, pointAngle]);

  // 2. 拖拽回调 (反向求解参数，铁律 7)
  const handlePointADrag = (newX: number, newY: number) => {
    onParamChange("pointX", Math.round(newX * 10) / 10);
    onParamChange("pointY", Math.round(newY * 10) / 10);
  };

  const handlePointPDrag = (newX: number, newY: number) => {
    if (studyMode === "apollonius" || studyMode === "combined") {
      const centerO = apolloniusData.centerO;
      if (apolloniusData.isDegenerate) {
        // 在中垂线上，根据 Y 计算 angleDeg
        let deg = Math.round((Math.atan2(newY, 3) * 180) / Math.PI);
        if (deg < 0) deg += 360;
        onParamChange("pointAngle", deg);
      } else {
        let rad = Math.atan2(newY - centerO.y, newX - centerO.x);
        let deg = Math.round((rad * 180) / Math.PI);
        if (deg < 0) deg += 360;
        onParamChange("pointAngle", deg);
      }
    }
  };

  // 3. 计算设计坐标
  const designA = useMemo(
    () =>
      mathToDesign(polarizationData.pointA.x, polarizationData.pointA.y, scale),
    [polarizationData.pointA, scale],
  );
  const designB = useMemo(
    () =>
      mathToDesign(polarizationData.pointB.x, polarizationData.pointB.y, scale),
    [polarizationData.pointB, scale],
  );
  const designC = useMemo(
    () =>
      mathToDesign(polarizationData.pointC.x, polarizationData.pointC.y, scale),
    [polarizationData.pointC, scale],
  );
  const designM = useMemo(
    () =>
      mathToDesign(polarizationData.pointM.x, polarizationData.pointM.y, scale),
    [polarizationData.pointM, scale],
  );

  const designP = useMemo(
    () => mathToDesign(apolloniusData.pointP.x, apolloniusData.pointP.y, scale),
    [apolloniusData.pointP, scale],
  );
  const designCenterO = useMemo(
    () =>
      mathToDesign(apolloniusData.centerO.x, apolloniusData.centerO.y, scale),
    [apolloniusData.centerO, scale],
  );
  const designD = useMemo(
    () => mathToDesign(apolloniusData.pointD.x, apolloniusData.pointD.y, scale),
    [apolloniusData.pointD, scale],
  );
  const designE = useMemo(
    () => mathToDesign(apolloniusData.pointE.x, apolloniusData.pointE.y, scale),
    [apolloniusData.pointE, scale],
  );

  const designMinP = useMemo(
    () => mathToDesign(combinedData.minPoint.x, combinedData.minPoint.y, scale),
    [combinedData.minPoint, scale],
  );
  const designMaxP = useMemo(
    () => mathToDesign(combinedData.maxPoint.x, combinedData.maxPoint.y, scale),
    [combinedData.maxPoint, scale],
  );

  // 阿圆设计尺寸半径
  const designRadius = useMemo(() => {
    if (apolloniusData.isDegenerate) return 0;
    const ptEdge = mathToDesign(
      apolloniusData.centerO.x + apolloniusData.radiusR,
      0,
      scale,
    );
    return Math.abs(ptEdge.x - designCenterO.x);
  }, [apolloniusData, designCenterO, scale]);

  return {
    polarizationData,
    apolloniusData,
    combinedData,
    handlePointADrag,
    handlePointPDrag,
    designA,
    designB,
    designC,
    designM,
    designP,
    designCenterO,
    designD,
    designE,
    designMinP,
    designMaxP,
    designRadius,
  };
}
