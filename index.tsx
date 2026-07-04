// Safe Date monkey-patch to prevent RangeErrors when parsing numeric string timestamps
(function() {
  const NativeDate = window.Date;
  
  function SafeDate(this: any, ...args: any[]) {
    if (!(this instanceof SafeDate)) {
      return (NativeDate as any)(...args);
    }
    
    if (args.length === 1) {
      const val = args[0];
      if (typeof val === 'string' && /^\d{10,}$/.test(val)) {
        return new (NativeDate as any)(Number(val));
      }
    }
    
    return new (NativeDate.bind.apply(NativeDate, [null, ...args] as any))();
  }

  SafeDate.prototype = NativeDate.prototype;
  
  Object.getOwnPropertyNames(NativeDate).forEach(prop => {
    if (prop !== 'prototype' && prop !== 'name' && prop !== 'length') {
      (SafeDate as any)[prop] = (NativeDate as any)[prop];
    }
  });

  window.Date = SafeDate as any;
})();

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';
import './index.css';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (const registration of registrations) {
      registration.unregister();
      console.log('SW unregistered successfully');
    }
  });
}

if ('caches' in window) {
  caches.keys().then((names) => {
    for (const name of names) {
      caches.delete(name);
      console.log('Cache storage cleared: ' + name);
    }
  });
}

