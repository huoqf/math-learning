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
  TipCard,
  KatexFormula,
} from "@/components/UI";
import type { ParamConfig } from "@/components/UI";
import {
  Point3D,
  PointLabel3D,
  FormulaLabel3D,
  Segment3D,
  Legend3D,
  CameraRig,
} from "@/components/Math3D";
import {
  Cuboid,
  RegularPyramid,
  TriangularPrism,
  Cone,
  Cylinder,
  SphereBySphereType,
} from "@/components/Math3D/solids";
import { use3DViewport } from "@/hooks/use3DViewport";
import type { CameraPreset } from "@/hooks/use3DViewport";
import { buildMathQuantities } from "@/data/mathQuantities";
import {
  cuboidCircumRadius,
  regularPyramidCircumRadius,
  coneCircumRadius,
} from "@/math3d/solidGeometry";
import type { Vec3 } from "@/math3d/vector3";

type SphereType = "circum" | "inscribed";
type ShapeType =
  "cuboid" | "regularPyramid" | "triangularPrism" | "cone" | "cylinder";

export default function CircumInSphereAnimation() {
  const [sphereType, setSphereType] = useState<SphereType>("circum");
  const [shape, setShape] = useState<ShapeType>("cuboid");
  const [params, setParams] = useState<Record<string, number>>({
    a: 3,
    b: 2,
    c: 2,
  });

  const { preset, cameraPosition, setCameraPreset, controlsRef } =
    use3DViewport("iso");

  const { a, b, c } = params;

  // 球半径与球心坐标精准解算
  const { radius, center } = useMemo<{ radius: number; center: Vec3 }>(() => {
    if (sphereType === "circum") {
      // ── 外接球模式 ──
      if (shape === "cuboid") {
        const r = cuboidCircumRadius(a, b, c);
        return { radius: r, center: { x: a / 2, y: b / 2, z: c / 2 } };
      } else if (shape === "regularPyramid") {
        const rBase = a / Math.sqrt(2);
        const r = regularPyramidCircumRadius(rBase, c);
        return { radius: r, center: { x: 0, y: 0, z: c - r } };
      } else if (shape === "triangularPrism") {
        const rBase = Math.sqrt(a * a + b * b) / 2;
        const r = Math.sqrt(rBase * rBase + (c / 2) ** 2);
        return { radius: r, center: { x: a / 2, y: b / 2, z: c / 2 } };
      } else if (shape === "cone") {
        const r = coneCircumRadius(a, c);
        return { radius: r, center: { x: 0, y: 0, z: c - r } };
      } else {
        // cylinder
        const r = Math.sqrt(a * a + (c / 2) ** 2);
        return { radius: r, center: { x: 0, y: 0, z: c / 2 } };
      }
    } else {
      // ── 内切球模式 ──
      if (shape === "cuboid") {
        const r = Math.min(a, b, c) / 2;
        return { radius: r, center: { x: a / 2, y: b / 2, z: c / 2 } };
      } else if (shape === "regularPyramid") {
        const hs = Math.sqrt(c * c + (a / 2) ** 2);
        const vSolid = (1 / 3) * a * a * c;
        const sTotal = a * a + 2 * a * hs;
        const r = (3 * vSolid) / sTotal;
        return { radius: r, center: { x: 0, y: 0, z: r } };
      } else if (shape === "triangularPrism") {
        const rBaseIn = (a + b - Math.sqrt(a * a + b * b)) / 2;
        const r = Math.min(rBaseIn, c / 2);
        return {
          radius: r,
          center: { x: rBaseIn, y: rBaseIn, z: c / 2 },
        };
      } else if (shape === "cone") {
        const l = Math.sqrt(a * a + c * c);
        const r = (a * c) / (a + l);
        return { radius: r, center: { x: 0, y: 0, z: r } };
      } else {
        // cylinder
        const r = Math.min(a, c / 2);
        return { radius: r, center: { x: 0, y: 0, z: c / 2 } };
      }
    }
  }, [sphereType, shape, a, b, c]);

  // 组装右屏看板数据
  const mathData = useMemo(
    () =>
      buildMathQuantities("anim-solid-ball", params, {
        sphereType,
        shape,
      }),
    [params, sphereType, shape],
  );

  const handleParamChange = (key: string, value: number) => {
    setParams((prev) => ({ ...prev, [key]: value }));
  };

  const handleReset = () => {
    setParams({ a: 3, b: 2, c: 2 });
  };

  // 左屏参数配置（按几何体形状精准过滤）
  const paramConfigs = useMemo<ParamConfig[]>(() => {
    if (shape === "cone" || shape === "cylinder") {
      return [
        {
          key: "a",
          label: "底面半径 r",
          labelFormula: "r",
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
          labelFormula: "h",
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
          labelFormula: "a",
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
          labelFormula: "h",
          value: params.c ?? 2,
          min: 1,
          max: 6,
          step: 0.1,
          description: "正棱锥的高",
          importance: "core",
        },
      ];
    }

    return [
      {
        key: "a",
        label: shape === "triangularPrism" ? "直角边 a" : "长 a",
        labelFormula: "a",
        value: params.a ?? 3,
        min: 1,
        max: 6,
        step: 0.1,
        description: "底面尺寸 a",
        importance: "core",
      },
      {
        key: "b",
        label: shape === "triangularPrism" ? "直角边 b" : "宽 b",
        labelFormula: "b",
        value: params.b ?? 2,
        min: 1,
        max: 6,
        step: 0.1,
        description: "底面尺寸 b",
        importance: "core",
      },
      {
        key: "c",
        label: "高 h",
        labelFormula: "h",
        value: params.c ?? 2,
        min: 1,
        max: 6,
        step: 0.1,
        description: "几何体高度",
        importance: "core",
      },
    ];
  }, [shape, params]);

  // 教学提示配置
  const tipConfig = useMemo(() => {
    if (sphereType === "circum") {
      if (shape === "cuboid") {
        return {
          variant: "success" as const,
          formula: "2R = \\sqrt{a^2+b^2+c^2}",
          text: "长方体外接球：体对角线即为外接球直径，球心为长方体中心。",
        };
      }
      if (shape === "regularPyramid" || shape === "cone") {
        return {
          variant: "primary" as const,
          formula: "R = \\frac{r_{\\text{底}}^2 + h^2}{2h}",
          text: "正棱锥与圆锥外接球：球心位于高线上，由勾股定理 (h-R)² + r² = R² 求解。",
        };
      }
      return {
        variant: "warning" as const,
        formula: "R^2 = r_{\\text{底}}^2 + \\left(\\frac{h}{2}\\right)^2",
        text: "直棱柱与圆柱外接球：套柱勾股定理，球心位于上下底面中心连线的中点。",
      };
    } else {
      return {
        variant: "danger" as const,
        formula: "r_{\\text{in}} = \\frac{3V}{S_{\\text{表}}}",
        text: "多面体与多棱锥内切球通法：等体积法剖分，体积等于各面面积与内切球半径乘积之和的 1/3。",
      };
    }
  }, [sphereType, shape]);

  return (
    <ThreePanel
      left={
        <LeftPanel>
          {/* Step 1: 球切接类型 */}
          <LeftPanelSection title="球切接类型">
            <TabSwitcher
              tabs={[
                { key: "circum", label: "外接球 (Circum)" },
                { key: "inscribed", label: "内切球 (Inscribed)" },
              ]}
              value={sphereType}
              onChange={(t) => setSphereType(t as SphereType)}
            />
          </LeftPanelSection>

          {/* Step 2: 几何体模型选择 (2+1 布局防截断) */}
          <LeftPanelSection title="几何体模型选择">
            <SelectGrid
              items={[
                { key: "cuboid", label: "长方体", description: "对角线补形" },
                {
                  key: "regularPyramid",
                  label: "正四棱锥",
                  description: "高线切接",
                },
                {
                  key: "triangularPrism",
                  label: "直三棱柱",
                  description: "套柱勾股",
                },
                { key: "cone", label: "圆锥", description: "轴截面切接" },
                {
                  key: "cylinder",
                  label: "圆柱",
                  description: "旋转对称",
                  fullWidth: true,
                },
              ]}
              value={shape}
              onChange={(k) => setShape(k as ShapeType)}
              columns={2}
            />
          </LeftPanelSection>

          {/* Step 3: 参数调节 */}
          <LeftPanelSection title="几何参数调节" subtitle="调节底面尺寸与高度">
            <ParamControl
              params={paramConfigs}
              onParamChange={handleParamChange}
              onReset={handleReset}
            />
          </LeftPanelSection>

          {/* Step 4: 教学提示 */}
          <LeftPanelSection title="教学提示与核心公式" compact>
            <TipCard variant={tipConfig.variant}>
              <div className="font-semibold text-xs mb-1">
                <KatexFormula mode="inline" formula={tipConfig.formula} />
              </div>
              <p className="text-xs text-neutral-600 leading-relaxed">
                {tipConfig.text}
              </p>
            </TipCard>
          </LeftPanelSection>

          {/* Step 5: 3D 视角选择 */}
          <LeftPanelSection title="3D 视角选择">
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
                { colorKey: "highlight", swatch: "point", label: "O：球心" },
              ]}
            />
          }
        >
          <CameraRig ref={controlsRef} />
          {/* 纯几何范式：严禁笛卡尔直角坐标系与地面网格 */}

          {/* 渲染几何体实体 */}
          {shape === "cuboid" && (
            <Cuboid a={a} b={b} c={c} colorKey="primary" opacity={0.2} />
          )}
          {shape === "regularPyramid" && (
            <RegularPyramid
              sides={4}
              baseRadius={a / Math.sqrt(2)}
              height={c}
              colorKey="primary"
            />
          )}
          {shape === "cone" && (
            <Cone radius={a} height={c} colorKey="primary" />
          )}
          {shape === "triangularPrism" && (
            <TriangularPrism legA={a} legB={b} height={c} colorKey="primary" />
          )}
          {shape === "cylinder" && (
            <Cylinder radius={a} height={c} colorKey="primary" />
          )}

          {/* 渲染球体 */}
          <SphereBySphereType
            sphereType={sphereType}
            center={center}
            radius={radius}
          />

          {/* 渲染球心点 O */}
          <Point3D position={center} colorKey="highlight" />
          <PointLabel3D position={center} text="O" />

          {/* 绘制球半径/辅连线 (纯几何无箭头线段) */}
          {sphereType === "circum" ? (
            <Segment3D
              from={center}
              to={
                shape === "regularPyramid" || shape === "cone"
                  ? { x: 0, y: 0, z: c }
                  : shape === "cylinder"
                    ? { x: a, y: 0, z: c }
                    : shape === "triangularPrism"
                      ? { x: 0, y: 0, z: c }
                      : { x: a, y: b, z: c }
              }
              colorKey="highlight"
              lineWidth={2.5}
            />
          ) : (
            <Segment3D
              from={center}
              to={{ x: center.x, y: center.y, z: 0 }}
              colorKey="highlight"
              lineWidth={2.5}
            />
          )}

          <FormulaLabel3D
            position={{ x: center.x + 0.3, y: center.y, z: center.z + 0.3 }}
            tex={`${sphereType === "circum" ? "R" : "r_{\\text{in}}"}=${radius.toFixed(2)}`}
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
          }${sphereType === "circum" ? "外接球" : "内切球"}高考指标`}
        />
      }
    />
  );
}
