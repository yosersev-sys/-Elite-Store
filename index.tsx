import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

console.log("Elite Store is initializing...");

const rootElement = document.getElementById('root');

if (!rootElement) {
  console.error("FATAL: Could not find root element to mount the React app.");
} else {
  // معالج أخطاء شامل لمنع الشاشة البيضاء
  class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean, error: any}> {
    constructor(props: any) {
      super(props);
      this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: any) {
      return { hasError: true, error };
    }

    componentDidCatch(error: any, errorInfo: any) {
      console.error("React Error Caught:", error, errorInfo);
    }

    render() {
      if (this.state.hasError) {
        return (
          <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 text-center font-sans">
            <div className="max-w-md bg-white p-8 rounded-3xl shadow-xl border border-red-100">
              <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h1 className="text-xl font-black text-gray-900 mb-2">عذراً، حدث خطأ تقني</h1>
              <p className="text-gray-500 text-sm mb-6 font-bold">
                تعذر تحميل تطبيق المتجر. يرجى التحقق من اتصال الإنترنت أو إعدادات السيرفر.
              </p>
              <div className="bg-gray-100 p-3 rounded-lg text-left text-[10px] font-mono text-gray-600 mb-4 overflow-auto max-h-32">
                Error: {this.state.error?.toString()}
              </div>
              <button 
                onClick={() => window.location.reload()} 
                className="w-full bg-indigo-600 text-white py-3 rounded-2xl font-bold hover:bg-indigo-700 transition"
              >
                تحديث الصفحة
              </button>
            </div>
          </div>
        );
      }
      return this.props.children;
    }
  }

  try {
    const root = ReactDOM.createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </React.StrictMode>
    );
    console.log("React app mounted successfully.");
  } catch (err) {
    console.error("Failed to render React app:", err);
  }
}
