/**
 * 中屏底部高考规范分布矩阵表
 * 依据模式渲染三类对照表：
 *  - compare  ：超几何 vs 二项分列概率对照
 *  - decision ：方案 A/B 期望-方差决策对照
 *  - 其余      ：标准分布列 x_i / P_i 矩阵表（线性变换额外附 y_i = aX+b 行）
 */
import type {
  DistributionResult,
  DistributionComparisonResult,
  DecisionScenarioResult,
} from "@/math/probabilityDistribution";
import type { StudyMode } from "./modeConfig";

interface DistributionTableProps {
  studyMode: StudyMode;
  distResult: DistributionResult;
  linearA?: number;
  linearB?: number;
  comparisonResult?: DistributionComparisonResult;
  decisionResult?: DecisionScenarioResult;
}

export function DistributionTable({
  studyMode,
  distResult,
  linearA = 2,
  linearB = 1,
  comparisonResult,
  decisionResult,
}: DistributionTableProps) {
  return (
    <div className="overflow-x-auto max-w-full">
      <table className="min-w-full text-center border-collapse bg-neutral-50/90 rounded border border-neutral-200 text-xs font-mono">
        {studyMode === "compare" && comparisonResult ? (
          <>
            <thead>
              <tr className="bg-neutral-100/80 text-neutral-700 font-bold border-b border-neutral-200">
                <th className="px-2.5 py-0.5 border-r border-neutral-200 text-primary-700 font-bold">
                  k
                </th>
                {comparisonResult.binomDist.outcomes.map((o) => (
                  <th
                    key={`th-k-${o.x}`}
                    className="px-2 py-0.5 border-r border-neutral-200 min-w-[36px]"
                  >
                    {o.x}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="bg-blue-50/70 text-blue-900 border-b border-neutral-200">
                <td className="px-2.5 py-0.5 font-bold text-blue-800 border-r border-neutral-200 bg-blue-100/60">
                  P_超
                </td>
                {comparisonResult.binomDist.outcomes.map((o) => {
                  const pHyper =
                    comparisonResult.hyperDist.outcomes.find((h) => h.x === o.x)
                      ?.p || 0;
                  return (
                    <td
                      key={`td-hyper-${o.x}`}
                      className="px-2 py-0.5 border-r border-neutral-200 font-medium"
                    >
                      {pHyper.toFixed(3)}
                    </td>
                  );
                })}
              </tr>
              <tr className="bg-amber-50/70 text-amber-900">
                <td className="px-2.5 py-0.5 font-bold text-amber-800 border-r border-neutral-200 bg-amber-100/60">
                  P_二项
                </td>
                {comparisonResult.binomDist.outcomes.map((o) => (
                  <td
                    key={`td-binom-${o.x}`}
                    className="px-2 py-0.5 border-r border-neutral-200 font-medium"
                  >
                    {o.p.toFixed(3)}
                  </td>
                ))}
              </tr>
            </tbody>
          </>
        ) : studyMode === "decision" && decisionResult ? (
          <>
            <thead>
              <tr className="bg-neutral-100/80 text-neutral-700 font-bold border-b border-neutral-200">
                <th className="px-2.5 py-0.5 border-r border-neutral-200 text-primary-700 font-bold">
                  方案
                </th>
                <th className="px-2.5 py-0.5 border-r border-neutral-200 text-neutral-700">
                  分布状态与概率
                </th>
                <th className="px-2.5 py-0.5 border-r border-neutral-200 text-primary-800 font-bold">
                  期望 E
                </th>
                <th className="px-2.5 py-0.5 text-primary-800 font-bold">
                  方差 D
                </th>
              </tr>
            </thead>
            <tbody>
              <tr className="bg-emerald-50/70 border-b border-neutral-200">
                <td className="px-2.5 py-0.5 font-bold text-emerald-800 border-r border-neutral-200 bg-emerald-100/60">
                  方案 A
                </td>
                <td className="px-2.5 py-0.5 border-r border-neutral-200 text-left text-neutral-700">
                  {decisionResult.schemeADist.outcomes
                    .map((o) => `${o.label}: ${(o.p * 100).toFixed(0)}%`)
                    .join(" | ")}
                </td>
                <td className="px-2.5 py-0.5 font-bold text-emerald-800 border-r border-neutral-200">
                  {decisionResult.schemeADist.mean.toFixed(2)}
                </td>
                <td className="px-2.5 py-0.5 font-bold text-emerald-800">
                  {decisionResult.schemeADist.variance.toFixed(2)}
                </td>
              </tr>
              <tr className="bg-rose-50/70">
                <td className="px-2.5 py-0.5 font-bold text-rose-800 border-r border-neutral-200 bg-rose-100/60">
                  方案 B
                </td>
                <td className="px-2.5 py-0.5 border-r border-neutral-200 text-left text-neutral-700">
                  {decisionResult.schemeBDist.outcomes
                    .map((o) => `${o.label}: ${(o.p * 100).toFixed(0)}%`)
                    .join(" | ")}
                </td>
                <td className="px-2.5 py-0.5 font-bold text-rose-800 border-r border-neutral-200">
                  {decisionResult.schemeBDist.mean.toFixed(2)}
                </td>
                <td className="px-2.5 py-0.5 font-bold text-rose-800">
                  {decisionResult.schemeBDist.variance.toFixed(2)}
                </td>
              </tr>
            </tbody>
          </>
        ) : (
          <>
            <thead>
              <tr className="bg-neutral-100/80 text-neutral-700 font-bold border-b border-neutral-200">
                <th className="px-2.5 py-0.5 border-r border-neutral-200 text-primary-700 font-bold">
                  x_i
                </th>
                {distResult.outcomes.map((o) => (
                  <th
                    key={`th-x-${o.x}`}
                    className="px-2 py-0.5 border-r border-neutral-200 min-w-[32px]"
                  >
                    {o.label || o.x}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {studyMode === "linear" && (
                <tr className="bg-amber-50/70 text-amber-900 font-bold border-b border-neutral-200">
                  <td className="px-2.5 py-0.5 font-bold text-amber-800 border-r border-neutral-200 bg-amber-100/60">
                    y_i
                  </td>
                  {distResult.outcomes.map((o) => (
                    <td
                      key={`td-y-${o.x}`}
                      className="px-2 py-0.5 border-r border-neutral-200 text-amber-900 font-bold"
                    >
                      {(linearA * o.x + linearB).toFixed(1)}
                    </td>
                  ))}
                </tr>
              )}
              <tr>
                <td className="px-2.5 py-0.5 font-bold text-primary-700 border-r border-neutral-200 bg-neutral-100/50">
                  P_i
                </td>
                {distResult.outcomes.map((o) => (
                  <td
                    key={`td-p-${o.x}`}
                    className="px-2 py-0.5 border-r border-neutral-200 text-neutral-600 font-medium"
                  >
                    {o.p.toFixed(3)}
                  </td>
                ))}
              </tr>
            </tbody>
          </>
        )}
      </table>
    </div>
  );
}
