/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';
export default defineConfig({
    plugins: [react()],
    base: './',
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
    server: {
        port: 5173,
    },
    build: {
        manifest: true,
        rollupOptions: {
            output: {
                manualChunks: function (id) {
                    if (!id.includes('node_modules'))
                        return undefined;
                    if (/[\\/]three[\\/]/.test(id) && !id.includes('@react-three'))
                        return 'vendor-three-core';
                    if (id.includes('@react-three/fiber'))
                        return 'vendor-r3f';
                    if (id.includes('@react-three/drei'))
                        return 'vendor-drei';
                    if (id.includes('troika-three'))
                        return 'vendor-troika';
                    if (id.includes('katex'))
                        return 'vendor-katex';
                    if (id.includes('react-dom') || /[\\/]react[\\/]/.test(id) || id.includes('react-router'))
                        return 'vendor-react';
                    return 'vendor-misc';
                },
            },
        },
        chunkSizeWarningLimit: 700,
    },
    test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: ['./src/test/setup.ts'],
        include: ['src/**/*.test.{ts,tsx}'],
    },
});
