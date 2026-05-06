"use client";

import { Component, ReactNode } from "react";

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

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("[TarotReading Error]", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="min-h-[100dvh] flex flex-col items-center justify-center p-8 text-center gap-6">
            <div className="text-rose-500 text-6xl mb-2">&#10039;</div>
            <h2 className="text-2xl font-medium text-zinc-100 tracking-tight">
              Energi Terganggu
            </h2>
            <p className="text-zinc-400 max-w-md text-sm leading-relaxed">
              Terjadi gangguan saat memuat bacaan tarot. Silakan muat ulang halaman.
            </p>
            <p className="text-zinc-600 text-xs font-mono max-w-sm break-all">
              {this.state.error?.message}
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              className="px-6 py-3 rounded-full bg-zinc-100 text-zinc-950 font-medium tracking-tight hover:bg-white transition-all active:scale-[0.98]"
            >
              Muat Ulang
            </button>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
