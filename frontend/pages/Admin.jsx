import React, { useState, useEffect } from "react";
import { Users, CheckSquare, Clock, Bell, RefreshCw, LogOut, Edit, Trash2 } from "lucide-react";
import './Admin.css';

const API_BASE_URL = "https://taskmanager-if8h.onrender.com/api/admin";

const Admin = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState({
    stats: null,
    users: [],
    tasks: []
  });

  const ADMIN_EMAILS = ["admin@example.com", "admin@taskmanager.com"];

  const handleLogin = (e) => {
    e.preventDefault();
    setError("");
    
    if (!email) {
      setError("Please enter an email");
      return;
    }

    if (!ADMIN_EMAILS.includes(email.toLowerCase())) {
      setError("Access denied. Not an admin email.");
      return;
    }

    localStorage.setItem("adminEmail", email);
    setIsLoggedIn(true);
    loadAllData();
  };

  const handleLogout = () => {
    localStorage.removeItem("adminEmail");
    setIsLoggedIn(false);
    setEmail("");
    setData({ stats: null, users: [], tasks: [] });
  };

  const loadAllData = async () => {
    setLoading(true);
    setError("");
    
    try {
      const [statsResponse, usersResponse, tasksResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/stats`),
        fetch(`${API_BASE_URL}/users`),
        fetch(`${API_BASE_URL}/tasks?limit=10`)
      ]);

      const [statsResult, usersResult, tasksResult] = await Promise.all([
        statsResponse.json(),
        usersResponse.json(),
        tasksResponse.json()
      ]);

      if (!statsResponse.ok) throw new Error(statsResult.message || "Failed to fetch stats");
      if (!usersResponse.ok) throw new Error(usersResult.message || "Failed to fetch users");
      if (!tasksResponse.ok) throw new Error(tasksResult.message || "Failed to fetch tasks");

      setData({
        stats: statsResult.stats.overview,
        users: usersResult.users,
        tasks: tasksResult.tasks
      });

    } catch (err) {
      console.error("Failed to load admin data:", err);
      setError("Failed to load data: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTask = async (taskId, updateData) => {
    if (window.confirm("Are you sure you want to update this task?")) {
      try {
        const response = await fetch(`${API_BASE_URL}/tasks/bulk-update`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ taskIds: [taskId], action: 'custom', updateData: updateData }),
        });
        if (!response.ok) {
          throw new Error("Failed to update task");
        }
        alert("Task updated successfully!");
        loadAllData(); // Refresh data
      } catch (err) {
        alert("Error updating task: " + err.message);
        console.error("Error updating task:", err);
      }
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (window.confirm("Are you sure you want to delete this task?")) {
      try {
        const response = await fetch(`${API_BASE_URL}/tasks/bulk-delete`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ taskIds: [taskId], confirmDelete: true }),
        });
        if (!response.ok) {
          throw new Error("Failed to delete task");
        }
        alert("Task deleted successfully!");
        loadAllData(); // Refresh data
      } catch (err) {
        alert("Error deleting task: " + err.message);
        console.error("Error deleting task:", err);
      }
    }
  };

  useEffect(() => {
    const savedEmail = localStorage.getItem("adminEmail");
    if (savedEmail && ADMIN_EMAILS.includes(savedEmail)) {
      setEmail(savedEmail);
      setIsLoggedIn(true);
      loadAllData();
    }
  }, []);
  
  // Login screen
  if (!isLoggedIn) {
    return (
      <div className="login-container">
        <div className="login-form animated-card">
          <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">Admin Login</h2>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Admin Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                className="input-field"
              />
            </div>
            {error && (
              <div className="error-message">
                {error}
              </div>
            )}
            <button
              type="submit"
              className="login-button"
            >
              Login as Admin
            </button>
          </form>
          <p className="text-xs text-gray-500 text-center mt-4">
            Only authorized admin emails can access this panel
          </p>
        </div>
      </div>
    );
  }

  // Admin Dashboard
  return (
    <div className="dashboard-container">
      {/* Header */}
      <header className="dashboard-header">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <h1 className="text-xl font-semibold text-gray-800">Task Manager Admin Panel</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">Logged in as: {email}</span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-red-600 hover:text-red-700 text-sm logout-button"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="dashboard-main">
        {loading ? (
          <div className="loading-spinner">
            <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : (
          <>
            {/* Stats Cards */}
            {data.stats && (
              <div className="stats-grid">
                <div className="stat-card stat-blue animated-card">
                  <div className="icon-wrapper">
                    <Users className="stat-icon" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Users</p>
                    <p className="text-2xl font-bold">{data.stats.totalUsers}</p>
                  </div>
                </div>
                
                <div className="stat-card stat-green animated-card">
                  <div className="icon-wrapper">
                    <CheckSquare className="stat-icon" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Tasks</p>
                    <p className="text-2xl font-bold">{data.stats.totalTasks}</p>
                  </div>
                </div>

                <div className="stat-card stat-emerald animated-card">
                  <div className="icon-wrapper">
                    <CheckSquare className="stat-icon" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Completed</p>
                    <p className="text-2xl font-bold">{data.stats.completedTasks}</p>
                  </div>
                </div>

                <div className="stat-card stat-yellow animated-card">
                  <div className="icon-wrapper">
                    <Clock className="stat-icon" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Pending</p>
                    <p className="text-2xl font-bold">{data.stats.pendingTasks}</p>
                  </div>
                </div>

                <div className="stat-card stat-purple animated-card">
                  <div className="icon-wrapper">
                    <Bell className="stat-icon" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Today's Tasks</p>
                    <p className="text-2xl font-bold">{data.stats.todayTasks}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Users Table */}
            <div className="card animated-card">
              <div className="card-header">
                <h2 className="text-lg font-semibold text-gray-800">Users Overview</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Email</th>
                      <th>Total Tasks</th>
                      <th>Completed</th>
                      <th>Completion Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.users.map((user) => (
                      <tr key={user._id} className="table-row-animated">
                        <td>{user.email}</td>
                        <td>{user.totalTasks}</td>
                        <td>{user.completedTasks}</td>
                        <td>
                          <div className="completion-rate">
                            <span className="mr-2">
                              {user.completionRate}%
                            </span>
                            <div className="progress-bar-bg">
                              <div 
                                className="progress-bar-fill"
                                style={{ width: `${user.completionRate}%` }}
                              ></div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Recent Tasks Table */}
            <div className="card animated-card">
              <div className="card-header">
                <h2 className="text-lg font-semibold text-gray-800">Recent Tasks</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Task Title</th>
                      <th>Assigned To</th>
                      <th>Due Date</th>
                      <th>Type</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.tasks.map((task) => (
                      <tr key={task._id} className="table-row-animated">
                        <td>{task.title}</td>
                        <td>{task.email || 'N/A'}</td>
                        <td>{new Date(task.date).toLocaleDateString()}</td>
                        <td>
                          <span className="badge badge-blue">
                            {task.reminderType}
                          </span>
                        </td>
                        <td>
                          {task.completed ? (
                            <span className="badge badge-green">
                              Completed
                            </span>
                          ) : (
                            <span className="badge badge-yellow">
                              Pending
                            </span>
                          )}
                        </td>
                        <td className="actions-cell">
                          <button
                            onClick={() => handleUpdateTask(task._id, { completed: !task.completed })}
                            className="action-button update-button"
                            title="Toggle Status"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteTask(task._id)}
                            className="action-button delete-button"
                            title="Delete Task"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default Admin;