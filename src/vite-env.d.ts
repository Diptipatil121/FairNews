/// <reference types="vite/client" />

// FUTURE: required when `ReportBackground.tsx` mp4 import is uncommented
// declare module '*.mp4' {
//   const src: string;
//   export default src;
// }

interface ImportMetaEnv {
  readonly VITE_PIPELINE_GATEWAY_URL?: string;
}

