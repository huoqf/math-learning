import { useMemo } from "react";
import type { SceneScale } from "@/hooks/useSceneScale";
import {
  getParabolaBaseInfo,
  getPointOnParabola,
  getFocalRadiusInfo,
  getFocalChordInfo,
  getTangentAndOpticalInfo,
  getDirectrixMongeInfo,
  type ParabolaDirection,
} from "@/math/parabola";
import { mathToDesign } from "@/utils/coordinate";
import { avoidLabels, type LabelEntry } from "@/utils/labelAvoider";

interface UseParabolaSceneProps {
  params: {
    p: number;
    tP: number;
    thetaDeg: number;
    yQ: number;
  };
  scale: SceneScale;
  direction: ParabolaDirection;
  studyMode: string;
  onParamChange: (key: string, value: number) => void;
  onInteractionStart?: () => void;
}

export function useParabolaScene({
  params,
  scale,
  direction,
  studyMode,
  onParamChange,
  onInteractionStart,
}: UseParabolaSceneProps) {
  const { p, tP, thetaDeg, yQ } = params;

  const base = useMemo(() => getParabolaBaseInfo(p, direction), [p, direction]);
  const isDegenerate = p <= 0;

  // 1. 根据开向生成描绘抛物线曲线的采样参数
  const curvePoints = useMemo(() => {
    if (isDegenerate) return "";
    const pts: { x: number; y: number }[] = [];
    const steps = 120;

    if (direction === "right" || direction === "left") {
      const yMin = scale.yMin - 1;
      const yMax = scale.yMax + 1;
      for (let i = 0; i <= steps; i++) {
        const yVal = yMin + (i / steps) * (yMax - yMin);
        const pt = getPointOnParabola(yVal, base.p, direction);
        if (pt.x >= scale.xMin - 2 && pt.x <= scale.xMax + 2) {
          const dPt = mathToDesign(pt.x, pt.y, scale);
          pts.push(dPt);
        }
      }
    } else {
      const xMin = scale.xMin - 1;
      const xMax = scale.xMax + 1;
      for (let i = 0; i <= steps; i++) {
        const xVal = xMin + (i / steps) * (xMax - xMin);
        const pt = getPointOnParabola(xVal, base.p, direction);
        if (pt.y >= scale.yMin - 2 && pt.y <= scale.yMax + 2) {
          const dPt = mathToDesign(pt.x, pt.y, scale);
          pts.push(dPt);
        }
      }
    }

    if (pts.length === 0) return "";
    return pts.reduce(
      (acc, pt, i) => `${acc} ${i === 0 ? "M" : "L"} ${pt.x} ${pt.y}`,
      "",
    );
  }, [base.p, direction, scale, isDegenerate]);

  // 2. 第一定义焦点与焦半径数据
  const P = useMemo(
    () => getPointOnParabola(tP, base.p, direction),
    [tP, base.p, direction],
  );
  const radiusInfo = useMemo(
    () => getFocalRadiusInfo(P, base.p, direction),
    [P, base.p, direction],
  );

  // 3. 焦点弦数据
  const chordInfo = useMemo(
    () => getFocalChordInfo(thetaDeg, base.p, direction),
    [thetaDeg, base.p, direction],
  );

  // 4. 切线与准线数据
  const opticalInfo = useMemo(
    () => getTangentAndOpticalInfo(P, base.p, direction),
    [P, base.p, direction],
  );
  const mongeInfo = useMemo(
    () => getDirectrixMongeInfo(yQ, base.p, direction),
    [yQ, base.p, direction],
  );

  // 5. 拖拽处理器
  const handlePDrag = (mathPt: { x: number; y: number }) => {
    onInteractionStart?.();
    let newTP = tP;

    if (direction === "right" || direction === "left") {
      newTP = Math.max(scale.yMin, Math.min(scale.yMax, mathPt.y));
    } else {
      newTP = Math.max(scale.xMin, Math.min(scale.xMax, mathPt.x));
    }
    onParamChange("tP", Math.round(newTP * 10) / 10);
  };

  const handleQDrag = (mathPt: { x: number; y: number }) => {
    onInteractionStart?.();
    let newYQ = yQ;
    if (base.directrixIsVertical) {
      newYQ = Math.max(scale.yMin, Math.min(scale.yMax, mathPt.y));
    } else {
      newYQ = Math.max(scale.xMin, Math.min(scale.xMax, mathPt.x));
    }
    onParamChange("yQ", Math.round(newYQ * 10) / 10);
  };

  // 6. 纯字母单源标注避让（零坐标堆砌）
  const labels = useMemo(() => {
    const rawLabels: LabelEntry[] = [];

    const F_d = mathToDesign(base.focus.x, base.focus.y, scale);
    rawLabels.push({
      key: "label-F",
      x: F_d.x,
      y: F_d.y,
      anchor: "start",
      dy: 14,
      text: "F",
    });

    const O_d = mathToDesign(0, 0, scale);
    rawLabels.push({
      key: "label-O",
      x: O_d.x,
      y: O_d.y,
      anchor: "end",
      dy: 14,
      text: "O",
    });

    if (studyMode === "definition") {
      const P_d = mathToDesign(P.x, P.y, scale);
      rawLabels.push({
        key: "label-P",
        x: P_d.x,
        y: P_d.y,
        anchor: "start",
        dy: -8,
        text: "P",
      });

      const H_d = mathToDesign(radiusInfo.H.x, radiusInfo.H.y, scale);
      rawLabels.push({
        key: "label-H",
        x: H_d.x,
        y: H_d.y,
        anchor: "end",
        dy: -8,
        text: "H",
      });
    } else if (studyMode === "focalChord") {
      const A_d = mathToDesign(chordInfo.A.x, chordInfo.A.y, scale);
      const B_d = mathToDesign(chordInfo.B.x, chordInfo.B.y, scale);
      const M_d = mathToDesign(
        chordInfo.midCircle.center.x,
        chordInfo.midCircle.center.y,
        scale,
      );
      const K_d = mathToDesign(
        chordInfo.midCircle.directrixTangentPoint.x,
        chordInfo.midCircle.directrixTangentPoint.y,
        scale,
      );

      rawLabels.push(
        {
          key: "label-A",
          x: A_d.x,
          y: A_d.y,
          anchor: "start",
          dy: -8,
          text: "A",
        },
        {
          key: "label-B",
          x: B_d.x,
          y: B_d.y,
          anchor: "start",
          dy: 14,
          text: "B",
        },
        {
          key: "label-M",
          x: M_d.x,
          y: M_d.y,
          anchor: "start",
          dy: -8,
          text: "M",
        },
        {
          key: "label-K",
          x: K_d.x,
          y: K_d.y,
          anchor: "end",
          dy: -8,
          text: "K",
        },
      );
    } else if (studyMode === "tangentOptical") {
      const Q_d = mathToDesign(mongeInfo.Q.x, mongeInfo.Q.y, scale);
      rawLabels.push({
        key: "label-Q",
        x: Q_d.x,
        y: Q_d.y,
        anchor: "end",
        dy: -8,
        text: "Q",
      });

      const P_d = mathToDesign(P.x, P.y, scale);
      rawLabels.push({
        key: "label-P-opt",
        x: P_d.x,
        y: P_d.y,
        anchor: "start",
        dy: -8,
        text: "P",
      });

      const A_d = mathToDesign(mongeInfo.A.x, mongeInfo.A.y, scale);
      const B_d = mathToDesign(mongeInfo.B.x, mongeInfo.B.y, scale);
      rawLabels.push(
        {
          key: "label-QA-A",
          x: A_d.x,
          y: A_d.y,
          anchor: "start",
          dy: -8,
          text: "A",
        },
        {
          key: "label-QB-B",
          x: B_d.x,
          y: B_d.y,
          anchor: "start",
          dy: 14,
          text: "B",
        },
      );
    }

    return avoidLabels(rawLabels);
  }, [base, P, radiusInfo, chordInfo, mongeInfo, studyMode, scale]);

  return {
    base,
    isDegenerate,
    curvePoints,
    P,
    radiusInfo,
    chordInfo,
    opticalInfo,
    mongeInfo,
    handlePDrag,
    handleQDrag,
    labels,
  };
}
