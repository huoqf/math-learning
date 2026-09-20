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
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined

          if (/[\\/]three[\\/]/.test(id) && !id.includes('@react-three')) return 'vendor-three-core'
          if (id.includes('@react-three/fiber')) return 'vendor-r3f'
          if (id.includes('@react-three/drei')) return 'vendor-drei'
          if (id.includes('troika-three')) return 'vendor-troika'
          if (id.includes('katex')) return 'vendor-katex'
          if (id.includes('react-dom') || /[\\/]react[\\/]/.test(id) || id.includes('react-router')) return 'vendor-react'
          return 'vendor-misc'
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
