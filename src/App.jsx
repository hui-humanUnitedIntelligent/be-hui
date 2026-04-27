import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Home from './pages/Home';
import BookingFlow from './pages/BookingFlow';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/Home" replace />} />
        <Route path="/Home" element={<Home />} />
        <Route path="/BookingFlow" element={<BookingFlow />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
