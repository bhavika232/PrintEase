import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import UserDashboard from './pages/UserDashboard';
import UploadRequest from './pages/UploadRequest';
import OrderStatus from './pages/OrderStatus';
import AdminDashboard from './pages/AdminDashboard';
import './index.css';

function App() {
  return (
    <Router>
      <Routes>
        {/* Auth routes without top navbar Layout */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Protected routes wrapped with Navbar Layout */}
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<UserDashboard />} />
          <Route path="/upload" element={<UploadRequest />} />
          <Route path="/orders" element={<OrderStatus />} />
          <Route path="/admin" element={<AdminDashboard />} />
        </Route>
        
        {/* Default redirect to login for undefined routes */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
