import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance as queryClient } from '@/lib/query-client'
import { AuthProvider } from '@/lib/AuthContext'
import { Toaster } from '@/components/ui/toaster'
import Home from './pages/Home';
import Admin from './pages/Admin';
import BookingFlow from './pages/BookingFlow';

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Navigate to="/Home" replace />} />
            <Route path="/Home" element={<Home />} />
            <Route path="/Admin" element={<Admin />} />
            <Route path="/BookingFlow" element={<BookingFlow />} />
          </Routes>
          <Toaster />
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  )
}

export default App