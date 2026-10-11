import { useMemo } from "react";
import { Segment3D } from "@/components/Math3D/Segment3D";
import { Point3D } from "@/components/Math3D/Point3D";
import { PointLabel3D } from "@/components/Math3D/PointLabel3D";
import { FormulaLabel3D } from "@/components/Math3D/FormulaLabel3D";
import { Polygon3DFace } from "@/components/Math3D/Polygon3DFace";
import { MATH_COLORS } from "@/theme";
import {
  buildAxiomsElements,
  type AxiomsMarkerKey,
  type AxiomsMode,
  type AxiomsSegmentKind,
  type AxiomsSubType,
} from "@/math3d/solidAxioms";

interface SolidAxiomsSceneProps {
  mode: AxiomsMode;
  subType: AxiomsSubType;
  tParam: number;
  tiltDeg: number;
  angleParamDeg: number;
  /** 等角定理"反向"开关：把平移角的一边整体反向，展示互补分支 */
  flipSecondRay: boolean;
}

type ColorKey = keyof typeof MATH_COLORS;

/** 线段角色 → 视觉样式（几何在数学层，样式只在这里） */
const SEGMENT_STYLE: Record<
  AxiomsSegmentKind,
  { colorKey: ColorKey; lineWidth: number; dashed?: boolean }
> = {
  linePrimary: { colorKey: "paramPrimary", lineWidth: 2.5 },
  lineSecondary: { colorKey: "paramSecondary", lineWidth: 2.5 },
  lineHighlight: { colorKey: "highlight", lineWidth: 3.5 },
  aux: { colorKey: "textMuted", lineWidth: 1.5, dashed: true },
};

/**
 * 点标注文本与颜色。
 * `O / Op / Ap / Bp` 使用 KaTeX（`O'`、`A'`、`B'` 需要撇号与数学字形），
 * 其余为字母/纯 ASCII，走 `PointLabel3D`（KaTeX_Main 字体不含 Unicode 下标，
 * 因此这里刻意不写 `A₁` 这类字符 —— 见 pointLabel3D-characters 契约）。
 */
const MARKER_TEX: Record<AxiomsMarkerKey, string> = {
  A: "A",
  B: "B",
  C: "C",
  P: "P",
  O: "O",
  Op: "O'",
  Ap: "A'",
  Bp: "B'",
};

const MARKER_COLOR: Record<AxiomsMarkerKey, ColorKey> = {
  A: "paramPrimary",
  B: "paramPrimary",
  C: "paramPrimary",
  P: "paramTertiary",
  O: "paramPrimary",
  Op: "paramPrimary",
  Ap: "paramPrimary",
  Bp: "paramSecondary",
};

/** 等角模式里 B / B' 属于"平移平行角"的那条边，单独配色 */
const SPATIAL_COLOR: Partial<Record<AxiomsMarkerKey, ColorKey>> = {
  B: "paramSecondary",
  Bp: "paramSecondary",
};

const MARKER_OFFSET: [number, number, number] = [0.2, 0.2, 0];
const MOVING_POINT_OFFSET: [number, number, number] = [0, 0, 0.32];

export function SolidAxiomsScene({
  mode,
  subType,
  tParam,
  tiltDeg,
  angleParamDeg,
  flipSecondRay,
}: SolidAxiomsSceneProps) {
  /**
   * 几何全部来自纯数学层 `buildAxiomsElements` ——
   * 页面与 `<CameraFit>` 的包围盒消费同一份输出，不存在"页面画一套、相机算一套"。
   */
  const elements = useMemo(
    () =>
      buildAxiomsElements(mode, subType, {
        tParam,
        tiltDeg,
        angleParamDeg,
        flipSecondRay,
      }),
    [mode, subType, tParam, tiltDeg, angleParamDeg, flipSecondRay],
  );

  const markerColor = (key: AxiomsMarkerKey): ColorKey =>
    (mode === "spatialLines" ? SPATIAL_COLOR[key] : undefined) ??
    MARKER_COLOR[key];

  return (
    <group>
      {/* 半透明示意面片 */}
      {elements.faces.map((face, i) => (
        <Polygon3DFace
          key={`face-${i}`}
          points={face.points}
          colorKey={face.kind === "facePrimary" ? "primary" : "paramSecondary"}
          opacity={face.kind === "facePrimary" ? 0.25 : 0.3}
        />
      ))}

      {/* 线段 / 直线 / 辅助虚线 */}
      {elements.segments.map((seg, i) => {
        const style = SEGMENT_STYLE[seg.kind];
        return (
          <Segment3D
            key={`seg-${i}`}
            from={seg.from}
            to={seg.to}
            colorKey={style.colorKey}
            lineWidth={style.lineWidth}
            dashed={style.dashed}
          />
        );
      })}

      {/* 命名点与标注 */}
      {elements.markers.map((marker) => {
        const useFormula =
          marker.key === "Op" || marker.key === "Ap" || marker.key === "Bp";
        return (
          <group key={`marker-${marker.key}`}>
            <Point3D
              position={marker.at}
              colorKey={markerColor(marker.key)}
              radius={0.07}
            />
            {useFormula ? (
              <FormulaLabel3D
                position={marker.at}
                tex={MARKER_TEX[marker.key]}
              />
            ) : (
              <PointLabel3D
                position={marker.at}
                text={MARKER_TEX[marker.key]}
                offset={MARKER_OFFSET}
              />
            )}
          </group>
        );
      })}

      {/* 直线名（KaTeX 渲染真下标，如 l₁ / l₂） */}
      {elements.lineLabels.map((label, i) => (
        <FormulaLabel3D
          key={`line-label-${i}`}
          position={label.at}
          tex={label.tex}
        />
      ))}

      {/* 动点 P 与离面垂线 */}
      {elements.movingPoint && (
        <>
          <Point3D
            position={elements.movingPoint}
            colorKey={
              elements.movingPointCoplanar ? "paramTertiary" : "highlight"
            }
            radius={0.09}
          />
          <PointLabel3D
            position={elements.movingPoint}
            text="P"
            offset={MOVING_POINT_OFFSET}
          />
          {elements.movingPointFoot && (
            <Segment3D
              from={elements.movingPoint}
              to={elements.movingPointFoot}
              colorKey="highlight"
              lineWidth={1.5}
              dashed
            />
          )}
        </>
      )}
    </group>
  );
}
