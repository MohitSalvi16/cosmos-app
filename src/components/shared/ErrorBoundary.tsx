import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  /** Rendered instead of children after an error. */
  fallback?: ReactNode | ((error: Error, reset: () => void) => ReactNode);
  label?: string;
}

interface State {
  error: Error | null;
}

/** Isolates failures in 3D scenes and remote-data panels so one broken widget never blanks the page. */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`[cosmos] ${this.props.label ?? 'Component'} crashed`, error, info.componentStack);
  }

  reset = () => this.setState({ error: null });

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;
    const { fallback, label } = this.props;
    if (typeof fallback === 'function') return fallback(error, this.reset);
    if (fallback !== undefined) return fallback;
    return (
      <div role="alert" className="glass p-6 text-sm text-muted">
        <p className="text-stellar">{label ?? 'This section'} could not be displayed.</p>
        <p className="mt-1">{error.message}</p>
        <button type="button" onClick={this.reset} className="btn-ghost mt-4 !px-4 !py-2">
          Try again
        </button>
      </div>
    );
  }
}
