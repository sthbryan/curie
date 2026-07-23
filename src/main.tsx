import React from "react";
import ReactDOM from "react-dom/client";
import App from "@/App";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ErrorFallback } from "@/components/ErrorFallback";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <ErrorBoundary
      fallback={({ error, reset }) => <ErrorFallback error={error} reset={reset} variant="root" />}
    >
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
);
