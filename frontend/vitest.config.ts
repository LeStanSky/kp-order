import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: false,
    testTimeout: 15000,
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/test/**',
        'src/main.tsx',
        'src/**/*.test.{ts,tsx}',
        'src/api/**',
        'src/hooks/**',
        'src/types/**',
      ],
      thresholds: {
        lines: 70,
        statements: 75,
        functions: 60,
        branches: 68,
      },
    },
  },
  resolve: { alias: { '@': path.resolve(__dirname, './src') } },
});
