import { lazy, Suspense, useMemo, type ComponentType } from "react";
import { isWebGLAvailable } from "@/utils/webglSupport";

interface Guarded3DPageProps {
  loader: () => Promise<{ default: ComponentType }>;
}

function PageLoading() {
  return (
    <div className="flex items-center justify-center h-full text-neutral-400">
      加载中...
    </div>
  );
}

/**
 * WebGL 能力门禁：不支持 WebGL 的设备完全不触发 three.js 相关 chunk 下载。
 *
 * 仅当 WebGL 可用时才构造 lazy()，dynamic import()（连带 three/r3f/drei chunk）
 * 只会在 <LazyPage/> 真正渲染时才发起网络请求。
 */
export const Guarded3DPage = ({ loader }: Guarded3DPageProps) => {
  const supported = useMemo(() => isWebGLAvailable(), []);

  const LazyPage = useMemo(
    () => (supported ? lazy(loader) : null),
    [supported],
  );

  if (!supported) {
    return (
      <div className="flex items-center justify-center h-full text-slate-500 text-sm p-8 text-center">
        当前浏览器不支持 WebGL，无法显示 3D 立体几何内容。
        <br />
        建议使用最新版 Chrome / Edge / Firefox 浏览器访问本页面。
      </div>
    );
  }

  return (
    <Suspense fallback={<PageLoading />}>{LazyPage && <LazyPage />}</Suspense>
  );
};
