import { HashRouter, Routes, Route } from 'react-router-dom';
import { QuadraticAnimation } from './features/quadratic/QuadraticAnimation';

export default function App() {
  return (
    <HashRouter>
      <div className="w-screen h-screen flex flex-col overflow-hidden bg-neutral-50">
        {/* 全局简易 Header */}
        <header className="h-14 shrink-0 bg-white border-b border-neutral-200 flex items-center justify-between px-6 shadow-sm z-10">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold bg-gradient-to-r from-primary-600 to-indigo-600 bg-clip-text text-transparent">
              MathVision
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-500 font-medium border border-neutral-200">
              高中数学交互学习系统
            </span>
          </div>
          <nav className="flex items-center gap-6">
            <span className="text-sm font-semibold text-primary-600 border-b-2 border-primary-500 py-4 px-1">
              二次函数实验室
            </span>
          </nav>
        </header>

        {/* 核心内容区 */}
        <main className="flex-1 overflow-hidden">
          <Routes>
            <Route path="/" element={<QuadraticAnimation />} />
            <Route path="*" element={<QuadraticAnimation />} />
          </Routes>
        </main>
      </div>
    </HashRouter>
  );
}
