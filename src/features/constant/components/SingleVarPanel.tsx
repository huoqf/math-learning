/**
 * 单变量实验室左屏面板
 * 核心函数专题（超越/二次）+ 典型构型预设 + 研究目标与方法（量词/分离法/辅助图层）
 * 含单变量预设一键设置逻辑
 */
import { Dispatch, SetStateAction } from "react";
import { LeftPanelSection, SelectGrid, TabSwitcher } from "@/components/UI";
import type { TransModelKey } from "@/math/constant";
import type { FunModel, SingleLogic, SingleSubMode } from "./modeConfig";

interface SingleVarPanelProps {
  funModel: FunModel;
  setFunModel: Dispatch<SetStateAction<FunModel>>;
  transModel: TransModelKey;
  setTransModel: Dispatch<SetStateAction<TransModelKey>>;
  singlePresetKey: string;
  setSinglePresetKey: Dispatch<SetStateAction<string>>;
  subMode: SingleSubMode;
  setSubMode: Dispatch<SetStateAction<SingleSubMode>>;
  logic: SingleLogic;
  setLogic: Dispatch<SetStateAction<SingleLogic>>;
  showDerivative: boolean;
  setShowDerivative: Dispatch<SetStateAction<boolean>>;
  showTangent: boolean;
  setShowTangent: Dispatch<SetStateAction<boolean>>;
  setParams: Dispatch<SetStateAction<Record<string, number>>>;
}

export function SingleVarPanel({
  funModel,
  setFunModel,
  transModel,
  setTransModel,
  singlePresetKey,
  setSinglePresetKey,
  subMode,
  setSubMode,
  logic,
  setLogic,
  showDerivative,
  setShowDerivative,
  showTangent,
  setShowTangent,
  setParams,
}: SingleVarPanelProps) {
  const handleSinglePresetChange = (key: string) => {
    setSinglePresetKey(key);
    if (key === "free") return;

    if (funModel === "transcendent") {
      if (key === "trans_critical") {
        if (transModel === "ln_x_over_x") {
          setSubMode("sep");
          setParams((prev) => ({ ...prev, a: 0.37, m: 0.5, n: 3.5 }));
        } else if (transModel === "exp_minus_ax") {
          setSubMode("direct");
          setParams((prev) => ({ ...prev, a_axis: 1.0, m: 0.1, n: 2.0 }));
        } else if (transModel === "a_ln_x_minus_x") {
          setSubMode("direct");
          setShowTangent(true);
          setParams((prev) => ({ ...prev, a_axis: 1.0, m: 0.2, n: 3.0 }));
        } else if (transModel === "exp_minus_a_x_plus_1") {
          setSubMode("direct");
          setShowTangent(true);
          setParams((prev) => ({ ...prev, a_axis: 1.0, m: 0.1, n: 2.5 }));
        }
      } else if (key === "trans_left") {
        setParams((prev) => ({ ...prev, m: 0.2, n: 1.5 }));
      } else if (key === "trans_right") {
        setParams((prev) => ({ ...prev, m: 2.5, n: 5.0 }));
      }
    } else {
      if (key === "axis_left") {
        setSubMode("direct");
        setParams((prev) => ({ ...prev, a_axis: 0.0, m: 1.0, n: 3.0 }));
      } else if (key === "axis_inside") {
        setSubMode("direct");
        setParams((prev) => ({ ...prev, a_axis: 2.0, m: 1.0, n: 3.0 }));
      } else if (key === "axis_right") {
        setSubMode("direct");
        setParams((prev) => ({ ...prev, a_axis: 4.0, m: 1.0, n: 3.0 }));
      }
    }
  };

  return (
    <>
      {/* 2.1 核心函数专题 */}
      <LeftPanelSection title="核心函数专题">
        <TabSwitcher
          tabs={[
            { key: "transcendent", label: "超越函数压轴" },
            { key: "quadratic", label: "二次函数模型" },
          ]}
          value={funModel}
          onChange={(k) => {
            setFunModel(k as FunModel);
            setSinglePresetKey("free");
          }}
        />

        {funModel === "transcendent" && (
          <div className="pt-2">
            <div className="text-[10px] font-semibold text-neutral-400 mb-1">
              高考 4 大超越母题
            </div>
            <SelectGrid
              items={[
                {
                  key: "ln_x_over_x",
                  formula: "\\frac{\\ln x}{x}",
                  description: "极值点 x=e",
                },
                {
                  key: "exp_minus_ax",
                  formula: "e^x - ax",
                  description: "驻点 x=ln a",
                },
                {
                  key: "a_ln_x_minus_x",
                  formula: "a\\ln x - x + 1",
                  description: "x=1 切线放缩",
                },
                {
                  key: "exp_minus_a_x_plus_1",
                  formula: "e^x - a(x+1)",
                  description: "x=0 切线下界",
                },
              ]}
              value={transModel}
              onChange={(k) => {
                setTransModel(k as TransModelKey);
                setSinglePresetKey("free");
              }}
              variant="filled"
              columns={2}
            />
          </div>
        )}
      </LeftPanelSection>

      {/* 2.2 黄金 2x2 预设 */}
      <LeftPanelSection
        title="典型构型预设"
        subtitle="一键直达经典高考题型参数"
      >
        {funModel === "transcendent" ? (
          <SelectGrid
            items={[
              { key: "free", label: "自由探究", description: "全参数开放" },
              {
                key: "trans_critical",
                label: "极值相切",
                description: "临界点等号",
              },
              {
                key: "trans_left",
                label: "左偏区间",
                description: "单调递增区",
              },
              {
                key: "trans_right",
                label: "右偏区间",
                description: "单调递减区",
              },
            ]}
            value={singlePresetKey}
            onChange={handleSinglePresetChange}
            variant="filled"
            columns={2}
          />
        ) : (
          <SelectGrid
            items={[
              { key: "free", label: "自由探究", description: "全参数开放" },
              {
                key: "axis_left",
                label: "轴在区间左",
                description: "a < m 单调递增",
              },
              {
                key: "axis_inside",
                label: "轴在区间内",
                description: "m ≤ a ≤ n 顶点极值",
              },
              {
                key: "axis_right",
                label: "轴在区间右",
                description: "a > n 单调递减",
              },
            ]}
            value={singlePresetKey}
            onChange={handleSinglePresetChange}
            variant="filled"
            columns={2}
          />
        )}
      </LeftPanelSection>

      {/* 2.3 探究目标与方法 */}
      <LeftPanelSection
        title="研究目标与方法"
        subtitle="选择量词目标与求解转化方法"
      >
        <div className="space-y-2.5">
          <div>
            <label className="text-[10px] font-bold text-neutral-400 block mb-1">
              探索目标 (量词)
            </label>
            <SelectGrid
              items={[
                {
                  key: "always",
                  label: "恒成立 (∀x)",
                  description: "抓最小值守底线",
                },
                {
                  key: "exist",
                  label: "存在性 (∃x)",
                  description: "抓最大值求突破",
                },
              ]}
              value={logic}
              onChange={(k) => setLogic(k as SingleLogic)}
              variant="filled"
              columns={2}
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-neutral-400 block mb-1">
              核心解题方法
            </label>
            <SelectGrid
              items={[
                {
                  key: "sep",
                  label: "参变分离法",
                  description: "孤立参数看极值",
                },
                {
                  key: "direct",
                  label: "直接最值讨论",
                  description: "分类讨论单调性",
                },
              ]}
              value={subMode}
              onChange={(k) => setSubMode(k as SingleSubMode)}
              variant="filled"
              columns={2}
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-neutral-400 block mb-1">
              辅助分析图层
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => setShowDerivative((prev) => !prev)}
                className={`py-1.5 px-2 text-[11px] font-semibold rounded-lg border transition-all duration-200 text-center select-none ${
                  showDerivative
                    ? "bg-emerald-500 text-white border-emerald-500 shadow-sm"
                    : "bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-50"
                }`}
              >
                {showDerivative ? "✓ 导数 f'(x)" : "+ 导数 f'(x)"}
              </button>
              <button
                type="button"
                onClick={() => setShowTangent((prev) => !prev)}
                className={`py-1.5 px-2 text-[11px] font-semibold rounded-lg border transition-all duration-200 text-center select-none ${
                  showTangent
                    ? "bg-amber-500 text-white border-amber-500 shadow-sm"
                    : "bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-50"
                }`}
              >
                {showTangent ? "✓ 切线放缩" : "+ 切线放缩"}
              </button>
            </div>
          </div>
        </div>
      </LeftPanelSection>
    </>
  );
}
