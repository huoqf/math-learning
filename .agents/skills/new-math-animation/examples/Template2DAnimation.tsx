import React, { useState, useMemo, useCallback } from 'react';
import { ThreePanel, AnimationSvgCanvas } from '@/components/Layout';
import {
  LeftPanel,
  LeftPanelSection,
  ParamControl,
  TabSwitcher,
  SelectGrid,
  TipCard,
  KatexFormula,
  MathPanel,
} from '@/components/UI';
import { SceneLegend, type LegendItem } from '@/components/Math';
import { useAnimationViewport, useSceneScale } from '@/hooks';
import { CANVAS_PRESETS } from '@/types';
import { MATH_COLORS } from '@/theme';
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

export const Template2DAnimation: React.FC = () => {
  // 模式控制 (A类基础概念课可省略情景选择)
  const [activeMode, setActiveMode] = useState<'concept' | 'gaokao'>('concept');
  const [activePreset, setActivePreset] = useState<'free' | 'tangent' | 'extreme'>('free');
  const [params, setParams] = useState<TemplateParams>(DEFAULT_PARAMS);

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

  // 预设情境切换 (参数降维与题设锁定)
  const handlePresetChange = useCallback((key: string) => {
    setActivePreset(key as typeof activePreset);
    if (key === 'tangent') {
      setParams((prev) => ({ ...prev, paramA: 1.0, paramB: -1.0, interactiveX: 1.0 }));
    } else if (key === 'extreme') {
      setParams((prev) => ({ ...prev, paramA: 2.0, paramB: 0.0, interactiveX: 0.0 }));
    }
  }, []);

  // 左屏 ParamControl 配置 (参数标签“含义+代号+色彩”三位一体，marks防撞车)
  const paramConfigs = useMemo(() => [
    {
      key: 'paramA',
      label: '主控系数 a',
      labelFormula: `\\text{主控系数 } \\color{${MATH_COLORS.paramPrimary}}{a}`,
      value: params.paramA,
      min: -3.0,
      max: 3.0,
      step: 0.1,
      // 仅在分水岭临界点配置 critical mark
      marks: [{ value: 0, label: '0', variant: 'critical' as const }],
      group: '模型基准参数',
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
    },
  ], [params.paramA, params.interactiveX]);

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

          {/* ② 典型情景（B类多构型页面开启，双列排版） */}
          <LeftPanelSection title="典型模型">
            <SelectGrid
              columns={2}
              items={[
                { key: 'free', label: '自由探索' },
                { key: 'tangent', label: '相切临界' },
                { key: 'extreme', label: '对称极值' },
              ]}
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

          {/* ④ 教学导引与题设背景 (高考标准双要素架构，严禁剧透答案) */}
          <LeftPanelSection title="教学导引" compact>
            <TipCard variant="interactive">
              <div className="space-y-1.5 text-xs leading-relaxed">
                <div>
                  <span className="font-semibold text-neutral-800">【初始条件】</span>
                  <span className="text-neutral-600">
                    已知曲线 <KatexFormula formula="f(x) = ax^2" mode="inline" />，过曲线上动点{' '}
                    <KatexFormula formula="P(x_0, y_0)" mode="inline" /> 作切线 <KatexFormula formula="l" mode="inline" />。
                  </span>
                </div>
                <div>
                  <span className="font-semibold text-neutral-800">【核心设问】</span>
                  <span className="text-neutral-600">
                    (1) 拖拽动点 <KatexFormula formula="P" mode="inline" />，观察切线斜率变化；(2) 探究当参数{' '}
                    <KatexFormula formula="a" mode="inline" /> 异号时曲线凹凸性转变。
                  </span>
                </div>
              </div>
            </TipCard>
          </LeftPanelSection>
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
        <MathPanel
          title="代数特征看板"
          quantities={[
            {
              id: 'q-slope',
              label: '切线斜率 k',
              value: 2 * params.paramA * params.interactiveX,
              formula: `k = f'(x_0) = 2 \\cdot \\color{${MATH_COLORS.paramPrimary}}{a} \\cdot x_0`,
            },
          ]}
          theorems={[
            {
              id: 'thm-deriv',
              title: '导数几何意义',
              formula: `f'(x_0) = \\lim_{\\Delta x \\to 0} \\frac{f(x_0 + \\Delta x) - f(x_0)}{\\Delta x}`,
              condition: '函数在 x0 处可导',
            },
          ]}
          gaokaoPoints={[
            {
              id: 'gk-1',
              title: '求切线方程两步通法',
              description: '①代入求点坐标与导数值；②点斜式联立化为一般式。',
            },
          ]}
        />
      }
    />
  );
};
