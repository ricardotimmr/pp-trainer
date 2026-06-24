import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    exclude: [
      '**/node_modules/**',
      '**/e2e/**',       // Playwright tests — run separately via `npm run test:e2e`
      '**/*.spec.ts',    // Playwright spec files
    ],
  },
});
