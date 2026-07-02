import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="p-6 border border-red-200 bg-red-50 rounded-xl flex flex-col items-center justify-center text-center space-y-4">
          <div className="p-3 bg-red-100 rounded-full text-red-600">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-red-900">حدث خطأ غير متوقع</h3>
            <p className="text-sm text-red-700 mt-1 max-w-sm">
              {this.state.error?.message || "تعذر تحميل هذا الجزء من الشاشة. يرجى إعادة المحاولة."}
            </p>
          </div>
          <Button 
            variant="outline" 
            className="border-red-200 text-red-700 hover:bg-red-100 mt-2"
            onClick={this.handleReset}
          >
            <RefreshCw className="w-4 h-4 me-2" />
            إعادة المحاولة
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
