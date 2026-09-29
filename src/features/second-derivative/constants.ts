/**
 * src/features/second-derivative/constants.ts
 * 二阶导数 · 拐点 · 琴生不等式实验室常量与图例转出
 *
 * 图例与画布的颜色 / 线型统一由 `./scenePalette` 提供（唯一事实源），
 * 此处只做转出，便于页面按既有路径引用。
 * 面积填充透明度 `AREA_FILL_ALPHA` 亦一并转出，避免场景自造常量。
 */

export {
  AREA_FILL_ALPHA,
  getSecondDerivativeLegendItems,
  getSecondDerivativePalette,
} from "./scenePalette";
export type { SecondDerivativeMode } from "./scenePalette";
