import { useContext } from "react";
import { UNSAFE_LocationContext } from "react-router-dom";

/**
 * 读取当前路由 URL 是否处于高三二轮/压轴视图（?view=gaokao）。
 * 使用 UNSAFE_LocationContext 安全兼容未被 Router 包裹的独立组件单元测试。
 */
export function useGaokaoView(): boolean {
  const ctx = useContext(UNSAFE_LocationContext);
  if (!ctx?.location?.search) return false;
  return new URLSearchParams(ctx.location.search).get("view") === "gaokao";
}
