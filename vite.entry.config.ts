import { defineConfig } from 'vite'
import {
  ersFabricTransformPlugin,
  ersFabricJsxPlugin,
  ersSolidPlugin,
  ersRouteRegistryPlugin,
  ersStyleRegistryPlugin,
} from '@touchlesscode/core-vite'

export default defineConfig({
  plugins: [
    ersFabricTransformPlugin(),
    ersFabricJsxPlugin(),
    ersSolidPlugin(),
    ersRouteRegistryPlugin({ routesDir: 'src/routes' }),
    ersStyleRegistryPlugin({ routesDir: 'src/routes' }),
  ],
  build: {
    outDir: './dist',
    emptyOutDir: true,
    ssr: true,
    target: 'es2022',
    minify: false,
    rollupOptions: {
      input: 'src/index.tsx',
      output: {
        entryFileNames: 'index.js',
        format: 'es',
        inlineDynamicImports: true,
      },
      external: ['@cloudflare/workers-types'],
    },
  },
})
