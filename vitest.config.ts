import path from 'path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/__tests__/setup.ts'],
    include: ['src/__tests__/**/*.test.{ts,tsx}'],
    alias: {
      '/utils/supabase/info': path.resolve(__dirname, './src/__tests__/__mocks__/supabaseInfo.ts'),
      '/utils/supabase/client': path.resolve(__dirname, './src/__tests__/__mocks__/supabaseClient.ts'),
    },
    coverage: {
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/__tests__/**', 'src/app/components/figma/**', 'src/app/components/ui/**'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
