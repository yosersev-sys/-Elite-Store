
import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  // Children is optional for the component to be used as a wrapper in JSX
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * ErrorBoundary component to catch rendering errors and show a fallback UI.
 */
// Fix: Extending Component<Props, State> ensures that props and state are correctly typed.
class ErrorBoundary extends Component<Props, State> {
  // Fix: Explicitly declare the props property to resolve "Property 'props' does not exist on type 'ErrorBoundary'" error.
  public props: Props;

  // Fix: Explicitly declare the state property to resolve "Property 'state' does not exist on type 'ErrorBoundary'" error.
  public state: State = {
    hasError: false,
    error: null
  };

  constructor(props: Props) {
    super(props);
  }

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log the error to an error reporting service or console
    console.error("Uncaught error:", error, errorInfo);
  }

  public render(): ReactNode {
    // Fix: Destructure from this.state and this.props. 
    // Explicit property declarations and named imports help TypeScript find these members on the class instance.
    const { hasError, error } = this.state;
    const { children } = this.props;

    if (hasError) {
      // Fallback UI when an error occurs in the child components
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-center">
          <div className="bg-white p-10 rounded-[3rem] shadow-2xl border border-rose-100 max-w-md w-full animate-fadeIn">
            <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center text-4xl mx-auto mb-6">⚠️</div>
            <h2 className="text-2xl font-black text-slate-800 mb-2">عذراً، حدث خطأ تقني</h2>
            <p className="text-slate-500 font-bold text-sm mb-8 leading-relaxed">
              واجه التطبيق مشكلة غير متوقعة في عرض هذه الصفحة. لا تقلق، بياناتك آمنة.
            </p>
            <div className="space-y-3">
              <button 
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                  window.location.reload();
                }}
                className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black shadow-lg active:scale-95 transition-all cursor-pointer"
              >
                إعادة تحميل الصفحة 🔄
              </button>
              <button 
                onClick={() => {
                  window.location.hash = '';
                  this.setState({ hasError: false, error: null });
                  window.location.href = 'index.php';
                }}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 rounded-2xl font-black text-xs cursor-pointer"
              >
                العودة للصفحة الرئيسية
              </button>
            </div>

            {error && (
              <details className="mt-6 text-right">
                <summary className="text-[10px] font-bold text-slate-400 cursor-pointer hover:text-slate-600">عرض تفاصيل الخطأ الفني 🛠️</summary>
                <pre className="mt-2 p-3 bg-slate-900 text-rose-400 text-[10px] text-left rounded-xl overflow-auto max-h-36 dir-ltr">
                  {error.toString()}
                  {error.stack && `\n\nStack:\n${error.stack}`}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return children;
  }
}

export default ErrorBoundary;
