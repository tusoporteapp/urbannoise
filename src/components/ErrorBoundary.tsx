import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw, LogOut } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary capturó una excepción:', error, errorInfo);
  }

  public handleReset = () => {
    try {
      if (typeof window !== 'undefined') {
        const url = new URL(window.location.href);
        url.searchParams.delete('product');
        url.searchParams.delete('p');
        url.searchParams.delete('sku');
        window.history.replaceState(null, '', url.pathname + (url.search || '') + (url.hash || ''));
      }
    } catch {}
    this.setState({ hasError: false, error: undefined });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  public handleLogoutAndReset = () => {
    try {
      if (typeof window !== 'undefined') {
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && (k.startsWith('urbannoise_') || k.includes('session') || k.includes('admin') || k.includes('order'))) {
            keysToRemove.push(k);
          }
        }
        keysToRemove.forEach((k) => localStorage.removeItem(k));
        window.location.hash = '#cuenta';
        window.location.reload();
      }
    } catch {
      window.location.reload();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 z-50 bg-white/95 backdrop-blur-md flex items-center justify-center p-6 text-center">
          <div className="max-w-md w-full bg-[#101013] text-[#F5F2E4] p-8 rounded-lg shadow-2xl border border-white/10 space-y-4">
            <div className="w-12 h-12 rounded-full bg-amber-500/20 text-amber-400 mx-auto flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="font-extrabold text-lg uppercase tracking-tight text-white">
              {this.props.fallbackTitle || 'Aviso de Visualización'}
            </h3>
            <p className="text-xs text-white/70 leading-relaxed font-normal">
              Ocurrió un problema temporal al cargar esta vista. Puedes regresar a la tienda o cerrar tu sesión para limpiar el estado del navegador.
            </p>

            {this.state.error && (
              <div className="p-2.5 bg-black/60 border border-white/10 rounded text-[11px] font-mono text-amber-300/90 text-left max-h-24 overflow-auto break-all">
                {this.state.error.message || String(this.state.error)}
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={this.handleReset}
                className="w-full sm:w-auto bg-[#F5F2E4] hover:bg-[#D9C4AB] text-[#101013] font-black text-xs uppercase tracking-widest px-5 py-3 rounded transition cursor-pointer flex items-center justify-center space-x-2"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Regresar a la Tienda</span>
              </button>

              <button
                type="button"
                onClick={this.handleLogoutAndReset}
                className="w-full sm:w-auto bg-red-600/90 hover:bg-red-700 text-white font-extrabold text-xs uppercase tracking-widest px-5 py-3 rounded transition cursor-pointer flex items-center justify-center space-x-2"
              >
                <LogOut className="w-4 h-4" />
                <span>Cerrar Sesión</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
