/// <reference types="vitest" />
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

// R3F 内建元素标签（jsdom 下用 React DOM 渲染 3D 元素树时会出现这些「非 HTML 标签」）
const R3F_INTRINSIC_TAGS = new Set([
  'mesh',
  'group',
  'line',
  'lineSegments',
  'sprite',
  'points',
  'primitive',
  'instancedMesh',
  'bufferAttribute',
  'ambientLight',
  'directionalLight',
  'pointLight',
  'spotLight',
  'hemisphereLight',
  'orthographicCamera',
  'perspectiveCamera',
])
const isR3fIntrinsic = (tag: string) =>
  R3F_INTRINSIC_TAGS.has(tag) ||
  /^[a-z][A-Za-z]*(?:Geometry|Material|Attribute)$/.test(tag)

export default defineConfig({
  plugins: [react()],
  base: './',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
    dedupe: ['three'],
  },
  server: {
    port: 5173,
  },
  build: {
    manifest: true,
    modulePreload: {
      resolveDependencies(_filename, deps) {
        return deps.filter(
          (dep) =>
            !dep.includes('vendor-three') &&
            !dep.includes('vendor-r3f') &&
            !dep.includes('vendor-drei') &&
            !dep.includes('vendor-troika'),
        )
      },
    },
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (/[\\/]three[\\/]/.test(id) && !id.includes('@react-three')) return 'vendor-three-core'
            if (id.includes('@react-three/fiber')) return 'vendor-r3f'
            if (id.includes('@react-three/drei')) return 'vendor-drei'
            if (id.includes('troika-three')) return 'vendor-troika'
            if (id.includes('katex')) return 'vendor-katex'
            // react-dom 依赖 scheduler：必须与 react 同桶，否则会形成
            // vendor-react ↔ vendor-misc 循环分包，模块初始化顺序错位后
            // 消费方在模块顶层读到的 React 绑定为 undefined（表现为启动即崩：
            // "Cannot read properties of undefined (reading 'forwardRef')"）。
            if (
              id.includes('react-dom') ||
              id.includes('react-router') ||
              /[\\/]react[\\/]/.test(id) ||
              /[\\/]scheduler[\\/]/.test(id)
            )
              return 'vendor-react'
            return 'vendor-misc'
          }

          // 数学计算层按学科板块分包（彻底解耦 mathQuantities 单体）
          if (/[\\/]src[\\/](data[\\/]builders[\\/]solidGeometry|math3d)[\\/]/.test(id)) {
            return 'math-solid-3d'
          }
          if (/[\\/]src[\\/](data[\\/]builders[\\/]derivative|math[\\/]derivative)/.test(id)) {
            return 'math-derivative'
          }
          if (/[\\/]src[\\/](data[\\/]builders[\\/]probability|math[\\/](probability|stat))/.test(id)) {
            return 'math-probability'
          }
          if (/[\\/]src[\\/](data[\\/]builders[\\/](conic|line|parabola)|math[\\/](conic|parabola|line))/.test(id)) {
            return 'math-conic'
          }
          return undefined
        },
      },
    },
    chunkSizeWarningLimit: 700,
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    // 3D 真渲染测试（src/test/harness/threeTestLayer.tsx）用 **React DOM** 渲染 R3F 内建元素，
    // React 必然会对 <mesh>/<sphereGeometry> 这类「非 HTML 标签」发 unrecognized / incorrect-casing
    // 告警，而这类告警不经 console.error 的可拦截路径（spy 无效），故在 runner 层按**标签白名单**过滤。
    // 白名单外的未知标签仍照常报警 —— 真写错标签不会被掩盖。
    onConsoleLog(log) {
      const matched =
        /The tag <([A-Za-z]+)> is unrecognized/.exec(log) ??
        /<([A-Za-z]+) \/> is using incorrect casing/.exec(log)
      if (matched && isR3fIntrinsic(matched[1])) return false
    },
  },
})
