/**
 * src/utils/labelOverlap.ts
 * 数学几何图元标签智能避让与多方向碰撞解算算法 (Smart Multi-Direction Label Placement)
 */

export type LabelPlacement =
  | "top-right"
  | "top-left"
  | "bottom-right"
  | "bottom-left"
  | "top"
  | "bottom"
  | "right"
  | "left";

export interface LabelItem {
  key: string;
  x: number;
  y: number;
  text: string;
  anchor?: "start" | "middle" | "end";
  finalDy?: number;
  fontSize?: number;
  color?: string;
  preferredPlacement?: LabelPlacement;
}

export interface ResolvedLabelItem extends LabelItem {
  textX: number;
  textY: number;
  textAnchor: "start" | "middle" | "end";
  dominantBaseline: "auto" | "middle" | "hanging";
  placement: LabelPlacement;
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * 估算中英文字符串在指定字号下的像素宽度
 */
export function estimateTextWidth(text: string, fontSize = 11): number {
  let width = 0;
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    // CJK 统一表意文字及全角字符
    if (
      (code >= 0x4e00 && code <= 0x9fff) ||
      (code >= 0x3400 && code <= 0x4dbf) ||
      (code >= 0xff00 && code <= 0xffef)
    ) {
      width += fontSize * 1.05;
    } else {
      // 半角英文字母、数字与符号
      width += fontSize * 0.62;
    }
  }
  return width + 4;
}

const PLACEMENT_CANDIDATES: LabelPlacement[] = [
  "top-right",
  "top-left",
  "bottom-right",
  "bottom-left",
  "top",
  "bottom",
  "right",
  "left",
];

/**
 * 计算给定方向下的包围盒与文字锚点坐标
 */
function getPlacementBox(
  x: number,
  y: number,
  width: number,
  height: number,
  placement: LabelPlacement,
  offset = 8,
): {
  box: BoundingBox;
  textX: number;
  textY: number;
  textAnchor: "start" | "middle" | "end";
  dominantBaseline: "auto" | "middle" | "hanging";
} {
  switch (placement) {
    case "top-right":
      return {
        box: { x: x + offset, y: y - offset - height, width, height },
        textX: x + offset,
        textY: y - offset,
        textAnchor: "start",
        dominantBaseline: "auto",
      };
    case "top-left":
      return {
        box: { x: x - offset - width, y: y - offset - height, width, height },
        textX: x - offset,
        textY: y - offset,
        textAnchor: "end",
        dominantBaseline: "auto",
      };
    case "bottom-right":
      return {
        box: { x: x + offset, y: y + offset, width, height },
        textX: x + offset,
        textY: y + offset + height * 0.8,
        textAnchor: "start",
        dominantBaseline: "auto",
      };
    case "bottom-left":
      return {
        box: { x: x - offset - width, y: y + offset, width, height },
        textX: x - offset,
        textY: y + offset + height * 0.8,
        textAnchor: "end",
        dominantBaseline: "auto",
      };
    case "top":
      return {
        box: { x: x - width / 2, y: y - offset - height, width, height },
        textX: x,
        textY: y - offset,
        textAnchor: "middle",
        dominantBaseline: "auto",
      };
    case "bottom":
      return {
        box: { x: x - width / 2, y: y + offset, width, height },
        textX: x,
        textY: y + offset + height * 0.8,
        textAnchor: "middle",
        dominantBaseline: "auto",
      };
    case "right":
      return {
        box: { x: x + offset, y: y - height / 2, width, height },
        textX: x + offset,
        textY: y + height * 0.3,
        textAnchor: "start",
        dominantBaseline: "auto",
      };
    case "left":
      return {
        box: { x: x - offset - width, y: y - height / 2, width, height },
        textX: x - offset,
        textY: y + height * 0.3,
        textAnchor: "end",
        dominantBaseline: "auto",
      };
  }
}

/**
 * 计算两个矩形包围盒的相交面积
 */
function getIntersectionArea(a: BoundingBox, b: BoundingBox): number {
  const xOverlap = Math.max(
    0,
    Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x),
  );
  const yOverlap = Math.max(
    0,
    Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y),
  );
  return xOverlap * yOverlap;
}

/**
 * 2D 智能多方向标签碰撞解算算法 (Smart Multi-Direction Label Placement)
 * 为全项目所有几何点标提供防重影、防重叠与重合点智能分流排布
 */
export function resolveLabelPlacements<T extends LabelItem>(
  items: T[],
  options?: {
    offset?: number;
    viewport?: { width: number; height: number };
  },
): (T & ResolvedLabelItem)[] {
  if (items.length === 0) return [];

  const offset = options?.offset ?? 8;
  const vp = options?.viewport;

  // 1. 预处理重合点组，分配互斥对角象限
  const coincidentGroups: number[][] = [];
  const assigned = new Set<number>();

  for (let i = 0; i < items.length; i++) {
    if (assigned.has(i)) continue;
    const group = [i];
    for (let j = i + 1; j < items.length; j++) {
      const dist = Math.hypot(items[i].x - items[j].x, items[i].y - items[j].y);
      if (dist < 4) {
        group.push(j);
        assigned.add(j);
      }
    }
    if (group.length > 1) {
      coincidentGroups.push(group);
    }
  }

  // 2. 初始化各标签的候选状态
  const itemData = items.map((item, idx) => {
    const fontSize = item.fontSize ?? 11;
    const width = estimateTextWidth(item.text, fontSize);
    const height = fontSize + 4;

    // 默认候选列表
    let candidates = [...PLACEMENT_CANDIDATES];
    if (item.preferredPlacement) {
      candidates = [
        item.preferredPlacement,
        ...candidates.filter((c) => c !== item.preferredPlacement),
      ];
    }

    // 若属于重合点组，则按组内索引赋予不同的首选对角象限
    for (const group of coincidentGroups) {
      const posInGroup = group.indexOf(idx);
      if (posInGroup !== -1) {
        const opposingPairs: LabelPlacement[] = [
          "top-left",
          "bottom-right",
          "top-right",
          "bottom-left",
        ];
        const assignedPlacement =
          opposingPairs[posInGroup % opposingPairs.length];
        candidates = [
          assignedPlacement,
          ...candidates.filter((c) => c !== assignedPlacement),
        ];
      }
    }

    return {
      item,
      width,
      height,
      candidates,
      chosenIndex: 0,
    };
  });

  // 3. 贪心迭代求解最优方向组合
  for (let iter = 0; iter < 3; iter++) {
    for (let i = 0; i < itemData.length; i++) {
      let minPenalty = Infinity;
      let bestCandidateIdx = itemData[i].chosenIndex;

      for (let cIdx = 0; cIdx < itemData[i].candidates.length; cIdx++) {
        const placement = itemData[i].candidates[cIdx];
        const { box } = getPlacementBox(
          itemData[i].item.x,
          itemData[i].item.y,
          itemData[i].width,
          itemData[i].height,
          placement,
          offset,
        );

        let penalty = cIdx * 5; // 偏离首选方向惩罚

        // 计算与其他已选标签的碰撞相交面积
        for (let j = 0; j < itemData.length; j++) {
          if (i === j) continue;
          const otherPlacement =
            itemData[j].candidates[itemData[j].chosenIndex];
          const otherBox = getPlacementBox(
            itemData[j].item.x,
            itemData[j].item.y,
            itemData[j].width,
            itemData[j].height,
            otherPlacement,
            offset,
          ).box;

          const area = getIntersectionArea(box, otherBox);
          if (area > 0) {
            penalty += area * 100 + 1000;
          }
        }

        // 视口越界惩罚
        if (vp) {
          if (
            box.x < 0 ||
            box.y < 0 ||
            box.x + box.width > vp.width ||
            box.y + box.height > vp.height
          ) {
            penalty += 3000;
          }
        }

        if (penalty < minPenalty) {
          minPenalty = penalty;
          bestCandidateIdx = cIdx;
        }
      }

      itemData[i].chosenIndex = bestCandidateIdx;
    }
  }

  // 4. 格式化输出结果
  return itemData.map(({ item, width, height, candidates, chosenIndex }) => {
    const placement = candidates[chosenIndex];
    const { textX, textY, textAnchor, dominantBaseline } = getPlacementBox(
      item.x,
      item.y,
      width,
      height,
      placement,
      offset,
    );

    return {
      ...item,
      textX,
      textY,
      textAnchor,
      dominantBaseline,
      placement,
    };
  });
}

/**
 * 保持向后兼容的旧版接口
 */
export function avoidLabelOverlap<T extends LabelItem>(
  items: T[],
  minDist = 16,
): (T & { finalDy: number })[] {
  const result = items.map((item) => ({ ...item, finalDy: 0 }));

  for (let i = 0; i < result.length; i++) {
    for (let j = i + 1; j < result.length; j++) {
      const a = result[i];
      const b = result[j];
      const dx = Math.abs(a.x - b.x);
      const dy = Math.abs(a.y + a.finalDy - (b.y + b.finalDy));

      if (dx < minDist * 2 && dy < minDist) {
        if (a.y <= b.y) {
          a.finalDy -= minDist / 2;
          b.finalDy += minDist / 2;
        } else {
          a.finalDy += minDist / 2;
          b.finalDy -= minDist / 2;
        }
      }
    }
  }

  return result;
}
