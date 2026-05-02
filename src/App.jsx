import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Home from './pages/Home';
import Admin from './pages/Admin';
import BookingFlow from './pages/BookingFlow';
import ImpactPool from './pages/ImpactPool';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/Home" replace />} />
        <Route path="/Home" element={<Home />} />
        <Route path="/Admin" element={<Admin />} />
        <Route path="/BookingFlow" element={<BookingFlow />} />
        <Route path="/ImpactPool" element={<ImpactPool />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App