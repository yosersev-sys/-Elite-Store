
import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
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
                onClick={() => window.location.reload()}
                className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black shadow-lg active:scale-95 transition-all"
              >
                إعادة تحميل الصفحة 🔄
              </button>
              <button 
                onClick={() => {
                  localStorage.clear();
                  window.location.href = 'index.php';
                }}
                className="w-full bg-rose-50 text-rose-600 py-3 rounded-2xl font-black text-xs"
              >
                مسح التخزين المؤقت والعودة للرئيسية
              </button>
            </div>
            {process.env.NODE_ENV === 'development' && (
              <pre className="mt-6 p-4 bg-slate-900 text-rose-400 text-[10px] text-left rounded-xl overflow-auto max-h-32">
                {this.state.error?.toString()}
              </pre>
            )}
          </div>
        </div>
      );
    }

    // Fix: Access children from props in class component
    return this.props.children;
  }
}

export default ErrorBoundary;
