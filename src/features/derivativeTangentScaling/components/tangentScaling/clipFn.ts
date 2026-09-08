/**
 * 定义域截断辅助包装，避免 FunctionGraph 在定义域外产生飞线。
 * range 为可选定义域区间，超出区间返回 NaN 从而断开曲线。
 */
export const clipFn =
  (f: (x: number) => number, range?: [number, number] | number[]) =>
  (x: number) => (!range || (x >= range[0] && x <= range[1]) ? f(x) : NaN);
