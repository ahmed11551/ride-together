import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import type { Plugin } from "vite";

// Плагин для изменения порядка загрузки скриптов - entry chunk должен быть первым
function fixScriptOrder(): Plugin {
  return {
    name: 'fix-script-order',
    transformIndexHtml: {
      order: 'post',
      handler(html, ctx) {
        // Находим все script теги с src (только модули)
        const scriptRegex = /<script[^>]*type=["']module["'][^>]*src=["']([^"']*)["'][^>]*><\/script>/g;
        const scripts: Array<{ tag: string; src: string; isEntry: boolean }> = [];
        let match;
        
        while ((match = scriptRegex.exec(html)) !== null) {
          const src = match[1];
          // Entry chunk - это index-*.js (React, React Router и критичные UI в entry)
          const isEntry = src.includes('/index-') || src.includes('/assets/js/index-');
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
        
        // КРИТИЧНО: Добавляем modulepreload для entry chunk ПЕРВЫМ в <head>
        // Это гарантирует предзагрузку entry chunk (с React, React Router и критичными UI)
        const entryPreload = entryScripts
          .filter(s => s.src.startsWith('/assets/') || s.src.startsWith('./assets/'))
          .map(s => {
            const href = s.src.startsWith('./') ? s.src.slice(1) : s.src;
            return `    <link rel="modulepreload" href="${href}" crossorigin>`;
          })
          .join('\n');
        
        // КРИТИЧНО: Добавляем modulepreload для всех vendor chunks ПОСЛЕ entry в <head>
        // Это гарантирует, что vendor chunks загружаются, но не выполняются до entry
        const preloadLinks = vendorScripts
          .filter(s => s.src.startsWith('/assets/') || s.src.startsWith('./assets/'))
          .map(s => {
            const href = s.src.startsWith('./') ? s.src.slice(1) : s.src;
            return `    <link rel="modulepreload" href="${href}" crossorigin>`;
          })
          .join('\n');
        
        // Вставляем preload в <head> перед </head>
        const headEnd = newHtml.lastIndexOf('</head>');
        if (headEnd > -1) {
          const allPreloads = [entryPreload, preloadLinks].filter(Boolean).join('\n');
          if (allPreloads) {
            newHtml = newHtml.slice(0, headEnd) + '\n' + allPreloads + '\n' + newHtml.slice(headEnd);
          }
        }
        
        // Вставляем скрипты в <body> перед </body>
        // КРИТИЧНО: Entry chunk должен загружаться и выполняться ПЕРВЫМ
        // ES modules автоматически сохраняют порядок выполнения, но важно, чтобы entry был первым
        const allScripts = [...entryScripts, ...vendorScripts].map(s => s.tag).join('\n    ');
        const bodyEnd = newHtml.lastIndexOf('</body>');
        if (bodyEnd > -1) {
          newHtml = newHtml.slice(0, bodyEnd) + '\n    ' + allScripts + '\n' + newHtml.slice(bodyEnd);
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
        // КРИТИЧНО: Отключаем code splitting для React - он должен быть встроен в entry chunk
        // Это гарантирует синхронную загрузку React до всех других модулей
        // ВАЖНО: Это увеличит размер entry chunk, но решит проблему с порядком загрузки
                manualChunks: (id) => {
                  // КАРДИНАЛЬНОЕ ИЗМЕНЕНИЕ: Включаем ВСЕ React-зависимые библиотеки в entry chunk
                  // Это гарантирует, что они загружаются вместе с React и не вызывают ошибки
                  
                  // 1. ВСЕ Radix UI компоненты - в entry
                  if (id.includes('@radix-ui')) {
                    return undefined; // ВСЕ Radix UI в entry chunk
                  }
                  
                  // 2. Sonner и next-themes - в entry
                  if (id.includes('sonner') || id.includes('next-themes')) {
                    return undefined; // В entry chunk
                  }
                  
                  // 3. React core - всегда в entry
                  if (id.includes('node_modules/react/')) {
                    return undefined; // ВСЕ React в entry
                  }
                  
                  // 4. React DOM - всегда в entry
                  if (id.includes('node_modules/react-dom/')) {
                    return undefined; // React DOM в entry
                  }
                  
                  // 5. Scheduler - всегда в entry
                  if (id.includes('node_modules/scheduler/')) {
                    return undefined; // Scheduler в entry
                  }
                  
                  // 6. React Router - в entry
                  if (id.includes('node_modules/react-router/')) {
                    return undefined; // React Router в entry
                  }
                  
                  // 7. React Query - КРИТИЧНО: тоже в entry, так как используется в App.tsx
                  if (id.includes('@tanstack/react-query')) {
                    return undefined; // React Query в entry
                  }
                  
                  // 8. React Helmet - в entry (используется в App.tsx)
                  if (id.includes('react-helmet')) {
                    return undefined; // React Helmet в entry
                  }
                  
                  // 9. React Hook Form - в entry (используется в формах)
                  if (id.includes('react-hook-form') || id.includes('@hookform')) {
                    return undefined; // React Hook Form в entry
                  }
                  
                  // 10. React Day Picker - в entry (используется в формах)
                  if (id.includes('react-day-picker')) {
                    return undefined; // React Day Picker в entry
                  }
                  
                  // 11. React Resizable - в entry (если используется)
                  if (id.includes('react-resizable')) {
                    return undefined; // React Resizable в entry
                  }
                  
                  // Vendor chunks - только НЕ React-зависимые библиотеки
                  if (id.includes('node_modules')) {
                    // UI библиотеки без React зависимостей
                    if (id.includes('lucide-react') || id.includes('recharts')) {
                      return 'ui-vendor';
                    }
                    // Supabase (deprecated, но оставляем для совместимости)
                    if (id.includes('@supabase')) {
                      return 'supabase';
                    }
                    // Socket.io (не зависит от React напрямую)
                    if (id.includes('socket.io-client')) {
                      return 'socket-vendor';
                    }
                    // Zod (не зависит от React)
                    if (id.includes('zod')) {
                      return 'form-vendor';
                    }
                    // Date libraries без React
                    if (id.includes('date-fns')) {
                      return 'date-vendor';
                    }
                    // Остальные vendor библиотеки (не React-зависимые)
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
              'socket.io-client',
            ],
            exclude: ['@supabase/supabase-js'],
            // Предварительная оптимизация
            esbuildOptions: {
              target: 'esnext',
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
