import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Admin from './pages/Admin';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/Home" replace />} />
        <Route path="/Home" element={<Home />} />
        <Route path="/Admin" element={<Admin />} />
        <Route path="*" element={<Navigate to="/Home" replace />} />
      </Routes>
    </Router>
  );
}

export default App;