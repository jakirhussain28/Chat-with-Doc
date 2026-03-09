import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// 1. Import
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// 2. Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes (how long data is "fresh")
      cacheTime: 1000 * 60 * 30, // 30 minutes (how long data stays in cache)
      retry: 1, // Retry failed requests 1 time
      refetchOnWindowFocus: true, // Auto-refresh when user tabs back
    }
  }
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* 3. Wrap App in the provider */}
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
)