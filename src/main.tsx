import "./sentry";
import { createRoot } from "react-dom/client";
import * as Sentry from "@sentry/react";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <Sentry.ErrorBoundary
    fallback={
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-zinc-900 p-8">
        <div className="text-center space-y-2 max-w-md">
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
            Something went wrong
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400 text-sm">
            Check the browser console for details.
          </p>
        </div>
      </div>
    }
    showDialog={false}
  >
    <App />
  </Sentry.ErrorBoundary>
);
