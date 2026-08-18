/**
 * 两角和差、倍角/降幂与辅助角公式计算（纯函数，零副作用）
 */

export type SumDiffFormulaKey =
  | "cos_minus"
  | "cos_plus"
  | "sin_plus"
  | "sin_minus"
  | "tan_plus"
  | "tan_minus";

export type DoubleAngleFormulaKey =
  "sin_2a" | "cos_2a" | "tan_2a" | "sin2_a" | "cos2_a";

export type StudyMode = "sum_diff" | "double_angle" | "auxiliary";

export interface SumDiffResult {
  alphaRad: number;
  betaRad: number;
  cosAlpha: number;
  sinAlpha: number;
  cosBeta: number;
  sinBeta: number;
  tanAlpha?: number;
  tanBeta?: number;
  targetAngleRad: number;
  targetAngleDeg: number;
  resultVal: number;
  dotProduct: number;
  chordLength: number;
  isTanDefined: boolean;
  formulaTitle: string;
  formulaLatex: string;
}

export interface DoubleAngleResult {
  alphaRad: number;
  doubleRad: number;
  sinAlpha: number;
  cosAlpha: number;
  tanAlpha?: number;
  sin2Alpha: number;
  cos2Alpha: number;
  tan2Alpha?: number;
  sinSqAlpha: number;
  cosSqAlpha: number;
  period: number;
  baseline: number;
  isTanDefined: boolean;
  formulaTitle: string;
  formulaLatex: string;
}

export interface AuxiliaryResult {
  a: number;
  b: number;
  amplitude: number;
  phiRad: number;
  phiDeg: number;
  cosPhi: number;
  sinPhi: number;
  tanPhi?: number;
  quadrantStr: string;
  isDegenerate: boolean;
  formulaLatex: string;
  maxPointX: number;
  minPointX: number;
}

const DEG_TO_RAD = Math.PI / 180;
const RAD_TO_DEG = 180 / Math.PI;

/**
 * 计算两角和差公式相关几何与代数数值
 */
export function calculateSumDiff(
  alphaDeg: number,
  betaDeg: number,
  key: SumDiffFormulaKey = "cos_minus",
): SumDiffResult {
  const alphaRad = alphaDeg * DEG_TO_RAD;
  const betaRad = betaDeg * DEG_TO_RAD;

  const cosAlpha = Math.cos(alphaRad);
  const sinAlpha = Math.sin(alphaRad);
  const cosBeta = Math.cos(betaRad);
  const sinBeta = Math.sin(betaRad);

  const dotProduct = cosAlpha * cosBeta + sinAlpha * sinBeta; // cos(alpha - beta)
  const dx = cosAlpha - cosBeta;
  const dy = sinAlpha - sinBeta;
  const chordLength = Math.sqrt(dx * dx + dy * dy);

  const isTanAlphaDefined = Math.abs(cosAlpha) > 1e-6;
  const isTanBetaDefined = Math.abs(cosBeta) > 1e-6;
  const tanAlpha = isTanAlphaDefined ? sinAlpha / cosAlpha : undefined;
  const tanBeta = isTanBetaDefined ? sinBeta / cosBeta : undefined;

  let targetAngleRad = 0;
  let resultVal = 0;
  let isTanDefined = true;
  let formulaTitle = "";
  let formulaLatex = "";

  switch (key) {
    case "cos_minus":
      targetAngleRad = alphaRad - betaRad;
      resultVal = Math.cos(targetAngleRad);
      formulaTitle = "两角差的余弦";
      formulaLatex =
        "\\cos(\\alpha - \\beta) = \\cos\\alpha\\cos\\beta + \\sin\\alpha\\sin\\beta";
      break;
    case "cos_plus":
      targetAngleRad = alphaRad + betaRad;
      resultVal = Math.cos(targetAngleRad);
      formulaTitle = "两角和的余弦";
      formulaLatex =
        "\\cos(\\alpha + \\beta) = \\cos\\alpha\\cos\\beta - \\sin\\alpha\\sin\\beta";
      break;
    case "sin_plus":
      targetAngleRad = alphaRad + betaRad;
      resultVal = Math.sin(targetAngleRad);
      formulaTitle = "两角和的正弦";
      formulaLatex =
        "\\sin(\\alpha + \\beta) = \\sin\\alpha\\cos\\beta + \\cos\\alpha\\sin\\beta";
      break;
    case "sin_minus":
      targetAngleRad = alphaRad - betaRad;
      resultVal = Math.sin(targetAngleRad);
      formulaTitle = "两角差的正弦";
      formulaLatex =
        "\\sin(\\alpha - \\beta) = \\sin\\alpha\\cos\\beta - \\cos\\alpha\\sin\\beta";
      break;
    case "tan_plus":
      targetAngleRad = alphaRad + betaRad;
      if (
        !isTanAlphaDefined ||
        !isTanBetaDefined ||
        tanAlpha === undefined ||
        tanBeta === undefined
      ) {
        isTanDefined = false;
        resultVal = NaN;
      } else {
        const denom = 1 - tanAlpha * tanBeta;
        if (Math.abs(denom) < 1e-6) {
          isTanDefined = false;
          resultVal = NaN;
        } else {
          resultVal = (tanAlpha + tanBeta) / denom;
        }
      }
      formulaTitle = "两角和的正切";
      formulaLatex =
        "\\tan(\\alpha + \\beta) = \\frac{\\tan\\alpha + \\tan\\beta}{1 - \\tan\\alpha\\tan\\beta}";
      break;
    case "tan_minus":
      targetAngleRad = alphaRad - betaRad;
      if (
        !isTanAlphaDefined ||
        !isTanBetaDefined ||
        tanAlpha === undefined ||
        tanBeta === undefined
      ) {
        isTanDefined = false;
        resultVal = NaN;
      } else {
        const denom = 1 + tanAlpha * tanBeta;
        if (Math.abs(denom) < 1e-6) {
          isTanDefined = false;
          resultVal = NaN;
        } else {
          resultVal = (tanAlpha - tanBeta) / denom;
        }
      }
      formulaTitle = "两角差的正切";
      formulaLatex =
        "\\tan(\\alpha - \\beta) = \\frac{\\tan\\alpha - \\tan\\beta}{1 + \\tan\\alpha\\tan\\beta}";
      break;
  }

  const targetAngleDeg = (((targetAngleRad * RAD_TO_DEG) % 360) + 360) % 360;

  return {
    alphaRad,
    betaRad,
    cosAlpha,
    sinAlpha,
    cosBeta,
    sinBeta,
    tanAlpha,
    tanBeta,
    targetAngleRad,
    targetAngleDeg,
    resultVal,
    dotProduct,
    chordLength,
    isTanDefined,
    formulaTitle,
    formulaLatex,
  };
}

/**
 * 计算倍角与降幂公式相关数值
 */
export function calculateDoubleAngle(
  alphaDeg: number,
  key: DoubleAngleFormulaKey = "sin_2a",
): DoubleAngleResult {
  const alphaRad = alphaDeg * DEG_TO_RAD;
  const doubleRad = 2 * alphaRad;

  const sinAlpha = Math.sin(alphaRad);
  const cosAlpha = Math.cos(alphaRad);
  const isTanAlphaDefined = Math.abs(cosAlpha) > 1e-6;
  const tanAlpha = isTanAlphaDefined ? sinAlpha / cosAlpha : undefined;

  const sin2Alpha = Math.sin(doubleRad);
  const cos2Alpha = Math.cos(doubleRad);

  const sinSqAlpha = sinAlpha * sinAlpha;
  const cosSqAlpha = cosAlpha * cosAlpha;

  let isTanDefined = true;
  let tan2Alpha: number | undefined;
  if (Math.abs(Math.cos(doubleRad)) > 1e-6) {
    tan2Alpha = Math.sin(doubleRad) / Math.cos(doubleRad);
  } else {
    isTanDefined = false;
  }

  let formulaTitle = "";
  let formulaLatex = "";

  switch (key) {
    case "sin_2a":
      formulaTitle = "二倍角正弦";
      formulaLatex = "\\sin 2\\alpha = 2\\sin\\alpha\\cos\\alpha";
      break;
    case "cos_2a":
      formulaTitle = "二倍角余弦";
      formulaLatex =
        "\\cos 2\\alpha = \\cos^2\\alpha - \\sin^2\\alpha = 2\\cos^2\\alpha - 1 = 1 - 2\\sin^2\\alpha";
      break;
    case "tan_2a":
      formulaTitle = "二倍角正切";
      formulaLatex =
        "\\tan 2\\alpha = \\frac{2\\tan\\alpha}{1 - \\tan^2\\alpha}";
      break;
    case "sin2_a":
      formulaTitle = "正弦降幂公式";
      formulaLatex = "\\sin^2\\alpha = \\frac{1 - \\cos 2\\alpha}{2}";
      break;
    case "cos2_a":
      formulaTitle = "余弦降幂公式";
      formulaLatex = "\\cos^2\\alpha = \\frac{1 + \\cos 2\\alpha}{2}";
      break;
  }

  return {
    alphaRad,
    doubleRad,
    sinAlpha,
    cosAlpha,
    tanAlpha,
    sin2Alpha,
    cos2Alpha,
    tan2Alpha,
    sinSqAlpha,
    cosSqAlpha,
    period: Math.PI,
    baseline: 0.5,
    isTanDefined,
    formulaTitle,
    formulaLatex,
  };
}

/**
 * 判定点 (a, b) 所在象限字符串
 */
function getQuadrantString(a: number, b: number): string {
  if (Math.abs(a) < 1e-6 && Math.abs(b) < 1e-6) return "原点";
  if (Math.abs(a) < 1e-6) return b > 0 ? "y 轴正半轴" : "y 轴负半轴";
  if (Math.abs(b) < 1e-6) return a > 0 ? "x 轴正半轴" : "x 轴负半轴";
  if (a > 0 && b > 0) return "第一象限";
  if (a < 0 && b > 0) return "第二象限";
  if (a < 0 && b < 0) return "第三象限";
  return "第四象限";
}

/**
 * 计算辅助角公式 Asin(x+phi)
 */
export function calculateAuxiliary(a: number, b: number): AuxiliaryResult {
  const amplitude = Math.sqrt(a * a + b * b);
  const isDegenerate = amplitude < 1e-6;

  if (isDegenerate) {
    return {
      a,
      b,
      amplitude: 0,
      phiRad: 0,
      phiDeg: 0,
      cosPhi: 1,
      sinPhi: 0,
      tanPhi: 0,
      quadrantStr: "原点",
      isDegenerate: true,
      formulaLatex: "0\\cdot\\sin x + 0\\cdot\\cos x = 0",
      maxPointX: Math.PI / 2,
      minPointX: -Math.PI / 2,
    };
  }

  const phiRad = Math.atan2(b, a);
  let phiDeg = phiRad * RAD_TO_DEG;
  if (phiDeg < 0) phiDeg += 360;

  const cosPhi = a / amplitude;
  const sinPhi = b / amplitude;
  const tanPhi = Math.abs(a) > 1e-6 ? b / a : undefined;
  const quadrantStr = getQuadrantString(a, b);

  const aStr = a.toFixed(2).replace(/\.00$/, "");
  const bStr =
    b >= 0
      ? `+ ${b.toFixed(2).replace(/\.00$/, "")}`
      : `- ${Math.abs(b).toFixed(2).replace(/\.00$/, "")}`;
  const ampStr = amplitude.toFixed(2).replace(/\.00$/, "");
  const phiDegStr = phiDeg.toFixed(1).replace(/\.0$/, "");

  const formulaLatex = `${aStr}\\sin x ${bStr}\\cos x = ${ampStr}\\sin(x + ${phiDegStr}^\\circ)`;

  const maxPointX = Math.PI / 2 - phiRad;
  const minPointX = -Math.PI / 2 - phiRad;

  return {
    a,
    b,
    amplitude,
    phiRad,
    phiDeg,
    cosPhi,
    sinPhi,
    tanPhi,
    quadrantStr,
    isDegenerate: false,
    formulaLatex,
    maxPointX,
    minPointX,
  };
}
