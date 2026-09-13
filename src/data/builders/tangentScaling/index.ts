import type { MathPanelData } from "@/data/types";
import type {
  TangentScalingParams,
  TangentScalingMode,
  BaseSubModel,
  SandwichSubModel,
  ParamKSubModel,
  SecantSubModel,
} from "@/data/registries/tangentScaling";
import { buildBaseModel } from "./baseModel";
import { buildSandwichModel } from "./sandwichModel";
import { buildParamKModel } from "./paramKModel";
import { buildSecantModel } from "./secantModel";

export interface TangentScalingOptions {
  mode?: TangentScalingMode;
  baseSubModel?: BaseSubModel;
  sandwichSubModel?: SandwichSubModel;
  paramKSubModel?: ParamKSubModel;
  secantSubModel?: SecantSubModel;
}

/**
 * 导数切线放缩与双切线卡位右屏数据构建器（策略路由门面）
 */
export function buildTangentScalingPanel(
  params: TangentScalingParams,
  options?: TangentScalingOptions,
): MathPanelData {
  const mode = options?.mode ?? "base";
  const baseSub = options?.baseSubModel ?? "exp_x_plus_1";
  const sandwichSub = options?.sandwichSubModel ?? "common_tangent";
  const paramKSub = options?.paramKSubModel ?? "exp_log_k";
  const secantSub = options?.secantSubModel ?? "exp_secant_tangent";

  switch (mode) {
    case "base":
      return buildBaseModel(params, baseSub);
    case "sandwich":
      return buildSandwichModel(params, sandwichSub);
    case "param_k":
      return buildParamKModel(params, paramKSub);
    case "secant":
      return buildSecantModel(params, secantSub);
    default:
      return buildBaseModel(params, baseSub);
  }
}
