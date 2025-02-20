/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string
  readonly VITE_SOCKET_URL: string
  readonly VITE_STRIPE_PUBLIC_KEY: string
  readonly VITE_SENTRY_DSN: string
  readonly VITE_GA_TRACKING_ID: string
  readonly VITE_ENV: 'development' | 'staging' | 'production'
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
