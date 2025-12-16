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
        
        // КРИТИЧНО: Добавляем modulepreload для всех vendor chunks в <head>
        // КРИТИЧНО: react-vendor должен быть первым (содержит React и React Router)
        const reactVendorPreload = vendorScripts
          .filter(s => s.src.includes('react-vendor') && s.src.startsWith('/assets/'))
          .map(s => `    <link rel="modulepreload" href="${s.src}" crossorigin>`)
          .join('\n');
        const otherVendorPreload = vendorScripts
          .filter(s => !s.src.includes('react-vendor') && s.src.startsWith('/assets/'))
          .map(s => `    <link rel="modulepreload" href="${s.src}" crossorigin>`)
          .join('\n');
        const preloadLinks = reactVendorPreload + (reactVendorPreload && otherVendorPreload ? '\n' : '') + otherVendorPreload;
        
        // Вставляем preload в <head> перед </head>
        const headEnd = newHtml.lastIndexOf('</head>');
        if (headEnd > -1 && preloadLinks) {
          newHtml = newHtml.slice(0, headEnd) + '\n' + preloadLinks + '\n' + newHtml.slice(headEnd);
        }
        
        // Вставляем скрипты в <body> перед </body>
        // КРИТИЧНО: react-vendor chunk должен загружаться ПЕРВЫМ (содержит React и React Router)
        // Затем entry chunk, затем остальные vendor chunks
        const reactVendorScripts = vendorScripts.filter(s => s.src.includes('react-vendor'));
        const otherVendorScripts = vendorScripts.filter(s => !s.src.includes('react-vendor'));
        const allScripts = [
          ...reactVendorScripts,
          ...entryScripts,
          ...otherVendorScripts
        ].map(s => s.tag).join('\n    ');
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
        // КРИТИЧНО: React и React Router должны быть в одном chunk для синхронной загрузки
        manualChunks: (id) => {
          // КРИТИЧНО: React core и React Router в одном chunk
          // Это гарантирует, что React загрузится до того, как React Router попытается его использовать
          if (
            id.includes('node_modules/react/') ||
            id.includes('node_modules/react-dom/') ||
            id.includes('node_modules/scheduler/') ||
            id.includes('node_modules/react-router')
          ) {
            // Проверяем, что это не другие react-* библиотеки
            if (
              id.includes('react-helmet') || 
              id.includes('react-hook-form') || 
              id.includes('react-day-picker') || 
              id.includes('react-resizable') ||
              id.includes('react-query')
            ) {
              // Эти библиотеки могут быть в отдельных chunks
            } else {
              // React core и React Router - в один chunk
              return 'react-vendor';
            }
          }
          
          // Vendor chunks
          if (id.includes('node_modules')) {
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
            // Socket.io client
            if (id.includes('socket.io-client')) {
              return 'socket-vendor';
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
