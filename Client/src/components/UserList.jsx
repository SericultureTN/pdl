import { useState, useEffect } from 'react';
import { Search, Plus, Edit2, Trash2, Users, UserCheck, UserX, ChevronLeft, ChevronRight, Filter } from 'lucide-react';
import { sericulturistService } from '../services/sericulturist.js';
import UserForm from './UserForm.jsx';
import './UserList.css';

export default function UserList() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [selectedUsers, setSelectedUsers] = useState([]);
  
  // Pagination and filtering
  const [pagination, setPagination] = useState({
    current: 1,
    total: 1,
    limit: 10,
    totalItems: 0
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const result = await sericulturistService.getAll(
        pagination.current,
        pagination.limit,
        searchTerm,
        statusFilter
      );
      
      if (result.ok) {
        setUsers(result.sericulturists);
        setPagination(result.pagination);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [pagination.current, pagination.limit, searchTerm, statusFilter]);

  const handleCreateUser = () => {
    setEditingUser(null);
    setShowForm(true);
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    setShowForm(true);
  };

  const handleDeleteUser = async (user) => {
    if (!window.confirm(`Are you sure you want to delete ${user.name}?`)) {
      return;
    }

    try {
      await sericulturistService.delete(user.id);
      fetchUsers();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSaveUser = () => {
    setShowForm(false);
    setEditingUser(null);
    fetchUsers();
  };

  const handleSelectUser = (userId) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSelectAll = () => {
    if (selectedUsers.length === users.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(users.map(user => user.id));
    }
  };

  const handleBulkStatusUpdate = async (status) => {
    if (selectedUsers.length === 0) return;
    
    if (!window.confirm(`Are you sure you want to mark ${selectedUsers.length} user(s) as ${status}?`)) {
      return;
    }

    try {
      await sericulturistService.bulkUpdateStatus(selectedUsers, status);
      setSelectedUsers([]);
      fetchUsers();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedUsers.length === 0) return;
    
    if (!window.confirm(`Are you sure you want to delete ${selectedUsers.length} user(s)?`)) {
      return;
    }

    try {
      await sericulturistService.bulkDelete(selectedUsers);
      setSelectedUsers([]);
      fetchUsers();
    } catch (err) {
      setError(err.message);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusBadge = (status) => {
    return (
      <span className={`status-badge ${status}`}>
        {status === 'active' ? <UserCheck size={12} /> : <UserX size={12} />}
        {status}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="user-list-loading">
        <div className="spinner"></div>
        <p>Loading users...</p>
      </div>
    );
  }

  return (
    <div className="user-list-container">
      <div className="user-list-header">
        <div className="header-left">
          <h2>
            <Users size={24} />
            Sericulturists
          </h2>
          <span className="user-count">
            {pagination.totalItems} total users
          </span>
        </div>
        
        <button onClick={handleCreateUser} className="btn btn-primary">
          <Plus size={16} />
          Add User
        </button>
      </div>

      <div className="user-list-filters">
        <div className="search-box">
          <Search size={16} />
          <input
            type="text"
            placeholder="Search by name, email, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="filter-controls">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="filter-select"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {selectedUsers.length > 0 && (
        <div className="bulk-actions">
          <span>{selectedUsers.length} selected</span>
          <div className="bulk-buttons">
            <button
              onClick={() => handleBulkStatusUpdate('active')}
              className="btn btn-sm btn-success"
            >
              <UserCheck size={14} />
              Mark Active
            </button>
            <button
              onClick={() => handleBulkStatusUpdate('inactive')}
              className="btn btn-sm btn-warning"
            >
              <UserX size={14} />
              Mark Inactive
            </button>
            <button
              onClick={handleBulkDelete}
              className="btn btn-sm btn-danger"
            >
              <Trash2 size={14} />
              Delete
            </button>
          </div>
        </div>
      )}

      <div className="user-table-wrapper">
        <table className="user-table">
          <thead>
            <tr>
              <th>
                <input
                  type="checkbox"
                  checked={selectedUsers.length === users.length && users.length > 0}
                  onChange={handleSelectAll}
                />
              </th>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Role</th>
              <th>AD Office</th>
              <th>Status</th>
              <th>Joined</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id}>
                <td>
                  <input
                    type="checkbox"
                    checked={selectedUsers.includes(user.id)}
                    onChange={() => handleSelectUser(user.id)}
                  />
                </td>
                <td className="user-name">
                  <div>
                    <strong>{user.name}</strong>
                    {user.address && (
                      <small>{user.address}</small>
                    )}
                  </div>
                </td>
                <td>{user.email}</td>
                <td>{user.phone || '-'}</td>
                <td>{user.role || '-'}</td>
                <td>{user.ad_office || '-'}</td>
                <td>{getStatusBadge(user.status)}</td>
                <td>{formatDate(user.created_at)}</td>
                <td>
                  <div className="action-buttons">
                    <button
                      onClick={() => handleEditUser(user)}
                      className="btn-icon btn-edit"
                      title="Edit"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => handleDeleteUser(user)}
                      className="btn-icon btn-delete"
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {users.length === 0 && !loading && (
        <div className="empty-state">
          <Users size={48} />
          <h3>No users found</h3>
          <p>Get started by adding your first sericulturist.</p>
          <button onClick={handleCreateUser} className="btn btn-primary">
            <Plus size={16} />
            Add First User
          </button>
        </div>
      )}

      {pagination.total > 1 && (
        <div className="pagination">
          <button
            onClick={() => setPagination(prev => ({ ...prev, current: prev.current - 1 }))}
            disabled={pagination.current === 1}
            className="btn btn-secondary"
          >
            <ChevronLeft size={16} />
            Previous
          </button>
          
          <span className="page-info">
            Page {pagination.current} of {pagination.total}
          </span>
          
          <button
            onClick={() => setPagination(prev => ({ ...prev, current: prev.current + 1 }))}
            disabled={pagination.current === pagination.total}
            className="btn btn-secondary"
          >
            Next
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      {showForm && (
        <UserForm
          user={editingUser}
          onClose={() => setShowForm(false)}
          onSave={handleSaveUser}
          mode={editingUser ? 'edit' : 'create'}
        />
      )}
    </div>
  );
}
