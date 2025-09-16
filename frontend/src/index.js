import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './AuthContext'; // Import from the correct file

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    {/* The Provider wraps everything, providing context to the whole app */}
    <AuthProvider>
      {/* The Toaster is a sibling to App, at the highest level */}
      <Toaster position="top-center" reverseOrder={false} />
      <App />
    </AuthProvider>  
  </React.StrictMode>
);