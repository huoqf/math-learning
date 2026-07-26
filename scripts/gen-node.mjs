#!/usr/bin/env node
/**
 * gen-node.mjs — 知识树节点脚手架
 *
 * 自动生成：
 *   1. src/features/<name>/meta.ts        — 路由元数据（node + loader）
 *   2. src/features/<name>/<Name>Animation.tsx — 组件骨架
 *   3. src/features/<name>/index.ts       — barrel export
 *   4. 在 knowledgeTree.ts 中插入节点
 *   5. 在 routeEntries.ts 中插入路由条目
 *
 * 用法：
 *   node scripts/gen-node.mjs \
 *     --id know-xxx \
 *     --title "知识点标题" \
 *     --lab-title "实验室名称" \
 *     --chapter "章节" \
 *     --module "模块" \
 *     --importance core \
 *     --route /xxx \
 *     --anim-id anim-xxx \
 *     --prereq know-yyy,know-zzz
 *
 * 示例：
 *   node scripts/gen-node.mjs \
 *     --id know-trig-unit-circle \
 *     --title "任意角与单位圆中的三角函数线" \
 *     --lab-title "三角函数实验室" \
 *     --chapter "三角函数" \
 *     --module "三角函数概念" \
 *     --importance core \
 *     --route /trig-unit-circle \
 *     --anim-id anim-trig-unit-circle
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const SRC = resolve(__dirname, '../src')

// ── 参数解析 ──
function parseArgs() {
  const args = process.argv.slice(2)
  const opts = {}
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--')) {
      const key = args[i].slice(2).replace(/-([a-z])/g, (_, c) => c.toUpperCase())
      opts[key] = args[i + 1] ?? ''
      i++
    }
  }
  return opts
}

const opts = parseArgs()

// 必填参数校验
const required = ['id', 'title', 'labTitle', 'chapter', 'module', 'importance', 'route', 'animId']
const missing = required.filter(k => !opts[k])
if (missing.length > 0) {
  console.error(`❌ 缺少必填参数: ${missing.map(k => '--' + k.replace(/[A-Z]/g, c => '-' + c.toLowerCase())).join(', ')}`)
  console.error('\n用法: node scripts/gen-node.mjs --id know-xxx --title "标题" --lab-title "实验室" --chapter "章" --module "节" --importance core --route /xxx --anim-id anim-xxx')
  process.exit(1)
}

// 参数类型校验
if (!opts.id.startsWith('know-')) {
  console.error('❌ --id 必须以 know- 开头')
  process.exit(1)
}
if (!opts.route.startsWith('/')) {
  console.error('❌ --route 必须以 / 开头')
  process.exit(1)
}
if (!opts.animId.startsWith('anim-')) {
  console.error('❌ --anim-id 必须以 anim- 开头')
  process.exit(1)
}
const validImportance = ['basic', 'core', 'gaokao', 'hard', 'extend']
if (!validImportance.includes(opts.importance)) {
  console.error(`❌ --importance 必须是 ${validImportance.join(' | ')} 之一`)
  process.exit(1)
}

const prereqs = opts.prereq ? opts.prereq.split(',').filter(Boolean) : []
const componentName = opts.id
  .replace(/^know-/, '')
  .split('-')
  .map(s => s.charAt(0).toUpperCase() + s.slice(1))
  .join('') + 'Animation'

// feature 目录名（从 id 推导，如 know-sequence-arithmetic → sequence/arithmetic）
// 对于简单 id 如 know-trig-unit-circle，直接用去掉 know- 前缀的部分
const featureDirName = opts.id.replace(/^know-/, '')
const featureDir = resolve(SRC, `features/${featureDirName}`)

console.log(`\n🔧 生成知识树节点: ${opts.id}`)
console.log(`   Feature 目录: features/${featureDirName}/`)
console.log(`   组件: ${componentName}`)
console.log(`   路由: ${opts.route}`)
console.log()

// ── 1. 创建 feature 目录 ──
if (existsSync(featureDir)) {
  console.error(`❌ 目录已存在: ${featureDir}`)
  console.error('   请先手动删除或选择不同的 id')
  process.exit(1)
}
mkdirSync(featureDir, { recursive: true })

// ── 2. 创建 meta.ts ──
const metaContent = `import type { KnowledgeNode } from "@/data/types";

/**
 * ${opts.title}
 *
 * 路由映射：
 *   ${opts.route} → ${componentName}
 */
export const node: KnowledgeNode = {
  id: "${opts.id}",
  title: "${opts.title}",
  labTitle: "${opts.labTitle}",
  chapter: "${opts.chapter}",
  module: "${opts.module}",
  importance: "${opts.importance}",
  animationIds: ["${opts.animId}"],
  prerequisites: [${prereqs.map(p => `"${p}"`).join(', ')}],
  route: "${opts.route}",
};

/** 独立 loader，不进入 KnowledgeNode 类型 */
export const loader = () => import("./${componentName}");
`
writeFileSync(resolve(featureDir, 'meta.ts'), metaContent)
console.log('✅ 创建 meta.ts')

// ── 3. 创建 Animation.tsx 骨架 ──
const animContent = `import { useState } from "react";
import { ThreePanel } from "@/components/Layout";
import { MathPanel } from "@/components/UI";

export function ${componentName}() {
  return (
    <ThreePanel
      left={
        <div className="p-4">
          <h2 className="text-lg font-bold mb-4">${opts.title}</h2>
          {/* 左面板：参数控制 */}
        </div>
      }
      center={
        <div className="flex items-center justify-center h-full text-neutral-400">
          {/* 主画布 */}
          画布区域
        </div>
      }
      right={<MathPanel />}
    />
  );
}
`
writeFileSync(resolve(featureDir, `${componentName}.tsx`), animContent)
console.log(`✅ 创建 ${componentName}.tsx`)

// ── 4. 创建 index.ts ──
const indexContent = `export { ${componentName} } from "./${componentName}";
`
writeFileSync(resolve(featureDir, 'index.ts'), indexContent)
console.log('✅ 创建 index.ts')

// ── 5. 在 knowledgeTree.ts 中插入节点 ──
const ktPath = resolve(SRC, 'data/knowledgeTree.ts')
let ktContent = readFileSync(ktPath, 'utf-8')

// 检查是否已存在
if (ktContent.includes(`"${opts.id}"`)) {
  console.error(`❌ knowledgeTree.ts 中已存在节点 ${opts.id}`)
  process.exit(1)
}

// 找到插入位置：在最后一个 ']' 之前插入
const insertNode = `  {
    id: "${opts.id}",
    title: "${opts.title}",
    chapter: "${opts.chapter}",
    module: "${opts.module}",
    importance: "${opts.importance}",
    animationIds: ["${opts.animId}"],
    prerequisites: [${prereqs.map(p => `"${p}"`).join(', ')}],
  },`

// 在 knowledgeTree 数组的最后一个 ']' 之前插入
const lastBracket = ktContent.lastIndexOf('];')
ktContent = ktContent.slice(0, lastBracket) + insertNode + '\n' + ktContent.slice(lastBracket)
writeFileSync(ktPath, ktContent)
console.log('✅ 插入 knowledgeTree.ts')

// ── 6. 在 routeEntries.ts 中插入路由条目 ──
const rePath = resolve(SRC, 'data/routeEntries.ts')
let reContent = readFileSync(rePath, 'utf-8')

// 检查路由是否已存在
if (reContent.includes(`"${opts.route}"`)) {
  console.error(`❌ routeEntries.ts 中已存在路由 ${opts.route}`)
  process.exit(1)
}

// 插入 import
const importLine = `import {\n  node as ${featureDirName.replace(/-/g, '')}Node,\n  loader as ${featureDirName.replace(/-/g, '')}Loader,\n} from "@/features/${featureDirName}/meta";\n`

// 在最后的聚合导出之前插入 import
const lastImportIdx = reContent.lastIndexOf('// ── 聚合导出')
reContent = reContent.slice(0, lastImportIdx) + importLine + '\n' + reContent.slice(lastImportIdx)

// 在 routeEntries 数组中插入条目
const insertEntry = `  { node: ${featureDirName.replace(/-/g, '')}Node, loader: ${featureDirName.replace(/-/g, '')}Loader },`
const lastArrayEnd = reContent.lastIndexOf('];')
reContent = reContent.slice(0, lastArrayEnd) + insertEntry + '\n' + reContent.slice(lastArrayEnd)

writeFileSync(rePath, reContent)
console.log('✅ 插入 routeEntries.ts')

console.log(`\n🎉 完成！已生成以下文件：`)
console.log(`   features/${featureDirName}/meta.ts`)
console.log(`   features/${featureDirName}/${componentName}.tsx`)
console.log(`   features/${featureDirName}/index.ts`)
console.log(`\n📝 下一步：`)
console.log(`   1. 编辑 ${componentName}.tsx 实现画布和交互逻辑`)
console.log(`   2. 运行 npx vitest run src/data/knowledgeTree.test.ts 验证`)
console.log(`   3. 运行 npm run dev 测试页面`)
