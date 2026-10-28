import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

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
  public state: State = {
    hasError: false,
  };

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
              Ocurrió un problema al renderizar los medios de esta prenda. Hemos protegido tu sesión.
            </p>
            <button
              type="button"
              onClick={this.handleReset}
              className="bg-[#F5F2E4] hover:bg-[#D9C4AB] text-[#101013] font-black text-xs uppercase tracking-widest px-6 py-3 rounded transition cursor-pointer flex items-center justify-center space-x-2 mx-auto"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Regresar a la Tienda</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
