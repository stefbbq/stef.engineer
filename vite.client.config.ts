import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    outDir: './dist/client',
    emptyOutDir: true,
    target: 'es2020',
    minify: 'esbuild',
    rollupOptions: {
      input: 'src/client/extensions.ts',
      output: {
        entryFileNames: 'extensions.js',
        format: 'iife',
        inlineDynamicImports: true,
      },
    },
  },
})
