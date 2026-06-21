import { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login.jsx';
import Dashboard from './components/Dashboard.jsx';
import MISDashboardLayout from './pages/mis/MISDashboardLayout.jsx';
import MISDashboardHome from './pages/mis/MISDashboardHome.jsx';
import MISPlaceholderView from './pages/mis/MISPlaceholderView.jsx';
import DFLsDistributionView from './pages/mis/DFLsDistributionView.jsx';
import DFLsConsumptionView from './pages/mis/DFLsConsumptionView.jsx';
import CocoonProductionView from './pages/mis/CocoonProductionView.jsx';
import PlantationScheme2024View from './pages/mis/PlantationScheme2024View.jsx';
import MISReportsLayout from './pages/mis/MISReportsLayout.jsx';
import MISReportsDashboard from './pages/mis/MISReportsDashboard.jsx';
import PlantationSchemeReportPage from './pages/mis/reports/PlantationSchemeReportPage.jsx';
import DflsReportPage from './pages/mis/reports/DflsReportPage.jsx';
import { MIS_DATA_ENTRY_ITEMS, MIS_MAIN_NAV_ITEMS, MIS_REPORT_ITEMS } from './pages/mis/misNavConfig.js';
import PLSPage from './pages/PLSPage.jsx';
import PRCPage from './pages/PRCPage.jsx';
import POCPage from './pages/POCPage.jsx';
import { authService } from './services/auth.js';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const result = await authService.getCurrentUser();
        if (result.ok && result.user) {
          setUser(result.user);
        }
      } catch {
        // Not authenticated
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch {
      // Still logout locally
    }
    setUser(null);
  };

  const placeholderMainItems = MIS_MAIN_NAV_ITEMS.filter(
    (item) => item.placeholder && item.path !== 'dashboard'
  );
  const placeholderDataItems = MIS_DATA_ENTRY_ITEMS.filter((item) => item.placeholder);
  const placeholderReportItems = MIS_REPORT_ITEMS.filter((item) => item.placeholder);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-text">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <Routes>
      <Route path="/" element={<Dashboard user={user} onLogout={handleLogout} />} />
      <Route path="/login" element={<Navigate to="/" replace />} />

      <Route path="/mis-dashboard" element={<MISDashboardLayout onLogout={handleLogout} />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<MISDashboardHome />} />
        <Route path="dfls-distribution" element={<DFLsDistributionView />} />
        <Route path="dfls-consumption" element={<DFLsConsumptionView />} />
        <Route path="cocoon-production" element={<CocoonProductionView />} />
        <Route path="plantation-scheme-2024-25" element={<PlantationScheme2024View />} />
        <Route path="plantation-scheme-2025-26" element={<PlantationScheme2024View />} />
        <Route path="reports" element={<MISReportsLayout />}>
          <Route index element={<MISReportsDashboard />} />
          <Route path="plantation-scheme-2024-25" element={<PlantationSchemeReportPage />} />
          <Route path="plantation-scheme-2025-26" element={<PlantationSchemeReportPage />} />
          <Route path="dfls-distribution" element={<DflsReportPage />} />
          <Route path="dfls-consumption" element={<DflsReportPage />} />
          <Route path="cocoon-production" element={<DflsReportPage />} />
          {placeholderReportItems.map((item) => {
            const segment = item.path.replace('reports/', '');
            return (
              <Route
                key={item.path}
                path={segment}
                element={<MISPlaceholderView title={item.title} description={item.description} />}
              />
            );
          })}
        </Route>
        {placeholderMainItems.map((item) => (
          <Route
            key={item.path}
            path={item.path}
            element={<MISPlaceholderView title={item.title} />}
          />
        ))}
        {placeholderDataItems.map((item) => (
          <Route
            key={item.path}
            path={item.path}
            element={<MISPlaceholderView title={item.title} />}
          />
        ))}
      </Route>

      <Route path="/pls-dashboard" element={<PLSPage />} />
      <Route path="/prc-dashboard" element={<PRCPage />} />
      <Route path="/poc-dashboard" element={<POCPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
