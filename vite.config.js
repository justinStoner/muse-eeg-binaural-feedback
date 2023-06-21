import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig(() => {
  return {
    build: {
      outDir: 'build',
      lib: {
        formats: ['es', 'umd'],
      },
    },
    plugins: [react()],
  };
});
