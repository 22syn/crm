import "./sentry";
import { createRoot } from "react-dom/client";
import * as Sentry from "@sentry/react";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <Sentry.ErrorBoundary fallback={<div>Something went wrong.</div>} showDialog={false}>
    <App />
  </Sentry.ErrorBoundary>
);
