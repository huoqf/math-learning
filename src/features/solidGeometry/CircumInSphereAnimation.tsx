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

  // 1. 2×2 黄金预设定义（纯净单行加粗学术标题，纯粹自解释，等高对称，杜绝折行与冗余公式）
  const presetsByShape: Record<
    ShapeType,
    {
      key: string;
      label: string;
      values: Record<string, number>;
    }[]
  > = {
    cuboid: [
      {
        key: "free",
        label: "自由探索",
        values: { a: 3, b: 2, c: 2 },
      },
      {
        key: "cube",
        label: "正方体",
        values: { a: 3, b: 3, c: 3 },
      },
      {
        key: "cuboid_std",
        label: "勾股长方体",
        values: { a: 1.5, b: 2, c: 6 },
      },
      {
        key: "cuboid_flat",
        label: "扁平长方体",
        values: { a: 4.5, b: 3.5, c: 1.2 },
      },
    ],
    regularPyramid: [
      {
        key: "free",
        label: "自由探索",
        values: { a: 3, b: 3, c: 2.5 },
      },
      {
        key: "octa_half",
        label: "正八面体半体",
        values: { a: 4, b: 4, c: 2.83 },
      },
      {
        key: "pyr_high",
        label: "细高正四棱锥",
        values: { a: 2.5, b: 2.5, c: 5 },
      },
      {
        key: "pyr_flat",
        label: "扁平正四棱锥",
        values: { a: 5, b: 5, c: 1.0 },
      },
    ],
    triangularPrism: [
      {
        key: "free",
        label: "自由探索",
        values: { a: 3, b: 4, c: 4 },
      },
      {
        key: "prism_equal",
        label: "等腰直角柱",
        values: { a: 3, b: 3, c: 4 },
      },
      {
        key: "prism_std",
        label: "勾股棱柱",
        values: { a: 1.5, b: 2, c: 6 },
      },
      {
        key: "prism_flat",
        label: "扁直三棱柱",
        values: { a: 4, b: 4, c: 1.5 },
      },
    ],
    cone: [
      {
        key: "free",
        label: "自由探索",
        values: { a: 3, b: 3, c: 4 },
      },
      {
        key: "cone_equilateral",
        label: "等边圆锥",
        values: { a: 3, b: 3, c: 5.2 },
      },
      {
        key: "cone_right",
        label: "直角圆锥",
        values: { a: 3.5, b: 3.5, c: 3.5 },
      },
      {
        key: "cone_flat",
        label: "扁平圆锥",
        values: { a: 5, b: 5, c: 1.5 },
      },
    ],
    cylinder: [
      {
        key: "free",
        label: "自由探索",
        values: { a: 2.5, b: 2.5, c: 5 },
      },
      {
        key: "cyl_square",
        label: "等高圆柱",
        values: { a: 2.5, b: 2.5, c: 5 },
      },
      {
        key: "cyl_high",
        label: "细长圆柱",
        values: { a: 1.5, b: 1.5, c: 5.5 },
      },
      {
        key: "cyl_flat",
        label: "扁平圆柱",
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
      if (presetKey === "octa_half" && key === "a") {
        next.b = value;
        next.c = Number(((Math.sqrt(2) / 2) * value).toFixed(2));
      }
      if (presetKey === "prism_equal" && key === "a") {
        next.b = value;
      }
      if (presetKey === "cone_equilateral" && key === "a") {
        next.b = value;
        next.c = Number((Math.sqrt(3) * value).toFixed(2));
      }
      if (presetKey === "cone_right" && key === "a") {
        next.b = value;
        next.c = value;
      }
      if (presetKey === "cyl_square" && key === "a") {
        next.b = value;
        next.c = Number((2 * value).toFixed(2));
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

  // 3. 声明式参数动态裁剪与三位一体命名（含义 + 代号 + 色彩）
  const paramConfigs = useMemo<ParamConfig[]>(() => {
    // 典型特定算例预设（题设完全确定，锁定所有参数，实现参数降维）
    if (
      presetKey !== "free" &&
      presetKey !== "cube" &&
      presetKey !== "octa_half" &&
      presetKey !== "prism_equal" &&
      presetKey !== "cone_equilateral" &&
      presetKey !== "cone_right" &&
      presetKey !== "cyl_square"
    ) {
      return [];
    }

    if (shape === "cone" || shape === "cylinder") {
      if (
        presetKey === "cone_equilateral" ||
        presetKey === "cone_right" ||
        presetKey === "cyl_square"
      ) {
        return [
          {
            key: "a",
            label: "底面半径 r",
            labelFormula: `\\text{底面半径 } \\color{${MATH_COLORS.paramPrimary}}{r}`,
            value: params.a ?? 3,
            min: 1,
            max: 6,
            step: 0.1,
            importance: "core",
          },
        ];
      }
      return [
        {
          key: "a",
          label: "底面半径 r",
          labelFormula: `\\text{底面半径 } \\color{${MATH_COLORS.paramPrimary}}{r}`,
          value: params.a ?? 3,
          min: 1,
          max: 6,
          step: 0.1,
          importance: "core",
        },
        {
          key: "c",
          label: "高 h",
          labelFormula: `\\text{高度 } \\color{${MATH_COLORS.paramTertiary}}{h}`,
          value: params.c ?? 2,
          min: 1,
          max: 6,
          step: 0.1,
          importance: "core",
        },
      ];
    }

    if (shape === "regularPyramid") {
      if (presetKey === "octa_half") {
        return [
          {
            key: "a",
            label: "底面边长 a",
            labelFormula: `\\text{底面边长 } \\color{${MATH_COLORS.paramPrimary}}{a}`,
            value: params.a ?? 4,
            min: 1,
            max: 6,
            step: 0.1,
            importance: "core",
          },
        ];
      }
      return [
        {
          key: "a",
          label: "底面边长 a",
          labelFormula: `\\text{底面边长 } \\color{${MATH_COLORS.paramPrimary}}{a}`,
          value: params.a ?? 3,
          min: 1,
          max: 6,
          step: 0.1,
          importance: "core",
        },
        {
          key: "c",
          label: "高 h",
          labelFormula: `\\text{棱锥高 } \\color{${MATH_COLORS.paramTertiary}}{h}`,
          value: params.c ?? 2,
          min: 1,
          max: 6,
          step: 0.1,
          importance: "core",
        },
      ];
    }

    if (presetKey === "cube") {
      return [
        {
          key: "a",
          label: "正方体棱长 a",
          labelFormula: `\\text{正方体棱长 } \\color{${MATH_COLORS.paramPrimary}}{a}`,
          value: params.a ?? 3,
          min: 1,
          max: 6,
          step: 0.1,
          importance: "core",
        },
      ];
    }

    if (presetKey === "prism_equal") {
      return [
        {
          key: "a",
          label: "底面腰长 a",
          labelFormula: `\\text{底面腰长 } \\color{${MATH_COLORS.paramPrimary}}{a}`,
          value: params.a ?? 3,
          min: 1,
          max: 6,
          step: 0.1,
          importance: "core",
        },
        {
          key: "c",
          label: "棱柱高 h",
          labelFormula: `\\text{棱柱高 } \\color{${MATH_COLORS.paramTertiary}}{h}`,
          value: params.c ?? 4,
          min: 1,
          max: 6,
          step: 0.1,
          importance: "core",
        },
      ];
    }

    return circumInSphereMeta.map((meta) => {
      let label = meta.label;
      let labelFormula = meta.labelFormula;

      if (shape === "triangularPrism") {
        if (meta.key === "a") {
          label = "底面直角边 a";
          labelFormula = `\\text{底面直角边 } \\color{${MATH_COLORS.paramPrimary}}{a}`;
        } else if (meta.key === "b") {
          label = "底面直角边 b";
          labelFormula = `\\text{底面直角边 } \\color{${MATH_COLORS.paramSecondary}}{b}`;
        } else if (meta.key === "c") {
          label = "棱柱高 h";
          labelFormula = `\\text{棱柱高 } \\color{${MATH_COLORS.paramTertiary}}{h}`;
        }
      } else if (shape === "cuboid") {
        if (meta.key === "a") {
          label = "长方体长 a";
          labelFormula = `\\text{长方体长 } \\color{${MATH_COLORS.paramPrimary}}{a}`;
        } else if (meta.key === "b") {
          label = "长方体宽 b";
          labelFormula = `\\text{长方体宽 } \\color{${MATH_COLORS.paramSecondary}}{b}`;
        } else if (meta.key === "c") {
          label = "长方体高 h";
          labelFormula = `\\text{长方体高 } \\color{${MATH_COLORS.paramTertiary}}{h}`;
        }
      }

      return {
        key: meta.key,
        label,
        labelFormula,
        value: params[meta.key] ?? meta.defaultValue ?? 0,
        min: meta.min,
        max: meta.max,
        step: meta.step ?? 0.1,
        importance: meta.importance,
      };
    });
  }, [shape, params, presetKey]);

  // 4. 左屏教学提示与题设导引（根据几何体与具体预设深度特化题设与设问）
  const tipConfig = useMemo(() => {
    const isCircum = sphereType === "circum";

    if (shape === "cuboid") {
      if (presetKey === "cube") {
        return {
          variant: "primary" as const,
          badge: isCircum
            ? "高考母题 · 正方体外接球"
            : "高考核心 · 正方体内切球",
          condition: "正方体棱长为 a (a=b=h)，中心为 O。",
          question: isCircum
            ? "正方体体对角线即外接球直径：2R = √3 a，球心与正方体中心重合。"
            : "正方体内切球直径等于棱长：2r = a，球与正方体 6 个正方形面均内切。",
        };
      }
      if (presetKey === "cuboid_std") {
        return {
          variant: "primary" as const,
          badge: "高考经典 · 3-4-12 勾股长方体外接球",
          condition: "长方体长 a=3、宽 b=4、高 h=12。",
          question:
            "由长方体对角线公式得 (2R)² = 3² + 4² + 12² = 169，秒解外接球直径 2R = 13 (R = 6.5)。",
        };
      }
      return {
        variant: "primary" as const,
        badge: isCircum ? "高考母题 · 长方体外接球" : "高考核心 · 正方体内切球",
        condition: "长方体长宽高分别为 a, b, h。",
        question: isCircum
          ? "长方体体对角线即外接球直径：(2R)² = a² + b² + h²，球心为体对角线交点。"
          : "正方体内切球球心为中心，内切球直径等于棱长：2r = a，球与 6 个正方形面相切。",
      };
    }

    if (shape === "regularPyramid") {
      if (presetKey === "octa_half") {
        return {
          variant: "warning" as const,
          badge: "高考经典 · 正八面体半体（侧棱等于底边）",
          condition: "正四棱锥侧棱等于底面边长 a，高 h = (√2/2)a。",
          question: isCircum
            ? "外接球球心落在底面正方形中心，外接球半径 R = (√2/2)a，侧棱即球半径。"
            : "轴截面等腰三角形内切圆半径 r = (3V) / S_表 = a / (√2 + 2√3)。",
        };
      }
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
    }

    if (shape === "triangularPrism") {
      if (presetKey === "prism_equal") {
        return {
          variant: "success" as const,
          badge: "高考母题 · 等腰直角三棱柱切接球",
          condition:
            "直三棱柱高为 h，底面为等腰直角三角形 (a=b, 斜边 c=√2 a)。",
          question: isCircum
            ? "底面外心即斜边中点，底面外接圆半径 r_底 = (√2/2)a，外接球半径 R² = a²/2 + (h/2)²。"
            : "内切球存在时必须满足 2r = h = 2a - √2 a。",
        };
      }
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
    }

    if (shape === "cone") {
      if (presetKey === "cone_equilateral") {
        return {
          variant: "accent" as const,
          badge: "高考模型 · 等边圆锥（轴截面正三角形）",
          condition: "圆锥底面半径为 r，母线长 l = 2r，高 h = √3 r。",
          question: isCircum
            ? "轴截面为正三角形，外接球半径 R = (2/3)h = (2√3/3)r。"
            : "内切球半径 r_内 = (1/3)h = (√3/3)r，外接球与内切球同心且 R = 2r_内。",
        };
      }
      return {
        variant: "accent" as const,
        badge: isCircum ? "高考模型 · 圆锥外接球" : "高考核心 · 圆锥内切球",
        condition: "圆锥底面半径为 r_底=a，高为 h，母线长为 l = √(a² + h²)。",
        question: isCircum
          ? "轴截面为等腰三角形，外接球半径即等腰三角形外接圆半径：R = l² / (2h)。"
          : "轴截面等腰三角形内切圆半径即圆锥内切球半径：r = (a·h) / (a + l)。",
      };
    }

    if (shape === "cylinder") {
      if (presetKey === "cyl_square") {
        return {
          variant: "info" as const,
          badge: "高考模型 · 等高圆柱（轴截面正方形）",
          condition: "圆柱底面半径为 r，高 h = 2r，轴截面为边长 2r 的正方形。",
          question: isCircum
            ? "外接球直径即正方形对角线：2R = 2√2 r，外接球半径 R = √2 r。"
            : "恰好存在内切球，内切球球心与圆柱中心重合，内切球半径 r_内 = r = h/2。",
        };
      }
      return {
        variant: "info" as const,
        badge: isCircum ? "高考模型 · 圆柱外接球" : "高考模型 · 圆柱内切球",
        condition: "圆柱底面半径为 r_底=a，高为 h (当 h=2a 时轴截面为正方形)。",
        question: isCircum
          ? "轴截面为矩形，外接球直径即矩形对角线：(2R)² = (2a)² + h²，R = √(a² + (h/2)²)。"
          : "当且仅当 h=2a（等高圆柱）时存在内切球，内切球半径 r = a = h/2。",
      };
    }

    return {
      variant: "info" as const,
      badge: "高考切接球模型",
      condition: "空间几何体与球体相切或相接。",
      question: "探究对称轴截面降维与球心位置、半径求解通法。",
    };
  }, [shape, sphereType, presetKey]);

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
                  label: "外接球",
                  formula: "R_{\\text{外}}",
                },
                {
                  key: "inscribed",
                  label: "内切球",
                  formula: "r_{\\text{内}}",
                },
              ]}
              value={sphereType}
              onChange={(t) => setSphereType(t as SphereType)}
            />
          </LeftPanelSection>

          {/* Step 2: 几何体选择 */}
          <LeftPanelSection title="几何体模型">
            <SelectGrid
              columns={2}
              items={[
                { key: "cuboid", label: "长方体" },
                { key: "regularPyramid", label: "正四棱锥" },
                { key: "triangularPrism", label: "直三棱柱" },
                { key: "cone", label: "圆锥" },
                {
                  key: "cylinder",
                  label: "圆柱",
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
            {paramConfigs.length > 0 ? (
              <ParamControl
                params={paramConfigs}
                onParamChange={handleParamChange}
                onReset={handleReset}
              />
            ) : (
              <div className="rounded-xl bg-neutral-50/80 border border-neutral-200/80 p-3 text-xs text-neutral-600 flex items-center justify-between shadow-xs">
                <span className="flex items-center gap-1.5">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-500" />
                  题设基准数据已锁定
                </span>
                <button
                  type="button"
                  onClick={() => setPresetKey("free")}
                  className="text-blue-600 font-medium hover:underline text-[11px] cursor-pointer"
                >
                  切为自由探索
                </button>
              </div>
            )}
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
