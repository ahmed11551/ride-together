import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Оптимизация бандла
    target: "esnext",
    minify: "esbuild",
    cssMinify: true,
    sourcemap: false,
    // Включаем сжатие
    reportCompressedSize: true,
    // Улучшенное разделение на чанки
    rollupOptions: {
      output: {
        // Разделение на чанки для лучшего кэширования
        manualChunks: (id) => {
          // Vendor chunks
          if (id.includes('node_modules')) {
            // React core
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
              return 'react-vendor';
            }
            // React Query
            if (id.includes('@tanstack/react-query')) {
              return 'query-vendor';
            }
            // UI библиотеки
            if (id.includes('@radix-ui') || id.includes('lucide-react') || id.includes('recharts')) {
              return 'ui-vendor';
            }
            // Supabase
            if (id.includes('@supabase')) {
              return 'supabase';
            }
            // Form libraries
            if (id.includes('react-hook-form') || id.includes('@hookform') || id.includes('zod')) {
              return 'form-vendor';
            }
            // Date libraries
            if (id.includes('date-fns') || id.includes('react-day-picker')) {
              return 'date-vendor';
            }
            // Остальные vendor библиотеки
            return 'vendor';
          }
        },
        // Оптимизация имен файлов
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name?.split('.') || [];
          const ext = info[info.length - 1];
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
            return `assets/images/[name]-[hash][extname]`;
          }
          if (/woff2?|eot|ttf|otf/i.test(ext)) {
            return `assets/fonts/[name]-[hash][extname]`;
          }
          return `assets/[ext]/[name]-[hash][extname]`;
        },
      },
    },
    // Увеличиваем лимит предупреждений о размере чанков
    chunkSizeWarningLimit: 1000,
    // Включаем tree-shaking
    treeshake: {
      moduleSideEffects: 'no-external',
    },
  },
  // Оптимизация зависимостей
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@tanstack/react-query',
      'react-hook-form',
      'zod',
    ],
    exclude: ['@supabase/supabase-js'],
    // Предварительная оптимизация
    esbuildOptions: {
      target: 'esnext',
    },
  },
  // Предзагрузка модулей
  experimental: {
    renderBuiltUrl(filename: string) {
      return `/${filename}`;
    },
  },
});
