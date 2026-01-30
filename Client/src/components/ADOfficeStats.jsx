import { useState, useEffect } from "react";
import { Building2, Users, TrendingUp, MapPin } from "lucide-react";
import { sericulturistService } from "../services/sericulturist.js";
import "./ADOfficeStats.css";

const ADOFFICES = [
  "Hosur", "Denkanikkottai", "Krishnagiri", "Dharmapuri", "Pennagaram",
  "Salem", "Coimbatore", "Udumalpet", "Erode", "Talavady",
  "Coonoor", "Vaniyambadi", "Tiruvannamalai", "Villuppuram", "Trichy",
  "Namakkal", "Dindigul", "Theni", "Tenkasi"
];

export default function ADOfficeStats({ user }) {
  const [officeStats, setOfficeStats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOfficeStats();
  }, []);

  const fetchOfficeStats = async () => {
    try {
      // Get all users to calculate stats per office
      const response = await sericulturistService.getAll(1, 1000, '', '');
      if (response.ok) {
        let stats;
        
        if (user.role === 'admin') {
          // Admin sees all offices
          stats = ADOFFICES.map(office => {
            const officeUsers = response.sericulturists.filter(user => user.ad_office === office);
            const activeUsers = officeUsers.filter(user => user.status === 'active');
            
            return {
              name: office,
              total: officeUsers.length,
              active: activeUsers.length,
              inactive: officeUsers.length - activeUsers.length,
              users: officeUsers
            };
          }).filter(office => office.total > 0); // Only show offices with users
        } else {
          // Sericulturist sees only their office
          const officeUsers = response.sericulturists.filter(u => u.ad_office === user.ad_office);
          const activeUsers = officeUsers.filter(u => u.status === 'active');
          
          stats = [{
            name: user.ad_office,
            total: officeUsers.length,
            active: activeUsers.length,
            inactive: officeUsers.length - activeUsers.length,
            users: officeUsers
          }];
        }

        setOfficeStats(stats);
      }
    } catch (error) {
      console.error('Failed to fetch office stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="ad-office-loading">
        <div className="spinner"></div>
        <p>Loading AD office statistics...</p>
      </div>
    );
  }

  return (
    <div className="ad-office-stats">
      <div className="stats-header">
        <h2>
          <Building2 size={24} />
          {user.role === 'admin' ? 'AD Office Statistics' : `${user.ad_office} Office`}
        </h2>
        {user.role === 'admin' && (
          <div className="stats-summary">
            <div className="summary-item">
              <span className="summary-number">{officeStats.length}</span>
              <span className="summary-label">Active Offices</span>
            </div>
            <div className="summary-item">
              <span className="summary-number">
                {officeStats.reduce((sum, office) => sum + office.total, 0)}
              </span>
              <span className="summary-label">Total Users</span>
            </div>
          </div>
        )}
      </div>

      <div className="office-grid">
        {officeStats.map((office, index) => (
          <div key={office.name} className="office-card">
            <div className="office-header">
              <div className="office-icon">
                <MapPin size={20} />
              </div>
              <h3>{office.name}</h3>
            </div>
            
            <div className="office-metrics">
              <div className="metric">
                <div className="metric-value">{office.total}</div>
                <div className="metric-label">Total Users</div>
              </div>
              
              <div className="metric">
                <div className="metric-value active">{office.active}</div>
                <div className="metric-label">Active</div>
              </div>
              
              <div className="metric">
                <div className="metric-value inactive">{office.inactive}</div>
                <div className="metric-label">Inactive</div>
              </div>
            </div>

            <div className="office-progress">
              <div className="progress-bar">
                <div 
                  className="progress-fill active"
                  style={{ width: `${(office.active / office.total) * 100}%` }}
                ></div>
              </div>
              <span className="progress-text">
                {office.total > 0 ? Math.round((office.active / office.total) * 100) : 0}% active
              </span>
            </div>

            {office.users.length > 0 && (
              <div className="recent-users">
                <h4>Recent Users</h4>
                <div className="user-list">
                  {office.users.slice(0, 3).map(user => (
                    <div key={user.id} className="user-item">
                      <span className="user-name">{user.name}</span>
                      <span className={`user-status ${user.status}`}>
                        {user.status}
                      </span>
                    </div>
                  ))}
                  {office.users.length > 3 && (
                    <div className="more-users">
                      +{office.users.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {officeStats.length === 0 && (
        <div className="no-data">
          <Building2 size={48} />
          <h3>No AD Office Data</h3>
          <p>No users have been assigned to AD offices yet.</p>
        </div>
      )}
    </div>
  );
}
