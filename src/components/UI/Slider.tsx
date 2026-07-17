/* eslint-disable react-refresh/only-export-components */
import React from 'react'
import type { FontScaler } from '@/theme/fontScaler'

const getStepDigits = (step: number): number => {
  if (!Number.isFinite(step) || step <= 0) return 1
  const text = step.toString()
  if (text.includes('e-')) {
    const [, exp] = text.split('e-')
    return Number.parseInt(exp, 10)
  }
  return text.includes('.') ? text.split('.')[1].length : 0
}

const formatByStep = (value: number, step: number): string => {
  const digits = Math.min(4, getStepDigits(step))
  return value.toFixed(digits)
}

interface SliderProps {
  value: number
  min: number
  max: number
  step?: number
  unit?: string
  label?: string
  onChange: (value: number) => void
  disabled?: boolean
  minLabel?: string
  maxLabel?: string
  midLabel?: string
  formatValue?: (v: number) => string
  description?: string
  fillAnchor?: number
  ariaLabel?: string
  ariaValueText?: string
  font?: FontScaler
}

export const Slider: React.FC<SliderProps> = ({
  value,
  min,
  max,
  step = 0.1,
  unit = '',
  label,
  onChange,
  disabled = false,
  minLabel,
  maxLabel,
  midLabel,
  formatValue,
  description,
  fillAnchor = 0,
  ariaLabel,
  ariaValueText,
}) => {
  const safeStep = Number.isFinite(step) && step > 0 ? step : 0.1
  const percentage = ((value - min) / (max - min)) * 100

  const displayValue = formatValue ? formatValue(value) : formatByStep(value, safeStep)

  const anchor = Math.max(min, Math.min(max, fillAnchor))
  const anchorPct = ((anchor - min) / (max - min)) * 100
  const fillLeft = Math.min(percentage, anchorPct)
  const fillWidth = Math.abs(percentage - anchorPct)

  return (
    <div className={['w-full', disabled && 'opacity-40 pointer-events-none'].filter(Boolean).join(' ')}>
      {(label || unit) && (
        <div className="flex items-center justify-between mb-2">
          {label && <span className="text-sm font-medium text-neutral-700">{label}</span>}
          <span className="text-sm font-mono text-neutral-600">
            {displayValue}
            {unit && <span className="ml-1 text-neutral-500">{unit}</span>}
          </span>
        </div>
      )}
      {description && (
        <div className="text-right text-xs text-neutral-400 -mt-1 mb-2">{description}</div>
      )}
      <div className="relative h-2 bg-neutral-200 rounded-full flex items-center">
        <input
          type="range"
          min={min}
          max={max}
          step={safeStep}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          disabled={disabled}
          className="peer absolute -inset-y-2 left-0 w-full h-6 opacity-0 cursor-pointer z-10"
          aria-label={ariaLabel ?? label}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={value}
          aria-valuetext={ariaValueText ?? `${displayValue}${unit ? ` ${unit}` : ''}`}
        />
        <div
          className="absolute top-0 h-full bg-primary-500 rounded-full pointer-events-none transition-all duration-fast ease-standard peer-hover:bg-primary-600"
          style={{ left: `${fillLeft}%`, width: `${fillWidth}%` }}
        />
        <div
          className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white border-2 border-primary-500 rounded-full shadow-sm pointer-events-none transition-all duration-fast ease-standard peer-hover:scale-110 peer-focus-visible:ring-2 peer-focus-visible:ring-primary-300 peer-focus-visible:ring-offset-1 peer-active:scale-95"
          style={{ left: `calc(${percentage}% - 8px)` }}
        />
      </div>
      {(minLabel || maxLabel) && (
        <div className="relative flex justify-between text-xs text-neutral-400 mt-0.5">
          <span>{minLabel}</span>
          {midLabel && (
            <span className="absolute left-1/2 -translate-x-1/2">{midLabel}</span>
          )}
          <span>{maxLabel}</span>
        </div>
      )}
    </div>
  )
}

export { getStepDigits, formatByStep }
