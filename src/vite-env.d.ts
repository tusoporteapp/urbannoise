/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_BOLD_IDENTITY_KEY?: string;
  readonly VITE_BOLD_SECRET_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
