import React from "react";
import { Point3D } from "./Point3D";
import { PointLabel3D } from "./PointLabel3D";
import { CompoundLabel3D } from "./CompoundLabel3D";
import { FormulaLabel3D } from "./FormulaLabel3D";
import { MATH_COLORS } from "@/theme/math/colors";
import type { Vec3 } from "@/math3d/vector3";

export interface VertexItem3D {
  label: string;
  position: Vec3;
  colorKey?: keyof typeof MATH_COLORS;
  offset?: [number, number, number];
  showPoint?: boolean;
  pointRadius?: number;
  fontSize?: number;
}

export interface VertexLabelGroup3DProps {
  /** 顶点列表配置 */
  items?: VertexItem3D[];
  /** 简易字典模式：key 即为顶点名称 (如 { A, B, C, A1, B1, "A'": APrime }) */
  vertices?: Record<string, Vec3>;
  /** 全局统一颜色 */
  colorKey?: keyof typeof MATH_COLORS;
  /** 全局是否显示实心顶点小圆点（默认 true） */
  showPoints?: boolean;
  /** 实心顶点半径（默认 0.045） */
  pointRadius?: number;
  /** 统一字号（默认 0.21） */
  fontSize?: number;
}

/**
 * 3D 几何顶点与标注批量渲染组件
 *
 * 智能解析顶点名称：
 * - 单字母 (A, B, C, P) -> PointLabel3D
 * - 带数字下标 (A1, B1, O1, P0) -> CompoundLabel3D
 * - 带撇/数学公式 (A', P', D') -> FormulaLabel3D
 *
 * @example
 * ```tsx
 * <VertexLabelGroup3D
 *   vertices={{ A, B, C, D, A1, B1, C1, D1 }}
 * />
 * ```
 */
export const VertexLabelGroup3D: React.FC<VertexLabelGroup3DProps> = ({
  items,
  vertices,
  colorKey = "label",
  showPoints = true,
  pointRadius = 0.045,
  fontSize = 0.21,
}) => {
  // 合并数据源
  const resolvedItems: VertexItem3D[] = React.useMemo(() => {
    if (items && items.length > 0) return items;
    if (!vertices) return [];

    return Object.entries(vertices).map(([label, position]) => {
      // 根据位置在 z 方向和 xy 象限自动分配极小避让偏移
      const isTop = position.z > 0.1;
      const offsetX = position.x < 0 ? -0.14 : 0.14;
      const offsetY = position.y < 0 ? -0.14 : 0.14;
      const offsetZ = isTop ? 0.12 : -0.12;

      return {
        label,
        position,
        offset: [offsetX, offsetY, offsetZ] as [number, number, number],
      };
    });
  }, [items, vertices]);

  return (
    <group>
      {resolvedItems.map((item, idx) => {
        const itemColor = item.colorKey ?? colorKey;
        const itemPointRadius = item.pointRadius ?? pointRadius;
        const itemShowPoint = item.showPoint ?? showPoints;
        const itemFontSize = item.fontSize ?? fontSize;
        const itemOffset = item.offset ?? [0.14, 0.14, 0];
        const label = item.label.trim();

        // 1. 撇号顶点 (A', D', P')
        if (label.includes("'") || label.includes("^{\\prime}")) {
          return (
            <group key={`vtx-${label}-${idx}`}>
              {itemShowPoint && (
                <Point3D
                  position={item.position}
                  colorKey={itemColor === "label" ? "primary" : itemColor}
                  radius={itemPointRadius}
                />
              )}
              <FormulaLabel3D
                position={item.position}
                tex={label}
                offset={itemOffset}
              />
            </group>
          );
        }

        // 2. 带数字下标 (A1, B1, P0, O_1)
        const subscriptMatch = label.match(
          /^([A-Za-z]+)(?:_?)([0-9]+|[a-z]+)$/,
        );
        if (subscriptMatch && subscriptMatch[2]) {
          return (
            <group key={`vtx-${label}-${idx}`}>
              {itemShowPoint && (
                <Point3D
                  position={item.position}
                  colorKey={itemColor === "label" ? "primary" : itemColor}
                  radius={itemPointRadius}
                />
              )}
              <CompoundLabel3D
                position={item.position}
                base={subscriptMatch[1]}
                subscript={subscriptMatch[2]}
                colorKey={itemColor}
                fontSize={itemFontSize}
                offset={itemOffset}
              />
            </group>
          );
        }

        // 3. 标准单字母顶点 (A, B, C, P)
        return (
          <group key={`vtx-${label}-${idx}`}>
            {itemShowPoint && (
              <Point3D
                position={item.position}
                colorKey={itemColor === "label" ? "primary" : itemColor}
                radius={itemPointRadius}
              />
            )}
            <PointLabel3D
              position={item.position}
              text={label}
              colorKey={itemColor}
              fontSize={itemFontSize}
              offset={itemOffset}
            />
          </group>
        );
      })}
    </group>
  );
};
