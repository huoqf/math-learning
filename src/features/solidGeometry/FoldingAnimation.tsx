import { useState, useMemo } from "react";
import { ThreePanel } from "@/components/Layout/ThreePanel";
import { ThreeDCanvas } from "@/components/Layout/ThreeDCanvas";
import { ThreeViewsPanel } from "@/components/Math3D/ThreeViewsPanel";
import {
  LeftPanel,
  LeftPanelSection,
  ParamControl,
  MathPanel,
  TabSwitcher,
} from "@/components/UI";
import type { ParamConfig } from "@/components/UI";
import {
  Scene3DGrid,
  Vector3DArrow,
  Plane3D,
  PointLabel3D,
  FormulaLabel3D,
  AngleArc3D,
  Legend3D,
  CameraRig,
} from "@/components/Math3D";
import { use3DViewport } from "@/hooks/use3DViewport";
import { solidFoldingMeta } from "@/data/registries/solidGeometry";
import type { Vec3 } from "@/math3d/vector3";

import { buildSolidViews } from "./threeViews/buildSolidViews";

export default function FoldingAnimation() {
  const [viewMode, setViewMode] = useState<"3d" | "threeViews">("3d");
  const [params, setParams] = useState<Record<string, number>>({
    a: 3,
    b: 2,
    h: 2,
    alphaDeg: 90,
  });

  const { preset, cameraPosition, setCameraPreset, controlsRef } =
    use3DViewport("iso");

  const a = params.a ?? 3;
  const b = params.b ?? 2;
  const h = params.h ?? 2;
  const alphaDeg = params.alphaDeg ?? 90;
  const alphaRad = (alphaDeg * Math.PI) / 180;

  const solidViews = useMemo(
    () =>
      buildSolidViews("cuboid", {
        width: a,
        depth: b,
        height: h,
      }),
    [a, b, h],
  );

  // 几何顶点 3D 坐标解算
  // 折痕边 EC 在 x = b 处，沿 y 轴方向 (b, 0, 0) -> (b, h, 0)
  // 静止部分: A(0,0,0), B(a,0,0), E(b,0,0), C(b,h,0)
  // 翻折部分: D(0,h,0) 绕折痕 EC 旋转 alpha 角，变动点为 D'
  const A: Vec3 = { x: 0, y: 0, z: 0 };
  const B: Vec3 = { x: a, y: 0, z: 0 };
  const E: Vec3 = { x: b, y: 0, z: 0 };
  const C: Vec3 = { x: b, y: h, z: 0 };
  // D' 翻折后的空间坐标:
  const D_prime: Vec3 = {
    x: b - b * Math.cos(alphaRad),
    y: h,
    z: b * Math.sin(alphaRad),
  };

  // 右屏 MathPanel 看板数据组装
  const mathData = useMemo(() => {
    // 线段 D'A 长度计算
    const lenDPrimeA = Math.sqrt(
      D_prime.x * D_prime.x + D_prime.y * D_prime.y + D_prime.z * D_prime.z,
    );
    return {
      quantities: [
        {
          label: "翻折二面角 α",
          symbol: "\\alpha",
          value: `${alphaDeg}°`,
          color: "#EF4444",
        },
        {
          label: "动点 D' 坐标",
          symbol: "D'",
          value: `(${D_prime.x.toFixed(2)}, ${D_prime.y.toFixed(2)}, ${D_prime.z.toFixed(2)})`,
          color: "#D97706",
        },
        {
          label: "变动线段 D'A 长度",
          symbol: "|D'A|",
          value: Number(lenDPrimeA.toFixed(3)),
          color: "#059669",
        },
        {
          label: "不变线段 EC 长度",
          symbol: "|EC|",
          value: h,
          color: "#3B82F6",
        },
      ],
      theorems: [
        {
          name: "平面翻折问题基本性质定理",
          latex:
            "\\text{折痕上的线段及平行于折痕的向量在翻折后保持长度与方向不变}",
          level: "core" as const,
          condition: "翻折过程不改变各部分内部几何图形的形状与大小",
        },
        {
          name: "翻折顶点坐标表示",
          latex: `D' = (b - b\\cos\\alpha, h, b\\sin\\alpha)`,
          level: "important" as const,
        },
      ],
      gaokaoPoints: [
        {
          text: "高考翻折大题核心：区分翻折前后的“变与不变”。折痕上的点线段距离不随翻折改变；翻折后不位于同一平面的点线段距离（如 D'A）随二面角 α 动态变化。",
          importance: "gaokao" as const,
        },
        {
          text: "建系法解翻折题：通常选择折痕所在直线与垂直于折痕的射线为坐标轴建立空间直角坐标系，利用二面角 α 参数化表示翻折点的 3D 坐标。",
          importance: "gaokao" as const,
        },
      ],
      warnings:
        alphaDeg === 0 || alphaDeg === 180
          ? [
              {
                text: `二面角 α = ${alphaDeg}° 时，图形退化为平面二维图形，3D 二面角退化！`,
                level: "warning" as const,
              },
            ]
          : [],
    };
  }, [alphaDeg, a, b, h, D_prime.x, D_prime.y, D_prime.z]);

  const handleParamChange = (key: string, value: number) => {
    setParams((prev) => ({ ...prev, [key]: value }));
  };

  const handleReset = () => {
    setParams({ a: 3, b: 2, h: 2, alphaDeg: 90 });
  };

  const paramConfigs = useMemo<ParamConfig[]>(
    () =>
      solidFoldingMeta.map((meta) => ({
        key: meta.key,
        label: meta.label,
        labelFormula: meta.labelFormula,
        value: params[meta.key] ?? meta.defaultValue ?? 0,
        min: meta.min,
        max: meta.max,
        step: meta.step ?? 1,
        description: meta.description,
        descriptionFormula: meta.descriptionFormula,
        importance: meta.importance,
        marks: meta.marks,
      })),
    [params],
  );

  return (
    <ThreePanel
      left={
        <LeftPanel>
          <LeftPanelSection title="视图模式选择">
            <TabSwitcher
              tabs={[
                { key: "3d", label: "3D 直观图" },
                { key: "threeViews", label: "正投影/三视图" },
              ]}
              value={viewMode}
              onChange={(m) => setViewMode(m as any)}
            />
          </LeftPanelSection>

          <LeftPanelSection
            title="图形尺寸与折叠角参数"
            subtitle="调节下底 a、上底 b、高 h 与翻折二面角 α"
          >
            <ParamControl
              params={paramConfigs}
              onParamChange={handleParamChange}
              onReset={handleReset}
            />
          </LeftPanelSection>

          <LeftPanelSection title="3D 视角选择">
            <TabSwitcher
              tabs={[
                { key: "iso", label: "轴测" },
                { key: "front", label: "主视" },
                { key: "top", label: "俯视" },
                { key: "side", label: "左视" },
              ]}
              value={preset}
              onChange={(p) => setCameraPreset(p as any)}
            />
          </LeftPanelSection>
        </LeftPanel>
      }
      center={
        viewMode === "3d" ? (
          <ThreeDCanvas
            cameraPosition={cameraPosition}
            legend={
              <Legend3D
                title="图例"
                items={[
                  {
                    colorKey: "primary",
                    swatch: "area",
                    label: "固定底面 ABCE",
                  },
                  {
                    colorKey: "highlight",
                    swatch: "area",
                    label: "翻折面 ECD'",
                  },
                  { colorKey: "accent", swatch: "line", label: "变动线段 D'A" },
                ]}
              />
            }
          >
            <CameraRig ref={controlsRef} />
            <Scene3DGrid size={5} />

            {/* 静止底面 ABCE */}
            <Plane3D
              origin={A}
              uAxis={{ x: a, y: 0, z: 0 }}
              vAxis={{ x: 0, y: h, z: 0 }}
              colorKey="primary"
              opacity={0.2}
            />

            {/* 折痕线段 EC */}
            <Vector3DArrow from={E} to={C} colorKey="secondary" />

            {/* 变动线段 D'A */}
            <Vector3DArrow from={D_prime} to={A} colorKey="accent" />
            <Vector3DArrow from={E} to={D_prime} colorKey="highlight" />

            {/* 顶点标签 */}
            <PointLabel3D position={A} text="A" />
            <PointLabel3D position={B} text="B" />
            <PointLabel3D position={E} text="E" />
            <PointLabel3D position={C} text="C" />
            <PointLabel3D
              position={D_prime}
              text="D'"
              offset={[0.1, 0.1, 0.1]}
            />

            {/* 二面角弧 */}
            <AngleArc3D
              vertex={E}
              dirA={{ x: -1, y: 0, z: 0 }}
              dirB={{
                x: D_prime.x - E.x,
                y: D_prime.y - E.y,
                z: D_prime.z - E.z,
              }}
              radius={0.8}
              colorKey="highlight"
            />
            <FormulaLabel3D
              position={{ x: E.x - 0.5, y: 0, z: 0.4 }}
              tex="\alpha"
            />
          </ThreeDCanvas>
        ) : (
          <ThreeViewsPanel
            views={solidViews.views}
            extent={solidViews.extent}
          />
        )
      }
      right={
        <MathPanel
          quantities={mathData.quantities}
          theorems={mathData.theorems}
          gaokaoPoints={mathData.gaokaoPoints}
          warnings={mathData.warnings}
          title="翻折二面角看板"
        />
      }
    />
  );
}
