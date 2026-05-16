import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RotateCcw, Home } from 'lucide-react';
import { Button } from '../design-system/components';

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center animate-scale-in">
          <div className="w-16 h-16 rounded-full bg-danger-bg text-danger flex items-center justify-center mb-6">
            <AlertCircle size={32} />
          </div>
          <h2 className="text-2xl font-bold mb-2">Something went wrong</h2>
          <p className="text-secondary max-w-md mb-8">
            We hit an unexpected error. Our team has been notified.
            {import.meta.env.DEV && (
              <pre className="mt-4 p-4 bg-surface-200 rounded text-xs text-left overflow-auto max-h-40">
                {this.state.error?.message}
                {this.state.error?.stack}
              </pre>
            )}
          </p>
          <div className="flex gap-4">
            <Button 
              variant="outline" 
              iconLeft={<RotateCcw size={18} />}
              onClick={() => window.location.reload()}
            >
              Try Again
            </Button>
            <Button 
              variant="brand" 
              iconLeft={<Home size={18} />}
              onClick={() => window.location.href = '/home'}
            >
              Go to Home
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
