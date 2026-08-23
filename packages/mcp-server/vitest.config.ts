import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // `tsc` emits the suite to dist/ alongside the server. Without this, every
    // test runs twice — once from source, once from its compiled copy — which
    // doubles the process spawns in stdout-purity.test.ts and reports phantom
    // duplicate results. The published tarball already excludes dist/__tests__
    // (package.json "files"), so the compiled copies are build residue only.
    exclude: ['**/node_modules/**', '**/dist/**'],
  },
});
