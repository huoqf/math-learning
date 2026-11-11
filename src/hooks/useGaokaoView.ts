import { useSearchParams } from "react-router-dom";

/**
 * 读取当前路由是否处于高考大专题视角（`?view=gaokao`）。
 * 依赖全局 HashRouter 下的 useSearchParams，严禁在 render 期手写解析 window.location。
 */
export function useGaokaoView(): boolean {
  const [searchParams] = useSearchParams();
  return searchParams.get("view") === "gaokao";
}
