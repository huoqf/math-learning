import { useState, useMemo } from "react";
import { ThreePanel } from "@/components/Layout/ThreePanel";
import { ThreeDCanvas } from "@/components/Layout/ThreeDCanvas";
import {
  LeftPanel,
  LeftPanelSection,
  ParamControl,
  MathPanel,
  TabSwitcher,
  TipCard,
  SelectGrid,
} from "@/components/UI";
import type { ParamConfig } from "@/components/UI";
import { Legend3D } from "@/components/Math3D/Legend3D";
import { buildMathQuantities } from "@/data/mathQuantities";
import {
  calculatePrismTripartition,
  calculateYangmaBienao,
  calculateConePyramidEquivalence,
} from "@/math3d/pyramidDerivation";
import { PyramidDerivationScene } from "./PyramidDerivationScene";

export function PyramidDerivationAnimation() {
  const [mode, setMode] = useState<
    "tripartition" | "yangma" | "coneEquivalence"
  >("tripartition");
  const [activePartId, setActivePartId] = useState<string | null>(null);

  const [params, setParams] = useState<Record<string, number>>({
    a: 2.6,
    b: 2.2,
    h: 3.2,
    c: 3.2, // 阳马模式下堑堵的高度独立参数，与三棱柱高 h 解耦
    r: 1.8,
    heightCut: 1.6,
    // 默认不拆解：先呈现完整母体与剖分截面（A/B/C/O… 顶点字母可见），
    // 由学生拖动滑块观察子体分离，避免初始即停在字母标注被隐藏的拆解态。
    explode: 0,
  });

  const handleParamChange = (key: string, value: number) => {
    setParams((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // 纯数学层计算结果
  const tripartitionData = useMemo(
    () => calculatePrismTripartition(params.a, params.b, params.h),
    [params.a, params.b, params.h],
  );

  const yangmaData = useMemo(
    () => calculateYangmaBienao(params.a, params.b, params.c ?? 3.2),
    [params.a, params.b, params.c],
  );

  const coneEquivalenceData = useMemo(
    () =>
      calculateConePyramidEquivalence(
        params.r ?? 1.8,
        params.h,
        params.heightCut ?? 1.6,
      ),
    [params.r, params.h, params.heightCut],
  );

  // 右屏统一看板数据 (SSOT)
  const mathPanelData = useMemo(() => {
    return buildMathQuantities("anim-solid-pyramid-derivation", params, {
      mode,
    });
  }, [params, mode]);

  // 控制参数配置
  const paramConfigs: ParamConfig[] = useMemo(() => {
    if (mode === "tripartition") {
      return [
        {
          key: "a",
          label: "底面直角边 a",
          value: params.a,
          min: 1.0,
          max: 4.5,
          step: 0.1,
        },
        {
          key: "b",
          label: "底面直角边 b",
          value: params.b,
          min: 1.0,
          max: 4.5,
          step: 0.1,
        },
        {
          key: "h",
          label: "三棱柱高 h",
          value: params.h,
          min: 1.5,
          max: 5.0,
          step: 0.1,
        },
        {
          key: "explode",
          label: "爆炸拆解进度",
          value: params.explode,
          min: 0,
          max: 1.0,
          step: 0.02,
        },
      ];
    } else if (mode === "yangma") {
      return [
        {
          key: "a",
          label: "堑堵底面直角边 a",
          value: params.a,
          min: 1.0,
          max: 4.5,
          step: 0.1,
        },
        {
          key: "b",
          label: "堑堵底面直角边 b",
          value: params.b,
          min: 1.0,
          max: 4.5,
          step: 0.1,
        },
        {
          key: "c",
          label: "堑堵高 c",
          value: params.c ?? 3.2,
          min: 1.5,
          max: 5.0,
          step: 0.1,
        },
        {
          key: "explode",
          label: "爆炸拆解进度",
          value: params.explode,
          min: 0,
          max: 1.0,
          step: 0.02,
        },
      ];
    }
    return [
      {
        key: "r",
        label: "圆锥底面半径 r",
        value: params.r ?? 1.8,
        min: 1.0,
        max: 3.0,
        step: 0.1,
      },
      {
        key: "h",
        label: "锥体高 h",
        value: params.h,
        min: 1.5,
        max: 5.0,
        step: 0.1,
      },
      {
        key: "heightCut",
        label: "水平截面高度 z",
        value: params.heightCut ?? 1.6,
        min: 0.1,
        max: Math.max(1.0, params.h - 0.1),
        step: 0.05,
      },
    ];
  }, [mode, params]);

  // 子体选择项（遵循门禁：纯中文标题）
  const focusItems = useMemo(() => {
    if (mode === "tripartition") {
      return [
        { key: "all", label: "全部显示" },
        { key: "part-pyramid-1", label: "三棱锥一" },
        { key: "part-pyramid-2", label: "三棱锥二" },
        { key: "part-pyramid-3", label: "三棱锥三" },
      ];
    } else if (mode === "yangma") {
      return [
        { key: "all", label: "全部显示" },
        { key: "part-yangma", label: "四棱锥阳马" },
        { key: "part-bienao", label: "三棱锥鳖臑" },
      ];
    }
    return [
      { key: "all", label: "全部显示" },
      { key: "part-cone", label: "圆锥主体" },
      { key: "part-pyramid", label: "伴随棱锥" },
      { key: "part-cut", label: "等高截面" },
    ];
  }, [mode]);

  // 题设导引 TipCard 数据
  const tipData = useMemo(() => {
    if (mode === "tripartition") {
      return {
        badge: "欧几里得分割 · 三等分三棱柱",
        background:
          "人教A版必修第二册第8章立体几何探究：求空间几何体体积的核心在于“割补法”与等底同高转化。欧几里得在《几何原本》中通过作两个截面对角剖分，将任意三棱柱严格剖分为三个体积相等的三棱锥（①与②同底 $\\triangle A_1BC$ 等高，②与③同底 $\\triangle A_1BC_1$ 等高）。",
        condition: `直三棱柱 $ABC-A_1B_1C_1$ 底面直角边为 $a = ${params.a.toFixed(1)}, b = ${params.b.toFixed(1)}$，高为 $h = ${params.h.toFixed(1)}$。作剖分截面 $A_1BC$ 与 $A_1BC_1$。`,
        question:
          "求证剖分得到的三个三棱锥体积两两严格相等，并由此导出一般锥体体积公式 $V = \\frac{1}{3} S_{\\text{底}} h$。",
      };
    } else if (mode === "yangma") {
      return {
        badge: "《九章算术》刘徽割体术 · 阳马与鳖臑",
        background:
          "魏晋数学家刘徽在《九章算术注》中首创割体无限细分逼近思想。他将直角三棱柱（堑堵）剖分为底面为矩形且有一侧棱垂直底面的四棱锥（阳马）和四个面皆为直角三角形的三棱锥（鳖臑），奠定了锥体体积的基础公理。",
        condition: `直角三棱柱（堑堵）尺寸为 $a = ${params.a.toFixed(1)}, b = ${params.b.toFixed(1)}, c = ${(params.c ?? 3.2).toFixed(1)}$。沿对角截面 $A_1OB$ 剖分为一个阳马和一个鳖臑。`,
        question:
          "探究并证明阳马与鳖臑的体积之比恒为 $2:1$（“阳马居二，鳖臑居一”），并证明鳖臑的四个面均为直角三角形。",
      };
    }
    return {
      badge: "祖暅原理 · 圆锥与棱锥等积",
      background:
        "人教A版必修第二册第8章立体几何探究：利用《九章算术注》刘徽与祖暅提出的“祖暅原理”（幂势既同，则积不容异），不仅能推导球体体积，还能将多面体棱锥的体积公式无缝平移至旋转体圆锥，实现从多面体到旋转体的严密过渡。",
      condition: `圆锥底面半径为 $r = ${(params.r ?? 1.8).toFixed(1)}$，同高伴随正四棱锥底面正方形边长为 $a = \\sqrt{\\pi} r \\approx ${((params.r ?? 1.8) * Math.sqrt(Math.PI)).toFixed(2)}$，二者高均为 $h = ${params.h.toFixed(1)}$。水平截面高度为 $z = ${(params.heightCut ?? 1.6).toFixed(1)}$。`,
      question:
        "求证在任意相同高度 $z$ 处截面圆面积与正方形面积恒等（$S_1(z) \\equiv S_2(z)$），并借助祖暅原理证明圆锥体积公式 $V = \\frac{1}{3} \\pi r^2 h$。",
    };
  }, [mode, params]);

  // 3D 场景图例
  const legendItems = useMemo<
    Array<{
      label: string;
      colorKey:
        "paramPrimary" | "paramSecondary" | "paramTertiary" | "highlight";
      swatch?: "area";
    }>
  >(() => {
    if (mode === "tripartition") {
      return [
        { label: "三棱锥① A₁-ABC", colorKey: "paramPrimary", swatch: "area" },
        {
          label: "三棱锥② A₁-BCC₁",
          colorKey: "paramSecondary",
          swatch: "area",
        },
        {
          label: "三棱锥③ C₁-A₁B₁B",
          colorKey: "paramTertiary",
          swatch: "area",
        },
      ];
    } else if (mode === "yangma") {
      return [
        {
          label: "阳马 A₁-OBB₁O₁ (V=1/3 abc)",
          colorKey: "paramPrimary",
          swatch: "area",
        },
        {
          label: "鳖臑 A₁-OAB (V=1/6 abc)",
          colorKey: "paramSecondary",
          swatch: "area",
        },
      ];
    }
    return [
      {
        label: "圆锥体 (底半径 r)",
        colorKey: "paramPrimary",
        swatch: "area",
      },
      {
        label: "伴随四棱锥 (底边 √π r)",
        colorKey: "paramSecondary",
        swatch: "area",
      },
      {
        label: "等高平行截面 (S₁ ≡ S₂)",
        colorKey: "highlight",
        swatch: "area",
      },
    ];
  }, [mode]);

  return (
    <ThreePanel
      left={
        <LeftPanel>
          <LeftPanelSection title="推导范式选择">
            <TabSwitcher
              tabs={[
                { key: "tripartition", label: "三棱柱三分法" },
                { key: "yangma", label: "刘徽阳马与鳖臑" },
                { key: "coneEquivalence", label: "祖暅圆锥等积" },
              ]}
              value={mode}
              onChange={(tab) => {
                setMode(tab as "tripartition" | "yangma" | "coneEquivalence");
                setActivePartId(null);
              }}
            />
          </LeftPanelSection>

          <LeftPanelSection title="几何参数控制">
            <ParamControl
              params={paramConfigs}
              onParamChange={handleParamChange}
            />
          </LeftPanelSection>

          <LeftPanelSection title="子体聚焦">
            <SelectGrid
              items={focusItems}
              value={activePartId ?? "all"}
              onChange={(val) =>
                setActivePartId(val === "all" ? null : String(val))
              }
            />
          </LeftPanelSection>

          <LeftPanelSection title="探究导引与高考考向">
            <TipCard
              badge={tipData.badge}
              background={tipData.background}
              condition={tipData.condition}
              question={tipData.question}
            />
          </LeftPanelSection>
        </LeftPanel>
      }
      center={
        <ThreeDCanvas
          cameraPosition={[6.5, 5.5, 7.5]}
          fov={42}
          legend={<Legend3D items={legendItems} />}
        >
          <PyramidDerivationScene
            mode={mode}
            tripartitionData={tripartitionData}
            yangmaData={yangmaData}
            coneEquivalenceData={coneEquivalenceData}
            explode={params.explode}
            activePartId={activePartId}
          />
        </ThreeDCanvas>
      }
      right={<MathPanel {...mathPanelData} title="锥体体积推导与割体术看板" />}
    />
  );
}

export default PyramidDerivationAnimation;
