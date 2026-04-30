import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import BookingFlow from './pages/BookingFlow';
import Home from './pages/Home';
import Admin from './pages/Admin';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/Home" replace />} />
        <Route path="/BookingFlow" element={<BookingFlow />} />
        <Route path="/Home" element={<Home />} />
        <Route path="/Admin" element={<Admin />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
