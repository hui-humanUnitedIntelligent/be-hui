import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './lib/AuthContext'
import Home from './pages/Home'
import LoginPage from './pages/LoginPage'
import BookingFlow from './pages/BookingFlow'
import Admin from './pages/Admin'
import AuthCallback from './pages/AuthCallback'

function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth()
  if (isLoading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32 }}>
      🌱
    </div>
  )
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return children
}

function AppRoutes() {
  const { isAuthenticated } = useAuth()
  return (
    <Routes>
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route path="/login" element={isAuthenticated ? <Navigate to="/Home" replace /> : <LoginPage onSuccess={() => window.location.href = '/Home'} />} />
      <Route path="/" element={<Navigate to="/Home" replace />} />
      <Route path="/Home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
      <Route path="/BookingFlow" element={<ProtectedRoute><BookingFlow /></ProtectedRoute>} />
      <Route path="/Admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
    </Routes>
  )
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
