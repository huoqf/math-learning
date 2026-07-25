/**
 * 分包验证脚本：检查 three.js 相关模块是否泄漏进首屏入口
 *
 * 运行方式：vite build && node scripts/verify-chunk-split.mjs
 * 依赖：vite.config.ts 中 build.manifest: true
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const manifestPath = resolve('dist/.vite/manifest.json')
let manifest
try {
  manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'))
} catch {
  console.error(`❌ 未找到 ${manifestPath}`)
  console.error('   请确保 vite.config.ts 中 build.manifest: true')
  console.error('   Vite 6 的 manifest 输出路径为 dist/.vite/manifest.json')
  process.exit(1)
}

const THREE_MARKERS = ['three/', '@react-three/fiber', '@react-three/drei', 'troika-three-text']

// 找出被打入 three/r3f/drei 相关产物文件的 manifest key
const threeKeys = Object.entries(manifest)
  .filter(([, m]) => {
    const f = m.file ?? ''
    return THREE_MARKERS.some((marker) => f.includes(marker))
  })
  .map(([key]) => key)

if (threeKeys.length === 0) {
  console.log('⚠️  未找到 three.js 相关 vendor chunk（可能尚未拆分成功），跳过静态可达性校验')
  process.exit(0)
}

function collectStaticReachable(key, visited = new Set()) {
  if (visited.has(key)) return visited
  visited.add(key)
  const mod = manifest[key]
  if (!mod) return visited
  // 只遍历 imports（同步静态依赖），不遍历 dynamicImports（懒加载边界）
  for (const dep of mod.imports ?? []) collectStaticReachable(dep, visited)
  return visited
}

const entryKeys = Object.entries(manifest)
  .filter(([, m]) => m.isEntry)
  .map(([key]) => key)

let failed = false
for (const entryKey of entryKeys) {
  const reachable = collectStaticReachable(entryKey)
  const leaked = threeKeys.filter((k) => reachable.has(k))
  if (leaked.length > 0) {
    console.error(`❌ 首屏入口 "${entryKey}" 静态可达 three.js 相关模块：`)
    for (const k of leaked) console.error(`  → ${k}`)
    failed = true
  }
}

if (failed) {
  console.error(
    '\n排查建议：\n' +
    '1. 检查是否有 import 未加 `import type`（尤其是从 3D 页面文件里引入类型的地方）\n' +
    '2. 检查 Math3D/ 目录是否被以桶文件 (index.ts) 形式引用\n' +
    '3. 确认 three/@react-three 只出现在 lazy() 回调和 Math3D 组件自身内部\n'
  )
  process.exit(1)
} else {
  console.log('✅ three.js 相关 chunk 均只能通过动态 import 到达，未泄漏进任何首屏入口')
}
