/// <reference types="vite/client" />
interface ImportMetaEnv {
  readonly VITE_ENV: string;
  readonly VITE_API_HOST: string;
  readonly VITE_OUT_DIR: string;
  readonly VITE_BASE: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}