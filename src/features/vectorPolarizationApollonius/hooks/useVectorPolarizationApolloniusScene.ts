/**
 * src/features/vectorPolarizationApollonius/hooks/useVectorPolarizationApolloniusScene.ts
 * 向量极化恒等式与阿波罗尼斯圆 Scene 逻辑 Hook
 */

import { useMemo } from "react";
import type { SceneScale } from "@/hooks/useSceneScale";
import { mathToDesign } from "@/utils/coordinate";
import {
  paramDomainRange,
  paramDragRange,
  snapDragValue,
} from "@/utils/paramClamp";
import {
  calcPolarizationIdentity,
  calcApolloniusCircle,
  calcCombinedModel,
} from "@/math/vectorPolarizationApollonius";
import {
  paramMeta,
  type VectorPolarizationApolloniusParams,
} from "@/data/registries/vectorPolarizationApollonius";

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

  // 合法拖拽区间 =「参数声明域 ∩ 中屏可见视口」（SSOT 见 utils/paramClamp）：
  // 旧实现直接回写四舍五入后的坐标，绕过声明域，A 点可被拖到 pointX ∈ [−8, 8] / pointY ∈ [−6, 6] 之外。
  const rangePointX = useMemo(
    () => paramDragRange(paramMeta.pointX, scale, "x"),
    [scale],
  );
  const rangePointY = useMemo(
    () => paramDragRange(paramMeta.pointY, scale, "y"),
    [scale],
  );
  // P 被约束在阿氏圆轨道上，角度是纯参数（非平面坐标），只守声明域 [0°, 360°]
  const rangeAngle = useMemo(() => paramDomainRange(paramMeta.pointAngle), []);

  // 2. 拖拽回调 (反向求解参数，铁律 7)
  const handlePointADrag = (newX: number, newY: number) => {
    onParamChange("pointX", snapDragValue(newX, 0.1, rangePointX));
    onParamChange("pointY", snapDragValue(newY, 0.1, rangePointY));
  };

  const handlePointPDrag = (newX: number, newY: number) => {
    if (studyMode === "apollonius" || studyMode === "combined") {
      const centerO = apolloniusData.centerO;
      if (apolloniusData.isDegenerate) {
        // 在中垂线上，根据 Y 平滑反算 angleDeg
        const ratio = Math.max(-1, Math.min(1, newY / 4.5));
        let deg = Math.round((Math.asin(ratio) * 180) / Math.PI);
        if (deg < 0) deg += 360;
        onParamChange("pointAngle", snapDragValue(deg, 1, rangeAngle));
      } else {
        let rad = Math.atan2(newY - centerO.y, newX - centerO.x);
        let deg = Math.round((rad * 180) / Math.PI);
        if (deg < 0) deg += 360;
        onParamChange("pointAngle", snapDragValue(deg, 1, rangeAngle));
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

  const designApoA = useMemo(
    () => mathToDesign(apolloniusData.pointA.x, apolloniusData.pointA.y, scale),
    [apolloniusData.pointA, scale],
  );
  const designApoB = useMemo(
    () => mathToDesign(apolloniusData.pointB.x, apolloniusData.pointB.y, scale),
    [apolloniusData.pointB, scale],
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
    designApoA,
    designApoB,
    designRadius,
    rangePointX,
    rangePointY,
  };
}
