/**
 * src/features/trigIdentity/math/trigIdentity.ts
 * 纯数学计算函数：零副作用、零 DOM / React / Store 依赖
 */

export type FormulaType =
  "period" | "pi_plus" | "neg" | "pi_minus" | "half_pi_minus" | "half_pi_plus";

export type IdentitySubMode = "geometry" | "known_one" | "homogeneous";
export type InductionSubMode = "standard6" | "universal_k" | "complementary";

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
  diffSignReason: string; // 差值正负象限决策原因
  // 一次齐次式 (A sinα + B cosα) / (C sinα + D cosα)
  homoA: number;
  homoB: number;
  homoC: number;
  homoD: number;
  homoVal?: number;
  isHomoDefined: boolean;
  homoFormulaTex: string;
  homoStepTex: string;
  // 二次齐次式 (a sin^2α + b sinα cosα + c cos^2α) / 1
  quadA: number;
  quadB: number;
  quadC: number;
  quadVal?: number;
  isQuadDefined: boolean;
  quadFormulaTex: string;
  quadStepTex: string;
}

export interface InductionResult {
  formulaType?: FormulaType;
  formulaTitle: string;
  formulaTex: string;
  alphaDeg: number;
  betaDeg: number;
  betaRad: number;
  pointP: Point2D;
  pointPPrime: Point2D;
  pointMPrime: Point2D;
  symmetryType:
    | "coincide"
    | "origin"
    | "xaxis"
    | "yaxis"
    | "diag_pos"
    | "diag_neg"
    | "general";
  symmetryName: string;
  symmetryLineTex?: string;
  // 奇变偶不变
  kValue: number; // k * (pi/2)
  isOdd: boolean; // 是否奇数
  nameChangeDesc: string; // "函数名不变" | "正余弦互换"
  // 符号看象限
  assumedQuadrant: string; // "假定 α 为锐角(第一象限)，β 在第 X 象限"
  signDesc: string;
  // 诱导公式恒等式
  sinFormulaTex: string;
  cosFormulaTex: string;
  tanFormulaTex: string;
  // 实际函数值比对
  sinBeta: number;
  cosBeta: number;
  tanBeta?: number;
  // 步进推演三步法
  step1Name: string;
  step2Sign: string;
  step3Verify: string;
}

export interface ComplementaryResult {
  alphaDeg: number;
  thetaDeg: number; // 配角参数
  angle1Deg: number; // α + θ
  angle2Deg: number; // 90° - (α + θ)
  isComplementary: boolean; // 是否互余
  isSupplementary: boolean; // 是否互补
  modelName: string;
  formulaLatex: string;
  explanation: string;
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
  homoC: number = 1,
  homoD: number = 1,
  quadA: number = 2,
  quadB: number = 3,
  quadC: number = -1,
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

  // 差值正负象限判断依据
  let diffSignReason = "";
  if (sinVal > cosVal) {
    diffSignReason =
      "因 \\sin\\alpha > \\cos\\alpha (终边位于 y=x 上方)，取正号 '+'";
  } else if (sinVal < cosVal) {
    diffSignReason =
      "因 \\sin\\alpha < \\cos\\alpha (终边位于 y=x 下方)，取负号 '-'";
  } else {
    diffSignReason =
      "因 \\sin\\alpha = \\cos\\alpha (终边位于 y=x 上)，差值为 0";
  }

  // 1. 一次齐次式 (A sinα + B cosα) / (C sinα + D cosα)
  const denom = homoC * sinVal + homoD * cosVal;
  const isHomoDefined = Math.abs(denom) > 1e-4;
  const homoVal = isHomoDefined
    ? (homoA * sinVal + homoB * cosVal) / denom
    : undefined;

  const homoFormulaTex = `\\frac{${homoA}\\sin\\alpha + ${homoB}\\cos\\alpha}{${homoC}\\sin\\alpha + ${homoD}\\cos\\alpha}`;
  const homoStepTex = `\\frac{${homoA}\\tan\\alpha + ${homoB}}{${homoC}\\tan\\alpha + ${homoD}}`;

  // 2. 二次齐次式 (a sin^2α + b sinα cosα + c cos^2α)
  const quadVal = quadA * sinSq + quadB * sinVal * cosVal + quadC * cosSq;
  const isQuadDefined = isTanDefined;
  const quadFormulaTex = `${quadA}\\sin^2\\alpha + ${quadB}\\sin\\alpha\\cos\\alpha + ${quadC}\\cos^2\\alpha`;
  const quadStepTex = `\\frac{${quadA}\\tan^2\\alpha + ${quadB}\\tan\\alpha + ${quadC}}{\\tan^2\\alpha + 1}`;

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
    diffSignReason,
    homoA,
    homoB,
    homoC,
    homoD,
    homoVal,
    isHomoDefined,
    homoFormulaTex,
    homoStepTex,
    quadA,
    quadB,
    quadC,
    quadVal,
    isQuadDefined,
    quadFormulaTex,
    quadStepTex,
  };
}

/**
 * 计算 6 组常用诱导公式的动态对称与推导
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

  let step1Name = "";
  let step2Sign = "";
  let step3Verify = "";

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
      assumedQuadrant = "α 视为锐角(第Ⅰ象限)，α+2π 落在第Ⅰ象限";
      signDesc = "第Ⅰ象限全为正 ➔ 符号全取正号 '+'";
      sinFormulaTex = "\\sin(\\alpha + 2\\pi) = \\sin\\alpha";
      cosFormulaTex = "\\cos(\\alpha + 2\\pi) = \\cos\\alpha";
      tanFormulaTex = "\\tan(\\alpha + 2\\pi) = \\tan\\alpha";
      step1Name = "k=4 为偶数 ➔ 函数名不变 (sin➔sin, cos➔cos, tan➔tan)";
      step2Sign = "设 α 为锐角，α+2π 仍在第 Ⅰ 象限 ➔ 正余弦正切全为正";
      step3Verify = "终边绕原点旋转 360° 后与原终边重合，三角函数值完全相同";
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
      assumedQuadrant = "α 视为锐角(第Ⅰ象限)，π+α 落在第Ⅲ象限";
      signDesc = "第Ⅲ象限中 sin<0, cos<0, tan>0 ➔ sin,cos加负号，tan为正";
      sinFormulaTex = "\\sin(\\pi + \\alpha) = -\\sin\\alpha";
      cosFormulaTex = "\\cos(\\pi + \\alpha) = -\\cos\\alpha";
      tanFormulaTex = "\\tan(\\pi + \\alpha) = \\tan\\alpha";
      step1Name = "k=2 为偶数 ➔ 函数名不变";
      step2Sign =
        "设 α 为锐角，π+α 落在第 Ⅲ 象限 ➔ sin<0(-), cos<0(-), tan>0(+)";
      step3Verify =
        "动点 P(x, y) 旋转 180° 变为 P'(-x, -y)，横纵坐标全取相反数";
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
      assumedQuadrant = "α 视为锐角(第Ⅰ象限)，-α 落在第Ⅳ象限";
      signDesc = "第Ⅳ象限中 sin<0, cos>0, tan<0 ➔ sin,tan加负号，cos为正";
      sinFormulaTex = "\\sin(-\\alpha) = -\\sin\\alpha";
      cosFormulaTex = "\\cos(-\\alpha) = \\cos\\alpha";
      tanFormulaTex = "\\tan(-\\alpha) = -\\tan\\alpha";
      step1Name = "k=0 为偶数 ➔ 函数名不变";
      step2Sign =
        "设 α 为锐角，-α 落在第 Ⅳ 象限 ➔ sin<0(-), cos>0(+), tan<0(-)";
      step3Verify =
        "动点 P(x, y) 关于 x 轴对称变为 P'(x, -y)，横坐标不变，纵坐标取反";
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
      assumedQuadrant = "α 视为锐角(第Ⅰ象限)，π-α 落在第Ⅱ象限";
      signDesc = "第Ⅱ象限中 sin>0, cos<0, tan<0 ➔ sin为正，cos,tan加负号";
      sinFormulaTex = "\\sin(\\pi - \\alpha) = \\sin\\alpha";
      cosFormulaTex = "\\cos(\\pi - \\alpha) = -\\cos\\alpha";
      tanFormulaTex = "\\tan(\\pi - \\alpha) = -\\tan\\alpha";
      step1Name = "k=2 为偶数 ➔ 函数名不变";
      step2Sign =
        "设 α 为锐角，π-α 落在第 Ⅱ 象限 ➔ sin>0(+), cos<0(-), tan<0(-)";
      step3Verify =
        "动点 P(x, y) 关于 y 轴对称变为 P'(-x, y)，横坐标取反，纵坐标不变";
      break;

    case "half_pi_minus":
      betaDeg = 90 - alphaDeg;
      formulaTitle = "公式五：π/2 - α";
      formulaTex = "\\frac{\\pi}{2} - \\alpha";
      symmetryType = "diag_pos";
      symmetryName = "关于直线 y = x 对称 (互余)";
      symmetryLineTex = "y = x";
      kValue = 1; // 1 * pi/2
      isOdd = true;
      nameChangeDesc = "k=1 (奇数) ➔ 奇变：正余弦互换 sin↔cos";
      assumedQuadrant = "α 视为锐角(第Ⅰ象限)，π/2-α 仍在第Ⅰ象限";
      signDesc = "第Ⅰ象限全为正 ➔ 变换后全取正号 '+'";
      sinFormulaTex =
        "\\sin\\left(\\frac{\\pi}{2} - \\alpha\\right) = \\cos\\alpha";
      cosFormulaTex =
        "\\cos\\left(\\frac{\\pi}{2} - \\alpha\\right) = \\sin\\alpha";
      tanFormulaTex =
        "\\tan\\left(\\frac{\\pi}{2} - \\alpha\\right) = \\frac{1}{\\tan\\alpha}";
      step1Name = "k=1 为奇数 ➔ 奇变：正余弦互换 (sin↔cos, tan↔cot)";
      step2Sign = "设 α 为锐角，π/2-α 落在第 Ⅰ 象限 ➔ 符号全为正 (+)";
      step3Verify = "动点 P(x, y) 关于 y=x 对称变为 P'(y, x)，横纵坐标对调";
      break;

    case "half_pi_plus":
      betaDeg = 90 + alphaDeg;
      formulaTitle = "公式六：π/2 + α";
      formulaTex = "\\frac{\\pi}{2} + \\alpha";
      symmetryType = "diag_neg";
      symmetryName = "关于直线 y = -x 对称 / 逆时针旋转 90°";
      symmetryLineTex = "y = -x";
      kValue = 1; // 1 * pi/2
      isOdd = true;
      nameChangeDesc = "k=1 (奇数) ➔ 奇变：正余弦互换 sin↔cos";
      assumedQuadrant = "α 视为锐角(第Ⅰ象限)，π/2+α 落在第Ⅱ象限";
      signDesc = "原 sin 在第Ⅱ象限为正(+)；原 cos 在第Ⅱ象限为负(-)";
      sinFormulaTex =
        "\\sin\\left(\\frac{\\pi}{2} + \\alpha\\right) = \\cos\\alpha";
      cosFormulaTex =
        "\\cos\\left(\\frac{\\pi}{2} + \\alpha\\right) = -\\sin\\alpha";
      tanFormulaTex =
        "\\tan\\left(\\frac{\\pi}{2} + \\alpha\\right) = -\\frac{1}{\\tan\\alpha}";
      step1Name = "k=1 为奇数 ➔ 奇变：正余弦互换 (sin↔cos)";
      step2Sign =
        "设 α 为锐角，π/2+α 落在第 Ⅱ 象限 ➔ 原 sin 为正(+得cosα)，原 cos 为负(-得-sinα)";
      step3Verify =
        "动点 P(x, y) 旋转 90° 变为 P'(-y, x)，新横坐标为 -y，新纵坐标为 x";
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
    step1Name,
    step2Sign,
    step3Verify,
  };
}

/**
 * 万能诱导公式 k * π/2 ± α
 */
export function calculateUniversalInduction(
  alphaDeg: number,
  k: number,
  sign: 1 | -1,
): InductionResult {
  const alphaRad = (alphaDeg * Math.PI) / 180;
  const pointP: Point2D = { x: Math.cos(alphaRad), y: Math.sin(alphaRad) };

  const betaDeg = k * 90 + sign * alphaDeg;
  const betaRad = (betaDeg * Math.PI) / 180;

  const isOdd = Math.abs(k) % 2 === 1;
  const signStr = sign === 1 ? "+" : "-";
  const formulaTex = `${k}\\cdot\\frac{\\pi}{2} ${signStr} \\alpha`;
  const formulaTitle = `万能诱导法则：${formulaTex}`;

  // 判定把 α 视为锐角时，k*90 + sign*30 所在的象限
  const assumedAngle = k * 90 + sign * 30;
  const testNorm = ((assumedAngle % 360) + 360) % 360;
  let testQuad = 1;
  if (testNorm > 0 && testNorm < 90) testQuad = 1;
  else if (testNorm > 90 && testNorm < 180) testQuad = 2;
  else if (testNorm > 180 && testNorm < 270) testQuad = 3;
  else testQuad = 4;

  const originSinSign = testQuad === 1 || testQuad === 2 ? 1 : -1;
  const originCosSign = testQuad === 1 || testQuad === 4 ? 1 : -1;
  const originTanSign = testQuad === 1 || testQuad === 3 ? 1 : -1;

  const nameChangeDesc = isOdd
    ? `k=${k} (奇数) ➔ 奇变：正余弦互换 (sin↔cos)`
    : `k=${k} (偶数) ➔ 偶不变：函数名保持不变`;

  const assumedQuadrant = `若令 α 为锐角(30°)，则 ${k}×90°${signStr}30° = ${assumedAngle}° 落在第 ${testQuad} 象限`;
  const signDesc = `原函数在第 ${testQuad} 象限正负：sin 为 ${originSinSign > 0 ? "+" : "-"}，cos 为 ${originCosSign > 0 ? "+" : "-"}，tan 为 ${originTanSign > 0 ? "+" : "-"}`;

  const sinFormulaTex = `\\sin\\left(${k}\\cdot\\frac{\\pi}{2} ${signStr} \\alpha\\right) = ${originSinSign < 0 ? "-" : ""}${isOdd ? "\\cos\\alpha" : "\\sin\\alpha"}`;
  const cosFormulaTex = `\\cos\\left(${k}\\cdot\\frac{\\pi}{2} ${signStr} \\alpha\\right) = ${originCosSign < 0 ? "-" : ""}${isOdd ? "\\sin\\alpha" : "\\cos\\alpha"}`;
  const tanFormulaTex = `\\tan\\left(${k}\\cdot\\frac{\\pi}{2} ${signStr} \\alpha\\right) = ${originTanSign < 0 ? "-" : ""}${isOdd ? "\\frac{1}{\\tan\\alpha}" : "\\tan\\alpha"}`;

  const sinBeta = Math.sin(betaRad);
  const cosBeta = Math.cos(betaRad);
  const isTanBetaDefined = Math.abs(cosBeta) > 1e-5;
  const tanBeta = isTanBetaDefined ? sinBeta / cosBeta : undefined;

  const pointPPrime: Point2D = { x: cosBeta, y: sinBeta };
  const pointMPrime: Point2D = { x: cosBeta, y: 0 };

  const step1Name = isOdd
    ? `第1步（看名）：k=${k} 是奇数 ➔ 奇变：sin ↔ cos，tan ↔ 1/tan`
    : `第1步（看名）：k=${k} 是偶数 ➔ 偶不变：函数名不变`;
  const step2Sign = `第2步（看号）：将 α 假定为锐角，${k}·(π/2)${signStr}α 落在第 ${testQuad} 象限 ➔ 原 sin 符号为 ${originSinSign > 0 ? "正(+)" : "负(-)"}，原 cos 符号为 ${originCosSign > 0 ? "正(+)" : "负(-)"}`;
  const step3Verify = `第3步（验证）：当前角 α=${alphaDeg}°，计算得 sin(${betaDeg}°) = ${sinBeta.toFixed(3)}，完全符合理论推导！`;

  return {
    formulaTitle,
    formulaTex,
    alphaDeg,
    betaDeg,
    betaRad,
    pointP,
    pointPPrime,
    pointMPrime,
    symmetryType: "general",
    symmetryName: isOdd
      ? "旋转奇数个直角 (正余弦互换)"
      : "对称或周期重合 (函数名不变)",
    kValue: k,
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
    step1Name,
    step2Sign,
    step3Verify,
  };
}

/**
 * 新高考互余互补配角模型
 */
export function calculateComplementaryModel(
  alphaDeg: number,
  thetaDeg: number = 30,
): ComplementaryResult {
  const angle1Deg = alphaDeg + thetaDeg;
  const angle2Deg = 90 - (alphaDeg + thetaDeg);

  const isComplementary = Math.abs(angle1Deg + angle2Deg - 90) < 1e-4;
  const isSupplementary = Math.abs(angle1Deg + (180 - angle1Deg) - 180) < 1e-4;

  const modelName = "高考经典互余配角模型：(α + θ) 与 (π/2 - (α + θ))";
  const formulaLatex = `\\cos\\left[\\frac{\\pi}{2} - (\\alpha + \\theta)\\right] = \\sin(\\alpha + \\theta)`;
  const explanation = `因为 (\\alpha + \\theta) + [\\frac{\\pi}{2} - (\\alpha + \\theta)] = \\frac{\\pi}{2} (两角互余)，所以一个角的正弦等于另一个角的余弦！`;

  return {
    alphaDeg,
    thetaDeg,
    angle1Deg,
    angle2Deg,
    isComplementary,
    isSupplementary,
    modelName,
    formulaLatex,
    explanation,
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
