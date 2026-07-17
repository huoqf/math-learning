import type { MathQuantity, Theorem, GaokaoPoint, WarningItem } from '@/components/UI'
import { solveQuadratic } from '@/math/quadratic'
import { ALGEBRA_COLORS, CALCULUS_COLORS } from '@/theme'

export interface MathPanelData {
  quantities: MathQuantity[]
  theorems: Theorem[]
  gaokaoPoints: GaokaoPoint[]
  warnings: WarningItem[]
  mnemonic?: string
}

export function buildMathQuantities(
  animId: string,
  params: Record<string, number>
): MathPanelData {
  if (animId === 'anim-quadratic') {
    const a = params.a ?? 1
    const b = params.b ?? 0
    const c = params.c ?? 0

    const res = solveQuadratic(a, b, c)

    // 构造数学量展示列表
    const quantities: MathQuantity[] = [
      { label: '二次项系数', symbol: 'a', value: a, color: ALGEBRA_COLORS.sequence },
      { label: '一次项系数', symbol: 'b', value: b, color: ALGEBRA_COLORS.inequality },
      { label: '常数项', symbol: 'c', value: c, color: CALCULUS_COLORS.derivative },
      {
        label: '判别式',
        symbol: 'Δ',
        value: res.delta,
        highlight: res.delta > 1e-9 ? 'positive' : (Math.abs(res.delta) <= 1e-9 ? 'zero' : 'negative')
      },
      {
        label: '对称轴',
        symbol: 'x',
        value: res.axisX !== null ? res.axisX.toFixed(2) : '无'
      },
      {
        label: '顶点坐标',
        value: res.vertexX !== null && res.vertexY !== null
          ? `(${res.vertexX.toFixed(2)}, ${res.vertexY.toFixed(2)})`
          : '无'
      }
    ]

    // 零点（实根）量添加
    if (res.roots.length === 2) {
      quantities.push({ label: '实根 x₁', value: res.roots[0], color: CALCULUS_COLORS.tangentLine })
      quantities.push({ label: '实根 x₂', value: res.roots[1], color: CALCULUS_COLORS.tangentLine })
    } else if (res.roots.length === 1) {
      quantities.push({ label: '唯一实根 x₀', value: res.roots[0], color: CALCULUS_COLORS.tangentLine })
    } else if (res.roots.length === 0) {
      quantities.push({ label: '实根数量', value: '无实数根' })
    }

    // 定理公式
    const theorems: Theorem[] = [
      {
        name: '二次函数一般式',
        latex: 'y = ax^2 + bx + c \\quad (a \\neq 0)',
        level: 'core'
      },
      {
        name: '对称轴与顶点坐标公式',
        latex: 'x = -\\frac{b}{2a}, \\quad \\text{顶点} \\left(-\\frac{b}{2a}, \\frac{4ac-b^2}{4a}\\right)',
        level: 'important'
      },
      {
        name: '一元二次方程求根公式',
        latex: 'x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a} \\quad (b^2 - 4ac \\ge 0)',
        level: 'important'
      }
    ]

    // 高考要点
    const gaokaoPoints: GaokaoPoint[] = [
      {
        text: '二次函数图象的开口方向、对称轴位置和顶点坐标是解决最值问题和不等式恒成立问题的核心基准。',
        importance: 'gaokao'
      },
      {
        text: '二次函数的零点个数等价于方程 ax² + bx + c = 0 的实根个数，由判别式 Δ 决定。',
        importance: 'core'
      }
    ]

    // 易错警示
    const warnings: WarningItem[] = []
    if (Math.abs(a) < 1e-9) {
      warnings.push({
        text: '当 a = 0 时，函数退化为一次函数（直线），对称轴和顶点坐标不复存在，原一元二次方程求根公式失效。',
        level: 'danger'
      })
    }
    if (res.delta < 0 && Math.abs(a) >= 1e-9) {
      warnings.push({
        text: '当前判别式 Δ < 0，抛物线与 x 轴无交点，方程在实数范围内无解。',
        level: 'warning'
      })
    }

    return {
      quantities,
      theorems,
      gaokaoPoints,
      warnings,
      mnemonic: '一柱擎天看a值，左同右异定轴线，常数c点过y轴。'
    }
  }

  return {
    quantities: [],
    theorems: [],
    gaokaoPoints: [],
    warnings: []
  }
}
