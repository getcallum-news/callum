"use client";

import { Component, type ReactNode } from "react";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center px-6">
          <div className="text-center">
            <h1 className="font-serif text-3xl font-semibold tracking-tight">
              Something went wrong.
            </h1>
            <p className="mt-4 text-[15px] text-callum-muted">
              An unexpected error occurred. Try refreshing the page.
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false });
                window.location.reload();
              }}
              className="mt-8 border border-[var(--border)] px-8 py-3 text-[11px] font-medium uppercase tracking-[0.15em] transition-all duration-300 hover:bg-[var(--text-primary)] hover:text-[var(--bg)]"
            >
              Refresh page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
