import { Component, type ErrorInfo, type ReactNode } from "react";

export type ErrorBoundaryFallbackProps = {
  error: Error;
  reset: () => void;
};

type Props = {
  children: ReactNode;
  fallback: (props: ErrorBoundaryFallbackProps) => ReactNode;
  onError?: (error: Error, info: ErrorInfo) => void;
  resetKeys?: ReadonlyArray<string | number | boolean | null | undefined>;
};

type State = {
  error: Error | null;
};

export function resetKeysChanged(
  prev: Props["resetKeys"] | undefined,
  next: Props["resetKeys"] | undefined,
): boolean {
  if (prev === next) return false;
  if (!prev || !next) return prev !== next;
  if (prev.length !== next.length) return true;
  return prev.some((v, i) => v !== next[i]);
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    const componentStack =
      info?.componentStack ?? (typeof error.stack === "string" ? error.stack : "");
    this.props.onError?.(error, { ...info, componentStack });
    if (import.meta.env.DEV) {
      console.error("[ErrorBoundary]", error, componentStack);
    }
  }

  componentDidUpdate(prevProps: Props) {
    if (this.state.error && resetKeysChanged(prevProps.resetKeys, this.props.resetKeys)) {
      this.reset();
    }
  }

  reset = () => {
    this.setState({ error: null });
  };

  render() {
    const { error } = this.state;
    if (error) {
      return this.props.fallback({ error, reset: this.reset });
    }
    return this.props.children;
  }
}
