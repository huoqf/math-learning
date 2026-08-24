import { useMemo } from "react";
import type { SceneScale } from "@/hooks/useSceneScale";
import { mathToDesign } from "@/utils/coordinate";
import { avoidLabels } from "@/utils/labelAvoider";
import type { LabelEntry, PlacedLabel } from "@/utils/labelAvoider";
import {
  getFirstDefData,
  getUnifiedDefData,
  getLocusGenData,
  solveThetaFromDrag,
} from "@/math/conicDefinition";
import type { ConicSceneData, Point2D } from "@/math/conicDefinition";

interface UseConicDefinitionSceneProps {
  params: {
    a: number;
    c: number;
    e: number;
    p: number;
    theta: number;
  };
  scale: SceneScale;
  studyMode: "firstDef" | "unifiedDef" | "locusGen";
  conicType: "ellipse" | "hyperbola" | "parabola";
  onParamChange: (key: string, value: number) => void;
}

export function useConicDefinitionScene({
  params,
  scale,
  studyMode,
  conicType,
  onParamChange,
}: UseConicDefinitionSceneProps) {
  const { a, c, e, p, theta } = params;

  // 1. 获取解算数据
  const sceneData: ConicSceneData = useMemo(() => {
    if (studyMode === "firstDef") {
      return getFirstDefData(conicType, a, c, p, theta);
    } else if (studyMode === "unifiedDef") {
      return getUnifiedDefData(e, p, theta);
    } else {
      return getLocusGenData(
        conicType === "hyperbola" ? "hyperbola" : "ellipse",
        a,
        c,
        theta,
      );
    }
  }, [studyMode, conicType, a, c, e, p, theta]);

  // 2. 生成 SVG path 字符串
  const pathD = useMemo(() => {
    if (sceneData.branches && sceneData.branches.length > 0) {
      return sceneData.branches
        .map((branch) => {
          if (branch.length === 0) return "";
          const first = mathToDesign(branch[0].x, branch[0].y, scale);
          let d = `M ${first.x} ${first.y}`;
          for (let i = 1; i < branch.length; i++) {
            const pt = mathToDesign(branch[i].x, branch[i].y, scale);
            d += ` L ${pt.x} ${pt.y}`;
          }
          return d;
        })
        .join(" ");
    }

    if (!sceneData.points || sceneData.points.length === 0) return "";

    const first = mathToDesign(
      sceneData.points[0].x,
      sceneData.points[0].y,
      scale,
    );
    let d = `M ${first.x} ${first.y}`;
    for (let i = 1; i < sceneData.points.length; i++) {
      const pt = mathToDesign(
        sceneData.points[i].x,
        sceneData.points[i].y,
        scale,
      );
      d += ` L ${pt.x} ${pt.y}`;
    }
    return d;
  }, [sceneData, scale]);

  // 3. 焦点坐标映射到 Design 屏幕坐标
  const f1Design = mathToDesign(
    sceneData.foci.f1.x,
    sceneData.foci.f1.y,
    scale,
  );
  const f2Design = sceneData.foci.f2
    ? mathToDesign(sceneData.foci.f2.x, sceneData.foci.f2.y, scale)
    : null;

  // 4. 动点 P 屏幕坐标
  const pDesign = mathToDesign(sceneData.pPoint.x, sceneData.pPoint.y, scale);

  // 5. 准线屏幕坐标
  const directrixLine = useMemo(() => {
    if (!sceneData.directrix) return null;
    const topPt = mathToDesign(sceneData.directrix.x, scale.yMax, scale);
    const bottomPt = mathToDesign(sceneData.directrix.x, scale.yMin, scale);
    return {
      x1: topPt.x,
      y1: topPt.y,
      x2: bottomPt.x,
      y2: bottomPt.y,
      x: sceneData.directrix.x,
    };
  }, [sceneData.directrix, scale]);

  // 6. 动点 P 到准线的垂线段与垂足 H
  const perpFootH = useMemo(() => {
    if (!sceneData.directrix) return null;
    const footMath: Point2D = {
      x: sceneData.directrix.x,
      y: sceneData.pPoint.y,
    };
    const footDesign = mathToDesign(footMath.x, footMath.y, scale);
    return {
      math: footMath,
      design: footDesign,
      line: {
        x1: pDesign.x,
        y1: pDesign.y,
        x2: footDesign.x,
        y2: footDesign.y,
      },
    };
  }, [sceneData.directrix, sceneData.pPoint, pDesign, scale]);

  // 7. 动圆法中点 Q 与中点 N 的屏幕坐标
  const qDesign = useMemo(() => {
    return sceneData.qPoint
      ? mathToDesign(sceneData.qPoint.x, sceneData.qPoint.y, scale)
      : null;
  }, [sceneData.qPoint, scale]);

  const nDesign = useMemo(() => {
    return sceneData.nPoint
      ? mathToDesign(sceneData.nPoint.x, sceneData.nPoint.y, scale)
      : null;
  }, [sceneData.nPoint, scale]);

  // 8. 垂直平分线屏幕坐标
  const bisectorLineDesign = useMemo(() => {
    if (!sceneData.bisectorLine) return null;
    const pt1 = mathToDesign(
      sceneData.bisectorLine.x1,
      sceneData.bisectorLine.y1,
      scale,
    );
    const pt2 = mathToDesign(
      sceneData.bisectorLine.x2,
      sceneData.bisectorLine.y2,
      scale,
    );
    return { x1: pt1.x, y1: pt1.y, x2: pt2.x, y2: pt2.y };
  }, [sceneData.bisectorLine, scale]);

  // 8.5 渐近线屏幕坐标
  const asymptotesDesign = useMemo(() => {
    if (!sceneData.asymptotes) return [];
    return sceneData.asymptotes.map((line) => {
      const p1 = mathToDesign(line.x1, line.y1, scale);
      const p2 = mathToDesign(line.x2, line.y2, scale);
      return { x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y };
    });
  }, [sceneData.asymptotes, scale]);

  // 9. 避让标签位置计算
  const rawLabels = useMemo<LabelEntry[]>(() => {
    const list: LabelEntry[] = [
      {
        key: studyMode === "locusGen" ? "M" : "P",
        text: studyMode === "locusGen" ? "M" : "P",
        x: pDesign.x,
        y: pDesign.y,
        anchor: "middle",
        dy: -14,
        priority: 2,
      },
      {
        key: "F1",
        text: "F₁",
        x: f1Design.x,
        y: f1Design.y,
        anchor: "middle",
        dy: 18,
        priority: 1,
      },
    ];
    if (f2Design) {
      list.push({
        key: "F2",
        text: "F₂",
        x: f2Design.x,
        y: f2Design.y,
        anchor: "middle",
        dy: 18,
        priority: 1,
      });
    }
    if (perpFootH) {
      list.push({
        key: "H",
        text: "H",
        x: perpFootH.design.x,
        y: perpFootH.design.y,
        anchor: "middle",
        dy: -12,
        priority: 1,
      });
    }
    if (qDesign) {
      list.push({
        key: "Q",
        text: "Q",
        x: qDesign.x,
        y: qDesign.y,
        anchor: "middle",
        dy: -12,
        priority: 1,
      });
    }
    if (nDesign) {
      list.push({
        key: "N",
        text: "N",
        x: nDesign.x,
        y: nDesign.y,
        anchor: "middle",
        dy: 16,
        priority: 1,
      });
    }
    return list;
  }, [pDesign, f1Design, f2Design, perpFootH, qDesign, nDesign, studyMode]);

  const labelPositions: PlacedLabel[] = useMemo(() => {
    return avoidLabels(rawLabels);
  }, [rawLabels]);

  // 10. 动点拖拽精准反解
  const handlePDrag = (newMathPt: Point2D) => {
    const solvedTheta = solveThetaFromDrag(
      studyMode,
      conicType,
      newMathPt,
      params,
    );
    onParamChange("theta", solvedTheta);
  };

  return {
    sceneData,
    pathD,
    f1Design,
    f2Design,
    pDesign,
    qDesign,
    nDesign,
    directrixLine,
    perpFootH,
    bisectorLineDesign,
    asymptotesDesign,
    labelPositions,
    handlePDrag,
  };
}
