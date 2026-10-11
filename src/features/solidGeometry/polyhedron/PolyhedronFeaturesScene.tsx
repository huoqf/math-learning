import { useMemo } from "react";
import { Segment3D } from "@/components/Math3D/Segment3D";
import { Point3D } from "@/components/Math3D/Point3D";
import { PointLabel3D } from "@/components/Math3D/PointLabel3D";
import { CompoundLabel3D } from "@/components/Math3D/CompoundLabel3D";
import { FormulaLabel3D } from "@/components/Math3D/FormulaLabel3D";
import { Polygon3DFace } from "@/components/Math3D/Polygon3DFace";
import type { Vec3 } from "@/math3d/vector3";
import {
  calculatePrismFeatures,
  calculateRegularPyramidFeatures,
  calculateEqualVolumeMethod,
  equalVolumeVertices,
  frustumApexGuide,
  frustumVertices,
} from "@/math3d/polyhedronFeatures";

interface PolyhedronFeaturesSceneProps {
  mode: "prism" | "pyramid" | "frustum" | "equalVolume";
  a: number;
  b: number;
  h: number;
  a1: number;
  a2: number;
}

export function PolyhedronFeaturesScene({
  mode,
  a,
  b,
  h,
  a1,
  a2,
}: PolyhedronFeaturesSceneProps) {
  // ── 模式一：棱柱 ──
  const prism = useMemo(() => calculatePrismFeatures(4, a, h), [a, h]);

  // ── 模式二：正棱锥 ──
  const pyramid = useMemo(() => calculateRegularPyramidFeatures(a, h), [a, h]);

  // ── 模式四：等体积换底法 ──
  const equalVol = useMemo(
    () => calculateEqualVolumeMethod(a, b, h),
    [a, b, h],
  );

  if (mode === "prism") {
    const bot = prism.bottomVertices;
    const top = prism.topVertices;

    return (
      <group>
        {/* 下底面与上底面 */}
        <Polygon3DFace points={bot} colorKey="primary" opacity={0.35} />
        <Polygon3DFace points={top} colorKey="primary" opacity={0.35} />

        {/* 下底边框 */}
        {bot.map((v, i) => (
          <Segment3D
            key={`b-${i}`}
            from={v}
            to={bot[(i + 1) % bot.length]}
            colorKey="paramPrimary"
            lineWidth={2.5}
          />
        ))}

        {/* 上底边框 */}
        {top.map((v, i) => (
          <Segment3D
            key={`t-${i}`}
            from={v}
            to={top[(i + 1) % top.length]}
            colorKey="paramPrimary"
            lineWidth={2.5}
          />
        ))}

        {/* 侧棱 */}
        {bot.map((v, i) => (
          <Segment3D
            key={`s-${i}`}
            from={v}
            to={top[i]}
            colorKey="paramTertiary"
            lineWidth={2.5}
          />
        ))}

        {/* 顶点标签 */}
        <Point3D position={bot[0]} colorKey="paramPrimary" radius={0.06} />
        <PointLabel3D position={bot[0]} text="A" offset={[-0.2, -0.2, 0]} />
        <Point3D position={bot[1]} colorKey="paramPrimary" radius={0.06} />
        <PointLabel3D position={bot[1]} text="B" offset={[0.2, -0.2, 0]} />
        <Point3D position={top[0]} colorKey="paramPrimary" radius={0.06} />
        <CompoundLabel3D
          position={top[0]}
          base="A"
          subscript="1"
          offset={[-0.2, -0.2, 0.2]}
        />
      </group>
    );
  }

  if (mode === "pyramid") {
    const P = pyramid.apex;
    const base = pyramid.baseVertices;
    const O: Vec3 = { x: 0, y: 0, z: 0 };
    // 侧面 BC 的中点 E
    const E: Vec3 = {
      x: (base[1].x + base[2].x) / 2,
      y: (base[1].y + base[2].y) / 2,
      z: 0,
    };

    return (
      <group>
        {/* 底面 */}
        <Polygon3DFace points={base} colorKey="primary" opacity={0.35} />

        {/* 底边 */}
        {base.map((v, i) => (
          <Segment3D
            key={`pb-${i}`}
            from={v}
            to={base[(i + 1) % base.length]}
            colorKey="paramPrimary"
            lineWidth={2.5}
          />
        ))}

        {/* 侧棱 */}
        {base.map((v, i) => (
          <Segment3D
            key={`pe-${i}`}
            from={P}
            to={v}
            colorKey="secondary"
            lineWidth={2.5}
          />
        ))}

        {/* 棱锥高 PO (虚线) */}
        <Segment3D
          from={P}
          to={O}
          colorKey="paramTertiary"
          lineWidth={2.5}
          dashed
        />
        <Point3D position={O} colorKey="paramTertiary" radius={0.06} />
        <PointLabel3D position={O} text="O" offset={[0.2, 0.2, 0]} />

        {/* 斜高 PE (侧面等腰三角形高) */}
        <Segment3D
          from={P}
          to={E}
          colorKey="paramSecondary"
          lineWidth={2}
          dashed
        />
        <Point3D position={E} colorKey="paramSecondary" radius={0.06} />
        <PointLabel3D position={E} text="E" offset={[0.2, 0, 0]} />

        {/* 底面中心到边心距 OE */}
        <Segment3D
          from={O}
          to={E}
          colorKey="paramPrimary"
          lineWidth={1.5}
          dashed
        />

        {/* 顶点 P */}
        <Point3D position={P} colorKey="highlight" radius={0.08} />
        <PointLabel3D position={P} text="P" offset={[0, 0, 0.3]} />
      </group>
    );
  }

  if (mode === "frustum") {
    // 顶点与补形延长线全部取自纯数学层：页面与包围盒共用同源，避免两处各写一套端点
    const { bottom: bot, top } = frustumVertices(a2, a1, h);
    const guide = frustumApexGuide(a2, a1, h);

    return (
      <group>
        {/* 下底面与上底面 */}
        <Polygon3DFace points={bot} colorKey="primary" opacity={0.35} />
        <Polygon3DFace points={top} colorKey="paramSecondary" opacity={0.35} />

        {/* 下底边框 */}
        {bot.map((v, i) => (
          <Segment3D
            key={`fb-${i}`}
            from={v}
            to={bot[(i + 1) % bot.length]}
            colorKey="paramPrimary"
            lineWidth={2.5}
          />
        ))}

        {/* 上底边框 */}
        {top.map((v, i) => (
          <Segment3D
            key={`ft-${i}`}
            from={v}
            to={top[(i + 1) % top.length]}
            colorKey="paramSecondary"
            lineWidth={2.5}
          />
        ))}

        {/* 棱台侧棱 */}
        {bot.map((v, i) => (
          <Segment3D
            key={`fs-${i}`}
            from={v}
            to={top[i]}
            colorKey="paramTertiary"
            lineWidth={2.5}
          />
        ))}

        {/*
          补全大棱锥的侧棱延长线。
          端点由 frustumApexGuide 给出，严格落在侧棱延长线上（bottom[i] → apex 的 t 分点）：
          未截断时四点重合为真实原锥顶点，截断时形成"绘制截断面"——
          任何情况下都不再用"轴上假顶点"，杜绝延长线折角。
        */}
        {top.map((v, i) => (
          <Segment3D
            key={`fa-${i}`}
            from={v}
            to={guide.endpoints[i]}
            colorKey="textMuted"
            lineWidth={1.5}
            dashed
          />
        ))}

        {/* 截断面：水平虚线闭合，提示"这是绘制边界，不是真实顶点" */}
        {guide.isTruncated &&
          guide.endpoints.map((v, i) => (
            <Segment3D
              key={`fc-${i}`}
              from={v}
              to={guide.endpoints[(i + 1) % guide.endpoints.length]}
              colorKey="textMuted"
              lineWidth={1.2}
              dashed
            />
          ))}

        {!guide.isTruncated && (
          <>
            <Point3D
              position={guide.trueApex}
              colorKey="highlight"
              radius={0.06}
            />
            <PointLabel3D
              position={guide.trueApex}
              text="P"
              offset={[0, 0, 0.3]}
            />
          </>
        )}

        {/* 原锥高 H 的数值标注：截断时贴在截断面上，未截断时贴在顶点旁 */}
        <FormulaLabel3D
          position={
            guide.isTruncated
              ? { x: 0, y: 0, z: guide.drawnHeight }
              : guide.trueApex
          }
          tex={
            guide.isTruncated
              ? `H=${guide.trueHeight.toFixed(2)}\\ \\text{(示意)}`
              : `H=${guide.trueHeight.toFixed(2)}`
          }
          offset={[0.22, 0.22, 0.22]}
        />
      </group>
    );
  }

  // mode === "equalVolume"
  const { A, B, C, P } = equalVolumeVertices(equalVol);

  return (
    <group>
      {/* 底面 △ABC */}
      <Polygon3DFace points={[A, B, C]} colorKey="primary" opacity={0.35} />
      {/* 侧面 △PAC */}
      <Polygon3DFace
        points={[P, A, C]}
        colorKey="paramSecondary"
        opacity={0.35}
      />

      {/* 四面体棱 */}
      <Segment3D from={A} to={B} colorKey="paramPrimary" lineWidth={2.5} />
      <Segment3D from={A} to={C} colorKey="paramSecondary" lineWidth={2.5} />
      <Segment3D from={B} to={C} colorKey="secondary" lineWidth={2} />
      <Segment3D from={P} to={A} colorKey="paramTertiary" lineWidth={2.5} />
      <Segment3D from={P} to={B} colorKey="highlight" lineWidth={2} />
      <Segment3D from={P} to={C} colorKey="highlight" lineWidth={2} />

      {/* 顶点标注 */}
      <Point3D position={A} colorKey="paramPrimary" radius={0.07} />
      <PointLabel3D position={A} text="A" offset={[-0.2, -0.2, 0]} />

      <Point3D position={B} colorKey="paramPrimary" radius={0.07} />
      <PointLabel3D position={B} text="B" offset={[0.2, 0, 0]} />

      <Point3D position={C} colorKey="paramSecondary" radius={0.07} />
      <PointLabel3D position={C} text="C" offset={[0, 0.2, 0]} />

      <Point3D position={P} colorKey="highlight" radius={0.08} />
      <PointLabel3D position={P} text="P" offset={[0, 0, 0.3]} />
    </group>
  );
}
