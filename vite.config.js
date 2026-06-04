import { defineConfig } from 'vite';

export default defineConfig({
  // For GitHub Pages project sites: set BASE_URL env var to /repo-name/
  // e.g. BASE_URL=/phon-experiment/ yarn build
  // GitHub Actions sets this automatically via workflow env.
  base: process.env.BASE_URL ?? '/',
});
