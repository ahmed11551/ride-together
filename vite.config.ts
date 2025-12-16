import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import type { Plugin } from "vite";

// Плагин для изменения порядка загрузки скриптов - entry chunk должен быть первым
function fixScriptOrder(): Plugin {
  return {
    name: 'fix-script-order',
    transformIndexHtml: {
      enforce: 'post',
      transform(html, ctx) {
        // Находим все script теги с src (только модули)
        const scriptRegex = /<script[^>]*type="module"[^>]*src="([^"]*)"[^>]*><\/script>/g;
        const scripts: Array<{ tag: string; src: string; isEntry: boolean }> = [];
        let match;
        
        while ((match = scriptRegex.exec(html)) !== null) {
          const src = match[1];
          // Entry chunk - это index-*.js, но не vendor или react-router
          const isEntry = src.includes('/index-') && !src.includes('vendor') && !src.includes('react-router');
          scripts.push({ tag: match[0], src, isEntry });
        }
        
        if (scripts.length === 0) return html;
        
        // Разделяем на entry и vendor
        const entryScripts = scripts.filter(s => s.isEntry);
        const vendorScripts = scripts.filter(s => !s.isEntry);
        
        // Удаляем все найденные script теги (только модули)
        let newHtml = html;
        scripts.forEach(script => {
          newHtml = newHtml.replace(script.tag, '');
        });
        
        // КРИТИЧНО: Удаляем существующие React CDN скрипты (если есть) чтобы избежать дублирования
        // Удаляем все скрипты, которые содержат react или react-dom в src (включая многострочные)
        const reactCDNRegex = /<script[^>]*(?:react|react-dom)[^>]*>[\s\S]*?<\/script>/gi;
        newHtml = newHtml.replace(reactCDNRegex, '');
        // Также удаляем скрипты, которые устанавливают window.React (многострочные)
        const reactGlobalRegex = /<script[^>]*>[\s\S]*?window\.(React|ReactDOM)[\s\S]*?<\/script>/gi;
        newHtml = newHtml.replace(reactGlobalRegex, '');
        // Удаляем комментарии о React CDN
        const reactCommentRegex = /<!--[^>]*React[^>]*CDN[^>]*-->/gi;
        newHtml = newHtml.replace(reactCommentRegex, '');
        
        // КРИТИЧНО: Добавляем modulepreload для всех vendor chunks в <head>
        // Это гарантирует, что все зависимости загружены до выполнения entry
        const preloadLinks = vendorScripts
          .filter(s => s.src.startsWith('/assets/')) // Только локальные файлы
          .map(s => `    <link rel="modulepreload" href="${s.src}" crossorigin>`)
          .join('\n');
        
        // Вставляем preload в <head> перед </head>
        const headEnd = newHtml.lastIndexOf('</head>');
        if (headEnd > -1 && preloadLinks) {
          newHtml = newHtml.slice(0, headEnd) + '\n' + preloadLinks + '\n' + newHtml.slice(headEnd);
        }
        
        // КРИТИЧНО: Добавляем React CDN ПЕРЕД всеми модулями в продакшене
        // Это гарантирует синхронную загрузку React до React Router
        const reactCDN = `    <!-- КРИТИЧНО: React загружается через CDN синхронно перед всеми модулями -->
    <script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
    <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
    <script>
      // Экспортируем React в глобальную область для использования в модулях
      if (typeof React !== 'undefined') window.React = React;
      if (typeof ReactDOM !== 'undefined') window.ReactDOM = ReactDOM;
    </script>`;
        
        // Вставляем скрипты в <body> перед </body>
        // КРИТИЧНО: Сначала React CDN, потом entry chunk, затем vendor chunks
        // Это гарантирует, что React будет доступен до того, как React Router попытается его использовать
        const allScripts = reactCDN + '\n    ' + [...entryScripts, ...vendorScripts].map(s => s.tag).join('\n    ');
        const bodyEnd = newHtml.lastIndexOf('</body>');
        if (bodyEnd > -1) {
          newHtml = newHtml.slice(0, bodyEnd) + '\n    ' + allScripts + '\n' + newHtml.slice(bodyEnd);
        }
        
        // КРИТИЧНО: Также добавляем modulepreload для entry chunk в <head>
        // Это гарантирует предзагрузку entry chunk
        const entryPreload = entryScripts
          .filter(s => s.src.startsWith('/assets/'))
          .map(s => `    <link rel="modulepreload" href="${s.src}" crossorigin>`)
          .join('\n');
        
        if (headEnd > -1 && entryPreload) {
          newHtml = newHtml.slice(0, headEnd) + '\n' + entryPreload + '\n' + newHtml.slice(headEnd);
        }
        
        return newHtml;
      },
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
        // КРИТИЧНО: Встраиваем React в entry chunk через inlineDynamicImports
        // Это гарантирует синхронную загрузку React до всех других модулей
        // ВАЖНО: Это увеличит размер entry chunk, но решит проблему с порядком загрузки
        manualChunks: (id, { getModuleInfo }) => {
          const moduleInfo = getModuleInfo(id);
          // Если это entry модуль, встраиваем все его зависимости
          if (moduleInfo?.isEntry) {
            return undefined; // Entry остается монолитным
          }
          
          // КРИТИЧНО: React core ДОЛЖЕН быть в entry chunk
          // Проверяем ТОЛЬКО точные пути к React core
          if (
            (id.includes('node_modules/react/') || id.includes('node_modules/react/index')) &&
            !id.includes('react-router') && 
            !id.includes('react-helmet') && 
            !id.includes('react-hook-form') && 
            !id.includes('react-day-picker') && 
            !id.includes('react-resizable') &&
            !id.includes('react-query')
          ) {
            return undefined; // React остается в entry
          }
          
          if (
            (id.includes('node_modules/react-dom/') || id.includes('node_modules/react-dom/index')) &&
            !id.includes('react-router')
          ) {
            return undefined; // React DOM остается в entry
          }
          
          if (id.includes('node_modules/scheduler/')) {
            return undefined; // Scheduler остается в entry
          }
          
          if (id.includes('react/jsx-runtime') || id.includes('react-dom/client')) {
            return undefined; // JSX runtime остается в entry
          }
          
          // Только после проверки React проверяем остальные node_modules
          // КРИТИЧНО: React core ДОЛЖЕН быть в entry chunk
          // Проверяем ТОЛЬКО точные пути к React core
          if (
            (id.includes('node_modules/react/') || id.includes('node_modules/react/index')) &&
            !id.includes('react-router') && 
            !id.includes('react-helmet') && 
            !id.includes('react-hook-form') && 
            !id.includes('react-day-picker') && 
            !id.includes('react-resizable') &&
            !id.includes('react-query')
          ) {
            return undefined; // React остается в entry
          }
          
          if (
            (id.includes('node_modules/react-dom/') || id.includes('node_modules/react-dom/index')) &&
            !id.includes('react-router')
          ) {
            return undefined; // React DOM остается в entry
          }
          
          if (id.includes('node_modules/scheduler/')) {
            return undefined; // Scheduler остается в entry
          }
          
          if (id.includes('react/jsx-runtime') || id.includes('react-dom/client')) {
            return undefined; // JSX runtime остается в entry
          }
          
          // Только после проверки React проверяем остальные node_modules
          // НЕ разбиваем React на отдельный chunk - он должен быть в entry
          // Vendor chunks
          if (id.includes('node_modules')) {
            // КРИТИЧНО: React core (react, react-dom, scheduler) НЕ должны быть в отдельном chunk
            // Проверяем ТОЛЬКО точные пути к React core, не все что содержит "react"
            const isReactCore = 
              (id.includes('node_modules/react/') && !id.includes('react-router') && !id.includes('react-helmet') && !id.includes('react-hook-form') && !id.includes('react-day-picker') && !id.includes('react-resizable') && !id.includes('react-query')) ||
              (id.includes('node_modules/react-dom/') && !id.includes('react-router')) ||
              id.includes('node_modules/scheduler/') ||
              id.includes('react/jsx-runtime') ||
              id.includes('react-dom/client');
            
            // Если это React core, НЕ разбиваем на chunk - останется в entry
            if (isReactCore) {
              return undefined;
            }
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
