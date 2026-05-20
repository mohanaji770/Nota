"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("ErrorBoundary caught:", error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <main className="adaptive-tonal flex min-h-[100dvh] flex-col items-center justify-center bg-surface px-6 text-center dark:bg-surface-dark">
          <div className="max-w-[300px]">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-white/[0.06] ring-1 ring-white/[0.08]">
              <AlertTriangle size={28} className="text-accent" />
            </div>
            <h1 className="mt-5 text-[1.25rem] font-bold leading-7 text-white/86">حدث خطأ غير متوقع</h1>
            <p className="mt-2 text-[0.82rem] font-medium leading-6 text-white/35">
              حدث شيء غير متوقع. يمكنك المحاولة مرة أخرى.
            </p>
            <button
              type="button"
              onClick={this.handleReset}
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-white/[0.08] px-5 py-2.5 text-[0.8rem] font-bold text-white/72 ring-1 ring-white/[0.08] transition active:scale-95"
            >
              <RefreshCw size={15} />
              إعادة المحاولة
            </button>
          </div>
        </main>
      );
    }

    return this.props.children;
  }
}
