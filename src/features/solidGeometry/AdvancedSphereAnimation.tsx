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
} from "@/components/UI";
import type { ParamConfig } from "@/components/UI";
import { Legend3D, CameraRig } from "@/components/Math3D";
import type { LegendItem } from "@/components/Math3D";
import {
  AdvancedSphereScene,
  type AdvancedSphereModelType,
} from "@/components/Math3D/solids";
import { use3DViewport } from "@/hooks/use3DViewport";
import type { CameraPreset } from "@/hooks/use3DViewport";
import { buildMathQuantities } from "@/data/mathQuantities";
import { advancedSphereMeta } from "@/data/registries/solidGeometry";

export default function AdvancedSphereAnimation() {
  const [modelType, setModelType] =
    useState<AdvancedSphereModelType>("perpPlanes");
  const [presetKey, setPresetKey] = useState<string>("free");

  const [showSphere, setShowSphere] = useState<boolean>(true);
  const [showAuxLines, setShowAuxLines] = useState<boolean>(true);
  const [showSection, setShowSection] = useState<boolean>(true);
  const [showTangentPoints, setShowTangentPoints] = useState<boolean>(true);

  const [params, setParams] = useState<Record<string, number>>({
    r1: 3,
    r2: 3.5,
    c: 3,
    a: 4,
    h: 4.24,
    R: 3,
    shapeType: 0,
  });

  const { preset, cameraPosition, setCameraPreset, controlsRef } =
    use3DViewport("iso");

  // 1. 右屏看板数据
  const mathData = useMemo(
    () =>
      buildMathQuantities("anim-solid-advanced-sphere", params, {
        modelType,
      }),
    [params, modelType],
  );

  // 2. 2×2 黄金预设定义（严格遵循微描述 <= 4 字）
  const presetsByModel: Record<
    AdvancedSphereModelType,
    {
      key: string;
      label: string;
      formula?: string;
      description: string;
      values: Record<string, number>;
    }[]
  > = {
    perpPlanes: [
      {
        key: "free",
        label: "自由探究",
        formula: "r_1, r_2, c",
        description: "全参开放",
        values: { r1: 3, r2: 3.5, c: 3 },
      },
      {
        key: "perp_equal",
        label: "对称直角",
        formula: "r_1 = r_2",
        description: "两面对称",
        values: { r1: 3, r2: 3, c: 3 },
      },
      {
        key: "perp_standard",
        label: "经典高考",
        formula: "3-4-5",
        description: "勾股母题",
        values: { r1: 2.5, r2: 3, c: 3 },
      },
      {
        key: "perp_critical",
        label: "交线极大",
        formula: "c \\to 2r_{\\min}",
        description: "临界闭合",
        values: { r1: 3, r2: 4, c: 5.5 },
      },
    ],
    concentric: [
      {
        key: "free",
        label: "自由探究",
        formula: "a \\in [1, 6]",
        description: "全参开放",
        values: { a: 4 },
      },
      {
        key: "tetra_std",
        label: "标准四面体",
        formula: "a = 4",
        description: "1:√3:3",
        values: { a: 4 },
      },
      {
        key: "tetra_small",
        label: "紧凑构型",
        formula: "a = 2.5",
        description: "小四面体",
        values: { a: 2.5 },
      },
      {
        key: "tetra_large",
        label: "放大透视",
        formula: "a = 5.5",
        description: "大尺寸球",
        values: { a: 5.5 },
      },
    ],
    truncatedCone: [
      {
        key: "free",
        label: "自由探究",
        formula: "r_1, r_2, h",
        description: "全参开放",
        values: { r1: 1.5, r2: 3, h: 4.24 },
      },
      {
        key: "in_sphere",
        label: "内切临界",
        formula: "h = 2\\sqrt{r_1 r_2}",
        description: "内切球现",
        values: { r1: 1, r2: 4, h: 4.0 },
      },
      {
        key: "cylinder_limit",
        label: "柱体退化",
        formula: "r_1 \\approx r_2",
        description: "底面等大",
        values: { r1: 2.8, r2: 3.0, h: 4.0 },
      },
      {
        key: "cone_limit",
        label: "锥体退化",
        formula: "r_1 \\to 0.3",
        description: "上底成尖",
        values: { r1: 0.3, r2: 3.2, h: 4.5 },
      },
    ],
    extrema: [
      {
        key: "free",
        label: "自由探究",
        formula: "h \\in (0, 2R)",
        description: "全参开放",
        values: { R: 3, shapeType: 0, h: 3.46 },
      },
      {
        key: "cyl_opt",
        label: "圆柱极值",
        formula: "h = \\frac{2\\sqrt{3}}{3}R",
        description: "最大57.7%",
        values: { R: 3, shapeType: 0, h: 3.46 },
      },
      {
        key: "cone_opt",
        label: "圆锥极值",
        formula: "h = \\frac{4}{3}R",
        description: "最大29.6%",
        values: { R: 3, shapeType: 1, h: 4.0 },
      },
      {
        key: "cyl_std",
        label: "等高圆柱",
        formula: "h = R",
        description: "对称对照",
        values: { R: 3, shapeType: 0, h: 3.0 },
      },
    ],
  };

  // 3. 模式切换处理（自动重置为该模式的基准参数）
  const handleModelTypeChange = (nextModel: AdvancedSphereModelType) => {
    setModelType(nextModel);
    setPresetKey("free");
    const freePreset = presetsByModel[nextModel]?.find((p) => p.key === "free");
    if (freePreset) {
      setParams((prev) => ({ ...prev, ...freePreset.values }));
    }
  };

  const handlePresetChange = (key: string) => {
    setPresetKey(key);
    const target = presetsByModel[modelType]?.find((p) => p.key === key);
    if (target) {
      setParams((prev) => ({ ...prev, ...target.values }));
    }
  };

  const handleParamChange = (key: string, value: number) => {
    setParams((prev) => {
      const next = { ...prev, [key]: value };
      if (presetKey === "perp_equal" && key === "r1") {
        next.r2 = value;
      }
      return next;
    });
    setPresetKey("free");
  };

  const handleReset = () => {
    setPresetKey("free");
    const freePreset = presetsByModel[modelType]?.find((p) => p.key === "free");
    if (freePreset) {
      setParams((prev) => ({ ...prev, ...freePreset.values }));
    }
  };

  // 4. 按当前模式与预设动态裁剪展示参数
  const paramConfigs = useMemo<ParamConfig[]>(() => {
    const keysByModel: Record<AdvancedSphereModelType, string[]> = {
      perpPlanes: presetKey === "perp_equal" ? ["r1", "c"] : ["r1", "r2", "c"],
      concentric: ["a"],
      truncatedCone:
        presetKey === "in_sphere" ? ["r1", "r2"] : ["r1", "r2", "h"],
      extrema: ["R", "h"],
    };

    const activeKeys = keysByModel[modelType] ?? ["r1", "r2", "c"];

    return advancedSphereMeta
      .filter((meta) => activeKeys.includes(meta.key))
      .map((meta) => ({
        key: meta.key,
        label: meta.label,
        labelFormula: meta.labelFormula,
        value: params[meta.key] ?? meta.defaultValue ?? 0,
        min: meta.min,
        max: meta.max,
        step: meta.step ?? 0.1,
        description: meta.description,
        descriptionFormula: meta.descriptionFormula,
        marks: meta.marks,
      }));
  }, [params, modelType, presetKey]);

  // 图例
  const legendItems: LegendItem[] = useMemo(() => {
    if (modelType === "perpPlanes") {
      return [
        { label: "底面外接半径 r₁", colorKey: "paramPrimary" },
        { label: "侧面外接半径 r₂", colorKey: "paramSecondary" },
        { label: "双外心垂线空间矩形", colorKey: "paramTertiary" },
        { label: "外接球心 O 与外接球", colorKey: "sphereShell" },
      ];
    } else if (modelType === "concentric") {
      return [
        { label: "正四面体棱骨架", colorKey: "paramPrimary" },
        { label: "外接球 (R = √6/4 a)", colorKey: "sphereShell" },
        { label: "棱切球 (r_棱 = √2/4 a)", colorKey: "paramTertiary" },
        { label: "内切球 (r = √6/12 a)", colorKey: "inSphereShell" },
      ];
    } else if (modelType === "truncatedCone") {
      return [
        { label: "上/下底半径 r₁, r₂", colorKey: "paramPrimary" },
        { label: "轴截面母线 l", colorKey: "paramSecondary" },
        { label: "外接球心 O", colorKey: "sphereShell" },
        { label: "内切球心 I (临界时)", colorKey: "inSphereShell" },
      ];
    } else {
      return [
        { label: "外接球 (固定半径 R)", colorKey: "sphereShell" },
        { label: "内接旋转体 (圆柱/圆锥)", colorKey: "paramSecondary" },
        { label: "轴高与极值高度 h", colorKey: "paramTertiary" },
      ];
    }
  }, [modelType]);

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
                  key: "perpPlanes",
                  label: "面面垂直",
                  formula: "R^2=r_1^2+r_2^2-(c/2)^2",
                  description: "双外心交",
                },
                {
                  key: "concentric",
                  label: "三球同心",
                  formula: "1 : \\sqrt{3} : 3",
                  description: "正四面体",
                },
                {
                  key: "truncatedCone",
                  label: "圆台切接",
                  formula: "l = r_1+r_2",
                  description: "轴截面降",
                },
                {
                  key: "extrema",
                  label: "体积极值",
                  formula: "V_{\\max}",
                  description: "导数最值",
                },
              ]}
              value={modelType}
              onChange={(val) =>
                handleModelTypeChange(val as AdvancedSphereModelType)
              }
            />
          </LeftPanelSection>

          {/* Step 2: 典型模型预设 (2×2 黄金网格) */}
          <LeftPanelSection title="典型模型预设">
            <SelectGrid
              columns={2}
              items={presetsByModel[modelType]}
              value={presetKey}
              onChange={handlePresetChange}
            />
          </LeftPanelSection>

          {/* Step 3: 参数调节 */}
          <LeftPanelSection title="参数调节">
            <ParamControl
              params={paramConfigs}
              onParamChange={handleParamChange}
              onReset={handleReset}
            />
          </LeftPanelSection>

          {/* Step 4: 图层与标注显示控制 */}
          <LeftPanelSection title="图层与标注显示控制" compact>
            <div className="flex flex-col gap-2.5">
              <Toggle
                checked={showSphere}
                onChange={setShowSphere}
                label="显示外接球与赤道虚实轮廓"
              />
              {modelType === "perpPlanes" && (
                <Toggle
                  checked={showAuxLines}
                  onChange={setShowAuxLines}
                  label="显示双外心垂线与空间矩形"
                />
              )}
              {modelType === "concentric" && (
                <Toggle
                  checked={showTangentPoints}
                  onChange={setShowTangentPoints}
                  label="显示棱切点与面切点"
                />
              )}
              {modelType === "truncatedCone" && (
                <>
                  <Toggle
                    checked={showSection}
                    onChange={setShowSection}
                    label="显示轴截面等腰梯形"
                  />
                  <Toggle
                    checked={showTangentPoints}
                    onChange={setShowTangentPoints}
                    label="显示内切球与球心 I"
                  />
                </>
              )}
            </div>
          </LeftPanelSection>

          {/* Step 5: 3D 空间视角预设 */}
          <LeftPanelSection title="3D 空间视角预设">
            <TabSwitcher
              tabs={[
                { key: "iso", label: "轴测直观" },
                { key: "top", label: "俯视底面" },
                { key: "front", label: "主视正投" },
                { key: "side", label: "左视侧面" },
              ]}
              value={preset}
              onChange={(val) => setCameraPreset(val as CameraPreset)}
            />
          </LeftPanelSection>
        </LeftPanel>
      }
      center={
        <ThreeDCanvas
          cameraPosition={cameraPosition}
          legend={<Legend3D items={legendItems} />}
        >
          <CameraRig ref={controlsRef} />
          <AdvancedSphereScene
            modelType={modelType}
            params={params}
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
          title="进阶切接球数学看板"
        />
      }
    />
  );
}
