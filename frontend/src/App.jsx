import React from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext.jsx';
import queryClient from './lib/react-query.js';
import AppRouter from './router/AppRouter.jsx';

export const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        {/* Render application routes */}
        <AppRouter />

        {/* Global structured notification alert toasts */}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#1f1f1f',
              color: '#e5e7eb',
              border: '1px solid #2a2a2a',
              borderRadius: '2px',
              fontSize: '13px',
              fontFamily: 'Inter, sans-serif',
            },
            success: {
              iconTheme: {
                primary: '#f97316',
                secondary: '#fff',
              },
            },
          }}
        />
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
