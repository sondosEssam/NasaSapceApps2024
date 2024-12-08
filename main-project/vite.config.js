import { defineConfig } from 'vite';
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import path from 'path';

export default defineConfig({
  plugins: [
    nodePolyfills({
      protocolImports: true,
    }),
  ],
  build: {
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
        game: path.resolve(__dirname, 'model_structure.html')
      }
    },
    // Include all relevant assets
    assetsInclude: ['**/*.{png,jpg,svg,js,json}']
  }
});
