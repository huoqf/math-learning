/**
 * src/features/trigIdentity/math/trigIdentity.ts
 * 纯数学计算函数：零副作用、零 DOM / React / Store 依赖
 */

export type FormulaType =
  "period" | "pi_plus" | "neg" | "pi_minus" | "half_pi_minus" | "half_pi_plus";

export interface Point2D {
  x: number;
  y: number;
}

export interface TrigIdentityResult {
  alphaDeg: number;
  alphaRad: number;
  normDeg: number;
  quadrant: 1 | 2 | 3 | 4 | 0; // 0 表示在坐标轴上
  sinVal: number;
  cosVal: number;
  tanVal?: number;
  isTanDefined: boolean;
  pointP: Point2D;
  pointM: Point2D;
  pointA: Point2D;
  pointT?: Point2D;
  // 同角推导数值
  sinSq: number;
  cosSq: number;
  sqSum: number;
  // 知一求二组合
  sumSC: number; // sinα + cosα
  diffSC: number; // sinα - cosα
  prodSC: number; // sinα * cosα
  sumSqVerif: number; // (sinα+cosα)^2
  diffSqVerif: number; // (sinα-cosα)^2
  // 齐次式演练 (A sinα + B cosα) / (sinα + cosα)
  homoVal?: number;
  isHomoDefined: boolean;
  homoFormulaTex: string;
}

export interface InductionResult {
  formulaType: FormulaType;
  formulaTitle: string;
  formulaTex: string;
  alphaDeg: number;
  betaDeg: number;
  betaRad: number;
  pointP: Point2D;
  pointPPrime: Point2D;
  pointMPrime: Point2D;
  symmetryType:
    "coincide" | "origin" | "xaxis" | "yaxis" | "diag_pos" | "diag_neg";
  symmetryName: string;
  symmetryLineTex?: string;
  // 奇变偶不变
  kValue: number; // k * (pi/2)
  isOdd: boolean; // 是否奇数
  nameChangeDesc: string; // "函数名不变" | "正余弦互换"
  // 符号看象限
  assumedQuadrant: string; // "假定 α 为锐角(第一象限)，β 在第 X 象限"
  signDesc: string;
  // 诱导公式恒等式列表
  sinFormulaTex: string;
  cosFormulaTex: string;
  tanFormulaTex: string;
  // 实际函数值比对
  sinBeta: number;
  cosBeta: number;
  tanBeta?: number;
}

/**
 * 角度转化为标准象限 (1, 2, 3, 4) 或 0 (轴上)
 */
export function getQuadrant(deg: number): 1 | 2 | 3 | 4 | 0 {
  const norm = ((deg % 360) + 360) % 360;
  if (norm === 0 || norm === 90 || norm === 180 || norm === 270) return 0;
  if (norm > 0 && norm < 90) return 1;
  if (norm > 90 && norm < 180) return 2;
  if (norm > 180 && norm < 270) return 3;
  return 4;
}

/**
 * 计算同角三角函数关系
 */
export function calculateTrigIdentity(
  alphaDeg: number,
  homoA: number = 1,
  homoB: number = 1,
): TrigIdentityResult {
  const alphaRad = (alphaDeg * Math.PI) / 180;
  const normDeg = ((alphaDeg % 360) + 360) % 360;
  const quadrant = getQuadrant(alphaDeg);

  const sinVal = Math.sin(alphaRad);
  const cosVal = Math.cos(alphaRad);

  const isTanDefined = Math.abs(cosVal) > 1e-5;
  const tanVal = isTanDefined ? sinVal / cosVal : undefined;

  const pointP: Point2D = { x: cosVal, y: sinVal };
  const pointM: Point2D = { x: cosVal, y: 0 };
  const pointA: Point2D = { x: 1, y: 0 };
  const pointT: Point2D | undefined =
    isTanDefined && tanVal !== undefined ? { x: 1, y: tanVal } : undefined;

  const sinSq = sinVal * sinVal;
  const cosSq = cosVal * cosVal;
  const sqSum = sinSq + cosSq;

  const sumSC = sinVal + cosVal;
  const diffSC = sinVal - cosVal;
  const prodSC = sinVal * cosVal;

  const sumSqVerif = sumSC * sumSC;
  const diffSqVerif = diffSC * diffSC;

  // 齐次式 (A sinα + B cosα) / (sinα + cosα)
  const denom = sinVal + cosVal;
  const isHomoDefined = Math.abs(denom) > 1e-4;
  const homoVal = isHomoDefined
    ? (homoA * sinVal + homoB * cosVal) / denom
    : undefined;

  const homoFormulaTex = `\\frac{${homoA}\\sin\\alpha + ${homoB}\\cos\\alpha}{\\sin\\alpha + \\cos\\alpha}`;

  return {
    alphaDeg,
    alphaRad,
    normDeg,
    quadrant,
    sinVal,
    cosVal,
    tanVal,
    isTanDefined,
    pointP,
    pointM,
    pointA,
    pointT,
    sinSq,
    cosSq,
    sqSum,
    sumSC,
    diffSC,
    prodSC,
    sumSqVerif,
    diffSqVerif,
    homoVal,
    isHomoDefined,
    homoFormulaTex,
  };
}

/**
 * 计算 6 组诱导公式的动态对称与推导
 */
export function calculateInduction(
  alphaDeg: number,
  formulaType: FormulaType,
): InductionResult {
  const alphaRad = (alphaDeg * Math.PI) / 180;
  const pointP: Point2D = { x: Math.cos(alphaRad), y: Math.sin(alphaRad) };

  let betaDeg = alphaDeg;
  let formulaTitle = "";
  let formulaTex = "";
  let symmetryType: InductionResult["symmetryType"] = "coincide";
  let symmetryName = "";
  let symmetryLineTex: string | undefined = undefined;

  let kValue = 0;
  let isOdd = false;
  let nameChangeDesc = "函数名不变";
  let assumedQuadrant = "";
  let signDesc = "";

  let sinFormulaTex = "";
  let cosFormulaTex = "";
  let tanFormulaTex = "";

  switch (formulaType) {
    case "period":
      betaDeg = alphaDeg + 360;
      formulaTitle = "公式一：α + 2kπ";
      formulaTex = "\\alpha + 2\\pi";
      symmetryType = "coincide";
      symmetryName = "终边重合 (周期性)";
      kValue = 4; // 4 * pi/2 = 2pi
      isOdd = false;
      nameChangeDesc = "k=4 (偶数) ➔ 函数名不变";
      assumedQuadrant = "α 为锐角(第一象限)，α+2π 也在第一象限";
      signDesc = "全为正 ➔ 符号全取正号 '+'";
      sinFormulaTex = "\\sin(\\alpha + 2\\pi) = \\sin\\alpha";
      cosFormulaTex = "\\cos(\\alpha + 2\\pi) = \\cos\\alpha";
      tanFormulaTex = "\\tan(\\alpha + 2\\pi) = \\tan\\alpha";
      break;

    case "pi_plus":
      betaDeg = 180 + alphaDeg;
      formulaTitle = "公式二：π + α";
      formulaTex = "\\pi + \\alpha";
      symmetryType = "origin";
      symmetryName = "关于原点 (0,0) 中心对称";
      kValue = 2; // 2 * pi/2 = pi
      isOdd = false;
      nameChangeDesc = "k=2 (偶数) ➔ 函数名不变";
      assumedQuadrant = "假定 α 在第 Ⅰ 象限，π+α 落在第 Ⅲ 象限";
      signDesc = "第 Ⅲ 象限中 sin<0, cos<0, tan>0 ➔ sin,cos加负号，tan为正";
      sinFormulaTex = "\\sin(\\pi + \\alpha) = -\\sin\\alpha";
      cosFormulaTex = "\\cos(\\pi + \\alpha) = -\\cos\\alpha";
      tanFormulaTex = "\\tan(\\pi + \\alpha) = \\tan\\alpha";
      break;

    case "neg":
      betaDeg = -alphaDeg;
      formulaTitle = "公式三：-α";
      formulaTex = "-\\alpha";
      symmetryType = "xaxis";
      symmetryName = "关于 x 轴对称";
      symmetryLineTex = "y = 0";
      kValue = 0; // 0 * pi/2
      isOdd = false;
      nameChangeDesc = "k=0 (偶数) ➔ 函数名不变";
      assumedQuadrant = "假定 α 在第 Ⅰ 象限，-α 落在第 Ⅳ 象限";
      signDesc = "第 Ⅳ 象限中 sin<0, cos>0, tan<0 ➔ sin,tan加负号";
      sinFormulaTex = "\\sin(-\\alpha) = -\\sin\\alpha";
      cosFormulaTex = "\\cos(-\\alpha) = \\cos\\alpha";
      tanFormulaTex = "\\tan(-\\alpha) = -\\tan\\alpha";
      break;

    case "pi_minus":
      betaDeg = 180 - alphaDeg;
      formulaTitle = "公式四：π - α";
      formulaTex = "\\pi - \\alpha";
      symmetryType = "yaxis";
      symmetryName = "关于 y 轴对称";
      symmetryLineTex = "x = 0";
      kValue = 2; // 2 * pi/2
      isOdd = false;
      nameChangeDesc = "k=2 (偶数) ➔ 函数名不变";
      assumedQuadrant = "假定 α 在第 Ⅰ 象限，π-α 落在第 Ⅱ 象限";
      signDesc = "第 Ⅱ 象限中 sin>0, cos<0, tan<0 ➔ sin不变号，cos,tan加负号";
      sinFormulaTex = "\\sin(\\pi - \\alpha) = \\sin\\alpha";
      cosFormulaTex = "\\cos(\\pi - \\alpha) = -\\cos\\alpha";
      tanFormulaTex = "\\tan(\\pi - \\alpha) = -\\tan\\alpha";
      break;

    case "half_pi_minus":
      betaDeg = 90 - alphaDeg;
      formulaTitle = "公式五：π/2 - α";
      formulaTex = "\\frac{\\pi}{2} - \\alpha";
      symmetryType = "diag_pos";
      symmetryName = "关于直线 y = x 对称";
      symmetryLineTex = "y = x";
      kValue = 1; // 1 * pi/2
      isOdd = true;
      nameChangeDesc = "k=1 (奇数) ➔ 奇变：正余弦互换 sin↔cos";
      assumedQuadrant = "假定 α 在第 Ⅰ 象限，π/2-α 也在第 Ⅰ 象限";
      signDesc = "原函数在第 Ⅰ 象限全为正 ➔ 变换后全取正号 '+'";
      sinFormulaTex =
        "\\sin\\left(\\frac{\\pi}{2} - \\alpha\\right) = \\cos\\alpha";
      cosFormulaTex =
        "\\cos\\left(\\frac{\\pi}{2} - \\alpha\\right) = \\sin\\alpha";
      tanFormulaTex =
        "\\tan\\left(\\frac{\\pi}{2} - \\alpha\\right) = \\frac{1}{\\tan\\alpha}";
      break;

    case "half_pi_plus":
      betaDeg = 90 + alphaDeg;
      formulaTitle = "公式六：π/2 + α";
      formulaTex = "\\frac{\\pi}{2} + \\alpha";
      symmetryType = "diag_neg";
      symmetryName = "关于直线 y = -x 对称 / 旋转 90°";
      symmetryLineTex = "y = -x";
      kValue = 1; // 1 * pi/2
      isOdd = true;
      nameChangeDesc = "k=1 (奇数) ➔ 奇变：正余弦互换 sin↔cos";
      assumedQuadrant = "假定 α 在第 Ⅰ 象限，π/2+α 落在第 Ⅱ 象限";
      signDesc =
        "原 sin 在第 Ⅱ 象限为正(得cosα)；原 cos 在第 Ⅱ 象限为负(得-sinα)";
      sinFormulaTex =
        "\\sin\\left(\\frac{\\pi}{2} + \\alpha\\right) = \\cos\\alpha";
      cosFormulaTex =
        "\\cos\\left(\\frac{\\pi}{2} + \\alpha\\right) = -\\sin\\alpha";
      tanFormulaTex =
        "\\tan\\left(\\frac{\\pi}{2} + \\alpha\\right) = -\\frac{1}{\\tan\\alpha}";
      break;
  }

  const betaRad = (betaDeg * Math.PI) / 180;
  const sinBeta = Math.sin(betaRad);
  const cosBeta = Math.cos(betaRad);
  const isTanBetaDefined = Math.abs(cosBeta) > 1e-5;
  const tanBeta = isTanBetaDefined ? sinBeta / cosBeta : undefined;

  const pointPPrime: Point2D = { x: cosBeta, y: sinBeta };
  const pointMPrime: Point2D = { x: cosBeta, y: 0 };

  return {
    formulaType,
    formulaTitle,
    formulaTex,
    alphaDeg,
    betaDeg,
    betaRad,
    pointP,
    pointPPrime,
    pointMPrime,
    symmetryType,
    symmetryName,
    symmetryLineTex,
    kValue,
    isOdd,
    nameChangeDesc,
    assumedQuadrant,
    signDesc,
    sinFormulaTex,
    cosFormulaTex,
    tanFormulaTex,
    sinBeta,
    cosBeta,
    tanBeta,
  };
}

/**
 * 拖拽点 P 逆向解算角度
 */
export function pointToAngleDeg(
  x: number,
  y: number,
  currentDeg: number,
): number {
  const rawRad = Math.atan2(y, x);
  let rawDeg = (rawRad * 180) / Math.PI;
  if (rawDeg < 0) rawDeg += 360;

  // 保证与 currentDeg 在同一旋转圈数上，避免突变
  const currentNormalized = ((currentDeg % 360) + 360) % 360;
  let diff = rawDeg - currentNormalized;

  if (diff > 180) diff -= 360;
  if (diff < -180) diff += 360;

  return Math.round(currentDeg + diff);
}
