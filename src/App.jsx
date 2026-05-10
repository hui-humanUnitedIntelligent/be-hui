import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './lib/AuthContext'
import Home from './pages/Home'
import ImpactPage from './pages/ImpactPage'
import LoginPage from './pages/LoginPage'
import BookingFlow from './pages/BookingFlow'
import Admin from './pages/Admin'
import AuthCallback from './pages/AuthCallback'
import ProfilePage from './components/ProfilePage'
import WorkDetailPage from './components/WorkDetailPage'

function ProtectedRoute({ children }) {
  const { isAuthenticated, loadingAuth } = useAuth()
  if (loadingAuth) return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center",
      justifyContent:"center",
      background:"linear-gradient(135deg, #E6FAF8 0%, #FFF9F4 100%)" }}>
      <div style={{ textAlign:"center" }}>
        <svg width="52" height="52" viewBox="0 0 64 64" fill="none"
          style={{ animation:"spin 1.5s linear infinite" }}>
          <defs>
            <linearGradient id="lg" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#22E8D8"/>
              <stop offset="100%" stopColor="#FF8A6B"/>
            </linearGradient>
          </defs>
          <rect x="2" y="2" width="60" height="60" rx="18" fill="url(#lg)"/>
          <text x="10" y="44" fontSize="30" fontWeight="900" fill="white"
            fontFamily="-apple-system,system-ui" letterSpacing="-2">Hj</text>
        </svg>
        <div style={{ fontSize:13, color:"#888", marginTop:12, fontWeight:600 }}>
          HUI lädt…
        </div>
      </div>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
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
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<Navigate to="/Home" replace />} />
      <Route path="/Home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
      <Route path="/impact" element={<ProtectedRoute><ImpactPage /></ProtectedRoute>} />
      <Route path="/BookingFlow" element={<ProtectedRoute><BookingFlow /></ProtectedRoute>} />
      <Route path="/Admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
      <Route path="/profile/:username" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
      <Route path="/work/:id" element={<ProtectedRoute><WorkDetailPage /></ProtectedRoute>} />
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
