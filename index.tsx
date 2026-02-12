
import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import App from './App';

const container = document.getElementById('root');

if (!container) {
  console.error("عنصر root غير موجود في DOM");
} else {
  const root = ReactDOM.createRoot(container);
  root.render(
    <React.StrictMode>
      <HashRouter>
        <App />
      </HashRouter>
    </React.StrictMode>
  );
}
