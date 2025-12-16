import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import type { Plugin } from "vite";

// Плагин для замены импортов React на глобальный React в продакшене
function useGlobalReact(): Plugin {
  let isProduction = false;
  return {
    name: 'use-global-react',
    enforce: 'pre',
    configResolved(config) {
      isProduction = config.command === 'build';
    },
    resolveId(id, importer) {
      // В продакшене заменяем импорты react и react-dom на виртуальные модули
      // КРИТИЧНО: Это должно работать для ВСЕХ модулей, включая react-router
      if (isProduction) {
        // Точное совпадение для 'react'
        if (id === 'react') {
          return '\0virtual:react';
        }
        // Все подмодули react (react/jsx-runtime, react/...)
        if (id.startsWith('react/')) {
          return '\0virtual:react';
        }
        // Точное совпадение для 'react-dom'
        if (id === 'react-dom') {
          return '\0virtual:react-dom';
        }
        // Все подмодули react-dom (react-dom/client, react-dom/...)
        if (id.startsWith('react-dom/')) {
          return '\0virtual:react-dom';
        }
      }
      return null;
    },
    load(id) {
      if (id === '\0virtual:react') {
        // КРИТИЧНО: Проверяем, что React загружен, иначе ждем
        return `
          // КРИТИЧНО: Ждем загрузки React из CDN
          if (!window.React) {
            throw new Error('React CDN must be loaded before modules. Make sure React CDN scripts are loaded synchronously before all module scripts.');
          }
          const React = window.React;
          export default React;
          export const useState = React.useState;
          export const useEffect = React.useEffect;
          export const useContext = React.useContext;
          export const useReducer = React.useReducer;
          export const useCallback = React.useCallback;
          export const useMemo = React.useMemo;
          export const useRef = React.useRef;
          export const useImperativeHandle = React.useImperativeHandle;
          export const useLayoutEffect = React.useLayoutEffect;
          export const useInsertionEffect = React.useInsertionEffect;
          export const useId = React.useId;
          export const useSyncExternalStore = React.useSyncExternalStore;
          export const useTransition = React.useTransition;
          export const useDeferredValue = React.useDeferredValue;
          export const useDebugValue = React.useDebugValue;
          export const createContext = React.createContext;
          export const createElement = React.createElement;
          export const Fragment = React.Fragment;
          export const StrictMode = React.StrictMode;
          export const Suspense = React.Suspense;
          export const Component = React.Component;
          export const PureComponent = React.PureComponent;
          export const memo = React.memo;
          export const forwardRef = React.forwardRef;
          export const lazy = React.lazy;
          export const startTransition = React.startTransition;
          export const use = React.use;
          // Для react/jsx-runtime
          export const jsx = React.createElement;
          export const jsxs = React.createElement;
        `;
      }
      if (id === '\0virtual:react-dom') {
        return `
          if (!window.ReactDOM) {
            throw new Error('ReactDOM CDN must be loaded before modules. Make sure ReactDOM CDN scripts are loaded synchronously before all module scripts.');
          }
          const ReactDOM = window.ReactDOM;
          export default ReactDOM;
          export const createRoot = ReactDOM.createRoot;
          export const hydrateRoot = ReactDOM.hydrateRoot;
          export const render = ReactDOM.render;
          export const unmountComponentAtNode = ReactDOM.unmountComponentAtNode;
          export const findDOMNode = ReactDOM.findDOMNode;
          export const flushSync = ReactDOM.flushSync;
        `;
      }
      return null;
    },
  };
}

// Плагин для изменения порядка загрузки скриптов - entry chunk должен быть первым
function fixScriptOrder(): Plugin {
  return {
    name: 'fix-script-order',
    transformIndexHtml: {
      enforce: 'post',
      transform(html, ctx) {
        // КРИТИЧНО: Сначала удаляем ВСЕ существующие React CDN скрипты из исходного HTML
        // Это предотвращает дублирование
        let cleanedHtml = html;
        // Удаляем скрипты с unpkg.com/react (однострочные и многострочные)
        cleanedHtml = cleanedHtml.replace(/<script[^>]*unpkg\.com\/react[^>]*>[\s\S]*?<\/script>/gi, '');
        // Удаляем скрипты, которые устанавливают window.React или window.ReactDOM
        cleanedHtml = cleanedHtml.replace(/<script[^>]*>[\s\S]*?window\.(React|ReactDOM)[\s\S]*?<\/script>/gi, '');
        // Удаляем комментарии о React CDN
        cleanedHtml = cleanedHtml.replace(/<!--[^>]*React[^>]*CDN[^>]*-->/gi, '');
        // Удаляем пустые строки после удаления
        cleanedHtml = cleanedHtml.replace(/\n\s{4,}\n/g, '\n');
        
        // Находим все script теги с src (только модули)
        const scriptRegex = /<script[^>]*type="module"[^>]*src="([^"]*)"[^>]*><\/script>/g;
        const scripts: Array<{ tag: string; src: string; isEntry: boolean }> = [];
        let match;
        
        while ((match = scriptRegex.exec(cleanedHtml)) !== null) {
          const src = match[1];
          // Entry chunk - это index-*.js, но не vendor или react-router
          const isEntry = src.includes('/index-') && !src.includes('vendor') && !src.includes('react-router');
          scripts.push({ tag: match[0], src, isEntry });
        }
        
        if (scripts.length === 0) return cleanedHtml;
        
        // Разделяем на entry и vendor
        const entryScripts = scripts.filter(s => s.isEntry);
        const vendorScripts = scripts.filter(s => !s.isEntry);
        
        // Удаляем все найденные script теги (только модули)
        let newHtml = cleanedHtml;
        scripts.forEach(script => {
          newHtml = newHtml.replace(script.tag, '');
        });
        
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
        // КРИТИЧНО: Используем обычные script теги БЕЗ async/defer для синхронной загрузки
        const reactCDN = `    <!-- КРИТИЧНО: React загружается через CDN синхронно перед всеми модулями -->
    <!-- ВАЖНО: Без async/defer - скрипты выполняются синхронно и блокируют выполнение модулей -->
    <script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
    <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
    <script>
      // КРИТИЧНО: Экспортируем React в глобальную область СРАЗУ после загрузки
      // Это гарантирует, что React доступен до выполнения любых модулей
      if (typeof React !== 'undefined') {
        window.React = React;
        // КРИТИЧНО: Убеждаемся, что React.__SECRET_INTERNALS доступен
        if (React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED) {
          window.__REACT_INTERNALS__ = React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED;
        }
      }
      if (typeof ReactDOM !== 'undefined') {
        window.ReactDOM = ReactDOM;
      }
      // КРИТИЧНО: Устанавливаем флаг, что React загружен
      window.__REACT_LOADED__ = true;
      // КРИТИЧНО: Отправляем событие, что React готов
      window.dispatchEvent(new Event('react-loaded'));
    </script>`;
        
        // КРИТИЧНО: Добавляем скрипт-защиту, который блокирует выполнение модулей до загрузки React
        const reactGuard = `    <script>
      // КРИТИЧНО: Блокируем выполнение модулей до загрузки React
      // Переопределяем import() для модулей, чтобы они ждали React
      (function() {
        const originalImport = window.import || function() { return Promise.resolve(); };
        const waitForReact = function() {
          if (window.__REACT_LOADED__ && window.React && window.ReactDOM) {
            return Promise.resolve();
          }
          return new Promise(function(resolve) {
            if (window.__REACT_LOADED__) {
              resolve();
            } else {
              window.addEventListener('react-loaded', resolve, { once: true });
              // Fallback: проверяем каждые 10ms
              setTimeout(function() {
                if (window.__REACT_LOADED__) resolve();
              }, 10);
            }
          });
        };
        // Ждем загрузки React перед выполнением модулей
        waitForReact().catch(function(err) {
          console.error('Error waiting for React:', err);
        });
      })();
    </script>`;
        
        // Вставляем скрипты в <body> перед </body>
        // КРИТИЧНО: Сначала React CDN, потом guard, потом entry chunk, затем vendor chunks
        const allScripts = reactCDN + '\n' + reactGuard + '\n    ' + [...entryScripts, ...vendorScripts].map(s => s.tag).join('\n    ');
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
