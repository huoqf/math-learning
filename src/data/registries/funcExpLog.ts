import type { ParamMeta } from "../types";
import { MATH_COLORS } from "@/theme";

export const defaultParams: Record<string, number> = {
  x0: 1.5,
  baseA: 2.0,
  powerAlpha: 2.0,
};

export const paramMeta: Record<string, ParamMeta> = {
  x0: {
    key: "x0",
    label: "探究动点 x0",
    labelFormula: `\\text{探究动点 } \\color{${MATH_COLORS.function}}{x_0}`,
    min: -4.0,
    max: 4.0,
    step: 0.1,
    defaultValue: 1.5,
    importance: "core",
  },
  baseA: {
    key: "baseA",
    label: "指对数底数 a",
    labelFormula: `\\text{底数 } \\color{${MATH_COLORS.paramPrimary}}{a}`,
    // 下界取 0.2 而非 0.1：活跃页面 ExponentialPage / LogarithmicPage 的左屏滑块下限即为 0.2，
    // 且 0 < a < 0.2 时 a^x 在 x 负半轴瞬间冲出视口 (a = 0.1, x = -4 ⇒ y = 10⁴)，教学上不可用。
    // 本条目此前为 0.1，仅被非路由容器 FuncExpLogAnimation 消费，属口径不一致（P2-8）。
    min: 0.2,
    max: 4.0,
    step: 0.1,
    defaultValue: 2.0,
    importance: "core",
    marks: [
      {
        value: 1.0,
        variant: "critical",
        label: "退化 (a=1 非指数函数)",
        labelFormula: "a = 1",
      },
    ],
  },
  powerAlpha: {
    key: "powerAlpha",
    label: "幂函数指数 α",
    labelFormula: `\\text{幂指数 } \\color{${MATH_COLORS.paramPrimary}}{\\alpha}`,
    min: -2.0,
    max: 3.0,
    step: 0.5,
    defaultValue: 2.0,
    importance: "core",
    marks: [
      {
        value: 0,
        variant: "critical",
        label: "α = 0",
        labelFormula: "\\alpha = 0",
      },
      {
        value: 1,
        variant: "critical",
        label: "α = 1",
        labelFormula: "\\alpha = 1",
      },
    ],
  },
};
