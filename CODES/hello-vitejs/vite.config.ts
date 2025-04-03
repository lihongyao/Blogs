import type { UserConfig, ConfigEnv } from 'vite';
import { defineConfig, loadEnv } from 'vite'
import { resolve } from 'node:path';
import react from '@vitejs/plugin-react'
import legacy from '@vitejs/plugin-legacy'

// https://cn.vitejs.dev/config/
export default defineConfig(({ mode }: ConfigEnv): UserConfig => {

  // -- 获取当前工作目录路径
  const root = process.cwd();
  const pathResolve = (path: string) => resolve(root, '.', path);
  // -- 获取环境变量
  const env = loadEnv(mode, root, "VITE_");
  console.log(env);
  return {
    resolve: {
      alias: {
        "@": pathResolve('src'),
      },
    },
    plugins: [react(), legacy({
      targets: ['defaults', 'not IE 11'],
    })],
    server: {
      host: "0.0.0.0",
      port: 5173,
      strictPort: false,
      open: true,
      cors: true,
      proxy: {},
    },
    build: {
      outDir: env.VITE_OUT_DIR,
      chunkSizeWarningLimit: 2000,
      reportCompressedSize: false
    },
    esbuild: {
      drop: ['debugger'],
      pure: ['console.log']
    }
    
  };
});


