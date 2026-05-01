import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Landing from './pages/Landing';
import Index from './pages/Index';
import Home from './pages/Home';
import BookingFlow from './pages/BookingFlow';
import Admin from './pages/Admin';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/Home" replace />} />
        <Route path="/Landing" element={<Landing />} />
        <Route path="/Index" element={<Index />} />
        <Route path="/Home" element={<Home />} />
        <Route path="/BookingFlow" element={<BookingFlow />} />
        <Route path="/Admin" element={<Admin />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
