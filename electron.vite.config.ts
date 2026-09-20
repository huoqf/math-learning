import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    build: {
      rollupOptions: {
        input: {
          index: resolve(__dirname, 'electron/main.ts'),
        },
      },
    },
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    build: {
      rollupOptions: {
        input: {
          index: resolve(__dirname, 'electron/preload/index.ts'),
        },
        output: {
          format: 'cjs',
          entryFileNames: '[name].js',
        },
      },
    },
  },
  renderer: {
    root: '.',
    build: {
      minify: 'esbuild',
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
        input: {
          index: resolve(__dirname, 'index.html'),
        },
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (/[\\/]three[\\/]/.test(id) && !id.includes('@react-three')) return 'vendor-three-core'
              if (id.includes('@react-three/fiber')) return 'vendor-r3f'
              if (id.includes('@react-three/drei')) return 'vendor-drei'
              if (id.includes('troika-three')) return 'vendor-troika'
              if (id.includes('katex')) return 'vendor-katex'
              if (id.includes('react-dom') || /[\\/]react[\\/]/.test(id) || id.includes('react-router')) return 'vendor-react'
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
    plugins: [react()],
    resolve: {
      alias: {
        '@': resolve(__dirname, './src'),
      },
      dedupe: ['three'],
    },
  },
})
