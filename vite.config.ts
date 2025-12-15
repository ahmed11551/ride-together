import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import type { Plugin } from "vite";

// Плагин для изменения порядка загрузки скриптов и добавления modulepreload
function fixScriptOrder(): Plugin {
  return {
    name: 'fix-script-order',
    transformIndexHtml(html) {
      // Находим все script теги
      const scriptRegex = /<script[^>]*src="([^"]*)"[^>]*><\/script>/g;
      const scripts: Array<{ tag: string; src: string; isEntry: boolean }> = [];
      let match;
      
      while ((match = scriptRegex.exec(html)) !== null) {
        const src = match[1];
        const isEntry = src.includes('/index-') && !src.includes('vendor') && !src.includes('react-router');
        scripts.push({ tag: match[0], src, isEntry });
      }
      
      if (scripts.length === 0) return html;
      
      // Разделяем на entry и vendor
      const entryScripts = scripts.filter(s => s.isEntry);
      const vendorScripts = scripts.filter(s => !s.isEntry);
      
      // Удаляем все script теги
      let newHtml = html;
      scripts.forEach(script => {
        newHtml = newHtml.replace(script.tag, '');
      });
      
      // КРИТИЧНО: Добавляем modulepreload для всех vendor chunks ПЕРЕД entry chunk
      // Это гарантирует, что все зависимости загружены до выполнения entry
      const preloadLinks = vendorScripts.map(s => 
        `    <link rel="modulepreload" href="${s.src}" crossorigin>`
      ).join('\n');
      
      // Вставляем сначала preload, потом entry, потом vendor scripts
      const allScripts = [...entryScripts, ...vendorScripts].map(s => s.tag).join('\n    ');
      const headEnd = newHtml.indexOf('</head>');
      const bodyEnd = newHtml.indexOf('</body>');
      
      if (headEnd > -1 && preloadLinks) {
        newHtml = newHtml.slice(0, headEnd) + '\n' + preloadLinks + '\n' + newHtml.slice(headEnd);
      }
      
      if (bodyEnd > -1) {
        newHtml = newHtml.slice(0, bodyEnd) + '    ' + allScripts + '\n' + newHtml.slice(bodyEnd);
      }
      
      return newHtml;
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react(), fixScriptOrder()],
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
    // КРИТИЧНО: Сохраняем сигнатуры entry точек для правильной загрузки
    rollupOptions: {
      preserveEntrySignatures: 'strict',
      output: {
        // КРИТИЧНО: Отключаем динамические импорты для React - он должен быть встроен
        // Это гарантирует синхронную загрузку React до всех других модулей
        manualChunks: (id) => {
          // КРИТИЧНО: React и react-dom НЕ должны быть в отдельном chunk
          // Они должны остаться в entry chunk для синхронной загрузки
          // Проверяем все возможные пути к React (более строгая проверка)
          if (
            id.includes('node_modules/react/') ||
            id.includes('node_modules/react-dom/') ||
            id.includes('node_modules/scheduler/') ||
            id.includes('/react/') ||
            id.includes('/react-dom/') ||
            id.includes('/scheduler/') ||
            id.includes('react/jsx-runtime') ||
            id.includes('react-dom/client') ||
            id.includes('react/index') ||
            id.includes('react-dom/index') ||
            id === 'react' ||
            id === 'react-dom' ||
            id.endsWith('/react') ||
            id.endsWith('/react-dom')
          ) {
            // Возвращаем undefined - React останется в entry chunk
            return undefined;
          }
          
          // НЕ разбиваем React на отдельный chunk - он должен быть в entry
          // Vendor chunks
          if (id.includes('node_modules')) {
            // React Router - зависит от React, но может быть в отдельном chunk
            if (id.includes('react-router')) {
              return 'react-router';
            }
            // React Query - зависит от React, но может быть в отдельном chunk
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
      'react/jsx-runtime',
      'react-dom',
      'react-dom/client',
      'react-router-dom',
      '@tanstack/react-query',
      'react-hook-form',
      'zod',
    ],
    exclude: ['@supabase/supabase-js'],
    // Предварительная оптимизация
    esbuildOptions: {
      target: 'esnext',
      // КРИТИЧНО: Убеждаемся, что React загружается синхронно
      jsx: 'automatic',
    },
    // Принудительная оптимизация React
    force: true,
    // КРИТИЧНО: Предзагружаем React синхронно
    entries: ['./src/main.tsx'],
  },
  // Предзагрузка модулей
  experimental: {
    renderBuiltUrl(filename: string) {
      return `/${filename}`;
    },
  },
});
