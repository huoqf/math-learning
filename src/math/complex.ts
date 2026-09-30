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

/** 计算两复数 z1, z2 的垂直平分线几何参数及距离 */
export function calcPerpBisectorLocus(
  z1: ComplexNumber,
  z2: ComplexNumber,
): {
  midPoint: ComplexNumber;
  normalDir: ComplexNumber;
  dist: number;
  valid: boolean;
} {
  const diff = subComplex(z2, z1);
  const dist = modulus(diff);
  if (dist < 1e-9) {
    return {
      midPoint: z1,
      normalDir: { re: 0, im: 1 },
      dist: 0,
      valid: false,
    };
  }
  const midPoint: ComplexNumber = {
    re: (z1.re + z2.re) / 2,
    im: (z1.im + z2.im) / 2,
  };
  // 法方向（与 z2-z1 垂直，即逆时针旋转 90° 的单位向量）
  const normalDir: ComplexNumber = {
    re: -diff.im / dist,
    im: diff.re / dist,
  };
  return {
    midPoint,
    normalDir,
    dist,
    valid: true,
  };
}

/**
 * 复数代数乘法展开的中间量。
 *
 * 教学用途：把 `(a+bi)(c+di)` 的「逐项相乘 → i² 归并 → 合并同类项」三步
 * 显式暴露出来，供推导链逐步展示，而不是直接给出结果。
 *
 * 展开过程（高中通法）：
 * ```
 * (a+bi)(c+di) = ac + adi + bci + bd·i²
 *              = ac + (ad+bc)i - bd      （用 i² = -1）
 *              = (ac - bd) + (ad + bc)i  （合并同类项）
 * ```
 */
export interface ComplexMultiplyExpansion {
  /** 实部×实部 a·c */
  ac: number;
  /** 虚部×虚部 b·d（乘 i² 后作为实数项参与合并） */
  bd: number;
  /** 交叉项 a·d（落在虚部） */
  ad: number;
  /** 交叉项 b·c（落在虚部） */
  bc: number;
  /** 虚部平方项 bd·i² 归并后的实部贡献 = −bd */
  iSquaredTerm: number;
  /** 合并同类项后的实部 = ac − bd */
  re: number;
  /** 合并同类项后的虚部 = ad + bc */
  im: number;
}

/** 复数代数乘法展开（返回逐项中间量） */
export function expandComplexMultiply(
  z1: ComplexNumber,
  z2: ComplexNumber,
): ComplexMultiplyExpansion {
  const ac = z1.re * z2.re;
  const bd = z1.im * z2.im;
  const ad = z1.re * z2.im;
  const bc = z1.im * z2.re;
  // i² = -1 ⇒ bd·i² = -bd，作为实数项与 ac 合并
  const iSquaredTerm = -bd;
  return {
    ac,
    bd,
    ad,
    bc,
    iSquaredTerm,
    re: ac - bd,
    im: ad + bc,
  };
}

/**
 * 共轭分母实数化的中间量。
 *
 * 教学用途：展示 `z1 / z2`（z2 ≠ 0）「分子分母同乘分母的共轭 →
 * 分母化为实数 |z2|² → 分子展开 → 实虚部同除以分母」的完整过程。
 *
 * 推导过程：
 * ```
 *   a+bi   (a+bi)(c-di)   (ac+bd) + (bc-ad)i   ac+bd    bc-ad
 *   ──── = ──────────── = ────────────────── = ────── + ────── i
 *   c+di   (c+di)(c-di)        c²+d²           c²+d²    c²+d²
 * ```
 */
export interface ComplexRationalizeResult {
  /** 分母能否实数化（c² + d² 是否显著非零） */
  valid: boolean;
  /** 分母的实数化结果 c² + d²（= |z2|²），分子分母同乘其共轭后分母恒为实数 */
  denominator: number;
  /** 分母展开项 c² */
  c2: number;
  /** 分母展开项 d² */
  d2: number;
  /** 分子乘共轭后的实部 = ac + bd */
  numeratorRe: number;
  /** 分子乘共轭后的虚部 = bc − ad */
  numeratorIm: number;
  /** 商 = (numeratorRe + numeratorIm·i) / denominator */
  result: ComplexNumber;
}

/** 共轭分母实数化（返回分母 |z2|² 与分子展开中间量） */
export function rationalizeComplexDivision(
  z1: ComplexNumber,
  z2: ComplexNumber,
): ComplexRationalizeResult {
  const c2 = z2.re * z2.re;
  const d2 = z2.im * z2.im;
  const denominator = c2 + d2;

  if (denominator < 1e-12) {
    // 除数为 0：分母 |z2|² 退化为 0，实数化无意义
    return {
      valid: false,
      denominator: 0,
      c2,
      d2,
      numeratorRe: 0,
      numeratorIm: 0,
      result: { re: 0, im: 0 },
    };
  }

  // (a+bi)(c-di) = (ac+bd) + (bc-ad)i
  const numeratorRe = z1.re * z2.re + z1.im * z2.im;
  const numeratorIm = z1.im * z2.re - z1.re * z2.im;

  return {
    valid: true,
    denominator,
    c2,
    d2,
    numeratorRe,
    numeratorIm,
    result: {
      re: numeratorRe / denominator,
      im: numeratorIm / denominator,
    },
  };
}

/** i^n 周期幂的结果（以 4 为周期，余数唯一决定取值） */
export interface ComplexPowerIResult {
  /** 指数 n（整数，允许为负） */
  n: number;
  /** n 对 4 取最小非负余数，∈ {0,1,2,3} */
  residue: 0 | 1 | 2 | 3;
  /** i^n 的代数形式 */
  value: ComplexNumber;
  /** i^n 的简洁 LaTeX 写法：1 / i / -1 / -i */
  latex: string;
}

/**
 * 计算 i 的整数次幂（周期幂）。
 *
 * 高中核心结论：`i` 的幂以 4 为周期循环 ——
 * ```
 * i^1 = i,  i^2 = -1,  i^3 = -i,  i^4 = 1,  i^5 = i, ...
 * ```
 * 故只需按 `n mod 4` 的余数取值（负数指数按最小非负余数归一，
 * 如 `i^(-1) = 1/i = -i`，余数 3）。
 */
export function powerOfI(n: number): ComplexPowerIResult {
  const integerN = Math.round(n);
  // JS 的 % 对负数返回负值，需再归一化到 [0, 3]
  const residue = (((integerN % 4) + 4) % 4) as 0 | 1 | 2 | 3;

  const table: Record<0 | 1 | 2 | 3, { value: ComplexNumber; latex: string }> =
    {
      0: { value: { re: 1, im: 0 }, latex: "1" },
      1: { value: { re: 0, im: 1 }, latex: "i" },
      2: { value: { re: -1, im: 0 }, latex: "-1" },
      3: { value: { re: 0, im: -1 }, latex: "-i" },
    };

  const hit = table[residue];
  return {
    n: integerN,
    residue,
    value: hit.value,
    latex: hit.latex,
  };
}

/** 计算两复数模的三角不等式范围 ||z1|-|z2|| <= |z1±z2| <= |z1|+|z2| */
export function calcModulusTriangleInequality(
  z1: ComplexNumber,
  z2: ComplexNumber,
): {
  mod1: number;
  mod2: number;
  modSum: number;
  modDiff: number;
  lowerBound: number;
  upperBound: number;
} {
  const mod1 = modulus(z1);
  const mod2 = modulus(z2);
  const modSum = modulus(addComplex(z1, z2));
  const modDiff = modulus(subComplex(z1, z2));
  const lowerBound = Math.abs(mod1 - mod2);
  const upperBound = mod1 + mod2;

  return {
    mod1,
    mod2,
    modSum,
    modDiff,
    lowerBound,
    upperBound,
  };
}
