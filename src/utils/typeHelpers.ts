import type { ParamMeta } from "@/data/types";

/**
 * 从参数元数据字典推导强类型参数对象
 *
 * @example
 * export const paramMeta = defineParamRegistry({
 *   a: { key: "a", label: "$a$", min: -5, max: 5, defaultValue: 1 },
 *   b: { key: "b", label: "$b$", min: -5, max: 5, defaultValue: 0 },
 * });
 *
 * export type ConicParams = InferParams<typeof paramMeta>;
 * // ConicParams 推导为 { a: number; b: number }
 */
export type InferParams<T extends Record<string, unknown>> = {
  [K in keyof T]: number;
};

/**
 * 辅助定义参数注册表，保留键名字面量类型以供推导
 */
export function defineParamRegistry<
  K extends string,
  T extends Record<K, ParamMeta>,
>(registry: T): T {
  return registry;
}
