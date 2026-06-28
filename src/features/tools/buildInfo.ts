/** Static app metadata surfaced on the Tools page. */
export const APP_VERSION: string = import.meta.env.VITE_APP_VERSION ?? '0.0.0';

/** Build mode reported by Vite (`development` | `production`). */
export const BUILD_MODE: string = import.meta.env.MODE;

/** Whether the bundle was built for production. */
export const IS_PRODUCTION: boolean = import.meta.env.PROD;

/** Approximate build/load timestamp (module-evaluation time). */
export const BUILD_TIME: string = new Date().toISOString();
