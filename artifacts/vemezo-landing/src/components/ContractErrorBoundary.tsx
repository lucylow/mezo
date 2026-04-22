import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

/**
 * Wraps contract-interaction sections. Catches unexpected errors thrown by
 * wagmi hooks (e.g. provider errors, ABI decode failures) and renders a
 * friendly recovery UI instead of a white screen.
 */
export class ContractErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[ContractErrorBoundary]", error, info);
  }

  handleReset = () => this.setState({ hasError: false, error: undefined });

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-yellow-500/20 bg-yellow-500/5 p-8 text-center">
          <AlertTriangle className="h-10 w-10 text-yellow-400 mb-3" />
          <h3 className="font-semibold text-lg mb-1">Contract interaction failed</h3>
          <p className="text-sm text-muted-foreground mb-4 max-w-sm">
            {this.state.error?.message ?? "An unexpected error occurred. Try refreshing."}
          </p>
          <Button variant="outline" size="sm" onClick={this.handleReset} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Try again
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}
