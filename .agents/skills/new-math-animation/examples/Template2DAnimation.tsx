import React, { useState, useMemo, useCallback } from 'react';
import { ThreePanel, AnimationSvgCanvas } from '@/components/Layout';
import {
  LeftPanel,
  LeftPanelSection,
  ParamControl,
  TabSwitcher,
  SelectGrid,
  TipCard,
  MathPanel,
} from '@/components/UI';
import { SceneLegend, type LegendItem } from '@/components/Math';
import { useAnimationViewport, useSceneScale } from '@/hooks';
import { CANVAS_PRESETS } from '@/types';
import { MATH_COLORS } from '@/theme';
import type { ScenarioSpec } from '@/types/scenario';
import { useScenario } from '@/hooks/useScenario';
import { Template2DScene } from './Template2DScene';

// 1. 参数接口定义 (严格避免无意义的缩写)
interface TemplateParams {
  paramA: number; // 核心自变量 1 (红色 paramPrimary)
  paramB: number; // 从属参数 2 (橙色 paramSecondary)
  interactiveX: number; // 动点切点横坐标
}

const DEFAULT_PARAMS: TemplateParams = {
  paramA: 1.0,
  paramB: 0.0,
  interactiveX: 1.0,
};

// 2. 场景元数据规范 (SSOT: 单一事实源统一声明)
const TEMPLATE_SCENARIOS: Record<'free' | 'tangent' | 'extreme', ScenarioSpec<TemplateParams>> = {
  free: {
    id: 'free',
    name: '自由探索',
    badge: '自主探究 · 任意切点',
    condition: '已知抛物线 $f(x) = ax^2$，动点 $P(x_0, y_0)$ 在曲线上任意平滑滑动。',
    question: '(1) 拖拽动点 $P$，观察切线斜率 $k$ 的正负及绝对值变化；(2) 探究主控参数 $a$ 对抛物线开口方向与陡峭度的影响。',
    variant: 'interactive',
  },
  tangent: {
    id: 'tangent',
    name: '相切临界',
    badge: '高考真题 · 切线几何应用',
    condition: '设定抛物线开口 $a = 1.0$，固定切点横坐标 $x_0 = 1.0$。',
    question: '(1) 验证切线点斜式方程展开与导函数数值的一致性；(2) 探究当 $x_0 > 0$ 时切线倾斜角所属范围。',
    presetParams: { paramA: 1.0, paramB: -1.0, interactiveX: 1.0 },
    lockedParamKeys: ['paramA'],
    variant: 'primary',
  },
  extreme: {
    id: 'extreme',
    name: '对称极值',
    badge: '命题模型 · 顶点极值探究',
    condition: '主控参数 $a = 2.0$，切点置于抛物线顶点 $x_0 = 0.0$。',
    question: '(1) 观察极值点处切线斜率与 $x$ 轴平行关系；(2) 探究二阶导数符号与极值性态的代数对应关系。',
    presetParams: { paramA: 2.0, paramB: 0.0, interactiveX: 0.0 },
    lockedParamKeys: ['interactiveX'],
    variant: 'accent',
  },
};

export const Template2DAnimation: React.FC = () => {
  // 模式控制
  const [activeMode, setActiveMode] = useState<'concept' | 'gaokao'>('concept');
  const [activePreset, setActivePreset] = useState<'free' | 'tangent' | 'extreme'>('free');
  const [params, setParams] = useState<TemplateParams>(DEFAULT_PARAMS);

  // 统一使用 useScenario 驱动情景、参数锁定与题设联动 (公理 1.2)
  const { tipProps, selectScenario, isParamLocked } = useScenario<
    'free' | 'tangent' | 'extreme',
    TemplateParams
  >({
    scenarios: TEMPLATE_SCENARIOS,
    activeKey: activePreset,
    params,
    onParamsChange: setParams,
  });

  // 视口与缩放解构 (铁律 1 & 2)
  const { containerRef, canvasSize, vp } = useAnimationViewport({
    preset: CANVAS_PRESETS.full,
  });
  const scale = useSceneScale({
    vp,
    xRange: [-6, 6],
    yRange: [-4.5, 4.5],
  });

  // 参数更新句柄 (动点拖拽自动回切自由探索 free)
  const handleParamChange = useCallback((key: string, value: number) => {
    setParams((prev) => ({ ...prev, [key]: value }));
    if (key === 'interactiveX') {
      setActivePreset('free');
    }
  }, []);

  const handleReset = useCallback(() => {
    setParams(DEFAULT_PARAMS);
    setActivePreset('free');
  }, []);

  // 预设情境切换 (由 useScenario 处理预设赋值与降维)
  const handlePresetChange = useCallback((key: string) => {
    const nextKey = key as typeof activePreset;
    setActivePreset(nextKey);
    selectScenario(nextKey);
  }, [selectScenario]);

  // 左屏 ParamControl 配置 (参数标签“含义+代号+色彩”三位一体，marks防撞车，支持参数锁定)
  const paramConfigs = useMemo(() => [
    {
      key: 'paramA',
      label: '主控系数 a',
      labelFormula: `\\text{主控系数 } \\color{${MATH_COLORS.paramPrimary}}{a}`,
      value: params.paramA,
      min: -3.0,
      max: 3.0,
      step: 0.1,
      marks: [{ value: 0, label: '0', variant: 'critical' as const }],
      group: '模型基准参数',
      disabled: isParamLocked('paramA'),
    },
    {
      key: 'interactiveX',
      label: '探究切点 x0',
      labelFormula: `\\text{探究切点 } \\color{${MATH_COLORS.paramPrimary}}{x_0}`,
      value: params.interactiveX,
      min: -4.0,
      max: 4.0,
      step: 0.05,
      group: '核心自变量',
      disabled: isParamLocked('interactiveX'),
    },
  ], [params.paramA, params.interactiveX, isParamLocked]);

  // 中屏毛玻璃图例 (1-to-1 颜色绑定与 KaTeX 公式)
  const legendItems: LegendItem[] = useMemo(() => [
    {
      label: `f(x) = \\color{${MATH_COLORS.paramPrimary}}{${params.paramA.toFixed(1)}}x^2`,
      colorKey: 'primary',
      type: 'line',
    },
    {
      label: `\\text{切线 } l: y - y_0 = k(x - x_0)`,
      colorKey: 'tangent',
      type: 'line',
      dashed: true,
    },
    {
      label: `P(x_0, y_0)`,
      colorKey: 'focusPoint',
      type: 'point',
    },
  ], [params.paramA]);

  return (
    <ThreePanel
      left={
        <LeftPanel>
          {/* ① 探究模式维度 */}
          <LeftPanelSection title="探究维度">
            <TabSwitcher
              tabs={[
                { key: 'concept', label: '基础概念' },
                { key: 'gaokao', label: '高考专题' },
              ]}
              value={activeMode}
              onChange={(k) => setActiveMode(k as typeof activeMode)}
            />
          </LeftPanelSection>

          {/* ② 典型情景（B类多构型页面开启，纯中文标题，双列排版） */}
          <LeftPanelSection title="典型模型">
            <SelectGrid
              columns={2}
              items={Object.values(TEMPLATE_SCENARIOS).map((s) => ({
                key: s.id,
                label: s.name,
              }))}
              value={activePreset}
              onChange={handlePresetChange}
            />
          </LeftPanelSection>

          {/* ③ 核心参数调节 */}
          <LeftPanelSection title="参数调节">
            <ParamControl
              params={paramConfigs}
              onParamChange={handleParamChange}
              onReset={handleReset}
            />
          </LeftPanelSection>

          {/* ④ 教学导引与题设背景 (由 useScenario 派发高考标准双要素架构，严禁剧透答案) */}
          {tipProps && (
            <LeftPanelSection title="教学导引" compact>
              <TipCard variant={tipProps.variant}>
                <div className="space-y-1.5 text-xs leading-relaxed">
                  <div>
                    <span className="font-semibold text-neutral-800">【初始条件】</span>
                    <span className="text-neutral-600 ml-1">{tipProps.condition}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-neutral-800">【核心设问】</span>
                    <span className="text-neutral-600 ml-1">{tipProps.question}</span>
                  </div>
                </div>
              </TipCard>
            </LeftPanelSection>
          )}
        </LeftPanel>
      }
      center={
        <div className="w-full h-full relative flex flex-col bg-white">
          {/* 顶栏悬浮公式 */}
          <div className="absolute top-4 left-4 z-10 bg-white/95 backdrop-blur border border-neutral-200 rounded-lg px-3.5 py-2 shadow-sm">
            <KatexFormula
              formula={`f(x) = \\color{${MATH_COLORS.paramPrimary}}{${params.paramA}}x^2`}
              mode="inline"
            />
          </div>

          {/* 右下角毛玻璃图例 */}
          <SceneLegend items={legendItems} />

          {/* SVG 动画画布 */}
          <AnimationSvgCanvas containerRef={containerRef} transform={vp.transform}>
            <Template2DScene
              params={params}
              scale={scale}
              vp={vp}
              fontScale={canvasSize.font}
              onParamChange={handleParamChange}
            />
          </AnimationSvgCanvas>
        </div>
      }
      right={
        /* 统一从数据层驱动右屏看板 (公理 1.3，由 src/data/builders/<topic>.ts 提供) */
        <MathPanel
          title="高考破题与推演看板"
          quantities={[
            {
              label: '切线斜率 k',
              symbol: 'k',
              value: 2 * params.paramA * params.interactiveX,
              color: MATH_COLORS.paramPrimary,
            },
          ]}
          theorems={[
            {
              name: '导数几何意义',
              latex: "f'(x_0) = \\lim_{\\Delta x \\to 0} \\frac{f(x_0 + \\Delta x) - f(x_0)}{\\Delta x}",
              condition: '函数在 x0 处可导',
              level: 'core',
            },
          ]}
          gaokaoPoints={[
            {
              text: '求切线方程两步通法：①求切点导数值；②点斜式联立化简。',
              importance: 'gaokao',
            },
          ]}
        />
      }
    />
  );
};
