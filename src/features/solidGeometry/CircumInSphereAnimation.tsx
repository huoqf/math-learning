import { useState, useMemo } from "react";
import { ThreePanel } from "@/components/Layout/ThreePanel";
import { ThreeDCanvas } from "@/components/Layout/ThreeDCanvas";
import {
  LeftPanel,
  LeftPanelSection,
  ParamControl,
  MathPanel,
  SelectGrid,
  TabSwitcher,
  Toggle,
  TipCard,
} from "@/components/UI";
import type { ParamConfig } from "@/components/UI";
import { Legend3D, CameraRig } from "@/components/Math3D";
import { CircumInSphereScene } from "@/components/Math3D/solids";
import { use3DViewport } from "@/hooks/use3DViewport";
import type { CameraPreset } from "@/hooks/use3DViewport";
import { buildMathQuantities } from "@/data/mathQuantities";
import { circumInSphereMeta } from "@/data/registries/solidGeometry";
import type { SphereType, ShapeType } from "@/math3d/circumInSphere";
import { MATH_COLORS } from "@/theme/math/colors";

export default function CircumInSphereAnimation() {
  const [sphereType, setSphereType] = useState<SphereType>("circum");
  const [shape, setShape] = useState<ShapeType>("cuboid");
  const [presetKey, setPresetKey] = useState<string>("free");

  // 图层显示控制
  const [showSolid, setShowSolid] = useState<boolean>(true);
  const [showSphere, setShowSphere] = useState<boolean>(true);
  const [showAuxLines, setShowAuxLines] = useState<boolean>(true);
  const [showSection, setShowSection] = useState<boolean>(true);
  const [showTangentPoints, setShowTangentPoints] = useState<boolean>(true);

  const [params, setParams] = useState<Record<string, number>>({
    a: 3,
    b: 2,
    c: 2,
  });

  const { preset, cameraPosition, setCameraPreset, controlsRef } =
    use3DViewport("iso");

  // 1. 黄金 2×2 典型预设体系
  const presetsByShape: Record<
    ShapeType,
    {
      key: string;
      label: string;
      formula?: string;
      description: string;
      values: Record<string, number>;
    }[]
  > = {
    cuboid: [
      {
        key: "free",
        label: "自由探究",
        formula: "a, b, c",
        description: "全参开放",
        values: { a: 3, b: 2, c: 2 },
      },
      {
        key: "cube",
        label: "正方体",
        formula: "a = b = c",
        description: "对称直角",
        values: { a: 3, b: 3, c: 3 },
      },
      {
        key: "cuboid_std",
        label: "3-4-12",
        formula: "2R = 13",
        description: "整数秒杀",
        values: { a: 3, b: 4, c: 12 },
      },
      {
        key: "cuboid_flat",
        label: "扁平长方体",
        formula: "c \\ll a, b",
        description: "极限观察",
        values: { a: 4.5, b: 3.5, c: 1.2 },
      },
    ],
    regularPyramid: [
      {
        key: "free",
        label: "自由探究",
        formula: "a, h",
        description: "全参开放",
        values: { a: 3, b: 3, c: 2.5 },
      },
      {
        key: "octa_half",
        label: "正八面半体",
        formula: "h = \\frac{\\sqrt{2}}{2}a",
        description: "正四面面对",
        values: { a: 4, b: 4, c: 2.83 },
      },
      {
        key: "pyr_high",
        label: "高尖棱锥",
        formula: "h \\gg a",
        description: "球心下移",
        values: { a: 2.5, b: 2.5, c: 5 },
      },
      {
        key: "pyr_flat",
        label: "扁平棱锥",
        formula: "h \\to 1.0",
        description: "球心外落",
        values: { a: 5, b: 5, c: 1.0 },
      },
    ],
    triangularPrism: [
      {
        key: "free",
        label: "自由探究",
        formula: "a, b, h",
        description: "全参开放",
        values: { a: 3, b: 4, c: 4 },
      },
      {
        key: "prism_equal",
        label: "等腰直角柱",
        formula: "a = b",
        description: "对称套柱",
        values: { a: 3, b: 3, c: 4 },
      },
      {
        key: "prism_std",
        label: "3-4-5 高考",
        formula: "2R = 13",
        description: "勾股母题",
        values: { a: 3, b: 4, c: 12 },
      },
      {
        key: "prism_flat",
        label: "扁三棱柱",
        formula: "h \\to 1.5",
        description: "底大高小",
        values: { a: 4, b: 4, c: 1.5 },
      },
    ],
    cone: [
      {
        key: "free",
        label: "自由探究",
        formula: "r, h",
        description: "全参开放",
        values: { a: 3, b: 3, c: 4 },
      },
      {
        key: "cone_equilateral",
        label: "等边圆锥",
        formula: "l = 2r",
        description: "正三角截面",
        values: { a: 3, b: 3, c: 5.2 },
      },
      {
        key: "cone_right",
        label: "直角圆锥",
        formula: "h = r",
        description: "90°顶角",
        values: { a: 3.5, b: 3.5, c: 3.5 },
      },
      {
        key: "cone_flat",
        label: "扁圆锥",
        formula: "h \\ll r",
        description: "底大高小",
        values: { a: 5, b: 5, c: 1.5 },
      },
    ],
    cylinder: [
      {
        key: "free",
        label: "自由探究",
        formula: "r, h",
        description: "全参开放",
        values: { a: 2.5, b: 2.5, c: 5 },
      },
      {
        key: "cyl_square",
        label: "等高圆柱",
        formula: "h = 2r",
        description: "正方形截面",
        values: { a: 2.5, b: 2.5, c: 5 },
      },
      {
        key: "cyl_high",
        label: "细长圆柱",
        formula: "h \\gg r",
        description: "高大径小",
        values: { a: 1.5, b: 1.5, c: 5.5 },
      },
      {
        key: "cyl_flat",
        label: "扁圆柱",
        formula: "h \\to 1.5",
        description: "饼状圆柱",
        values: { a: 4.5, b: 4.5, c: 1.5 },
      },
    ],
  };

  // 2. 右屏看板数据
  const mathData = useMemo(
    () =>
      buildMathQuantities("anim-solid-ball", params, {
        sphereType,
        shape,
      }),
    [params, sphereType, shape],
  );

  const handleShapeChange = (nextShape: ShapeType) => {
    setShape(nextShape);
    setPresetKey("free");
    const freeP = presetsByShape[nextShape]?.find((p) => p.key === "free");
    if (freeP) {
      setParams((prev) => ({ ...prev, ...freeP.values }));
    }
  };

  const handlePresetChange = (key: string) => {
    setPresetKey(key);
    const target = presetsByShape[shape]?.find((p) => p.key === key);
    if (target) {
      setParams((prev) => ({ ...prev, ...target.values }));
    }
  };

  const handleParamChange = (key: string, value: number) => {
    setParams((prev) => {
      const next = { ...prev, [key]: value };
      if (presetKey === "cube" && (key === "a" || key === "b" || key === "c")) {
        next.a = value;
        next.b = value;
        next.c = value;
      }
      if (presetKey === "prism_equal" && key === "a") {
        next.b = value;
      }
      return next;
    });
    setPresetKey("free");
  };

  const handleReset = () => {
    setPresetKey("free");
    const freeP = presetsByShape[shape]?.find((p) => p.key === "free");
    if (freeP) {
      setParams((prev) => ({ ...prev, ...freeP.values }));
    }
  };

  // 3. 声明式参数动态裁剪
  const paramConfigs = useMemo<ParamConfig[]>(() => {
    if (shape === "cone" || shape === "cylinder") {
      return [
        {
          key: "a",
          label: "底面半径 r",
          labelFormula: `\\color{${MATH_COLORS.paramPrimary}}{r}`,
          value: params.a ?? 3,
          min: 1,
          max: 6,
          step: 0.1,
          description: "底面圆半径",
          importance: "core",
        },
        {
          key: "c",
          label: "高 h",
          labelFormula: `\\color{${MATH_COLORS.paramTertiary}}{h}`,
          value: params.c ?? 2,
          min: 1,
          max: 6,
          step: 0.1,
          description: "几何体高度",
          importance: "core",
        },
      ];
    }

    if (shape === "regularPyramid") {
      return [
        {
          key: "a",
          label: "底面边长 a",
          labelFormula: `\\color{${MATH_COLORS.paramPrimary}}{a}`,
          value: params.a ?? 3,
          min: 1,
          max: 6,
          step: 0.1,
          description: "正方形底面边长",
          importance: "core",
        },
        {
          key: "c",
          label: "高 h",
          labelFormula: `\\color{${MATH_COLORS.paramTertiary}}{h}`,
          value: params.c ?? 2,
          min: 1,
          max: 6,
          step: 0.1,
          description: "正棱锥中心高",
          importance: "core",
        },
      ];
    }

    if (presetKey === "cube") {
      return [
        {
          key: "a",
          label: "棱长 a",
          labelFormula: `\\color{${MATH_COLORS.paramPrimary}}{a}`,
          value: params.a ?? 3,
          min: 1,
          max: 6,
          step: 0.1,
          description: "正方体各棱长 (a=b=c)",
          importance: "core",
        },
      ];
    }

    return circumInSphereMeta.map((meta) => ({
      key: meta.key,
      label:
        shape === "triangularPrism"
          ? meta.key === "a"
            ? "直角边 a"
            : meta.key === "b"
              ? "直角边 b"
              : "柱体高 h"
          : meta.label,
      labelFormula:
        meta.key === "a"
          ? `\\color{${MATH_COLORS.paramPrimary}}{a}`
          : meta.key === "b"
            ? `\\color{${MATH_COLORS.paramSecondary}}{b}`
            : `\\color{${MATH_COLORS.paramTertiary}}{h}`,
      value: params[meta.key] ?? meta.defaultValue ?? 0,
      min: meta.min,
      max: meta.max,
      step: meta.step ?? 0.1,
      description: meta.description,
      importance: meta.importance as any,
    }));
  }, [shape, params, presetKey]);

  // 左屏教学提示与题设导引（说明初始条件与探究设问）
  const tipConfig = useMemo(() => {
    const isCircum = sphereType === "circum";
    switch (shape) {
      case "cuboid":
        return {
          variant: "primary" as const,
          badge: isCircum
            ? "高考母题 · 长方体/正方体外接球"
            : "高考核心 · 正方体内切球",
          condition: "长方体长宽高分别为 a, b, h (当 a=b=h 时为正方体)。",
          question: isCircum
            ? "长方体体对角线即外接球直径：(2R)² = a² + b² + h²，球心为体对角线交点。"
            : "正方体内切球球心为中心，内切球直径等于棱长：2r = a，球与 6 个正方形面相切。",
        };
      case "regularPyramid":
        return {
          variant: "warning" as const,
          badge: isCircum
            ? "高考经典 · 正四棱锥外接球"
            : "高考大题 · 正四棱锥内切球",
          condition:
            "正四棱锥底面边长为 a，高为 h，斜高为 h_斜 = √(h² + (a/2)²)。",
          question: isCircum
            ? "外接球球心在高线上，设球心到顶点距离为 R，由直角三角形勾股得 R² = (a/√2)² + (h - R)²。"
            : "轴截面降维为等腰三角形内切圆，或由等体积法得内切球半径 r = (3V) / S_表 = (a·h) / (a + 2h_斜)。",
        };
      case "triangularPrism":
        return {
          variant: "success" as const,
          badge: isCircum
            ? "高考常考 · 直三棱柱外接球"
            : "高考高频 · 直三棱柱内切球",
          condition:
            "直三棱柱高为 h，底面为直角三角形（直角边 a, b，斜边 c=√(a²+b²)）。",
          question: isCircum
            ? "底面外接圆半径 r_底 = c/2，外接球球心为上下底外心连线中点，满足 R² = r_底² + (h/2)²。"
            : "内切球存在充要条件为底面内切圆直径等于高：2r = h = a + b - c。",
        };
      case "cone":
        return {
          variant: "accent" as const,
          badge: isCircum ? "高考模型 · 圆锥外接球" : "高考核心 · 圆锥内切球",
          condition: "圆锥底面半径为 r_底=a，高为 h，母线长为 l = √(a² + h²)。",
          question: isCircum
            ? "轴截面为等腰三角形，外接球半径即等腰三角形外接圆半径：R = l² / (2h)。"
            : "轴截面等腰三角形内切圆半径即圆锥内切球半径：r = (a·h) / (a + l)。",
        };
      case "cylinder":
        return {
          variant: "info" as const,
          badge: isCircum ? "高考模型 · 圆柱外接球" : "高考模型 · 圆柱内切球",
          condition:
            "圆柱底面半径为 r_底=a，高为 h (当 h=2a 时轴截面为正方形)。",
          question: isCircum
            ? "轴截面为矩形，外接球直径即矩形对角线：(2R)² = (2a)² + h²，R = √(a² + (h/2)²)。"
            : "当且仅当 h=2a（等高圆柱）时存在内切球，内切球半径 r = a = h/2。",
        };
    }
  }, [shape, sphereType]);

  return (
    <ThreePanel
      left={
        <LeftPanel>
          {/* Step 1: 探究模式 (2×2 黄金网格) */}
          <LeftPanelSection title="探究模式">
            <SelectGrid
              columns={2}
              items={[
                {
                  key: "circum",
                  label: "外接球探究",
                  formula: "R_{\\text{外}}",
                  description: "包络顶点",
                },
                {
                  key: "inscribed",
                  label: "内切球探究",
                  formula: "r_{\\text{内}}",
                  description: "面面相切",
                },
              ]}
              value={sphereType}
              onChange={(t) => setSphereType(t as SphereType)}
            />
          </LeftPanelSection>

          {/* Step 2: 几何体选择 */}
          <LeftPanelSection title="几何体模型选择">
            <SelectGrid
              columns={2}
              items={[
                { key: "cuboid", label: "长方体", description: "体对角线" },
                {
                  key: "regularPyramid",
                  label: "正四棱锥",
                  description: "高线勾股",
                },
                {
                  key: "triangularPrism",
                  label: "直三棱柱",
                  description: "套柱转化",
                },
                { key: "cone", label: "圆锥", description: "轴截面法" },
                {
                  key: "cylinder",
                  label: "圆柱",
                  description: "旋转对称",
                  fullWidth: true,
                },
              ]}
              value={shape}
              onChange={(k) => handleShapeChange(k as ShapeType)}
            />
          </LeftPanelSection>

          {/* Step 3: 典型模型预设 (2×2 黄金网格) */}
          <LeftPanelSection title="典型算例预设">
            <SelectGrid
              columns={2}
              items={presetsByShape[shape]}
              value={presetKey}
              onChange={handlePresetChange}
            />
          </LeftPanelSection>

          {/* Step 4: 参数调节 */}
          <LeftPanelSection title="几何参数调节">
            <ParamControl
              params={paramConfigs}
              onParamChange={handleParamChange}
              onReset={handleReset}
            />
          </LeftPanelSection>

          {/* Step 5: 图层与标注显示控制 */}
          <LeftPanelSection title="图层与标注显示控制" compact>
            <div className="flex flex-col gap-2.5">
              <Toggle
                label="几何体实体"
                checked={showSolid}
                onChange={setShowSolid}
              />
              <Toggle
                label="标准切接球壳 (带赤道与极轴)"
                checked={showSphere}
                onChange={setShowSphere}
              />
              <Toggle
                label="特征高线与对角线"
                checked={showAuxLines}
                onChange={setShowAuxLines}
              />
              {(shape === "cone" || shape === "cylinder") && (
                <Toggle
                  label="轴截面剖面"
                  checked={showSection}
                  onChange={setShowSection}
                />
              )}
              {sphereType === "inscribed" && (
                <Toggle
                  label="相切切点与垂线段"
                  checked={showTangentPoints}
                  onChange={setShowTangentPoints}
                />
              )}
            </div>
          </LeftPanelSection>

          {/* Step 6: 3D 空间视角预设 */}
          <LeftPanelSection title="3D 空间视角预设">
            <TabSwitcher
              layout="horizontal"
              tabs={[
                { key: "iso", label: "轴测" },
                { key: "front", label: "主视" },
                { key: "top", label: "俯视" },
                { key: "side", label: "左视" },
              ]}
              value={preset}
              onChange={(p) => setCameraPreset(p as CameraPreset)}
            />
          </LeftPanelSection>

          {/* Step 7: 教学提示与题设导引（置于左屏底部） */}
          <LeftPanelSection title="教学导引与题设背景" compact>
            <TipCard variant={tipConfig.variant}>
              <div className="flex items-center justify-between font-semibold text-xs mb-1.5 border-b border-black/5 pb-1">
                <span>{tipConfig.badge}</span>
              </div>
              <div className="space-y-1 text-[11px] leading-relaxed">
                <div>
                  <span className="font-semibold text-neutral-800">
                    【初始条件】
                  </span>
                  <span className="text-neutral-600">
                    {tipConfig.condition}
                  </span>
                </div>
                <div>
                  <span className="font-semibold text-neutral-800">
                    【探究设问】
                  </span>
                  <span className="text-neutral-600">{tipConfig.question}</span>
                </div>
              </div>
            </TipCard>
          </LeftPanelSection>
        </LeftPanel>
      }
      center={
        <ThreeDCanvas
          cameraPosition={cameraPosition}
          legend={
            <Legend3D
              title="切接球图例"
              items={[
                { colorKey: "primary", swatch: "area", label: "几何体主体" },
                {
                  colorKey:
                    sphereType === "circum" ? "sphereShell" : "inSphereShell",
                  swatch: "sphere",
                  label: sphereType === "circum" ? "外接球" : "内切球",
                },
                {
                  colorKey: "highlight",
                  swatch: "point",
                  label: sphereType === "circum" ? "O：球心" : "I：球心",
                },
                {
                  colorKey: "paramTertiary",
                  swatch: "line",
                  label: "特征高线/对角线",
                },
              ]}
            />
          }
        >
          <CameraRig ref={controlsRef} />
          <CircumInSphereScene
            sphereType={sphereType}
            shape={shape}
            params={params}
            showSolid={showSolid}
            showSphere={showSphere}
            showAuxLines={showAuxLines}
            showSection={showSection}
            showTangentPoints={showTangentPoints}
          />
        </ThreeDCanvas>
      }
      right={
        <MathPanel
          quantities={mathData.quantities}
          theorems={mathData.theorems}
          gaokaoPoints={mathData.gaokaoPoints}
          warnings={mathData.warnings}
          title={`${
            shape === "cuboid"
              ? "长方体"
              : shape === "regularPyramid"
                ? "正四棱锥"
                : shape === "triangularPrism"
                  ? "直三棱柱"
                  : shape === "cone"
                    ? "圆锥"
                    : "圆柱"
          }${sphereType === "circum" ? "外接球" : "内切球"}高考看板`}
        />
      }
    />
  );
}
