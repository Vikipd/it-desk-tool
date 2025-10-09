// COPY AND PASTE THIS ENTIRE, FINAL, PERFECT BLOCK.

import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './AuthContext';
import { BrowserRouter as Router } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();
const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <Router>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <Toaster position="top-center" reverseOrder={false} />
          <App />
        </AuthProvider>
      </QueryClientProvider>
    </Router>
  </React.StrictMode>
);