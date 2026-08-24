/**
 * src/features/conicDefinition/hooks/useConicDefinitionScene.ts
 * 场景图元解算与屏幕坐标映射 Hook
 * 专为第一定义与统一定义两大核心服务
 */

import { useMemo } from "react";
import type { SceneScale } from "@/hooks/useSceneScale";
import { mathToDesign } from "@/utils/coordinate";
import { avoidLabels } from "@/utils/labelAvoider";
import type { LabelEntry, PlacedLabel } from "@/utils/labelAvoider";
import {
  getFirstDefData,
  getUnifiedDefData,
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
  studyMode: "firstDef" | "unifiedDef";
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
    } else {
      return getUnifiedDefData(e, p, theta);
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

  // 7. 渐近线屏幕坐标
  const asymptotesDesign = useMemo(() => {
    if (!sceneData.asymptotes) return [];
    return sceneData.asymptotes.map((line) => {
      const p1 = mathToDesign(line.x1, line.y1, scale);
      const p2 = mathToDesign(line.x2, line.y2, scale);
      return { x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y };
    });
  }, [sceneData.asymptotes, scale]);

  // 8. 避让标签位置计算
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
        text:
          studyMode === "unifiedDef" || conicType === "parabola" ? "F" : "F₁",
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
        dy: -14,
        priority: 1,
      });
    }
    return list;
  }, [pDesign, f1Design, f2Design, perpFootH, studyMode, conicType]);

  const labelPositions = useMemo<PlacedLabel[]>(() => {
    return avoidLabels(rawLabels);
  }, [rawLabels]);

  // 9. 反向拖拽处理 (InteractivePoint 传入数学坐标 { x, y })
  const handlePDrag = (newMathPt: { x: number; y: number }) => {
    const newTheta = solveThetaFromDrag(studyMode, conicType, newMathPt, {
      a,
      c,
      e,
      p,
    });
    onParamChange("theta", newTheta);
  };

  return {
    sceneData,
    pathD,
    f1Design,
    f2Design,
    pDesign,
    directrixLine,
    perpFootH,
    asymptotesDesign,
    labelPositions,
    handlePDrag,
  };
}
