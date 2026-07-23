import { render } from "preact";
import App from "@/App";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ErrorFallback } from "@/components/ErrorFallback";
import "./index.css";

const root = document.getElementById("root") as HTMLElement;

render(
  <ErrorBoundary
    fallback={({ error, reset }) => <ErrorFallback error={error} reset={reset} variant="root" />}
  >
    <App />
  </ErrorBoundary>,
  root,
);
