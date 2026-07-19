/**
 * src/utils/polyBuilder.ts
 * 轻量级多项式 LaTeX 拼装工具
 * 处理：系数 1/-1 省略、正负号合并、零项剔除、参数着色
 */

/** 将数值格式化为 LaTeX 友好字符串 */
function fmtCoeff(val: number, opts?: { omitSign?: boolean }): string {
  const abs = Math.abs(val);
  const formatted =
    abs === Math.floor(abs)
      ? abs.toString()
      : abs.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
  if (opts?.omitSign) return formatted;
  return val >= 0 ? formatted : `-${formatted}`;
}

/** 包裹 KaTeX 颜色命令 */
function colored(text: string, color?: string): string {
  if (!color) return text;
  return `\\color{${color}}{${text}}`;
}

export interface PolyTerm {
  coeff: number;
  /** x 的指数，0 = 常数项，1 = 一次项，2 = 二次项 */
  power: number;
  /** 参数颜色（KaTeX 颜色名或 hex） */
  color?: string;
}

/**
 * 构建一元多项式的 LaTeX 表达式
 *
 * @example
 * buildPolyLatex([
 *   { coeff: 2, power: 2, color: '#2563EB' },
 *   { coeff: -3, power: 1, color: '#10B981' },
 *   { coeff: 1, power: 0, color: '#DC2626' },
 * ])
 * // => "\color{#2563EB}{2}x^2 \color{#10B981}{-3}x + \color{#DC2626}{1}"
 */
export function buildPolyLatex(terms: PolyTerm[]): string {
  // 过滤零项
  const nonzero = terms.filter((t) => Math.abs(t.coeff) > 1e-9);
  if (nonzero.length === 0) return "0";

  // 按幂次降序排列
  const sorted = [...nonzero].sort((a, b) => b.power - a.power);

  let latex = "";

  for (let i = 0; i < sorted.length; i++) {
    const { coeff, power, color } = sorted[i];
    const isFirst = i === 0;
    const isNeg = coeff < 0;

    // 符号处理
    if (!isFirst) {
      latex += isNeg ? " - " : " + ";
    } else if (isNeg) {
      latex += "-";
    }

    const absCoeff = Math.abs(coeff);

    // 系数部分
    if (power === 0) {
      // 常数项：始终显示系数
      latex += colored(fmtCoeff(absCoeff), color);
    } else {
      // 含 x 的项
      // 系数为 1 时省略（除非是带颜色的参数展示，保留 1 以保持参数可读性）
      if (Math.abs(absCoeff - 1) > 1e-9) {
        latex += colored(fmtCoeff(absCoeff), color);
      }

      // x 部分
      if (power === 1) {
        latex += colored("x", color);
      } else {
        latex += colored(`x^{${power}}`, color);
      }
    }
  }

  return latex;
}

/**
 * 构建一元二次函数 y = ax² + bx + c 的完整 LaTeX
 * 带参数着色
 */
export function buildQuadraticLatex(
  a: number,
  b: number,
  c: number,
  colors?: { a?: string; b?: string; c?: string },
): string {
  const terms: PolyTerm[] = [];

  if (Math.abs(a) > 1e-9) {
    terms.push({ coeff: a, power: 2, color: colors?.a });
  }
  if (Math.abs(b) > 1e-9) {
    terms.push({ coeff: b, power: 1, color: colors?.b });
  }
  // 常数项：当 a 和 b 都为 0 时必须显示 c（即使 c=0 也显示 "y = 0"）
  if (Math.abs(c) > 1e-9 || (Math.abs(a) < 1e-9 && Math.abs(b) < 1e-9)) {
    terms.push({ coeff: c, power: 0, color: colors?.c });
  }

  const poly = buildPolyLatex(terms);
  return `y = ${poly}`;
}
