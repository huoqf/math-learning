# 代数/函数模型驱动黄金样板 (Algebra Function Model Golden Sample)

> 适用学科：函数与导数、零点逼近、不等式放缩、复合函数与方程求解等代数专题。

---

## 一、标准架构分工表

```
src/features/<topic>/
├── <Topic>Animation.tsx         # [页面总控] 组装 ThreePanel，LeftPanelSection，SelectGrid，ParamControl，TipCard，SceneLegend
├── components/
│   └── <Topic>Scene.tsx         # [中屏图形] CoordinateGrid, FunctionGraph, MathPoint, IntervalShadow, InteractivePoint
src/data/
├── registries/<topic>.ts        # [数据注册] 模型列表、defaultParams、paramMeta (三位一体色彩命名)
└── builders/<topic>.ts          # [右屏看板] buildMathQuantities 分支，导出特征量、定理、高考考点、Warning
```

---

## 二、核心代码片段黄金范式

### 1. 数据层 `registries/<topic>.ts` 标准写法
```ts
import type { ParamMeta } from "../types";
import { MATH_COLORS } from "@/theme";

export const paramMeta: Record<string, ParamMeta> = {
  intervalA: {
    key: "intervalA",
    label: "区间左端点 a",
    labelFormula: `\\text{区间左端点 } \\color{${MATH_COLORS.paramPrimary}}{a}`,
    min: -3.0,
    max: 3.0,
    step: 0.1,
    defaultValue: 1.0,
    importance: "core",
  },
  // 仅在存在数学分水岭点 (如 a=0) 时才配置单个 variant: 'critical' 的 mark，普通滑块绝不平铺 marks
};
```

### 2. 页面层 `<Topic>Animation.tsx` 声明式布局
```tsx
<ThreePanel
  left={
    <LeftPanel>
      <LeftPanelSection title="函数模型">
        <SelectGrid
          items={MODEL_KEYS.map((k) => ({
            key: k,
            label: MODELS[k].name,
            formula: MODELS[k].formula,
            fullWidth: true,
          }))}
          value={modelKey}
          onChange={handleModelChange}
          variant="filled"
          columns={1}
        />
      </LeftPanelSection>
      <LeftPanelSection title="参数调节">
        <ParamControl params={paramConfigs} onParamChange={handleParamChange} onReset={handleReset} />
      </LeftPanelSection>
      <LeftPanelSection title="教学导引" compact>
        <TipCard variant={tipConfig.variant}>
          <div>
            <span className="font-semibold">【特征】</span>
            <span>{tipConfig.condition}</span>
          </div>
          <div>
            <span className="font-semibold">【收敛】</span>
            <span>{tipConfig.question}</span>
          </div>
        </TipCard>
      </LeftPanelSection>
    </LeftPanel>
  }
  center={
    <div className="w-full h-full relative flex flex-col bg-white">
      <div className="absolute top-4 left-4 z-10 bg-white/95 backdrop-blur border border-neutral-200 rounded-lg px-3.5 py-2 shadow-sm">
        <KatexFormula formula={formulaHeaderLatex} mode="inline" />
      </div>
      <SceneLegend items={legendItems} />
      <AnimationSvgCanvas containerRef={containerRef} transform={vp.transform}>
        <TopicScene params={params} scale={scale} vp={vp} onParamChange={handleParamChange} fontScale={canvasSize.font} />
      </AnimationSvgCanvas>
    </div>
  }
  right={
    <MathPanel quantities={mathData.quantities} theorems={mathData.theorems} gaokaoPoints={mathData.gaokaoPoints} warnings={mathData.warnings} mnemonic={mathData.mnemonic} title="xxx看板" />
  }
/>
```
