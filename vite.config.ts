import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    server: {
      host: "::",
      port: 8080,
    },
    plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    // Inline only if values exist; otherwise let Vite handle import.meta.env
    define: ((): Record<string, any> => {
      const defs: Record<string, any> = {};
      if (env.VITE_SUPABASE_URL) {
        defs['import.meta.env.VITE_SUPABASE_URL'] = JSON.stringify(env.VITE_SUPABASE_URL);
      }
      if (env.VITE_SUPABASE_PUBLISHABLE_KEY) {
        defs['import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY'] = JSON.stringify(env.VITE_SUPABASE_PUBLISHABLE_KEY);
      }
      return defs;
    })(),
    build: {
      rollupOptions: {
        output: {
          // Manual chunks for better caching
          manualChunks: {
            // React core
            'react-vendor': ['react', 'react-dom', 'react-router-dom'],
            // UI library
            'radix-vendor': [
              '@radix-ui/react-dialog',
              '@radix-ui/react-dropdown-menu',
              '@radix-ui/react-accordion',
              '@radix-ui/react-avatar',
              '@radix-ui/react-label',
              '@radix-ui/react-switch',
              '@radix-ui/react-tabs',
              '@radix-ui/react-tooltip',
              '@radix-ui/react-toast',
            ],
            // Supabase
            'supabase-vendor': ['@supabase/supabase-js'],
            // React Query
            'query-vendor': ['@tanstack/react-query'],
            // Icons
            'icons-vendor': ['lucide-react'],
          },
        },
      },
      // Chunk size warning limit
      chunkSizeWarningLimit: 1000,
      // Minification settings
      minify: 'terser',
      terserOptions: {
        compress: {
          // Remove console.log in production
          drop_console: mode === 'production',
          drop_debugger: mode === 'production',
        },
      },
      // Source map only in development
      sourcemap: mode === 'development',
    },
  };
});
