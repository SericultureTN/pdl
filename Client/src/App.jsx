import { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login.jsx';
import Dashboard from './components/Dashboard.jsx';
import MISPage from './pages/MISPage.jsx';
import PLSPage from './pages/PLSPage.jsx';
import PRCPage from './pages/PRCPage.jsx';
import POCPage from './pages/POCPage.jsx';
import { authService } from './services/auth.js';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        console.log('Checking authentication...');
        const result = await authService.getCurrentUser();
        console.log('Auth result:', result);
        if (result.ok && result.user) {
          setUser(result.user);
        } else {
          console.log('No valid user session found');
        }
      } catch (error) {
        console.log('Not authenticated:', error.message);
        // Don't throw error, just continue to login
      } finally {
        setLoading(false);
        setAuthChecked(true);
      }
    };

    checkAuth();
  }, []);

  const handleLogin = (userData) => {
    console.log('User logged in:', userData);
    setUser(userData);
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
      console.log('User logged out');
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
      // Still logout locally even if API call fails
      setUser(null);
    }
  };

  // Show loading only during initial auth check
  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-text">Loading...</div>
      </div>
    );
  }

  // If not authenticated, show login
  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  // If authenticated, show routes
  return (
    <Routes>
      <Route path="/" element={<Dashboard user={user} onLogout={handleLogout} />} />
      <Route path="/login" element={<Navigate to="/" replace />} />
      <Route path="/mis-dashboard" element={<MISPage />} />
      <Route path="/pls-dashboard" element={<PLSPage />} />
      <Route path="/prc-dashboard" element={<PRCPage />} />
      <Route path="/poc-dashboard" element={<POCPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
