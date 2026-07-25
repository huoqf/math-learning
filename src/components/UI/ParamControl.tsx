import React, { useEffect, useMemo, useRef, useState } from "react";
import { RotateCcw } from "lucide-react";
import { getStepDigits, formatByStep } from "./Slider";
import { KatexFormula } from "./KatexFormula";
import type {
  ParamImportance,
  ParamMark,
  ParamMarkVariant,
} from "@/data/types";

export interface ParamConfig {
  key: string;
  label: string;
  /** 参数标签的 KaTeX 公式（优先于 label 纯文本） */
  labelFormula?: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  group?: string;
  description?: string;
  /** 参数描述的 KaTeX 公式（优先于 description 纯文本） */
  descriptionFormula?: string;
  marks?: ParamMark[];
  importance?: ParamImportance;
  resetOnChange?: boolean;
}

interface ParamControlProps {
  params: ParamConfig[];
  onParamChange: (key: string, value: number) => void;
  onReset?: () => void;
  disabled?: boolean;
}

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

// ── 描述文字智能渲染 ──
// 处理 3 种 descriptionFormula 格式：
// 1. `$...$` 混合格式（中文 + 数学公式）
// 2. `\text{...}` 包裹格式（旧格式，限制：不支持嵌套大括号）
// 3. 纯 LaTeX（无中文）

function renderDescription(
  description: string | undefined,
  descriptionFormula: string | undefined,
): React.ReactNode {
  const text = descriptionFormula || description;
  if (!text) return null;

  // 纯 LaTeX：无中文字符，直接渲染
  if (!/[\u4e00-\u9fa5]/.test(text)) {
    return (
      <KatexFormula formula={text} mode="inline" className="!text-xs !my-0" />
    );
  }

  // `$...$` 混合格式：拆分渲染
  if (text.includes("$")) {
    const parts = text.split(/(\$[^$]+\$)/g);
    return (
      <span className="inline">
        {parts.map((part, i) => {
          if (part.startsWith("$") && part.endsWith("$")) {
            return (
              <KatexFormula
                key={i}
                formula={part.slice(1, -1)}
                mode="inline"
                className="!text-xs !my-0"
              />
            );
          }
          return <span key={i}>{part}</span>;
        })}
      </span>
    );
  }

  // `\text{...}` 格式：提取中文，数学部分渲染
  // 限制：不支持嵌套大括号（当前 28 条数据无嵌套）
  if (text.includes("\\text{")) {
    const parts = text.split(/(\\text\{[^}]+\})/g);
    return (
      <span className="inline">
        {parts.map((part, i) => {
          if (part.startsWith("\\text{") && part.endsWith("}")) {
            const content = part.slice(6, -1);
            return <span key={i}>{content}</span>;
          }
          if (part.trim()) {
            try {
              return (
                <KatexFormula
                  key={i}
                  formula={part}
                  mode="inline"
                  className="!text-xs !my-0"
                />
              );
            } catch {
              return <span key={i}>{part}</span>;
            }
          }
          return null;
        })}
      </span>
    );
  }

  // 纯文字
  return <span>{text}</span>;
}

const snapToStep = (value: number, param: ParamConfig) => {
  const step = param.step ?? 0.1;
  if (!Number.isFinite(step) || step <= 0) return value;
  const snapped = param.min + Math.round((value - param.min) / step) * step;
  const digits = Math.min(6, getStepDigits(step));
  return Number(clamp(snapped, param.min, param.max).toFixed(digits));
};

const markClass: Record<ParamMarkVariant, string> = {
  zero: "bg-neutral-400/70 text-neutral-400",
  critical: "bg-danger-500/80 text-danger-600",
  recommended: "bg-primary-500/80 text-primary-600",
};

function getMarkPercentage(markValue: number, param: ParamConfig) {
  if (param.max === param.min) return 0;
  return clamp(
    ((markValue - param.min) / (param.max - param.min)) * 100,
    0,
    100,
  );
}

/**
 * 标注优先级：auto(0) < zero(1) < 其他(2)
 * 数值越小越容易被隐藏（保护零点和用户显式标注）
 */
function markPriority(m: ParamMark & { auto?: boolean }): number {
  if (m.auto) return 0;
  if (m.variant === "zero") return 1;
  return 2;
}

/**
 * 基于像素间距的全局冲突检测
 * 轨道宽度推导：面板 320px - 左 label 40px - 右值 48px - gap 12px*2 = 208px → 取 220px 容错
 * MIN_GAP_PX = 28px ≈ 4 个字符宽度，防止标注文字重叠
 */
function detectMarkConflicts(
  marks: Array<ParamMark & { auto?: boolean }>,
  param: ParamConfig,
): Set<number> {
  const CONTAINER_WIDTH_PX = 220;
  const MIN_GAP_PX = 28;
  const minGapPercent = (MIN_GAP_PX / CONTAINER_WIDTH_PX) * 100;

  const conflicts = new Set<number>();

  for (let i = 0; i < marks.length; i++) {
    for (let j = i + 1; j < marks.length; j++) {
      const gap = Math.abs(
        getMarkPercentage(marks[i].value, param) -
          getMarkPercentage(marks[j].value, param),
      );
      if (gap < minGapPercent) {
        const hideIdx =
          markPriority(marks[i]) <= markPriority(marks[j]) ? i : j;
        conflicts.add(hideIdx);
      }
    }
  }

  return conflicts;
}

function buildMarks(param: ParamConfig): {
  visible: Array<ParamMark & { auto?: boolean }>;
  hidden: Array<ParamMark & { auto?: boolean }>;
} {
  const marks: Array<ParamMark & { auto?: boolean }> = (param.marks ?? [])
    .filter(
      (mark) =>
        Number.isFinite(mark.value) &&
        mark.value >= param.min &&
        mark.value <= param.max,
    )
    .map((mark) => ({ ...mark }));

  // 自动添加零点
  const hasZero = param.min < 0 && param.max > 0;
  const hasExplicitZero = marks.some((mark) => Math.abs(mark.value) < 1e-9);
  if (hasZero && !hasExplicitZero) {
    marks.push({
      value: 0,
      label: `0${param.unit ?? ""}`,
      variant: "zero",
      auto: true,
    });
  }

  // 全局冲突检测：优先隐藏 auto 标注，保护零点和用户显式标注
  const conflicts = detectMarkConflicts(marks, param);
  const visible = marks
    .filter((_, idx) => !conflicts.has(idx))
    .sort((a, b) => a.value - b.value);
  const hidden = marks.filter((_, idx) => conflicts.has(idx));

  return { visible, hidden };
}

export const ParamControl: React.FC<ParamControlProps> = ({
  params,
  onParamChange,
  onReset,
  disabled = false,
}) => {
  const [localValues, setLocalValues] = useState<Record<string, string>>({});
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const skipBlurCommitKey = useRef<string | null>(null);

  const inputWidth = useMemo(() => {
    const maxLen = params.reduce((acc, p) => {
      const step = p.step ?? 0.1;
      const len = Math.max(
        formatByStep(p.min, step).length,
        formatByStep(p.max, step).length,
      );
      return Math.max(acc, len);
    }, 3);
    return `${Math.max(6.5, maxLen + 2.5)}ch`;
  }, [params]);

  const paramsSignature = useMemo(
    () =>
      params
        .map(
          (p) =>
            `${p.key}:${p.value}:${p.min}:${p.max}:${p.step ?? 0.1}:${p.unit ?? ""}:${p.group ?? ""}`,
        )
        .join("|"),
    [params],
  );

  const groupedParams = useMemo(() => {
    const groups: Array<{ label: string; params: ParamConfig[] }> = [];
    const indexByGroup = new Map<string, number>();

    params.forEach((param) => {
      const groupLabel = param.group ?? "核心参数";
      const existingIndex = indexByGroup.get(groupLabel);
      if (existingIndex == null) {
        indexByGroup.set(groupLabel, groups.length);
        groups.push({ label: groupLabel, params: [param] });
      } else {
        groups[existingIndex].params.push(param);
      }
    });

    return groups;
  }, [params]);

  const showGroupTitle =
    groupedParams.length > 1 || params.some((param) => Boolean(param.group));

  useEffect(() => {
    setLocalValues((prev) => {
      const newValues: Record<string, string> = {};
      params.forEach((p) => {
        newValues[p.key] =
          editingKey === p.key && prev[p.key] != null
            ? prev[p.key]
            : formatByStep(p.value, p.step ?? 0.1);
      });
      return newValues;
    });
  }, [params, paramsSignature, editingKey]);

  const handleInputChange = (key: string, value: string) => {
    setLocalValues((prev) => ({ ...prev, [key]: value }));
  };

  const commitValue = (key: string, param: ParamConfig) => {
    const rawValue = localValues[key];
    const numValue = Number.parseFloat(rawValue);
    if (!Number.isNaN(numValue) && Number.isFinite(numValue)) {
      const normalizedValue = snapToStep(numValue, param);
      onParamChange(key, normalizedValue);
      setLocalValues((prev) => ({
        ...prev,
        [key]: formatByStep(normalizedValue, param.step ?? 0.1),
      }));
    } else {
      setLocalValues((prev) => ({
        ...prev,
        [key]: formatByStep(param.value, param.step ?? 0.1),
      }));
    }
    setEditingKey(null);
  };

  const handleSliderChange = (
    key: string,
    value: number,
    param: ParamConfig,
  ) => {
    const normalizedValue = snapToStep(value, param);
    onParamChange(key, normalizedValue);
    setLocalValues((prev) => ({
      ...prev,
      [key]: formatByStep(normalizedValue, param.step ?? 0.1),
    }));
  };

  const handleInputBlur = (key: string, param: ParamConfig) => {
    if (skipBlurCommitKey.current === key) {
      skipBlurCommitKey.current = null;
      return;
    }
    commitValue(key, param);
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    key: string,
    param: ParamConfig,
  ) => {
    if (e.key === "Enter") {
      e.preventDefault();
      commitValue(key, param);
    }
    if (e.key === "Escape") {
      e.preventDefault();
      skipBlurCommitKey.current = key;
      setLocalValues((prev) => ({
        ...prev,
        [key]: formatByStep(param.value, param.step ?? 0.1),
      }));
      setEditingKey(null);
      e.currentTarget.blur();
    }
  };

  const renderParam = (param: ParamConfig) => {
    const step = param.step ?? 0.1;
    const parsedValue = Number.parseFloat(localValues[param.key]);
    const safeValue = Number.isFinite(parsedValue)
      ? clamp(parsedValue, param.min, param.max)
      : param.value;
    const percentage = clamp(
      ((safeValue - param.min) / (param.max - param.min)) * 100,
      0,
      100,
    );
    const { visible: marks, hidden: hiddenMarks } = buildMarks(param);
    const zeroMark = marks.find((mark) => Math.abs(mark.value) < 1e-9);
    const zeroPercentage = zeroMark
      ? getMarkPercentage(zeroMark.value, param)
      : 0;
    const hasZeroMark = Boolean(zeroMark);
    const fillLeft = hasZeroMark ? Math.min(percentage, zeroPercentage) : 0;
    const fillWidth = hasZeroMark
      ? Math.abs(percentage - zeroPercentage)
      : percentage;

    return (
      <div
        key={param.key}
        className="space-y-2.5 pb-4 border-b border-neutral-100 last:border-0 last:pb-0"
      >
        <div className="flex items-start justify-between gap-2">
          <label
            className="min-w-0 text-xs font-semibold text-neutral-700 leading-6"
            htmlFor={`param-${param.key}`}
          >
            <span className="inline-flex items-center gap-1.5">
              {param.labelFormula ? (
                <span className="inline-flex items-center gap-1">
                  <KatexFormula
                    formula={param.labelFormula}
                    mode="inline"
                    className="!text-xs"
                  />
                  {param.unit && (
                    <span className="text-xs">({param.unit})</span>
                  )}
                </span>
              ) : (
                <span>
                  {param.label}
                  {param.unit ? ` (${param.unit})` : ""}
                </span>
              )}
            </span>
            {param.description && (
              <span className="mt-0.5 block text-xs font-normal leading-relaxed text-neutral-400">
                {renderDescription(param.description, param.descriptionFormula)}
              </span>
            )}
          </label>
          <div className="flex items-center gap-1.5 shrink-0">
            <input
              id={`param-${param.key}`}
              type="number"
              value={localValues[param.key] ?? ""}
              onFocus={() => setEditingKey(param.key)}
              onChange={(e) => handleInputChange(param.key, e.target.value)}
              onBlur={() => handleInputBlur(param.key, param)}
              onKeyDown={(e) => handleKeyDown(e, param.key, param)}
              min={param.min}
              max={param.max}
              step={step}
              disabled={disabled}
              style={{ width: inputWidth }}
              className="px-2 py-1 text-sm text-right font-mono bg-white border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              aria-label={`${param.label}数值`}
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-neutral-400 font-mono w-8 text-right shrink-0">
            {formatByStep(param.min, step)}
          </span>
          <div className="relative flex-1">
            <div className="relative h-2 bg-neutral-200 rounded-full flex items-center">
              {marks.map((mark) => {
                const markVariant = mark.variant ?? "recommended";
                return (
                  <div
                    key={`${param.key}-${mark.value}-${mark.label ?? ""}`}
                    className={[
                      "absolute top-1/2 -translate-y-1/2 w-px h-3.5 pointer-events-none z-[1]",
                      markClass[markVariant].split(" ")[0],
                    ].join(" ")}
                    style={{ left: `${getMarkPercentage(mark.value, param)}%` }}
                    aria-hidden="true"
                  />
                );
              })}
              <input
                type="range"
                min={param.min}
                max={param.max}
                step={step}
                value={safeValue}
                onChange={(e) =>
                  handleSliderChange(
                    param.key,
                    Number.parseFloat(e.target.value),
                    param,
                  )
                }
                disabled={disabled}
                className="peer absolute -inset-y-2 left-0 w-full h-6 opacity-0 cursor-pointer z-10"
                aria-label={`${param.label}滑块`}
              />
              <div
                className="absolute top-0 h-full bg-primary-500 rounded-full pointer-events-none transition-all duration-fast ease-standard peer-hover:bg-primary-600"
                style={{
                  left: `${fillLeft}%`,
                  width: `${fillWidth}%`,
                }}
              />
              <div
                className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white border-2 border-primary-500 rounded-full shadow-sm pointer-events-none transition-all duration-fast ease-standard peer-hover:scale-110 peer-focus-visible:ring-2 peer-focus-visible:ring-primary-300 peer-focus-visible:ring-offset-1 peer-active:scale-95"
                style={{
                  left: `calc(${percentage}% - 8px)`,
                }}
              />
            </div>
            {marks.some((mark) => mark.label) && (
              <div className="relative h-4 text-[10px] font-semibold w-full mt-1">
                {marks
                  .filter((mark) => mark.label)
                  .map((mark) => {
                    const markVariant = mark.variant ?? "recommended";
                    const [, textClass] = markClass[markVariant].split(" ");
                    return (
                      <span
                        key={`${param.key}-label-${mark.value}-${mark.label}`}
                        className={[
                          "absolute top-0 -translate-x-1/2 whitespace-nowrap",
                          textClass,
                        ].join(" ")}
                        style={{
                          left: `${getMarkPercentage(mark.value, param)}%`,
                        }}
                      >
                        {mark.labelFormula ? (
                          <KatexFormula
                            formula={mark.labelFormula}
                            mode="inline"
                            className="!text-[10px] !my-0"
                          />
                        ) : (
                          mark.label
                        )}
                      </span>
                    );
                  })}
              </div>
            )}
            {hiddenMarks.length > 0 && (
              <span
                className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[8px] text-neutral-400 cursor-help"
                title={`隐藏标注: ${hiddenMarks.map((m) => m.label ?? m.value).join(", ")}`}
              >
                ({hiddenMarks.length} hidden)
              </span>
            )}
          </div>
          <span className="text-xs text-neutral-400 font-mono w-8 text-left shrink-0">
            {formatByStep(param.max, step)}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div
      className={[
        "bg-white rounded-xl shadow-sm border border-neutral-200 p-4",
        disabled && "opacity-40 pointer-events-none",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-neutral-800">参数设置</h3>
        {onReset && (
          <button
            type="button"
            onClick={onReset}
            className="p-1.5 rounded-md text-neutral-400 hover:text-primary-700 hover:bg-primary-50 active:scale-[0.97] transition-all duration-instant ease-decelerate"
            aria-label="恢复默认参数"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="space-y-4">
        {groupedParams.map((group) => (
          <div key={group.label} className="space-y-3">
            {showGroupTitle && (
              <div className="flex items-center gap-2 text-xs font-bold text-neutral-500">
                <span className="h-px flex-1 bg-neutral-200" />
                <span>{group.label}</span>
                <span className="h-px flex-1 bg-neutral-200" />
              </div>
            )}
            {group.params.map(renderParam)}
          </div>
        ))}
      </div>
    </div>
  );
};
