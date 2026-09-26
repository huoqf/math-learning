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

            // 数学计算层按学科板块分包（把 mathQuantities 的单体 chunk 拆成学科 chunk）
            //
            // 注意 solid 规则必须匹配「solid 前缀」而非「solidGeometry/ 目录」：
            // 立体几何 builder 是扁平的 solid*.ts（solidSpatialAngle / solidCircumSphere …），
            // solidGeometry.ts 只是它们的 re-export 桶；历史规则写成 solidGeometry[\\/] 要求
            // 一个从未被创建出来的目录，导致 13 个 solid builder 全部回落到 mathQuantities。
            // 同理，分发包名以 *-3d 结尾的立体几何 builder 与 src/math3d 同桶，可避免二者互引成环。
            if (/[\\/]src[\\/](data[\\/]builders[\\/]solid|math3d[\\/])/.test(id)) {
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
            if (/[\\/]src[\\/]data[\\/]builders[\\/](func|triangle|trig)/.test(id)) {
              return 'math-function'
            }
            if (/[\\/]src[\\/]data[\\/]builders[\\/](vector|complex|nike|sequence)/.test(id)) {
              return 'math-algebra'
            }
            if (/[\\/]src[\\/]data[\\/]builders[\\/](quadratic|constant|set|inequality|quantifiers)/.test(id)) {
              return 'math-basic'
            }
            // 兜底：凡 src/data/builders/ 下未被上面学科规则命中的文件，统一归入杂项 chunk。
            // 这样 mathQuantities chunk 只剩 dispatcher 骨架，且**新增 builder 不会回潮**到单体 chunk
            // ——逐前缀穷举必然漏网（circleCircle / pairedData / statPercentile / secondDerivative /
            // transcendental / tangentScaling 都曾漏掉），兜底规则把这一类问题一次性消灭。
            if (/[\\/]src[\\/]data[\\/]builders[\\/]/.test(id)) {
              return 'math-builders-misc'
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
