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
        // КАРДИНАЛЬНОЕ РЕШЕНИЕ: Минимальный code splitting
        // ВСЕ React-зависимое в entry chunk, остальное в отдельные chunks
        manualChunks: (id) => {
                  // КРИТИЧНО: ВСЕ что содержит "react" в пути - в entry chunk
                  const lowerId = id.toLowerCase();
                  
                  // ВСЕ React-зависимое в entry
                  if (
                    lowerId.includes('react') ||
                    lowerId.includes('@radix-ui') ||
                    lowerId.includes('@tanstack/react-query') ||
                    lowerId.includes('react-helmet') ||
                    lowerId.includes('react-hook-form') ||
                    lowerId.includes('react-day-picker') ||
                    lowerId.includes('react-resizable') ||
                    lowerId.includes('react-router') ||
                    lowerId.includes('embla-carousel-react') ||
                    lowerId.includes('sonner') ||
                    lowerId.includes('next-themes') ||
                    lowerId.includes('cmdk') ||
                    lowerId.includes('vaul') ||
                    lowerId.includes('input-otp') ||
                    lowerId.includes('@hookform') ||
                    lowerId.includes('lucide-react') ||
                    lowerId.includes('recharts')
                  ) {
                    return undefined; // В entry chunk
                  }
                  
                  // Только НЕ React-зависимые библиотеки в отдельные chunks
                  if (id.includes('node_modules')) {
                    // Supabase - отдельный chunk
                    if (id.includes('@supabase')) {
                      return 'supabase';
                    }
                    // Socket.io - отдельный chunk
                    if (id.includes('socket.io-client')) {
                      return 'socket-vendor';
                    }
                    // Zod - отдельный chunk
                    if (id.includes('zod')) {
                      return 'form-vendor';
                    }
                    // Date libraries - отдельный chunk
                    if (id.includes('date-fns')) {
                      return 'date-vendor';
                    }
                    // Утилиты - отдельный chunk
                    if (id.includes('clsx') || id.includes('tailwind-merge') || id.includes('class-variance-authority')) {
                      return 'utils-vendor';
                    }
                    // ВСЕ остальное тоже в entry chunk (на всякий случай)
                    // Это гарантирует, что ничего не попадет в vendor с React-зависимостями
                    return undefined; // В entry chunk
                  }
                  
                  // Все остальное (не node_modules) - в entry
                  return undefined;
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
