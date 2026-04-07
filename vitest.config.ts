import { defineConfig } from 'vitest/config';
import { configDefaults } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./client/src/test/setup.ts'],
    include: ['**/*.test.{ts,tsx}'],
    exclude: [...configDefaults.exclude, 'node_modules/**']
  },
});
