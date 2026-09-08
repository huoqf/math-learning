import { MATH_COLORS } from "@/theme";
import type { ParamConfig, SelectGridItem } from "@/components/UI";
import type {
  TangentScalingMode,
  BaseSubModel,
  SandwichSubModel,
  ParamKSubModel,
  SecantSubModel,
} from "@/math/tangentScaling";

export type {
  TangentScalingMode,
  BaseSubModel,
  SandwichSubModel,
  ParamKSubModel,
  SecantSubModel,
} from "@/math/tangentScaling";

export interface TangentScalingParams {
  x0: number; // 切点横坐标
  evalX: number; // 评估观察点 x
  k: number; // 动直线斜率
  intervalA: number; // 割线/区间左端点 a
  intervalB: number; // 割线/区间右端点 b
  shiftDelta: number; // 移轴偏移量
}

export const defaultParams: TangentScalingParams = {
  x0: 0,
  evalX: 1.0,
  k: 1.0,
  intervalA: 0.5,
  intervalB: 2.5,
  shiftDelta: 0,
};

export const modeTabs: {
  key: TangentScalingMode;
  id: TangentScalingMode;
  label: string;
}[] = [
  { key: "base", id: "base", label: "基准切线放缩" },
  { key: "sandwich", id: "sandwich", label: "双切线卡位" },
  { key: "param_k", id: "param_k", label: "过定点卡位求参" },
  { key: "secant", id: "secant", label: "割切双向夹逼" },
];

export const baseSubModels: (SelectGridItem & {
  key: BaseSubModel;
  id: BaseSubModel;
})[] = [
  {
    key: "exp_x_plus_1",
    id: "exp_x_plus_1",
    label: "指数基准",
    formula: "e^x \\ge x + 1",
  },
  {
    key: "log_x_minus_1",
    id: "log_x_minus_1",
    label: "对数基准",
    formula: "\\ln x \\le x - 1",
  },
  {
    key: "exp_shift_x",
    id: "exp_shift_x",
    label: "指数移轴",
    formula: "e^{x-1} \\ge x",
  },
  {
    key: "log_shift_0",
    id: "log_shift_0",
    label: "对数移轴",
    formula: "\\ln(x+1) \\le x",
  },
  {
    key: "exp_ex",
    id: "exp_ex",
    label: "指数过原点",
    formula: "e^x \\ge ex",
  },
  {
    key: "log_x_div_e",
    id: "log_x_div_e",
    label: "对数过原点",
    formula: "\\ln x \\le \\frac{x}{e}",
  },
];

export const sandwichSubModels: (SelectGridItem & {
  key: SandwichSubModel;
  id: SandwichSubModel;
})[] = [
  {
    key: "common_tangent",
    id: "common_tangent",
    label: "公切中介卡位",
    formula: "e^{x-1} \\ge x \\ge \\ln x + 1",
  },
  {
    key: "parallel_bands",
    id: "parallel_bands",
    label: "平行双切差值",
    formula: "e^x - \\ln x \\ge 2",
  },
  {
    key: "origin_sandwich",
    id: "origin_sandwich",
    label: "原点对称夹逼",
    formula: "e^x - 1 \\ge x \\ge \\ln(x+1)",
  },
];

export const paramKSubModels: (SelectGridItem & {
  key: ParamKSubModel;
  id: ParamKSubModel;
})[] = [
  {
    key: "exp_log_k",
    id: "exp_log_k",
    label: "双侧旋转卡位",
    formula: "e^x \\ge kx \\ge \\ln x",
  },
  {
    key: "exp_kx_origin",
    id: "exp_kx_origin",
    label: "指数单侧",
    formula: "e^x \\ge kx",
  },
  {
    key: "log_kx_origin",
    id: "log_kx_origin",
    label: "对数单侧",
    formula: "\\ln x \\le kx",
  },
];

export const secantSubModels: (SelectGridItem & {
  key: SecantSubModel;
  id: SecantSubModel;
})[] = [
  {
    key: "exp_secant_tangent",
    id: "exp_secant_tangent",
    label: "指数下凸割切",
    formula: "L_{\\text{tan}} \\le e^x \\le L_{AB}",
  },
  {
    key: "log_secant_tangent",
    id: "log_secant_tangent",
    label: "对数上凸割切",
    formula: "L_{AB} \\le \\ln x \\le L_{\\text{tan}}",
  },
  {
    key: "taylor_quadratic",
    id: "taylor_quadratic",
    label: "二阶多项式卡位",
    formula: "x - \\frac{1}{2}x^2 \\le \\ln(1+x) \\le x",
  },
];

/**
 * 各子模型对应的基准相切点横坐标
 */
export const subModelDefaultPointMap: Record<BaseSubModel, number> = {
  exp_x_plus_1: 0,
  exp_shift_x: 1,
  exp_ex: 1,
  log_x_minus_1: 1,
  log_shift_0: 0,
  log_x_div_e: Math.E,
};

export interface TangentScalingConfigOptions {
  baseSubModel?: BaseSubModel;
  sandwichSubModel?: SandwichSubModel;
  paramKSubModel?: ParamKSubModel;
  secantSubModel?: SecantSubModel;
}

/**
 * 根据当前激活模式与情景动态生成左屏参数控件列表
 */
export function getTangentScalingParamConfigs(
  mode: TangentScalingMode,
  params: TangentScalingParams,
  options?: TangentScalingConfigOptions,
): ParamConfig[] {
  switch (mode) {
    case "base": {
      const baseSub = options?.baseSubModel ?? "exp_x_plus_1";
      let min = -2.0;
      let max = 2.0;
      let step = 0.1;
      let marks: ParamConfig["marks"] = [
        {
          value: 0,
          variant: "critical",
          label: "基准切点",
          labelFormula: "x_0=0",
        },
      ];

      if (baseSub === "log_x_minus_1") {
        min = 0.2;
        max = 4.0;
        marks = [
          {
            value: 1,
            variant: "critical",
            label: "基准切点",
            labelFormula: "x_0=1",
          },
        ];
      } else if (baseSub === "log_x_div_e") {
        min = 0.5;
        max = 4.5;
        marks = [
          {
            value: 2.72,
            variant: "critical",
            label: "临界切点 e",
            labelFormula: "x_0=e",
          },
        ];
      } else if (baseSub === "log_shift_0") {
        min = -0.8;
        max = 3.5;
        marks = [
          {
            value: 0,
            variant: "critical",
            label: "基准切点",
            labelFormula: "x_0=0",
          },
        ];
      } else if (baseSub === "exp_shift_x" || baseSub === "exp_ex") {
        min = -1.5;
        max = 2.8;
        marks = [
          {
            value: 1,
            variant: "critical",
            label: "基准切点",
            labelFormula: "x_0=1",
          },
        ];
      }

      return [
        {
          key: "x0",
          label: "切点横坐标",
          labelFormula: `\\text{切点横坐标 } \\color{${MATH_COLORS.paramPrimary}}{x_0}`,
          group: "切线控制参数",
          value: params.x0,
          min,
          max,
          step,
          importance: "core",
          marks,
        },
      ];
    }

    case "sandwich": {
      const isOrigin = options?.sandwichSubModel === "origin_sandwich";
      const isParallel = options?.sandwichSubModel === "parallel_bands";
      return [
        {
          key: "evalX",
          label: "观察点横坐标",
          labelFormula: `\\text{观察点横坐标 } \\color{${MATH_COLORS.paramPrimary}}{x}`,
          group: "卡位观察",
          value: params.evalX,
          min: isOrigin ? -0.7 : 0.2,
          max: 3.5,
          step: 0.1,
          importance: "core",
          marks: [
            {
              value: isOrigin ? 0 : 1,
              variant: "critical",
              label: isOrigin ? "原点相切" : isParallel ? "对数切点" : "公切点",
              labelFormula: isOrigin ? "x=0" : "x=1",
            },
          ],
        },
      ];
    }

    case "param_k": {
      const sub = options?.paramKSubModel ?? "exp_log_k";
      const marks: ParamConfig["marks"] = [];
      if (sub === "exp_log_k" || sub === "log_kx_origin") {
        marks.push({
          value: 0.37,
          variant: "critical",
          label: "1/e",
          labelFormula: "\\frac{1}{e}",
        });
      }
      if (sub === "exp_log_k" || sub === "exp_kx_origin") {
        marks.push({
          value: 2.72,
          variant: "critical",
          label: "e",
          labelFormula: "e",
        });
      }

      return [
        {
          key: "k",
          label: "动直线斜率",
          labelFormula: `\\text{动直线斜率 } \\color{${MATH_COLORS.paramPrimary}}{k}`,
          group: "直线斜率参数",
          value: params.k,
          min: 0.1,
          max: 3.5,
          step: 0.05,
          importance: "core",
          marks,
        },
        {
          key: "evalX",
          label: "观察检验点",
          labelFormula: `\\text{检验点 } \\color{${MATH_COLORS.paramSecondary}}{x}`,
          group: "直线斜率参数",
          value: params.evalX,
          min: 0.2,
          max: 3.0,
          step: 0.1,
        },
      ];
    }

    case "secant": {
      const secSub = options?.secantSubModel ?? "exp_secant_tangent";
      if (secSub === "taylor_quadratic") {
        return [
          {
            key: "evalX",
            label: "卡位观察点",
            labelFormula: `\\text{观察点 } \\color{${MATH_COLORS.paramPrimary}}{x}`,
            group: "多项式展开评估",
            value: params.evalX,
            min: 0.0,
            max: 2.5,
            step: 0.1,
            importance: "core",
            marks: [
              {
                value: 0,
                variant: "critical",
                label: "展开点",
                labelFormula: "x=0",
              },
              {
                value: 1,
                variant: "critical",
                label: "标准点",
                labelFormula: "x=1",
              },
            ],
          },
        ];
      }

      const isLog = secSub === "log_secant_tangent";
      return [
        {
          key: "intervalA",
          label: "区间左端点",
          labelFormula: `\\text{左端点 } \\color{${MATH_COLORS.paramPrimary}}{a}`,
          group: "区间参数",
          value: params.intervalA,
          min: isLog ? 0.2 : 0.1,
          max: 1.5,
          step: 0.1,
        },
        {
          key: "intervalB",
          label: "区间右端点",
          labelFormula: `\\text{右端点 } \\color{${MATH_COLORS.paramSecondary}}{b}`,
          group: "区间参数",
          value: params.intervalB,
          min: 1.6,
          max: isLog ? 4.5 : 3.5,
          step: 0.1,
        },
      ];
    }
  }
}
