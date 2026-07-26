import { HashRouter, Routes, Route, Link, useLocation } from "react-router-dom";
import { QuadraticAnimation } from "./features/quadratic/QuadraticAnimation";
import { DerivativeAnimation } from "./features/derivative/DerivativeAnimation";
import { ConstantAnimation } from "./features/constant/ConstantAnimation";
import { SetAnimation } from "./features/set";
import { FuncPropertiesAnimation } from "./features/funcProperties";
import { FuncExpLogAnimation } from "./features/funcExpLog";
import { FuncZeroAnimation } from "./features/funcZero";
import { TransformAnimation } from "./features/transform";
import { CompositeAnimation } from "./features/composite";
import { NikeAnimation } from "./features/nike";
import { TranscendentalAnimation } from "./features/derivativeTranscendental";
import { DerivativeShiftAnimation } from "./features/derivativeShift";
import { ProbabilityCountingAnimation } from "./features/probabilityCounting";
import { ProbabilityBayesAnimation } from "./features/probabilityBayes";
import { ProbabilityDistributionAnimation } from "./features/probabilityDistribution";
import { ProbabilityNormalAnimation } from "./features/probabilityNormal";
import { PairedDataAnimation } from "./features/pairedData/PairedDataAnimation";
import { SequenceAnimation } from "./features/sequence";
import { KnowledgeTreeHome } from "./features/home/KnowledgeTreeHome";
import { Guarded3DPage } from "./components/Layout/Guarded3DPage";

const PATH_TO_LABEL: Record<string, string> = {
  "/sequence": "等差与等比数列实验室",
  "/set": "集合与常用逻辑实验室",
  "/function-properties": "函数性质实验室",
  "/function-explog": "指对幂函数实验室",
  "/function-zero": "零点二分法实验室",
  "/transform": "函数图象变换实验室",
  "/composite": "分段与复合函数实验室",
  "/quadratic": "二次函数实验室",
  "/derivative": "导数几何意义",
  "/constant": "恒成立实验室",
  "/nike": "对勾函数与双曲型实验室",
  "/derivative-transcendental": "基准超越函数与切线放缩模型",
  "/derivative-shift": "隐零点定理与极值点偏移",
  "/probability-counting": "计数原理与二项式定理实验室",
  "/probability-bayes": "条件概率与贝叶斯实验室",
  "/probability-distribution": "离散型随机变量分布列与数字特征",
  "/statistics-normal": "频率分布直方图与正态分布实验室",
  "/paired-data": "成对数据的回归分析与独立性检验",
  "/solid-angle": "空间角：长方体截面二面角",
  "/solid-position": "线面位置关系判定",
  "/solid-ball": "外接球与内切球",
  "/solid-rotation-body": "旋转体的结构特征",
  "/solid-section": "截面可视化",
};

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

export default function App() {
  return (
    <HashRouter>
      <div className="w-screen h-screen flex flex-col overflow-hidden bg-neutral-50">
        <Header />
        <main className="flex-1 overflow-hidden">
          <Routes>
            <Route path="/" element={<KnowledgeTreeHome />} />
            <Route path="/sequence" element={<SequenceAnimation />} />
            <Route path="/set" element={<SetAnimation />} />
            <Route
              path="/function-properties"
              element={<FuncPropertiesAnimation />}
            />
            <Route path="/function-explog" element={<FuncExpLogAnimation />} />
            <Route path="/function-zero" element={<FuncZeroAnimation />} />
            <Route path="/transform" element={<TransformAnimation />} />
            <Route path="/composite" element={<CompositeAnimation />} />
            <Route path="/quadratic" element={<QuadraticAnimation />} />
            <Route path="/derivative" element={<DerivativeAnimation />} />
            <Route path="/constant" element={<ConstantAnimation />} />
            <Route path="/nike" element={<NikeAnimation />} />
            <Route
              path="/derivative-transcendental"
              element={<TranscendentalAnimation />}
            />
            <Route
              path="/derivative-shift"
              element={<DerivativeShiftAnimation />}
            />
            <Route
              path="/probability-counting"
              element={<ProbabilityCountingAnimation />}
            />
            <Route
              path="/probability-bayes"
              element={<ProbabilityBayesAnimation />}
            />
            <Route
              path="/probability-distribution"
              element={<ProbabilityDistributionAnimation />}
            />
            <Route
              path="/statistics-normal"
              element={<ProbabilityNormalAnimation />}
            />
            <Route path="/paired-data" element={<PairedDataAnimation />} />
            {/* 3D 页面：WebGL 门禁 + 按需加载 */}
            <Route
              path="/solid-angle"
              element={
                <Guarded3DPage
                  loader={() =>
                    import("./features/solidGeometry/SpatialAngleAnimation")
                  }
                />
              }
            />
            <Route
              path="/solid-position"
              element={
                <Guarded3DPage
                  loader={() =>
                    import("./features/solidGeometry/LinePlaneRelationAnimation")
                  }
                />
              }
            />
            <Route
              path="/solid-ball"
              element={
                <Guarded3DPage
                  loader={() =>
                    import("./features/solidGeometry/CircumInSphereAnimation")
                  }
                />
              }
            />
            <Route
              path="/solid-rotation-body"
              element={
                <Guarded3DPage
                  loader={() =>
                    import("./features/solidGeometry/RotationBodyAnimation")
                  }
                />
              }
            />
            <Route
              path="/solid-section"
              element={
                <Guarded3DPage
                  loader={() =>
                    import("./features/solidGeometry/section/SectionCuboidDemo")
                  }
                />
              }
            />
            <Route path="*" element={<KnowledgeTreeHome />} />
          </Routes>
        </main>
      </div>
    </HashRouter>
  );
}
