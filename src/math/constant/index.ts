/**
 * src/math/constant/index.ts
 * 统一 re-export，保持 import 路径兼容
 */

// 共享类型
export type {
  MathState,
  ConstantSingleSepResult,
  ConstantSingleDirectResult,
  ConstantDoubleResult,
  TransModelKey,
} from "./types";

// 二次函数模型
export {
  evalF,
  evalGParam,
  solveConstantSingleSep,
  solveConstantSingleDirect,
  solveConstantDouble,
} from "./quadratic";

// 超越函数模型
export {
  evalFTrans,
  evalGParamTrans,
  evalFTransC,
  evalFTransD,
  evalTransDerivative,
  solveSepEquation,
  solveDirectEquation,
  solveConstantSingleSepTrans,
  solveConstantSingleDirectTrans,
} from "./transcendental";
