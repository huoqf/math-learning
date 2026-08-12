/**
 * 复数基础数学计算库（纯函数，无 DOM/React 副作用）
 */

export interface ComplexNumber {
  re: number; // 实部
  im: number; // 虚部
}

export interface ComplexPolar {
  mod: number; // 模长 r >= 0
  arg: number; // 主辐角 theta in (-pi, pi]
}

export interface CircleLocusResult {
  valid: boolean;
  minDist: number;
  maxDist: number;
  minPoint: ComplexNumber;
  maxPoint: ComplexNumber;
  centerDist: number;
}

/** 创建复数 */
export function createComplex(re: number, im: number): ComplexNumber {
  return { re, im };
}

/** 计算复数模长 */
export function modulus(z: ComplexNumber): number {
  return Math.hypot(z.re, z.im);
}

/** 计算复数主辐角 theta ∈ (-π, π] */
export function argument(z: ComplexNumber): number {
  if (Math.abs(z.re) < 1e-12 && Math.abs(z.im) < 1e-12) {
    return 0; // 原点默认 0
  }
  return Math.atan2(z.im, z.re);
}

/** 转换为极坐标形式 */
export function toPolar(z: ComplexNumber): ComplexPolar {
  return {
    mod: modulus(z),
    arg: argument(z),
  };
}

/** 极坐标转代数形式 */
export function fromPolar(mod: number, arg: number): ComplexNumber {
  return {
    re: mod * Math.cos(arg),
    im: mod * Math.sin(arg),
  };
}

/** 共轭复数 */
export function conjugate(z: ComplexNumber): ComplexNumber {
  return { re: z.re, im: -z.im };
}

/** 复数加法 */
export function addComplex(
  z1: ComplexNumber,
  z2: ComplexNumber,
): ComplexNumber {
  return { re: z1.re + z2.re, im: z1.im + z2.im };
}

/** 复数减法 */
export function subComplex(
  z1: ComplexNumber,
  z2: ComplexNumber,
): ComplexNumber {
  return { re: z1.re - z2.re, im: z1.im - z2.im };
}

/** 复数乘法 */
export function mulComplex(
  z1: ComplexNumber,
  z2: ComplexNumber,
): ComplexNumber {
  return {
    re: z1.re * z2.re - z1.im * z2.im,
    im: z1.re * z2.im + z1.im * z2.re,
  };
}

/** 复数除法 */
export function divComplex(
  z1: ComplexNumber,
  z2: ComplexNumber,
): { result: ComplexNumber; valid: boolean } {
  const denom = z2.re * z2.re + z2.im * z2.im;
  if (denom < 1e-12) {
    return { result: { re: 0, im: 0 }, valid: false };
  }
  return {
    result: {
      re: (z1.re * z2.re + z1.im * z2.im) / denom,
      im: (z1.im * z2.re - z1.re * z2.im) / denom,
    },
    valid: true,
  };
}

/** 格式化复数为简洁 LaTeX 表达（如 3 + 4i, -2i, 5 等） */
export function formatComplexLatex(z: ComplexNumber, precision = 2): string {
  const round = (v: number) => {
    const p = Math.pow(10, precision);
    return Math.round(v * p) / p;
  };

  const a = round(z.re);
  const b = round(z.im);

  if (Math.abs(a) < 1e-9 && Math.abs(b) < 1e-9) return "0";
  if (Math.abs(b) < 1e-9) return `${a}`;
  if (Math.abs(a) < 1e-9) {
    if (b === 1) return "i";
    if (b === -1) return "-i";
    return `${b}i`;
  }

  const sign = b > 0 ? "+" : "-";
  const absB = Math.abs(b);
  const bStr = absB === 1 ? "i" : `${absB}i`;
  return `${a} ${sign} ${bStr}`;
}

/** 计算圆轨迹 |z - center| = radius 上点 z 到 target 距离的极值（高考核心几何解析） */
export function calcCircleLocusExtrema(
  center: ComplexNumber,
  radius: number,
  target: ComplexNumber,
): CircleLocusResult {
  const dVector = subComplex(target, center);
  const centerDist = modulus(dVector);

  if (centerDist < 1e-9) {
    // 目标点恰好是圆心
    return {
      valid: true,
      minDist: radius,
      maxDist: radius,
      minPoint: { re: center.re + radius, im: center.im },
      maxPoint: { re: center.re - radius, im: center.im },
      centerDist: 0,
    };
  }

  const dirX = dVector.re / centerDist;
  const dirY = dVector.im / centerDist;

  // 最近点：从圆心往 target 方向走 R
  const minPoint: ComplexNumber = {
    re: center.re + radius * dirX,
    im: center.im + radius * dirY,
  };

  // 最远点：从圆心往 target 反方向走 R
  const maxPoint: ComplexNumber = {
    re: center.re - radius * dirX,
    im: center.im - radius * dirY,
  };

  const minDist = Math.abs(centerDist - radius);
  const maxDist = centerDist + radius;

  return {
    valid: true,
    minDist,
    maxDist,
    minPoint,
    maxPoint,
    centerDist,
  };
}
