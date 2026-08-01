/**
 * src/features/lineEquation/hooks/useLineEquationScene.ts
 * 直线动画场景几何计算与拖拽交互 Hook
 */

import { useMemo, useCallback } from "react";
import type { SceneScale } from "@/hooks/useSceneScale";
import type { ViewportInfo } from "@/utils/useViewport";
import { mathToDesign, designToMath } from "@/utils/coordinate";
import { avoidLabels, type LabelEntry } from "@/utils/labelAvoider";
import {
  convertFormToGeneral,
  getLineSegmentInBounds,
  calcPointToLineDistance,
  calcTwoLinesRelation,
  getLineProperties,
  type Point2D,
} from "@/math/lineEquation";

interface UseLineEquationSceneProps {
  params: Record<string, number>;
  scale: SceneScale;
  vp: ViewportInfo;
  onParamChange: (key: string, value: number) => void;
  fontScale?: (v: number) => number;
  studyMode?: "forms" | "distance" | "relation" | "family";
  form?: "general" | "pointSlope" | "slopeIntercept" | "twoPoint" | "intercept";
}

export function useLineEquationScene({
  params,
  scale,
  onParamChange,
  fontScale = (v) => v,
  studyMode = "forms",
  form = "general",
}: UseLineEquationSceneProps) {
  // 1. 获取基础一般式 A, B, C
  const { A, B, C } = useMemo(() => {
    if (studyMode === "forms" && form !== "general") {
      return convertFormToGeneral(form, params);
    }
    return {
      A: params.A ?? 1,
      B: params.B ?? -1,
      C: params.C ?? -1,
    };
  }, [params, studyMode, form]);

  // 2. 坐标系视口边界
  const bounds = useMemo(
    () => ({
      xMin: scale.xMin,
      xMax: scale.xMax,
      yMin: scale.yMin,
      yMax: scale.yMax,
    }),
    [scale]
  );

  // 3. 计算主直线剪裁端点
  const mainLineMath = useMemo(
    () => getLineSegmentInBounds(A, B, C, bounds),
    [A, B, C, bounds]
  );

  const mainLineDesign = useMemo(() => {
    if (!mainLineMath) return null;
    const p1 = mathToDesign(mainLineMath.p1.x, mainLineMath.p1.y, scale);
    const p2 = mathToDesign(mainLineMath.p2.x, mainLineMath.p2.y, scale);
    return { p1, p2 };
  }, [mainLineMath, scale]);

  // 直线基础几何属性 (斜率, 倾斜角, 截距)
  const lineProps = useMemo(() => getLineProperties(A, B, C), [A, B, C]);

  // 4. 点到直线的距离模式几何元素
  const x0 = params.x0 ?? 2;
  const y0 = params.y0 ?? 3;

  const pointPDesign = useMemo(
    () => mathToDesign(x0, y0, scale),
    [x0, y0, scale]
  );

  const distanceResult = useMemo(
    () => calcPointToLineDistance(x0, y0, A, B, C),
    [x0, y0, A, B, C]
  );

  const footDesign = useMemo(
    () => mathToDesign(distanceResult.foot.x, distanceResult.foot.y, scale),
    [distanceResult.foot, scale]
  );

  // 直角符号 (Right Angle Mark) 的 3 个坐标点（设计坐标系）
  const rightAnglePath = useMemo(() => {
    if (!distanceResult.isValid || distanceResult.distance < 1e-4) return null;

    const Q = footDesign;
    const P = pointPDesign;

    // 向量 Q -> P
    const vLen = Math.hypot(P.x - Q.x, P.y - Q.y);
    if (vLen < 1e-4) return null;
    const vx = (P.x - Q.x) / vLen;
    const vy = (P.y - Q.y) / vLen;

    // 直线单位方向向量 (以主直线上的一段为例)
    if (!mainLineDesign) return null;
    const dx = mainLineDesign.p2.x - mainLineDesign.p1.x;
    const dy = mainLineDesign.p2.y - mainLineDesign.p1.y;
    const uLen = Math.hypot(dx, dy);
    if (uLen < 1e-4) return null;
    let ux = dx / uLen;
    let uy = dy / uLen;

    const size = 12 * fontScale(1);

    // 确定 u 向量的方向，保证直角符号在 Q 与 P 同侧的四分之一区域内
    const pt1 = { x: Q.x + size * ux, y: Q.y + size * uy };
    const pt2 = { x: Q.x + size * ux + size * vx, y: Q.y + size * uy + size * vy };
    const pt3 = { x: Q.x + size * vx, y: Q.y + size * vy };

    return `${pt1.x},${pt1.y} ${pt2.x},${pt2.y} ${pt3.x},${pt3.y}`;
  }, [footDesign, pointPDesign, mainLineDesign, distanceResult, fontScale]);

  // 5. 两直线位置关系模式 (relation)
  const A2 = params.A2 ?? 1;
  const B2 = params.B2 ?? 1;
  const C2 = params.C2 ?? -2;

  const line2Math = useMemo(
    () => getLineSegmentInBounds(A2, B2, C2, bounds),
    [A2, B2, C2, bounds]
  );

  const line2Design = useMemo(() => {
    if (!line2Math) return null;
    const p1 = mathToDesign(line2Math.p1.x, line2Math.p1.y, scale);
    const p2 = mathToDesign(line2Math.p2.x, line2Math.p2.y, scale);
    return { p1, p2 };
  }, [line2Math, scale]);

  const twoLinesRelation = useMemo(
    () => calcTwoLinesRelation(A, B, C, A2, B2, C2),
    [A, B, C, A2, B2, C2]
  );

  const intersectionDesign = useMemo(() => {
    if (!twoLinesRelation.intersection) return null;
    return mathToDesign(
      twoLinesRelation.intersection.x,
      twoLinesRelation.intersection.y,
      scale
    );
  }, [twoLinesRelation.intersection, scale]);

  // 6. 直线系模式 (family)
  const lambda = params.lambda ?? 1;
  const familyLineCoeffs = useMemo(() => {
    return {
      A: A + lambda * A2,
      B: B + lambda * B2,
      C: C + lambda * C2,
    };
  }, [A, B, C, A2, B2, C2, lambda]);

  const familyLineMath = useMemo(
    () =>
      getLineSegmentInBounds(
        familyLineCoeffs.A,
        familyLineCoeffs.B,
        familyLineCoeffs.C,
        bounds
      ),
    [familyLineCoeffs, bounds]
  );

  const familyLineDesign = useMemo(() => {
    if (!familyLineMath) return null;
    const p1 = mathToDesign(familyLineMath.p1.x, familyLineMath.p1.y, scale);
    const p2 = mathToDesign(familyLineMath.p2.x, familyLineMath.p2.y, scale);
    return { p1, p2 };
  }, [familyLineMath, scale]);

  // 7. 拖拽回调函数 (双向参数联动)
  const handlePointPDrag = useCallback(
    (designPt: Point2D) => {
      const mathPt = designToMath(designPt.x, designPt.y, scale);
      onParamChange("x0", Number(mathPt.x.toFixed(1)));
      onParamChange("y0", Number(mathPt.y.toFixed(1)));
    },
    [scale, onParamChange]
  );

  // 8. 智能避让文本标签
  const labels = useMemo(() => {
    const rawEntries: LabelEntry[] = [];

    if (studyMode === "distance") {
      rawEntries.push({
        key: "P",
        text: `P(${x0.toFixed(1)}, ${y0.toFixed(1)})`,
        x: pointPDesign.x,
        y: pointPDesign.y,
        anchor: "start",
        dy: -14,
        priority: 3,
      });

      if (distanceResult.isValid) {
        rawEntries.push({
          key: "Q",
          text: `Q(${distanceResult.foot.x.toFixed(1)}, ${distanceResult.foot.y.toFixed(1)})`,
          x: footDesign.x,
          y: footDesign.y,
          anchor: "start",
          dy: 16,
          priority: 2,
        });

        // 距离线段中点标注
        const midX = (pointPDesign.x + footDesign.x) / 2;
        const midY = (pointPDesign.y + footDesign.y) / 2;
        rawEntries.push({
          key: "d",
          text: `d = ${distanceResult.distance.toFixed(2)}`,
          x: midX,
          y: midY,
          anchor: "middle",
          dy: -10,
          priority: 1,
        });
      }
    } else if (studyMode === "forms") {
      if (lineProps.xIntercept !== null) {
        const pt = mathToDesign(lineProps.xIntercept, 0, scale);
        rawEntries.push({
          key: "xInt",
          text: `(${lineProps.xIntercept.toFixed(1)}, 0)`,
          x: pt.x,
          y: pt.y,
          anchor: "middle",
          dy: 16,
          priority: 2,
        });
      }
      if (lineProps.yIntercept !== null) {
        const pt = mathToDesign(0, lineProps.yIntercept, scale);
        rawEntries.push({
          key: "yInt",
          text: `(0, ${lineProps.yIntercept.toFixed(1)})`,
          x: pt.x,
          y: pt.y,
          anchor: "start",
          dy: -10,
          priority: 2,
        });
      }
    } else if (studyMode === "relation") {
      if (intersectionDesign) {
        rawEntries.push({
          key: "intersection",
          text: `交点 (${twoLinesRelation.intersection!.x.toFixed(1)}, ${twoLinesRelation.intersection!.y.toFixed(1)})`,
          x: intersectionDesign.x,
          y: intersectionDesign.y,
          anchor: "start",
          dy: -16,
          priority: 3,
        });
      }
    }

    return avoidLabels(rawEntries, {
      fontScale,
      bounds: { width: 840, height: 650 },
    });
  }, [
    studyMode,
    x0,
    y0,
    pointPDesign,
    distanceResult,
    footDesign,
    lineProps,
    intersectionDesign,
    twoLinesRelation,
    scale,
    fontScale,
  ]);

  return {
    A,
    B,
    C,
    mainLineDesign,
    pointPDesign,
    distanceResult,
    footDesign,
    rightAnglePath,
    line2Design,
    twoLinesRelation,
    intersectionDesign,
    familyLineDesign,
    handlePointPDrag,
    labels,
    lineProps,
  };
}
