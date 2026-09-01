import { Component } from "react";
import { Database, RefreshCw } from "lucide-react";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ background: "var(--bg)" }}>
        <div className="text-center max-w-md animate-fade-in">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
            style={{ background: "var(--danger-bg)", border: "1px solid var(--danger-border)" }}>
            <Database style={{ width: 28, height: 28, color: "var(--danger)" }} />
          </div>
          <h1 className="text-xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>Something went wrong</h1>
          <p className="text-sm mb-6 leading-relaxed" style={{ color: "var(--text-muted)" }}>
            An unexpected error occurred. Try refreshing the page.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="btn-primary mx-auto"
          >
            <RefreshCw style={{ width: 14, height: 14 }} />
            Reload Page
          </button>
          {this.state.error && (
            <pre className="mt-6 text-left text-[10px] p-3 rounded-lg overflow-x-auto"
              style={{ background: "var(--bg-hover)", color: "var(--text-faint)", maxHeight: 120 }}>
              {this.state.error.message}
            </pre>
          )}
        </div>
      </div>
    );
  }
}
