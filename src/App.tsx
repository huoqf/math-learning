import { Suspense, lazy } from "react";
import {
  HashRouter,
  Routes,
  Route,
  Link,
  useLocation,
  Navigate,
} from "react-router-dom";
import { KnowledgeTreeHome } from "./features/home/KnowledgeTreeHome";
import { Guarded3DPage } from "./components/Layout/Guarded3DPage";
import { routeEntries, PATH_TO_LABEL } from "./data/routeEntries";
import type { RouteEntry } from "./data/routeEntries";
import type { ComponentType } from "react";

/** 将命名导出的 loader 适配为 React.lazy 需要的 { default: Component } 格式 */
function adaptLoader(
  entry: RouteEntry,
): () => Promise<{ default: ComponentType }> {
  return async () => {
    const mod = await entry.loader();
    // 与 Guarded3DPage 同源：优先模块的 default 导出，缺省时才回退「首个函数导出」。
    // 页面模块除页面组件外还可能导出辅助纯函数（预设表、文案函数等），
    // 若只认「首个函数导出」，辅助函数会被误当成页面组件挂载，该路由直接崩页。
    const Component =
      typeof mod.default === "function"
        ? mod.default
        : Object.values(mod).find(
            (v): v is ComponentType => typeof v === "function",
          );
    return { default: Component! };
  };
}

/** 模块级惰性组件单例缓存，避免父级重渲染造成子树重复卸载挂载 */
const lazyComponentCache = new Map<
  string,
  React.LazyExoticComponent<ComponentType>
>();

function getLazyComponent(
  entry: RouteEntry,
): React.LazyExoticComponent<ComponentType> {
  const routeKey = entry.node.route || entry.node.id;
  let comp = lazyComponentCache.get(routeKey);
  if (!comp) {
    comp = lazy(adaptLoader(entry));
    lazyComponentCache.set(routeKey, comp);
  }
  return comp;
}

function Header() {
  const location = useLocation();
  const currentLabel = PATH_TO_LABEL[location.pathname];

  return (
    <header className="h-14 shrink-0 bg-white border-b border-neutral-200 flex items-center justify-between px-6 shadow-sm z-10">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xl font-bold bg-gradient-to-r from-primary-600 to-indigo-600 bg-clip-text text-transparent">
            MathVision
          </span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-500 font-medium border border-neutral-200">
            高中数学交互学习系统
          </span>
        </div>

        {currentLabel && (
          <div className="flex items-center gap-2 text-sm text-neutral-400 font-medium">
            <span className="text-neutral-300">/</span>
            <span className="text-neutral-600 font-semibold">
              {currentLabel}
            </span>
          </div>
        )}
      </div>
      <nav className="flex items-center gap-6">
        <Link
          to="/"
          className={`text-sm font-semibold py-4 px-1 border-b-2 transition-colors ${
            location.pathname === "/"
              ? "text-primary-600 border-primary-500"
              : "text-neutral-400 border-transparent hover:text-neutral-600 hover:border-neutral-300"
          }`}
        >
          知识地图
        </Link>
      </nav>
    </header>
  );
}

/** 加载中占位 */
function PageLoading() {
  return (
    <div className="flex items-center justify-center h-full text-neutral-400">
      加载中...
    </div>
  );
}

export default function App() {
  return (
    <HashRouter>
      <div className="w-screen h-screen flex flex-col overflow-hidden bg-neutral-50">
        <Header />
        <main className="flex-1 overflow-hidden">
          <Suspense fallback={<PageLoading />}>
            <Routes>
              <Route path="/" element={<KnowledgeTreeHome />} />
              {/* 旧路由重定向。
                  注意：此处路径不得与 routeEntries 的现行 route 重名——<Routes> 取首个匹配项，
                  重名会把正典路由静默劫持掉（历史事故：/set 曾被重定向到 /set-logic，
                  导致「集合的基本运算」页 SetVennPage 在应用内完全不可达）。 */}
              <Route
                path="/constant"
                element={<Navigate to="/constant-single" replace />}
              />
              <Route
                path="/paired-data"
                element={<Navigate to="/paired-data-regression" replace />}
              />
              <Route
                path="/function-properties"
                element={<Navigate to="/function-domain" replace />}
              />
              <Route
                path="/function-explog"
                element={<Navigate to="/function-exponential" replace />}
              />
              <Route
                path="/nike"
                element={<Navigate to="/nike-standard" replace />}
              />
              <Route
                path="/sequence"
                element={<Navigate to="/sequence-arithmetic" replace />}
              />
              {routeEntries.map((entry) => {
                const route = entry.node.route;
                if (!route) return null;

                if (entry.guarded3D) {
                  return (
                    <Route
                      key={route}
                      path={route}
                      element={<Guarded3DPage loader={entry.loader} />}
                    />
                  );
                }

                const LazyComponent = getLazyComponent(entry);
                return (
                  <Route key={route} path={route} element={<LazyComponent />} />
                );
              })}
              <Route path="*" element={<KnowledgeTreeHome />} />
            </Routes>
          </Suspense>
        </main>
      </div>
    </HashRouter>
  );
}
