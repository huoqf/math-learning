import { useMemo } from "react";
import type { SceneScale } from "@/hooks/useSceneScale";
import { mathToDesign } from "@/utils/coordinate";
import { avoidLabels } from "@/utils/labelAvoider";
import type { LabelEntry, PlacedLabel } from "@/utils/labelAvoider";
import {
  getFirstDefData,
  getUnifiedDefData,
  getLocusGenData,
} from "../math/conicDefinition";
import type { ConicSceneData, Point2D } from "../math/conicDefinition";

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
      return getUnifiedDefData(e, theta);
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
    if ("x" in sceneData.directrix) {
      const topPt = mathToDesign(sceneData.directrix.x, scale.yMax, scale);
      const bottomPt = mathToDesign(sceneData.directrix.x, scale.yMin, scale);
      return { x1: topPt.x, y1: topPt.y, x2: bottomPt.x, y2: bottomPt.y };
    }
    return null;
  }, [sceneData.directrix, scale]);

  // 6. 动点 P 到准线的垂线段
  const perpLineToDirectrix = useMemo(() => {
    if (!sceneData.directrix || !("x" in sceneData.directrix)) return null;
    const footPt = mathToDesign(
      sceneData.directrix.x,
      sceneData.pPoint.y,
      scale,
    );
    return { x1: pDesign.x, y1: pDesign.y, x2: footPt.x, y2: footPt.y };
  }, [sceneData.directrix, sceneData.pPoint, pDesign, scale]);

  // 7. 避让标签位置计算 (P, F1, F2)
  const rawLabels = useMemo<LabelEntry[]>(() => {
    const list: LabelEntry[] = [
      {
        key: "P",
        text: "P",
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
    return list;
  }, [pDesign, f1Design, f2Design]);

  const labelPositions: PlacedLabel[] = useMemo(() => {
    return avoidLabels(rawLabels);
  }, [rawLabels]);

  // 8. 动点 P 拖拽反向求解 theta
  const handlePDrag = (newMathPt: Point2D) => {
    let newTheta = Math.atan2(newMathPt.y, newMathPt.x);
    if (newTheta < 0) newTheta += 2 * Math.PI;
    onParamChange("theta", Number(newTheta.toFixed(2)));
  };

  return {
    sceneData,
    pathD,
    f1Design,
    f2Design,
    pDesign,
    directrixLine,
    perpLineToDirectrix,
    labelPositions,
    handlePDrag,
  };
}
