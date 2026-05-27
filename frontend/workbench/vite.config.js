import { fileURLToPath, URL } from 'node:url';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const workbenchRoot = fileURLToPath(new URL('.', import.meta.url));
const staticOutDir = fileURLToPath(new URL('../../src/symphony/workbench-static', import.meta.url));

export default defineConfig({
  root: workbenchRoot,
  plugins: [react()],
  server: {
    fs: {
      strict: true,
      allow: [workbenchRoot]
    }
  },
  build: {
    outDir: staticOutDir,
    emptyOutDir: true,
    modulePreload: {
      polyfill: false
    },
    minify: false,
    cssMinify: false
  }
});
