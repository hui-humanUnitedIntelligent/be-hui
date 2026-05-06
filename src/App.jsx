import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './lib/AuthContext'
import Home from './pages/Home'
import ImpactPage from './pages/ImpactPage'
import LoginPage from './pages/LoginPage'
import BookingFlow from './pages/BookingFlow'
import Admin from './pages/Admin'
import AuthCallback from './pages/AuthCallback'

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()
  if (loading) return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"#F8F7F5" }}>
      <div style={{ textAlign:"center" }}>
        <div style={{ fontSize:40, marginBottom:12, animation:"hui-pulse 2s ease-in-out infinite" }}>🌱</div>
        <div style={{ fontSize:14, color:"#6B7280" }}>HUI lädt...</div>
      </div>
    </div>
  )
  return isAuthenticated ? children : <Navigate to="/login" replace />
}

function AppRoutes() {
  const { isAuthenticated } = useAuth()
  return (
    <Routes>
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route path="/login" element={isAuthenticated ? <Navigate to="/Home" replace /> : <LoginPage />} />
      <Route path="/" element={<Navigate to="/Home" replace />} />
      <Route path="/Home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
      <Route path="/impact" element={<ProtectedRoute><ImpactPage /></ProtectedRoute>} />
      <Route path="/BookingFlow" element={<ProtectedRoute><BookingFlow /></ProtectedRoute>} />
      <Route path="/Admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
