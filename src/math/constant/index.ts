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
  solveSepEquation,
  solveDirectEquation,
  solveConstantSingleSepTrans,
  solveConstantSingleDirectTrans,
} from "./transcendental";
