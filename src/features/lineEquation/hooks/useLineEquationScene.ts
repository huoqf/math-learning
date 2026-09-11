/**
 * src/features/lineEquation/hooks/useLineEquationScene.ts
 * 直线动画场景几何计算与拖拽交互 Hook
 */

import { useMemo, useCallback } from "react";
import type { SceneScale } from "@/hooks/useSceneScale";
import type { ViewportInfo } from "@/utils/useViewport";
import { mathToDesign } from "@/utils/coordinate";
import type { LabelItem } from "@/utils/labelOverlap";
import { MATH_COLORS } from "@/theme";
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
    [scale],
  );

  // 3. 计算主直线剪裁端点
  const mainLineMath = useMemo(
    () => getLineSegmentInBounds(A, B, C, bounds),
    [A, B, C, bounds],
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
    [x0, y0, scale],
  );

  const distanceResult = useMemo(
    () => calcPointToLineDistance(x0, y0, A, B, C),
    [x0, y0, A, B, C],
  );

  const footDesign = useMemo(
    () => mathToDesign(distanceResult.foot.x, distanceResult.foot.y, scale),
    [distanceResult.foot, scale],
  );

  // 直角符号 (Right Angle Mark) 的 3 个坐标点（设计坐标系）
  const rightAnglePath = useMemo(() => {
    if (!distanceResult.isValid || distanceResult.distance < 0.15) return null;

    const Q = footDesign;
    const P = pointPDesign;

    // 向量 Q -> P
    const vLen = Math.hypot(P.x - Q.x, P.y - Q.y);
    if (vLen < 8) return null;
    const vx = (P.x - Q.x) / vLen;
    const vy = (P.y - Q.y) / vLen;

    // 垂直于 Q->P 的直线上单位切向量
    const ux = -vy;
    const uy = vx;

    // 限制直角符号大小，确保精致小巧且不超出垂线段
    const size = Math.min(10 * fontScale(1), vLen * 0.25);
    if (size < 3) return null;

    const pt1 = { x: Q.x + size * ux, y: Q.y + size * uy };
    const pt2 = {
      x: Q.x + size * ux + size * vx,
      y: Q.y + size * uy + size * vy,
    };
    const pt3 = { x: Q.x + size * vx, y: Q.y + size * vy };

    return `${pt1.x},${pt1.y} ${pt2.x},${pt2.y} ${pt3.x},${pt3.y}`;
  }, [footDesign, pointPDesign, distanceResult, fontScale]);

  // 5. 两直线位置关系模式 (relation)
  const A2 = params.A2 ?? 1;
  const B2 = params.B2 ?? 1;
  const C2 = params.C2 ?? -2;

  const line2Math = useMemo(
    () => getLineSegmentInBounds(A2, B2, C2, bounds),
    [A2, B2, C2, bounds],
  );

  const line2Design = useMemo(() => {
    if (!line2Math) return null;
    const p1 = mathToDesign(line2Math.p1.x, line2Math.p1.y, scale);
    const p2 = mathToDesign(line2Math.p2.x, line2Math.p2.y, scale);
    return { p1, p2 };
  }, [line2Math, scale]);

  const twoLinesRelation = useMemo(
    () => calcTwoLinesRelation(A, B, C, A2, B2, C2),
    [A, B, C, A2, B2, C2],
  );

  const intersectionDesign = useMemo(() => {
    if (!twoLinesRelation.intersection) return null;
    return mathToDesign(
      twoLinesRelation.intersection.x,
      twoLinesRelation.intersection.y,
      scale,
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
        bounds,
      ),
    [familyLineCoeffs, bounds],
  );

  const familyLineDesign = useMemo(() => {
    if (!familyLineMath) return null;
    const p1 = mathToDesign(familyLineMath.p1.x, familyLineMath.p1.y, scale);
    const p2 = mathToDesign(familyLineMath.p2.x, familyLineMath.p2.y, scale);
    return { p1, p2 };
  }, [familyLineMath, scale]);

  // 7. 拖拽回调函数 (双向参数联动，接收由 InteractivePoint 传出的数学坐标)
  const handlePointPDrag = useCallback(
    (mathPt: Point2D) => {
      onParamChange("x0", Number(mathPt.x.toFixed(1)));
      onParamChange("y0", Number(mathPt.y.toFixed(1)));
    },
    [onParamChange],
  );

  const handlePoint1Drag = useCallback(
    (mathPt: Point2D) => {
      onParamChange("x1", Number(mathPt.x.toFixed(1)));
      onParamChange("y1", Number(mathPt.y.toFixed(1)));
    },
    [onParamChange],
  );

  const handlePoint2Drag = useCallback(
    (mathPt: Point2D) => {
      onParamChange("x2", Number(mathPt.x.toFixed(1)));
      onParamChange("y2", Number(mathPt.y.toFixed(1)));
    },
    [onParamChange],
  );

  // 8. 智能学术标签组 (纯代数符号，杜绝跳动浮点数坐标)
  const labels = useMemo<LabelItem[]>(() => {
    const items: LabelItem[] = [];

    // 8.1 点到直线的距离模式
    if (studyMode === "distance") {
      items.push({
        key: "pt-P0",
        text: "P₀",
        x: pointPDesign.x,
        y: pointPDesign.y,
        color: MATH_COLORS.paramPrimary,
        preferredPlacement: "top-right",
      });

      if (distanceResult.isValid) {
        items.push({
          key: "pt-Q",
          text: "Q",
          x: footDesign.x,
          y: footDesign.y,
          color: MATH_COLORS.focusPoint,
          preferredPlacement: "bottom-left",
        });

        // 垂线段中点距离符号 d
        const midX = (pointPDesign.x + footDesign.x) / 2;
        const midY = (pointPDesign.y + footDesign.y) / 2;
        items.push({
          key: "lbl-d",
          text: "d",
          x: midX,
          y: midY,
          color: MATH_COLORS.focusPoint,
          preferredPlacement: "top",
        });
      }

      // 直线标注 L
      if (mainLineDesign) {
        items.push({
          key: "lbl-L",
          text: "L",
          x: mainLineDesign.p2.x,
          y: mainLineDesign.p2.y,
          color: MATH_COLORS.paramPrimary,
          preferredPlacement: "top-left",
        });
      }
    }

    // 8.2 直线方程形式模式
    else if (studyMode === "forms") {
      if (form === "twoPoint") {
        const p1D = mathToDesign(params.x1 ?? -2, params.y1 ?? -1, scale);
        const p2D = mathToDesign(params.x2 ?? 2, params.y2 ?? 3, scale);
        items.push(
          {
            key: "pt-P1",
            text: "P₁",
            x: p1D.x,
            y: p1D.y,
            color: MATH_COLORS.paramSecondary,
            preferredPlacement: "top-left",
          },
          {
            key: "pt-P2",
            text: "P₂",
            x: p2D.x,
            y: p2D.y,
            color: MATH_COLORS.paramTertiary,
            preferredPlacement: "top-right",
          },
        );
      } else if (form === "pointSlope") {
        const p0D = mathToDesign(params.x0 ?? 0, params.y0 ?? 1, scale);
        items.push({
          key: "pt-P0",
          text: "P₀",
          x: p0D.x,
          y: p0D.y,
          color: MATH_COLORS.paramSecondary,
          preferredPlacement: "top-left",
        });
      } else if (form === "intercept") {
        const a = params.a ?? 3;
        const b = params.b ?? 2;
        if (Math.abs(a) > 1e-9) {
          const ptA = mathToDesign(a, 0, scale);
          items.push({
            key: "pt-A",
            text: "A",
            x: ptA.x,
            y: ptA.y,
            color: MATH_COLORS.paramPrimary,
            preferredPlacement: "bottom",
          });
        }
        if (Math.abs(b) > 1e-9) {
          const ptB = mathToDesign(0, b, scale);
          items.push({
            key: "pt-B",
            text: "B",
            x: ptB.x,
            y: ptB.y,
            color: MATH_COLORS.paramSecondary,
            preferredPlacement: "left",
          });
        }
      } else {
        // 一般式或斜截式，标注坐标轴截距点
        if (lineProps.xIntercept !== null) {
          const pt = mathToDesign(lineProps.xIntercept, 0, scale);
          items.push({
            key: "pt-xInt",
            text: "A",
            x: pt.x,
            y: pt.y,
            color: MATH_COLORS.paramPrimary,
            preferredPlacement: "bottom",
          });
        }
        if (lineProps.yIntercept !== null) {
          const pt = mathToDesign(0, lineProps.yIntercept, scale);
          items.push({
            key: "pt-yInt",
            text: "B",
            x: pt.x,
            y: pt.y,
            color: MATH_COLORS.paramSecondary,
            preferredPlacement: "left",
          });
        }
      }

      // 直线标注 L
      if (mainLineDesign) {
        items.push({
          key: "lbl-L",
          text: "L",
          x: mainLineDesign.p2.x,
          y: mainLineDesign.p2.y,
          color: MATH_COLORS.paramPrimary,
          preferredPlacement: "top-left",
        });
      }
    }

    // 8.3 两线位置关系模式
    else if (studyMode === "relation") {
      if (mainLineDesign) {
        items.push({
          key: "lbl-L1",
          text: "L₁",
          x: mainLineDesign.p2.x,
          y: mainLineDesign.p2.y,
          color: MATH_COLORS.paramPrimary,
          preferredPlacement: "top-left",
        });
      }
      if (line2Design) {
        items.push({
          key: "lbl-L2",
          text: "L₂",
          x: line2Design.p2.x,
          y: line2Design.p2.y,
          color: MATH_COLORS.paramSecondary,
          preferredPlacement: "bottom-right",
        });
      }
      if (intersectionDesign) {
        items.push({
          key: "pt-Intersect",
          text: "P",
          x: intersectionDesign.x,
          y: intersectionDesign.y,
          color: MATH_COLORS.vectorResult,
          preferredPlacement: "top-right",
        });
      }
    }

    // 8.4 直线系模式
    else if (studyMode === "family") {
      if (mainLineDesign) {
        items.push({
          key: "lbl-L1",
          text: "L₁",
          x: mainLineDesign.p2.x,
          y: mainLineDesign.p2.y,
          color: MATH_COLORS.paramPrimary,
          preferredPlacement: "top-left",
        });
      }
      if (line2Design) {
        items.push({
          key: "lbl-L2",
          text: "L₂",
          x: line2Design.p2.x,
          y: line2Design.p2.y,
          color: MATH_COLORS.paramSecondary,
          preferredPlacement: "bottom-right",
        });
      }
      if (familyLineDesign) {
        items.push({
          key: "lbl-Lfam",
          text: "L(λ)",
          x: familyLineDesign.p2.x,
          y: familyLineDesign.p2.y,
          color: MATH_COLORS.paramTertiary,
          preferredPlacement: "top-right",
        });
      }
      if (intersectionDesign) {
        items.push({
          key: "pt-P0",
          text: "P₀",
          x: intersectionDesign.x,
          y: intersectionDesign.y,
          color: MATH_COLORS.paramPrimary,
          preferredPlacement: "bottom-left",
        });
      }
    }

    return items;
  }, [
    studyMode,
    form,
    params,
    pointPDesign,
    distanceResult,
    footDesign,
    mainLineDesign,
    line2Design,
    familyLineDesign,
    intersectionDesign,
    lineProps,
    scale,
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
    handlePoint1Drag,
    handlePoint2Drag,
    labels,
    lineProps,
  };
}
