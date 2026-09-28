import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in Maison LANA application:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full flex flex-col items-center justify-center bg-white text-neutral-900 px-6 py-12 font-sans text-center">
          <div className="max-w-md w-full space-y-6">
            <h1 className="font-serif text-2xl tracking-[0.2em] uppercase font-light text-neutral-900">
              Maison LANA
            </h1>
            <div className="w-12 h-px bg-neutral-300 mx-auto" />
            <p className="text-xs uppercase tracking-widest text-neutral-500 font-medium">
              HAUTE COUTURE &amp; PRESTIGE PARFUMERIE
            </p>
            <p className="text-sm text-neutral-600 leading-relaxed pt-2">
              Our luxury boutique encountered a brief connection sync. Tap below to refresh the collection.
            </p>
            <div className="pt-4">
              <button
                type="button"
                onClick={() => {
                  try {
                    localStorage.removeItem('lana_site_settings_cache');
                  } catch {}
                  window.location.reload();
                }}
                className="w-full py-3.5 px-8 bg-neutral-900 hover:bg-black text-white text-xs font-medium uppercase tracking-[0.25em] transition-all shadow-md active:scale-95 cursor-pointer"
              >
                Reload Boutique
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
export default ErrorBoundary;
