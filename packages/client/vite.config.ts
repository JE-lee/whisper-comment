import { defineConfig } from 'vite'
import preact from '@preact/preset-vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [preact()],
  css: {
    postcss: './postcss.config.js',
  },
  build: {
    lib: {
      entry: 'src/lib.tsx',
      name: 'WhisperComment',
      fileName: (format) => `whisper-comment.${format}.js`,
      formats: ['es', 'umd']
    },
    rollupOptions: {
      external: [],
      output: {
        format: 'umd',
        name: 'WhisperComment',
        globals: {},
        sourcemap: false,
        manualChunks: undefined
      },
      // 启用更激进的tree shaking
      treeshake: {
        preset: 'smallest',
        propertyReadSideEffects: false,
        unknownGlobalSideEffects: false
      }
    },
    cssCodeSplit: false,
    sourcemap: false,
    // 使用 esbuild 压缩，更快且效果也很好
    minify: 'esbuild',
    // 降低chunk大小阈值以获得更多警告
    chunkSizeWarningLimit: 50,
    // 确保输出目录存在
    outDir: 'dist'
  }
})
