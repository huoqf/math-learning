/**
 * src/features/second-derivative/components/SecondDerivativeScene.tsx
 * 二阶导数、拐点与凹凸性纯 SVG 渲染组件
 * 全量接入 resolveLabelPlacements 智能多方向标签避让算法
 */

import React, { useCallback, useMemo } from "react";
import type { SceneScale } from "@/hooks/useSceneScale";
import type { ViewportInfo } from "@/utils/useViewport";
import {
  CoordinateGrid,
  FunctionGraph,
  InteractivePoint,
  MathPoint,
  SceneLabelGroup,
} from "@/components/Math";
import { mathToDesign } from "@/utils/coordinate";
import { withAlpha } from "@/theme";
import { dashArrayOf } from "@/components/Math/scenePalette";
import type { LabelItem } from "@/utils/labelOverlap";
import {
  AREA_FILL_ALPHA,
  getSecondDerivativePalette,
} from "@/features/second-derivative/scenePalette";
import { paramMeta } from "@/data/registries/secondDerivative";
import {
  clampCoupledRange,
  paramDragRange,
  snapDragValue,
} from "@/utils/paramClamp";
import {
  evalFunction,
  findInflectionPoints,
  findExtremaPoints,
  evalJensen,
  type FnKey,
  type SecondDerivativeParams,
} from "@/math/secondDerivative";

/** 割线两端点必须保持的最小间距（与左屏滑块的耦合约束同源） */
const MIN_SECANT_GAP = 0.2;

interface SecondDerivativeSceneProps {
  params: SecondDerivativeParams;
  scale: SceneScale;
  vp: ViewportInfo;
  onParamChange: (key: string, value: number) => void;
  fontScale?: (v: number) => number;
  studyMode?: "concavity" | "inflection" | "jensen";
  fnKey?: FnKey;
}

export const SecondDerivativeScene: React.FC<SecondDerivativeSceneProps> = ({
  params,
  scale,
  vp,
  onParamChange,
  fontScale = (v) => v,
  studyMode = "concavity",
  fnKey = "cubic",
}) => {
  const { x0, x1, x2 } = params;

  // 本模式调色板：图例与画布的唯一颜色来源（见 scenePalette.ts）
  const P = useMemo(() => getSecondDerivativePalette(studyMode), [studyMode]);

  // 1. 原函数求值回调
  const fn = useCallback(
    (x: number) => evalFunction(fnKey, params, x).y,
    [fnKey, params],
  );

  // 2. 探针点 (x0, f(x0)) 计算
  const eval0 = useMemo(
    () => evalFunction(fnKey, params, x0),
    [fnKey, params, x0],
  );
  const pt0 = mathToDesign(x0, eval0.y, scale);

  // 3. 拐点与极值点求解
  const inflections = useMemo(
    () => findInflectionPoints(fnKey, params),
    [fnKey, params],
  );
  // 仅保留真拐点（两侧 f''(x) 变号）。findInflectionPoints 会为四次函数返回
  // f''(0)=0 但不变号的「反例点」，它只能在看板文案里作为反例出现，
  // 绝不能在中屏被标注为拐点 I 并画出「拐点切线」，否则与同屏定理卡自相矛盾。
  const trueInflections = useMemo(
    () => inflections.filter((ip) => ip.isTrueInflection),
    [inflections],
  );
  const extrema = useMemo(
    () => findExtremaPoints(fnKey, params),
    [fnKey, params],
  );

  // 4. 琴生不等式中点与割线计算
  const jensen = useMemo(
    () => evalJensen(fnKey, params, x1, x2),
    [fnKey, params, x1, x2],
  );

  // 5. 拖拽处理器
  // 落值统一走 paramClamp SSOT：先取「参数声明域 ∩ 可见视口」求交，再按 paramMeta.step 吸附。
  // 严禁手写 Math.max(scale.xMin, Math.min(scale.xMax, x)) + toFixed(2) ——
  // 它既丢了注册表声明域（拖出的值滑块表示不了），又把步长写死成 0.01 而非滑块真实的 0.05。
  const handleX0Drag = useCallback(
    (mathPos: { x: number; y: number }) => {
      onParamChange(
        "x0",
        snapDragValue(
          mathPos.x,
          paramMeta.x0.step,
          paramDragRange(paramMeta.x0, scale, "x"),
        ),
      );
    },
    [scale, onParamChange],
  );

  // x₁ / x₂ 是严格偏序的耦合端点：除各自声明域外还须保持最小间距，
  // 该约束依赖另一端点的实时取值，无法并入「区间求交」，
  // 故用原子算子 clampCoupledRange —— 极限紧绷时自动锁定，杜绝穿越。
  const handleX1Drag = useCallback(
    (mathPos: { x: number; y: number }) => {
      const range = clampCoupledRange(
        x2,
        MIN_SECANT_GAP,
        paramDragRange(paramMeta.x1, scale, "x"),
        true,
      );
      onParamChange("x1", snapDragValue(mathPos.x, paramMeta.x1.step, range));
    },
    [scale, x2, onParamChange],
  );

  const handleX2Drag = useCallback(
    (mathPos: { x: number; y: number }) => {
      const range = clampCoupledRange(
        x1,
        MIN_SECANT_GAP,
        paramDragRange(paramMeta.x2, scale, "x"),
        false,
      );
      onParamChange("x2", snapDragValue(mathPos.x, paramMeta.x2.step, range));
    },
    [scale, x1, onParamChange],
  );

  // 6. 切线两端点计算
  const tangentSegment = useMemo(() => {
    const k = eval0.dy;
    const xLeft = scale.xMin;
    const yLeft = eval0.y + k * (xLeft - x0);
    const xRight = scale.xMax;
    const yRight = eval0.y + k * (xRight - x0);

    const pLeft = mathToDesign(xLeft, yLeft, scale);
    const pRight = mathToDesign(xRight, yRight, scale);
    return { pLeft, pRight };
  }, [eval0.dy, eval0.y, x0, scale]);

  // 7. 凹凸区域背景高亮
  const concavityRegions = useMemo(() => {
    const steps = 60;
    const dx = (scale.xMax - scale.xMin) / steps;
    const regions: Array<{
      xStart: number;
      xEnd: number;
      type: "concaveUp" | "concaveDown";
    }> = [];

    let curType: "concaveUp" | "concaveDown" | "flat" = "flat";
    let curStart = scale.xMin;

    for (let i = 0; i <= steps; i++) {
      const x = scale.xMin + i * dx;
      const res = evalFunction(fnKey, params, x);
      if (i === 0) {
        curType = res.concavity;
        curStart = x;
      } else if (res.concavity !== curType) {
        if (curType !== "flat") {
          regions.push({ xStart: curStart, xEnd: x, type: curType });
        }
        curType = res.concavity;
        curStart = x;
      }
    }
    if (curType !== "flat" && curStart < scale.xMax) {
      regions.push({ xStart: curStart, xEnd: scale.xMax, type: curType });
    }
    return regions;
  }, [fnKey, params, scale]);

  // 割线端点与中点的屏幕像素点
  const ptJ1 = mathToDesign(jensen.x1, jensen.y1, scale);
  const ptJ2 = mathToDesign(jensen.x2, jensen.y2, scale);
  const ptJChordMid = mathToDesign(jensen.xMid, jensen.yChordMid, scale);
  const ptJCurveMid = mathToDesign(jensen.xMid, jensen.yCurveMid, scale);

  // 8. 智能多方向学术标签避让解算
  const modeLabels = useMemo(() => {
    if (studyMode === "concavity") {
      const items: LabelItem[] = [
        {
          key: "p0",
          x: pt0.x,
          y: pt0.y,
          text: "P₀",
          color: P.probe.color,
          fontSize: fontScale(13),
          preferredPlacement: "top-right",
        },
      ];
      return items;
    } else if (studyMode === "inflection") {
      const items: LabelItem[] = [];
      trueInflections.forEach((ip, idx) => {
        const pt = mathToDesign(ip.x, ip.y, scale);
        items.push({
          key: `inflection-${idx}`,
          x: pt.x,
          y: pt.y,
          text: trueInflections.length > 1 ? `I${idx + 1}` : "I",
          color: P.inflection.color,
          fontSize: fontScale(12),
          preferredPlacement: "top-left",
        });
      });
      extrema.forEach((ext, idx) => {
        const pt = mathToDesign(ext.x, ext.y, scale);
        items.push({
          key: `extrema-${idx}`,
          x: pt.x,
          y: pt.y,
          text: extrema.length > 1 ? `E${idx + 1}` : "E",
          color: P.extrema.color,
          fontSize: fontScale(12),
          preferredPlacement: "bottom-right",
        });
      });
      return items;
    } else {
      const items: LabelItem[] = [
        {
          key: "s1",
          x: ptJ1.x,
          y: ptJ1.y,
          text: "S₁",
          color: P.probeS1.color,
          fontSize: fontScale(12),
          preferredPlacement: "top-left",
        },
        {
          key: "s2",
          x: ptJ2.x,
          y: ptJ2.y,
          text: "S₂",
          color: P.probeS2.color,
          fontSize: fontScale(12),
          preferredPlacement: "top-right",
        },
        {
          key: "m",
          x: ptJChordMid.x,
          y: ptJChordMid.y,
          text: "M",
          color: P.chordMid.color,
          fontSize: fontScale(12),
          preferredPlacement: "top",
        },
        {
          key: "p",
          x: ptJCurveMid.x,
          y: ptJCurveMid.y,
          text: "P",
          color: P.curveMid.color,
          fontSize: fontScale(12),
          preferredPlacement: "bottom",
        },
      ];
      return items;
    }
  }, [
    studyMode,
    pt0,
    ptJ1,
    ptJ2,
    ptJChordMid,
    ptJCurveMid,
    trueInflections,
    extrema,
    scale,
    fontScale,
    // 点位标签的色值取自 palette（图例↔画布同源）。
    // 这里整体列 `P` 而**不能**逐个列 `P.probe.color` 之类：本页 palette 是**按模式分表**的
    // （CONCAVITY 无 chordMid、JENSEN 无 probe…），逐个列会在非对应模式下读到 undefined 而崩页；
    // `P` 本身由 `useMemo(..., [studyMode])` 产生、且 `PALETTES` 是模块级常量，引用稳定，不会多算。
    P,
  ]);

  return (
    <g>
      {/* 坐标轴与纯净背景（无多余方格网干扰） */}
      <CoordinateGrid scale={scale} fontScale={fontScale} showGrid={false} />

      {/* 二阶导数符号分区背景高亮（凹向上凸区 / 凹向下凹区，配色取自本页 palette，
          见 scenePalette.ts 的 zoneConvex / zoneConcave —— 图例与画布同源） */}
      {studyMode === "concavity" &&
        concavityRegions.map((reg, idx) => {
          const p1 = mathToDesign(reg.xStart, scale.yMax, scale);
          const p2 = mathToDesign(reg.xEnd, scale.yMin, scale);
          const width = Math.max(1, Math.abs(p2.x - p1.x));
          const height = Math.abs(p2.y - p1.y);
          const color =
            reg.type === "concaveUp"
              ? withAlpha(P.zoneConvex.color, AREA_FILL_ALPHA)
              : withAlpha(P.zoneConcave.color, AREA_FILL_ALPHA);

          return (
            <rect
              key={`region-${idx}`}
              x={Math.min(p1.x, p2.x)}
              y={Math.min(p1.y, p2.y)}
              width={width}
              height={height}
              fill={color}
              className="pointer-events-none"
            />
          );
        })}

      {/* 二阶导数曲线 f''(x)：本页两个模式的判定主体（此前该曲线在中屏完全缺席，
          学生只能凭 f 的弯曲方向「猜」f'' 的符号，凹凸性与拐点都失去了判定依据）。
            f''(x) > 0 ⟺ 曲线凹向上（分区底色：凸区）  f''(x) < 0 ⟺ 凹向下（分区底色：凹区）
            f''(x) 穿零变号 ⟺ 拐点；只与 x 轴相切而不变号 ⟺ 反例点
            （如四次函数 f''(x)=6x² 在 x=0 处只碰轴不变号，故该点不是拐点）。
          FunctionGraph 自带纵向容错过滤（超出视口 2 倍带宽即断笔），
          f'' 陡峭时自动只画可见带内片段，不会出现撑爆画布的飞线。 */}
      {(studyMode === "concavity" || studyMode === "inflection") && (
        <>
          <FunctionGraph
            fn={(x) => evalFunction(fnKey, params, x).ddy}
            scale={scale}
            color={P.fpp.color}
            strokeWidth={P.fpp.width}
            strokeDasharray={dashArrayOf(P.fpp)}
          />

          {/* f'' 的零点：其横坐标就是拐点候选的横坐标，故直接落在 x 轴上（该处 f''(x)=0）。
              同一横坐标处 f'' 是「穿过」还是「相切」x 轴，正是拐点第一充分条件的可视判别。
              此处取 inflections（含不变号的反例点）而非 trueInflections —— 反例点必须被显示，
              学生才能亲眼看到「f'' 只碰轴不穿轴 ⇒ 不是拐点」。 */}
          {inflections.map((ip, idx) => (
            <MathPoint
              key={`fpp-zero-${idx}-${ip.x}`}
              cx={ip.x}
              cy={0}
              scale={scale}
              variant="solid"
              color={P.fpp.color}
              fontScale={fontScale}
            />
          ))}

          {/* 拐点横坐标对照线：把拐点 I 与它正下方 f'' 的零点连起来，
              直观呈现「拐点的横坐标 = f'' 零点的横坐标」这一等价关系。 */}
          {studyMode === "inflection" &&
            trueInflections.map((ip, idx) => {
              const pTop = mathToDesign(ip.x, ip.y, scale);
              const pBottom = mathToDesign(ip.x, 0, scale);
              return (
                <line
                  key={`fpp-guide-${idx}-${ip.x}`}
                  x1={pTop.x}
                  y1={pTop.y}
                  x2={pBottom.x}
                  y2={pBottom.y}
                  stroke={P.fpp.color}
                  strokeWidth={1.2}
                  strokeDasharray="3 3"
                  strokeOpacity={0.75}
                />
              );
            })}
        </>
      )}

      {/* 原函数曲线 */}
      <FunctionGraph
        fn={fn}
        scale={scale}
        color={P.fn.color}
        strokeWidth={2.8}
      />

      {/* 拐点与其切线渲染 (仅渲染真拐点：f''(x0)=0 但不变号的反例点不得冒充拐点) */}
      {studyMode === "inflection" &&
        trueInflections.map((ip, idx) => {
          const resIp = evalFunction(fnKey, params, ip.x);
          const kIp = resIp.dy;
          const pIpLeft = mathToDesign(
            scale.xMin,
            ip.y + kIp * (scale.xMin - ip.x),
            scale,
          );
          const pIpRight = mathToDesign(
            scale.xMax,
            ip.y + kIp * (scale.xMax - ip.x),
            scale,
          );

          return (
            <g key={`inflection-${idx}`}>
              {/* 拐点切线 */}
              <line
                x1={pIpLeft.x}
                y1={pIpLeft.y}
                x2={pIpRight.x}
                y2={pIpRight.y}
                stroke={P.inflectTangent.color}
                strokeWidth={1.5}
                strokeDasharray="4 4"
                strokeOpacity={0.8}
              />
              {/* 拐点标准学术点标 */}
              <MathPoint
                cx={ip.x}
                cy={ip.y}
                scale={scale}
                color={P.inflection.color}
                fontScale={fontScale}
              />
            </g>
          );
        })}

      {/* 极值点渲染 */}
      {studyMode === "inflection" &&
        extrema.map((ext, idx) => (
          <MathPoint
            key={`extrema-${idx}`}
            cx={ext.x}
            cy={ext.y}
            scale={scale}
            color={P.extrema.color}
            fontScale={fontScale}
          />
        ))}

      {/* 凹凸性探针切线 */}
      {studyMode === "concavity" && (
        <line
          x1={tangentSegment.pLeft.x}
          y1={tangentSegment.pLeft.y}
          x2={tangentSegment.pRight.x}
          y2={tangentSegment.pRight.y}
          stroke={P.tangent.color}
          strokeWidth={2}
          strokeOpacity={0.9}
        />
      )}

      {/* 探针可拖拽控制点 */}
      {studyMode === "concavity" && (
        <InteractivePoint
          cx={x0}
          cy={eval0.y}
          scale={scale}
          vp={vp}
          onDrag={handleX0Drag}
          color={P.probe.color}
          r={6}
          fontScale={fontScale}
        />
      )}

      {/* 琴生不等式模式渲染 */}
      {studyMode === "jensen" && (
        <g>
          {/* 割线段 S1 -> S2 */}
          <line
            x1={ptJ1.x}
            y1={ptJ1.y}
            x2={ptJ2.x}
            y2={ptJ2.y}
            stroke={P.chord.color}
            strokeWidth={2.5}
          />
          {/* 垂直连接线 (弦中点 -> 弧中点) */}
          <line
            x1={ptJChordMid.x}
            y1={ptJChordMid.y}
            x2={ptJCurveMid.x}
            y2={ptJCurveMid.y}
            stroke={P.connector.color}
            strokeWidth={2}
            strokeDasharray="3 3"
          />

          {/* 割线中点 M */}
          <MathPoint
            cx={jensen.xMid}
            cy={jensen.yChordMid}
            scale={scale}
            color={P.chordMid.color}
            fontScale={fontScale}
          />

          {/* 曲线上中点 P */}
          <MathPoint
            cx={jensen.xMid}
            cy={jensen.yCurveMid}
            scale={scale}
            color={P.curveMid.color}
            fontScale={fontScale}
          />

          {/* 琴生端点 S1 与 S2 探针 */}
          <InteractivePoint
            cx={x1}
            cy={jensen.y1}
            scale={scale}
            vp={vp}
            onDrag={handleX1Drag}
            color={P.probeS1.color}
            r={6}
            fontScale={fontScale}
          />

          <InteractivePoint
            cx={x2}
            cy={jensen.y2}
            scale={scale}
            vp={vp}
            onDrag={handleX2Drag}
            color={P.probeS2.color}
            r={6}
            fontScale={fontScale}
          />
        </g>
      )}

      {/* ─── 统一智能避让图层：纯净学术点标渲染 ─── */}
      <SceneLabelGroup items={modeLabels} fontScale={fontScale} />
    </g>
  );
};
