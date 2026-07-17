import { useState, useMemo } from 'react'
import { ThreePanel, AnimationSvgCanvas } from '@/components/Layout'
import { ParamControl, MathPanel } from '@/components/UI'
import type { ParamConfig } from '@/components/UI'
import { useAnimationViewport, useSceneScale } from '@/hooks'
import { CANVAS_PRESETS } from '@/theme'
import { QuadraticScene } from './components/QuadraticScene'
import { buildMathQuantities } from '@/data/mathQuantities'
import { defaultParams, paramMeta } from '@/data/registries/quadratic'

export function QuadraticAnimation() {
  // 1. 本地状态保存 a, b, c 参数
  const [params, setParams] = useState<Record<string, number>>(() => ({
    a: defaultParams.a,
    b: defaultParams.b,
    c: defaultParams.c,
  }))

  // 2. 视口尺寸测量与防抖
  const { containerRef, vp } = useAnimationViewport({
    preset: CANVAS_PRESETS.full,
  })

  // 3. 构建直角坐标系比例尺：数学范围 X [-6, 6]，Y [-4.5, 4.5]
  const scale = useSceneScale({
    vp,
    xRange: [-6, 6],
    yRange: [-4.5, 4.5],
  })

  // 4. 数学量看板数据计算与组装
  const mathData = useMemo(() => {
    return buildMathQuantities('anim-quadratic', params)
  }, [params])

  // 参数更新处理器
  const handleParamChange = (key: string, value: number) => {
    setParams((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  // 重置参数
  const handleReset = () => {
    setParams({
      a: defaultParams.a,
      b: defaultParams.b,
      c: defaultParams.c,
    })
  }

  // 构建声明式控制面板配置参数
  const paramConfigs = useMemo<ParamConfig[]>(() => {
    return Object.entries(paramMeta).map(([key, meta]) => ({
      key,
      label: meta.label,
      value: params[key] ?? meta.defaultValue ?? 0,
      min: meta.min,
      max: meta.max,
      step: meta.step ?? 0.1,
      description: meta.description,
      importance: meta.importance as any,
    }))
  }, [params])

  // 计算当前方程的文本表示，供中屏上方展示
  const equationText = useMemo(() => {
    const aVal = params.a.toFixed(1)
    const cVal = params.c.toFixed(1)

    // 构建二次项
    let str = 'y = '
    if (params.a !== 0) {
      str += `${aVal}x²`
    }

    // 构建一次项
    if (params.b !== 0) {
      const sign = params.b > 0 ? ' + ' : ' - '
      const absVal = Math.abs(params.b).toFixed(1)
      str += params.a !== 0 ? `${sign}${absVal}x` : `${params.b.toFixed(1)}x`
    }

    // 构建常数项
    if (params.c !== 0 || (params.a === 0 && params.b === 0)) {
      const sign = params.c > 0 ? ' + ' : ' - '
      const absVal = Math.abs(params.c).toFixed(1)
      str += (params.a !== 0 || params.b !== 0) ? `${sign}${absVal}` : cVal
    }

    return str
  }, [params])

  return (
    <ThreePanel
      left={
        <div className="flex flex-col gap-3 p-4">
          <ParamControl
            params={paramConfigs}
            onParamChange={handleParamChange}
            onReset={handleReset}
          />
        </div>
      }
      center={
        <div className="w-full h-full relative flex flex-col bg-white">
          {/* 方程公式文字悬浮展示 */}
          <div className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur border border-neutral-200 rounded-lg px-3 py-1.5 shadow-sm">
            <span className="text-sm font-semibold font-mono text-primary-700">
              {equationText}
            </span>
          </div>

          {/* SVG 自适应画布 */}
          <AnimationSvgCanvas containerRef={containerRef} transform={vp.transform}>
            <QuadraticScene params={params as any} scale={scale} />
          </AnimationSvgCanvas>
        </div>
      }
      right={
        <MathPanel
          quantities={mathData.quantities}
          theorems={mathData.theorems}
          gaokaoPoints={mathData.gaokaoPoints}
          warnings={mathData.warnings}
          mnemonic={mathData.mnemonic}
          title="二次方程指标看板"
        />
      }
    />
  )
}
