export interface QuadraticResult {
  a: number
  b: number
  c: number
  delta: number
  direction: '向上' | '向下' | '无 (退化为直线)'
  axisX: number | null // 对称轴 x 值，退化时为 null
  vertexX: number | null
  vertexY: number | null
  roots: number[] // 实根数组，长度 0, 1 或 2，退化且无解时为 []，退化且无数解时为 [-Infinity, Infinity]
  isValid: boolean // a ≠ 0 时为 true
  isDegenerate: boolean // a = 0 时为 true
  degenerateType: 'linear' | 'constant' | 'none' // 退化类型
}

/**
 * 二次函数 y = ax^2 + bx + c 求解器
 */
export function solveQuadratic(a: number, b: number, c: number): QuadraticResult {
  const delta = b * b - 4 * a * c

  if (Math.abs(a) < 1e-9) {
    // 退化为一次函数 y = bx + c
    let roots: number[] = []
    if (Math.abs(b) >= 1e-9) {
      roots = [-c / b]
    } else {
      // y = c
      roots = Math.abs(c) < 1e-9 ? [-Infinity, Infinity] : []
    }

    return {
      a, b, c,
      delta: 0,
      direction: '无 (退化为直线)',
      axisX: null,
      vertexX: null,
      vertexY: null,
      roots,
      isValid: false,
      isDegenerate: true,
      degenerateType: Math.abs(b) >= 1e-9 ? 'linear' : 'constant'
    }
  }

  const direction = a > 0 ? '向上' : '向下'
  const axisX = -b / (2 * a)
  const vertexX = axisX
  const vertexY = (4 * a * c - b * b) / (4 * a)

  let roots: number[] = []
  if (delta > 1e-9) {
    const sqrtDelta = Math.sqrt(delta)
    roots = [
      (-b - sqrtDelta) / (2 * a),
      (-b + sqrtDelta) / (2 * a)
    ].sort((x, y) => x - y)
  } else if (Math.abs(delta) <= 1e-9) {
    roots = [-b / (2 * a)]
  }

  return {
    a, b, c,
    delta,
    direction,
    axisX,
    vertexX,
    vertexY,
    roots,
    isValid: true,
    isDegenerate: false,
    degenerateType: 'none'
  }
}
