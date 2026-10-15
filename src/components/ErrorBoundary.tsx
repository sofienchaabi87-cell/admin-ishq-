import { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error caught by ErrorBoundary:", error, errorInfo);
  }

  private handleReset = () => {
    if (window.location.pathname.startsWith("/admin")) {
      localStorage.removeItem("ishq_token");
      localStorage.removeItem("ishq_user");
      window.location.href = "/admin/login";
    } else {
      window.location.href = "/";
    }
    this.setState({ hasError: false, error: undefined });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-stone-950 flex flex-col items-center justify-center p-6 text-center text-white">
          <div className="max-w-md bg-stone-900 border border-stone-800 rounded-2xl p-8 shadow-2xl">
            <h1 className="text-2xl font-serif text-amber-400 mb-3">Une erreur est survenue</h1>
            <p className="text-stone-400 text-sm mb-6">
              Une erreur s'est produite lors de l'affichage de la page d'administration.
            </p>
            {this.state.error?.message && (
              <div className="bg-stone-800 text-red-400 text-xs p-3 rounded-lg font-mono mb-6 overflow-x-auto">
                {this.state.error.message}
              </div>
            )}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => window.location.reload()}
                className="bg-stone-800 hover:bg-stone-700 text-stone-200 font-medium px-4 py-2 rounded-lg text-sm transition"
              >
                Actualiser la page
              </button>
              <button
                onClick={this.handleReset}
                className="bg-amber-500 hover:bg-amber-400 text-stone-950 font-semibold px-4 py-2 rounded-lg text-sm transition"
              >
                Réinitialiser & Reconnecter
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
