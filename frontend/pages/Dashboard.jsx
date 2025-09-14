import React, { useEffect, useState } from "react";
import axios from "axios";
import Navbar from "../components/Navbar";
import TaskForm from "../components/TaskForm";
import TaskList from "../components/TaskList";

function Dashboard({ token, onLogout }) {
  const [tasks, setTasks] = useState([]); 
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false); 
  const [loading, setLoading] = useState(true); 
  const [error, setError] = useState(null); 

  const fetchTasks = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get user ID from token
      let userId = "user123"; // fallback
      if (token) {
        try {
          const tokenData = JSON.parse(atob(token.split('.')[1]));
          userId = tokenData.userId || tokenData.id || "user123";
        } catch (tokenError) {
          console.warn("Error parsing token, using fallback userId:", tokenError);
        }
      }

      // Fixed API call - removed template literal syntax error
      const res = await axios.get("http://localhost:5000/api/tasks", {
        headers: { 
          Authorization: `Bearer ${token}` 
        },
        params: {
          userId: userId  // Send userId as query parameter
        }
      });

      // Backend returns { success, count, tasks } - extract tasks array
      const tasksData = res.data.tasks || res.data || [];
      setTasks(Array.isArray(tasksData) ? tasksData : []);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      setError("Failed to load tasks. Please try again.");
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchTasks();
    }
  }, [token]);

  const handleAddTaskClick = () => {
    setIsTaskFormOpen(true);
  };

  const handleCloseTaskForm = () => {
    setIsTaskFormOpen(false);
  };

  return (
    <div className="dashboard">
      <Navbar onLogout={onLogout} />

      <div className="dashboard-header">
        <div className="add-task-card">
          <div className="card-header">
            <div className="card-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <h3 className="card-title">Create New Task</h3>
            
          </div>
          <div className="card-content">
            <p>Ready to add a new task to your list? Click below to get started and stay organized.</p>
          </div>
          <div className="card-footer">
            <button 
              className="add-task-btn" 
              onClick={handleAddTaskClick}
            >
              ADD TASK
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="error-message">
          {error}
          <button onClick={fetchTasks} className="retry-btn">
            Retry
          </button>
        </div>
      )}

      <TaskForm 
        fetchTasks={fetchTasks} 
        token={token}
        isOpen={isTaskFormOpen}
        onClose={handleCloseTaskForm}
      />
      
      <TaskList 
        tasks={tasks} 
        fetchTasks={fetchTasks} 
        loading={loading}
        token={token}
      />

      <style jsx>{`
        .dashboard {
          min-height: 100vh;
          background: #f8fafc;
        }
        .dashboard-header {
          padding: 40px 20px;
          display: flex;
          justify-content: center;
          align-items: center;
        }
        .add-task-card {
          background: white;
          border-radius: 12px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
          max-width: 400px;
          width: 100%;
          overflow: hidden;
          position: relative;
        }
        .card-header {
          background: linear-gradient(135deg, #f6805cff 0%, #7c3aed 100%);
          padding: 20px;
          display: flex;
          align-items: center;
          gap: 12px;
          color: white;
          position: relative;
        }
        .card-icon {
          width: 40px;
          height: 40px;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .card-title {
          margin: 0;
          font-size: 18px;
          font-weight: 600;
          flex: 1;
        }
        .close-btn {
          background: none;
          border: none;
          color: white;
          font-size: 24px;
          cursor: pointer;
          padding: 0;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0.7;
          transition: opacity 0.2s ease;
          position: absolute;
          top: 15px;
          right: 15px;
        }
        .close-btn:hover {
          opacity: 1;
        }
        .card-content {
          padding: 24px;
          text-align: center;
        }
        .card-content p {
          margin: 0;
          color: #64748b;
          font-size: 14px;
          line-height: 1.6;
        }
        .card-footer {
          padding: 0 24px 24px;
          text-align: center;
        }
        .add-task-btn {
          background: #10b981;
          color: white;
          border: none;
          padding: 12px 32px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          width: 100%;
        }
        .add-task-btn:hover {
          background: #059669;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
        }
        .error-message {
          background: #fef2f2;
          border: 1px solid #fecaca;
          color: #dc2626;
          padding: 16px;
          margin: 20px;
          border-radius: 8px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .retry-btn {
          background: #dc2626;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
        }
        .retry-btn:hover {
          background: #b91c1c;
        }
        @media (max-width: 480px) {
          .dashboard-header {
            padding: 20px;
          }
          .add-task-card {
            max-width: 100%;
          }
        }
      `}</style>
    </div>
  );
}

export default Dashboard;