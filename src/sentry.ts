import * as Sentry from "@sentry/react";

const dsn = import.meta.env.VITE_SENTRY_DSN;
const env = import.meta.env.MODE;

/** Deferred init — runs after hydration to avoid blocking initial bundle */
export function initSentry() {
  if (dsn && typeof dsn === "string" && dsn.length > 0) {
    Sentry.init({
      dsn,
      environment: env,
      integrations: [Sentry.browserTracingIntegration()],
      tracesSampleRate: env === "production" ? 0.2 : 1.0,
      tracePropagationTargets: ["localhost", /^https:\/\/.*\.supabase\.co/],
    });
  }
}

export default Sentry;
