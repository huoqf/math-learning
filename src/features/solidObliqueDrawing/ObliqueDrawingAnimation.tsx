import { useState, useMemo } from "react";
import { ThreePanel, AnimationSvgCanvas } from "@/components/Layout";
import {
  LeftPanel,
  LeftPanelSection,
  ParamControl,
  MathPanel,
  TabSwitcher,
  SelectGrid,
  TipCard,
  type ParamConfig,
  type SelectGridItem,
} from "@/components/UI";
import { useAnimationViewport } from "@/hooks";
import { CANVAS_PRESETS } from "@/theme";
import { buildMathQuantities } from "@/data/mathQuantities";
import { ObliqueDrawingScene } from "./components/ObliqueDrawingScene";
import type { PolygonPresetKey } from "@/math/obliqueDrawing";

type ViewMode = "polygon" | "solidPrism";

export default function ObliqueDrawingAnimation() {
  const [viewMode, setViewMode] = useState<ViewMode>("polygon");
  const [polygonType, setPolygonType] = useState<PolygonPresetKey>("square");

  const [params, setParams] = useState<Record<string, number>>({
    a: 4.0,
    b: 4.0,
    h: 4.0,
    alphaDeg: 45,
    ratioY: 0.5,
    prismH: 3.5,
  });

  const { containerRef, canvasSize, vp } = useAnimationViewport({
    preset: CANVAS_PRESETS.full,
  });

  // 参数配置
  const paramConfigs: ParamConfig[] = useMemo(() => {
    if (viewMode === "solidPrism") {
      return [
        {
          key: "a",
          label: "底面横向尺寸 a",
          value: params.a ?? 4.0,
          min: 2,
          max: 6,
          step: 0.5,
        },
        {
          key: "b",
          label: "底面纵向尺寸 b",
          value: params.b ?? 4.0,
          min: 2,
          max: 6,
          step: 0.5,
        },
        {
          key: "prismH",
          label: "几何体直观高 h",
          value: params.prismH ?? 3.5,
          min: 2,
          max: 6,
          step: 0.5,
        },
      ];
    }
    return [
      {
        key: "a",
        label: "横向尺寸 a",
        value: params.a ?? 4.0,
        min: 2,
        max: 6,
        step: 0.5,
      },
      {
        key: "b",
        label: "纵向尺寸 b",
        value: params.b ?? 4.0,
        min: 2,
        max: 6,
        step: 0.5,
      },
      {
        key: "alphaDeg",
        label: "斜轴夹角 α (°)",
        value: params.alphaDeg ?? 45,
        min: 30,
        max: 60,
        step: 5,
      },
      {
        key: "ratioY",
        label: "纵轴折半比率 k",
        value: params.ratioY ?? 0.5,
        min: 0.2,
        max: 1.0,
        step: 0.05,
      },
    ];
  }, [viewMode, params]);

  // 依赖中保留二级选项变量：TipCard 教学提示须随二级选项切换同步特化（项目纪律 left/tipcard-secondary-sync）
  const tipConfig = useMemo(() => {
    if (viewMode === "solidPrism") {
      return {
        background:
          "必修第二册 8.2 空间几何体直观图构建：在水平平面内先用斜二测画出底面多边形，再过各顶点向上作平行于 $z'$ 轴且等于原高的平行线段，连接上底面各点形成封闭多面体。",
        condition: `底面长宽高参数分别为 $a=${params.a ?? 4}$, $b=${params.b ?? 4}$, 直观高 $h=${params.prismH ?? 3.5}$。`,
        question:
          "探究为何空间直观图中平行于 $z$ 轴的线段长度保持原长不变？如何准确辨识看不见的内侧被遮挡虚线棱？",
      };
    }
    const shapeNames: Record<PolygonPresetKey, string> = {
      square: "正方形",
      rectangle: "矩形",
      rightTriangle: "直角三角形",
      isoscelesTrapezoid: "等腰梯形",
      regularHexagon: "正六边形",
    };
    return {
      background:
        "必修第二册 8.2 斜二测画法：用于在二维平面纸面上直观表达空间或水平放置的几何多边形。核心口诀为「横不变、纵减半、夹角四十五度」。",
      condition: `当前探究平面图形为「${shapeNames[polygonType]}」，设定斜轴夹角 $\\alpha=${params.alphaDeg ?? 45}^\\circ$，纵轴折半比例 $k=${params.ratioY ?? 0.5}$。`,
      question:
        "探究直观图面积 $S_{\\text{直观}}$ 与原图形面积 $S_{\\text{原}}$ 为何严格满足 $\\frac{\\sqrt{2}}{4}$ 恒等关系？高考中若已知直观图面积，如何反求原图形的真实面积？",
    };
  }, [viewMode, polygonType, params]);

  // 右屏数据组装
  const mathData = useMemo(() => {
    return buildMathQuantities("anim-solid-oblique-drawing", params, {
      mode: viewMode,
      polygonType,
    });
  }, [viewMode, polygonType, params]);

  const polygonItems: SelectGridItem[] = useMemo(
    () => [
      { key: "square", label: "正方形" },
      { key: "rectangle", label: "矩形" },
      { key: "rightTriangle", label: "直角三角形" },
      { key: "isoscelesTrapezoid", label: "等腰梯形" },
      { key: "regularHexagon", label: "正六边形" },
    ],
    [],
  );

  return (
    <ThreePanel
      left={
        <LeftPanel>
          <LeftPanelSection title="教学模式">
            <TabSwitcher
              tabs={[
                { key: "polygon", label: "平面多边形" },
                { key: "solidPrism", label: "空间几何体" },
              ]}
              value={viewMode}
              onChange={(key) => setViewMode(key as ViewMode)}
            />
          </LeftPanelSection>

          {viewMode === "polygon" && (
            <LeftPanelSection title="平面多边形类型">
              <SelectGrid
                items={polygonItems}
                value={polygonType}
                onChange={(val) => setPolygonType(val as PolygonPresetKey)}
              />
            </LeftPanelSection>
          )}

          <LeftPanelSection title="几何尺寸与投影参数">
            <ParamControl
              params={paramConfigs}
              onParamChange={(k: string, v: number) =>
                setParams((prev) => ({ ...prev, [k]: v }))
              }
            />
          </LeftPanelSection>

          <TipCard {...tipConfig} />
        </LeftPanel>
      }
      center={
        <div className="w-full h-full relative flex flex-col bg-white">
          <AnimationSvgCanvas
            containerRef={containerRef}
            transform={vp.transform}
          >
            <ObliqueDrawingScene
              mode={viewMode}
              polygonType={polygonType}
              params={params}
              canvasSize={canvasSize}
            />
          </AnimationSvgCanvas>
        </div>
      }
      right={<MathPanel {...mathData} title="斜二测画法与面积推导看板" />}
    />
  );
}
