import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  errorMessage: string;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    errorMessage: ""
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, errorMessage: error.message };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error logged by ErrorBoundary:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: "20px", color: "red", fontFamily: "sans-serif" }}>
          <h2>Application Error</h2>
          <p>The application encountered a critical error and could not render.</p>
          <pre style={{ background: "#fee", padding: "10px", border: "1px solid #fcc", overflowX: "auto" }}>
            {this.state.errorMessage}
          </pre>
          <button 
            onClick={() => window.location.reload()}
            style={{ marginTop: "10px", padding: "8px 16px", cursor: "pointer" }}
          >
            Reload application
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
