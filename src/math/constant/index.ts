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
  solveConstantSingleSepTrans,
  solveConstantSingleDirectTrans,
  // 四模型唯一事实源（画布 / 看板 / 求解器共用）
  evalSepTransFn,
  evalSepTransDeriv,
  evalDirectTransFn,
  evalDirectTransDeriv,
  sepTransCritical,
  directTransCritical,
  TRANS_MODEL_SPEC,
} from "./transcendental";

export type { TransModelSpec, TransCriticalPoint } from "./transcendental";
