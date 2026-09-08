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

    if (key === "critical_touch") {
      setParams((prev) => ({
        ...prev,
        xf: 1.25,
        yf: 2.0,
        xg: 2.25,
        yg: 2.0,
      }));
    } else if (key === "safe_isolate") {
      setParams((prev) => ({
        ...prev,
        xf: 1.25,
        yf: 3.0,
        xg: 2.25,
        yg: 1.0,
      }));
    } else if (key === "cross_violate") {
      setParams((prev) => ({
        ...prev,
        xf: 1.25,
        yf: 1.4,
        xg: 2.25,
        yg: 2.6,
      }));
    }
  };

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
              label: "∀x₁, ∀x₂",
              description: "任意对任意(极值隔离)",
            },
            {
              key: "all_exist",
              label: "∀x₁, ∃x₂",
              description: "任意对存在(值域包含)",
            },
            {
              key: "exist_all",
              label: "∃x₁, ∀x₂",
              description: "存在对任意(最值压制)",
            },
            {
              key: "exist_exist",
              label: "∃x₁, ∃x₂",
              description: "存在对存在(值域相交)",
            },
            {
              key: "same_var",
              label: "∀x ∈ I₁ ∩ I₂ (同变量)",
              description: "同变量对垒 (差函数法 h(x) ≥ 0)",
              fullWidth: true,
            },
          ]}
          value={selectedLogic}
          onChange={(k) => setSelectedLogic(k as SelectedLogic)}
          variant="filled"
          columns={2}
        />
      </LeftPanelSection>

      {/* 3.2 黄金 2x2 典型构型预设 */}
      <LeftPanelSection
        title="典型构型预设"
        subtitle="一键直达双动点临界与博弈构型"
      >
        <SelectGrid
          items={[
            { key: "free", label: "自由探究", description: "全参数开放" },
            {
              key: "critical_touch",
              label: "临界相切",
              description: "f_min = g_max",
            },
            {
              key: "safe_isolate",
              label: "安全隔离",
              description: "f_min > g_max",
            },
            {
              key: "cross_violate",
              label: "交叉穿透",
              description: "f_min < g_max",
            },
          ]}
          value={doublePresetKey}
          onChange={handleDoublePresetChange}
          variant="filled"
          columns={2}
        />
      </LeftPanelSection>
    </>
  );
}
