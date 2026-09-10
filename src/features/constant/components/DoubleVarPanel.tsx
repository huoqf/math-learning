/**
 * 双变量对决左屏面板
 * 博弈量词关系选择 + 黄金 2x2 典型构型预设
 */
import { Dispatch, SetStateAction } from "react";
import { LeftPanelSection, SelectGrid } from "@/components/UI";
import type { SelectedLogic } from "./modeConfig";

interface DoubleVarPanelProps {
  selectedLogic: SelectedLogic;
  setSelectedLogic: Dispatch<SetStateAction<SelectedLogic>>;
  doublePresetKey: string;
  setDoublePresetKey: Dispatch<SetStateAction<string>>;
  setParams: Dispatch<SetStateAction<Record<string, number>>>;
}

export function DoubleVarPanel({
  selectedLogic,
  setSelectedLogic,
  doublePresetKey,
  setDoublePresetKey,
  setParams,
}: DoubleVarPanelProps) {
  const handleDoublePresetChange = (key: string) => {
    setDoublePresetKey(key);
    if (key === "free") return;

    if (selectedLogic === "same_var") {
      if (key === "critical_touch") {
        setParams((prev) => ({
          ...prev,
          xf: 1.25,
          yf: 1.5,
          xg: 2.25,
          yg: 2.0,
        }));
      } else if (key === "safe_isolate") {
        setParams((prev) => ({
          ...prev,
          xf: 1.25,
          yf: 2.2,
          xg: 2.25,
          yg: 1.5,
        }));
      } else if (key === "partial_overlap") {
        setParams((prev) => ({
          ...prev,
          xf: 1.25,
          yf: 1.0,
          xg: 2.25,
          yg: 2.2,
        }));
      }
    } else if (selectedLogic === "all_all") {
      if (key === "critical_touch") {
        setParams((prev) => ({
          ...prev,
          xf: 1.0,
          yf: 2.0,
          xg: 2.0,
          yg: 2.0,
        }));
      } else if (key === "safe_isolate") {
        setParams((prev) => ({
          ...prev,
          xf: 1.0,
          yf: 3.0,
          xg: 2.0,
          yg: 2.0,
        }));
      } else if (key === "partial_overlap") {
        setParams((prev) => ({
          ...prev,
          xf: 1.0,
          yf: 1.4,
          xg: 2.0,
          yg: 2.0,
        }));
      }
    } else if (selectedLogic === "all_exist") {
      if (key === "critical_touch") {
        setParams((prev) => ({
          ...prev,
          xf: 1.0,
          yf: 1.0,
          xg: 2.0,
          yg: 2.0,
        }));
      } else if (key === "safe_isolate") {
        setParams((prev) => ({
          ...prev,
          xf: 1.0,
          yf: 1.8,
          xg: 2.0,
          yg: 2.0,
        }));
      } else if (key === "partial_overlap") {
        setParams((prev) => ({
          ...prev,
          xf: 1.0,
          yf: 0.4,
          xg: 2.0,
          yg: 2.0,
        }));
      }
    } else if (selectedLogic === "exist_all") {
      if (key === "critical_touch") {
        setParams((prev) => ({
          ...prev,
          xf: 1.0,
          yf: 1.0,
          xg: 2.0,
          yg: 2.0,
        }));
      } else if (key === "safe_isolate") {
        setParams((prev) => ({
          ...prev,
          xf: 1.0,
          yf: 1.6,
          xg: 2.0,
          yg: 2.0,
        }));
      } else if (key === "partial_overlap") {
        setParams((prev) => ({
          ...prev,
          xf: 1.0,
          yf: 0.4,
          xg: 2.0,
          yg: 2.0,
        }));
      }
    } else if (selectedLogic === "exist_exist") {
      if (key === "critical_touch") {
        setParams((prev) => ({
          ...prev,
          xf: 1.0,
          yf: 0.0,
          xg: 2.0,
          yg: 2.0,
        }));
      } else if (key === "safe_isolate") {
        setParams((prev) => ({
          ...prev,
          xf: 1.0,
          yf: 0.8,
          xg: 2.0,
          yg: 2.0,
        }));
      } else if (key === "partial_overlap") {
        setParams((prev) => ({
          ...prev,
          xf: 1.0,
          yf: -0.8,
          xg: 2.0,
          yg: 2.0,
        }));
      }
    }
  };

  const presetItems =
    selectedLogic === "same_var"
      ? [
          { key: "free", label: "自由探究", description: "全参数自主探索" },
          {
            key: "critical_touch",
            label: "曲线公切",
            description: "差函数恰好相切触零",
          },
          {
            key: "safe_isolate",
            label: "严格高于",
            description: "全域无交点严格大于",
          },
          {
            key: "partial_overlap",
            label: "交叉穿透",
            description: "曲线相交产生违背",
          },
        ]
      : selectedLogic === "all_all"
        ? [
            { key: "free", label: "自由探究", description: "全参数自主探索" },
            {
              key: "critical_touch",
              label: "外切临界",
              description: "极小与极大相切接触",
            },
            {
              key: "safe_isolate",
              label: "完全隔离",
              description: "极值完全分离无交集",
            },
            {
              key: "partial_overlap",
              label: "值域交错",
              description: "值域重叠导致违背",
            },
          ]
        : selectedLogic === "all_exist"
          ? [
              { key: "free", label: "自由探究", description: "全参数自主探索" },
              {
                key: "critical_touch",
                label: "保底临界",
                description: "极小底线接触持平",
              },
              {
                key: "safe_isolate",
                label: "充分保底",
                description: "极小高于底线成立",
              },
              {
                key: "partial_overlap",
                label: "击穿底线",
                description: "跌破底线导致失效",
              },
            ]
          : selectedLogic === "exist_all"
            ? [
                {
                  key: "free",
                  label: "自由探究",
                  description: "全参数自主探索",
                },
                {
                  key: "critical_touch",
                  label: "顶峰临界",
                  description: "两峰顶持平接触",
                },
                {
                  key: "safe_isolate",
                  label: "突破压制",
                  description: "峰顶突围成功压制",
                },
                {
                  key: "partial_overlap",
                  label: "全域受压",
                  description: "峰顶受限压制失败",
                },
              ]
            : [
                {
                  key: "free",
                  label: "自由探究",
                  description: "全参数自主探索",
                },
                {
                  key: "critical_touch",
                  label: "门槛临界",
                  description: "峰顶触及谷底接触",
                },
                {
                  key: "safe_isolate",
                  label: "跨越门槛",
                  description: "峰顶超越谷底有解",
                },
                {
                  key: "partial_overlap",
                  label: "门槛落空",
                  description: "未及门槛完全无解",
                },
              ];

  return (
    <>
      {/* 3.1 双变量博弈量词模式 */}
      <LeftPanelSection
        title="博弈量词关系"
        subtitle="双动点对决与同变量差函数"
      >
        <SelectGrid
          items={[
            {
              key: "all_all",
              label: "任意对任意",
              description: "∀x₁, ∀x₂ 极值完全隔离",
            },
            {
              key: "all_exist",
              label: "任意对存在",
              description: "∀x₁, ∃x₂ 极小保底支撑",
            },
            {
              key: "exist_all",
              label: "存在对任意",
              description: "∃x₁, ∀x₂ 极大顶峰压制",
            },
            {
              key: "exist_exist",
              label: "存在对存在",
              description: "∃x₁, ∃x₂ 门槛局部超越",
            },
            {
              key: "same_var",
              label: "同自变量对垒",
              description: "∀x ∈ I₁ ∩ I₂ 差函数法",
              fullWidth: true,
            },
          ]}
          value={selectedLogic}
          onChange={(k) => {
            setSelectedLogic(k as SelectedLogic);
            setDoublePresetKey("free");
          }}
          variant="filled"
          columns={2}
        />
      </LeftPanelSection>

      {/* 3.2 黄金 2x2 典型构型预设 */}
      <LeftPanelSection
        title="典型构型预设"
        subtitle={
          selectedLogic === "same_var"
            ? "一键直达同变量差函数临界构型"
            : "一键直达双动点临界与博弈构型"
        }
      >
        <SelectGrid
          items={presetItems}
          value={doublePresetKey}
          onChange={handleDoublePresetChange}
          variant="filled"
          columns={2}
        />
      </LeftPanelSection>
    </>
  );
}
