/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SMART_CLIENT_ID: string
  readonly VITE_REDIRECT_URI: string
  readonly VITE_FHIR_ISS?: string
}
interface ImportMeta {
  readonly env: ImportMetaEnv
}
