import React, { useState, useMemo, useCallback } from "react";
import axios from "axios";
import "./tasklist.css";

function TaskList({ tasks = [], fetchTasks, loading = false, token }) {
  const [deletingTasks, setDeletingTasks] = useState(new Set());
  const [completingTasks, setCompletingTasks] = useState(new Set());
  const [filter, setFilter] = useState('all');
  const [editingTask, setEditingTask] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editTime, setEditTime] = useState('');
  const [editReminderType, setEditReminderType] = useState('Custom');
  const [showCompleted, setShowCompleted] = useState(true);

  const safeTasks = Array.isArray(tasks) ? tasks : [];

  // Reminder types matching TaskForm
  const reminderTypes = [
    "Custom",
    "Weekly", 
    "Fortnightly",
    "Monthly",
    "Bimonthly",
    "Quarterly",
    "Half yearly",
    "Annually",
    "Bi annually",
    "Tri annually"
  ];

  const deleteTask = async (id) => {
    setDeletingTasks(prev => new Set(prev).add(id));
    try {
      await axios.delete(`https://taskmanager-r5m8.onrender.com/api/tasks/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Add small delay for visual feedback
      setTimeout(async () => {
        await fetchTasks();
        setDeletingTasks(prev => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      }, 300);
    } catch (error) {
      console.error("Failed to delete task:", error);
      alert("Failed to delete task. Please try again.");
      setDeletingTasks(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const markComplete = async (task) => {
    if (!task || !task._id) return;
    const id = task._id;
    setCompletingTasks(prev => new Set(prev).add(id));

    try {
      await axios.put(
        `https://taskmanager-r5m8.onrender.com/api/tasks/${id}`,
        { completed: !task.completed }, // Toggle completion status
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      await fetchTasks();
    } catch (error) {
      console.error("Failed to toggle task completion:", error);
      alert("Failed to update task. Please try again.");
    } finally {
      setCompletingTasks(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const updateTask = async (id, updatedData) => {
    try {
      await axios.put(`https://taskmanager-r5m8.onrender.com/api/tasks/${id}`, updatedData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      await fetchTasks();
      setEditingTask(null);
      setEditTitle('');
      setEditDate('');
      setEditTime('');
      setEditReminderType('Custom');
    } catch (error) {
      console.error("Failed to update task:", error);
      alert("Failed to update task. Please try again.");
    }
  };

  const startEdit = useCallback((task) => {
    setEditingTask(task._id);
    setEditTitle(task.title);
    setEditDate(new Date(task.date).toISOString().split('T')[0]);
    setEditTime(task.time || '');
    setEditReminderType(task.reminderType || 'Custom');
  }, []);

  const cancelEdit = useCallback(() => {
    setEditingTask(null);
    setEditTitle('');
    setEditDate('');
    setEditTime('');
    setEditReminderType('Custom');
  }, []);

  const saveEdit = useCallback(() => {
    if (editTitle.trim() && editDate && editTime) {
      updateTask(editingTask, {
        title: editTitle.trim(),
        date: editDate,
        time: editTime,
        reminderType: editReminderType
      });
    }
  }, [editTitle, editDate, editTime, editReminderType, editingTask]);

  const handleTitleChange = useCallback((e) => setEditTitle(e.target.value), []);
  const handleDateChange = useCallback((e) => setEditDate(e.target.value), []);
  const handleTimeChange = useCallback((e) => setEditTime(e.target.value), []);
  const handleReminderTypeChange = useCallback((e) => setEditReminderType(e.target.value), []);

  const today = new Date().toDateString();
  const now = new Date();

  const categorizedTasks = useMemo(() => {
    const todayTasks = [];
    const upcomingTasks = [];
    const overdueTasks = [];
    const completedTasks = [];

    safeTasks.forEach(task => {
      if (task.completed) {
        completedTasks.push({ ...task, category: 'completed' });
        return;
      }
      
      const taskDate = new Date(task.date);
      const taskDateString = taskDate.toDateString();
      const taskDateTime = new Date(`${task.date}T${task.time || '00:00'}`);

      if (taskDateString === today) {
        todayTasks.push({ ...task, category: 'today' });
      } else if (taskDateTime < now) {
        overdueTasks.push({ ...task, category: 'overdue' });
      } else {
        upcomingTasks.push({ ...task, category: 'upcoming' });
      }
    });

    // Sort tasks by time
    const sortByTime = (a, b) => (a.time && b.time ? a.time.localeCompare(b.time) : 0);
    todayTasks.sort(sortByTime);
    upcomingTasks.sort((a, b) => new Date(a.date) - new Date(b.date) || sortByTime(a, b));
    overdueTasks.sort((a, b) => new Date(a.date) - new Date(b.date) || sortByTime(a, b));
    completedTasks.sort((a, b) => new Date(b.updatedAt || b.date) - new Date(a.updatedAt || a.date));

    return { todayTasks, upcomingTasks, overdueTasks, completedTasks };
  }, [safeTasks, today, now]);

  const filteredTasks = useMemo(() => {
    const { todayTasks, upcomingTasks, overdueTasks, completedTasks } = categorizedTasks;
    switch (filter) {
      case 'today': return { todayTasks, upcomingTasks: [], overdueTasks: [], completedTasks: [] };
      case 'upcoming': return { todayTasks: [], upcomingTasks, overdueTasks: [], completedTasks: [] };
      case 'overdue': return { todayTasks: [], upcomingTasks: [], overdueTasks, completedTasks: [] };
      case 'completed': return { todayTasks: [], upcomingTasks: [], overdueTasks: [], completedTasks };
      default: return categorizedTasks;
    }
  }, [categorizedTasks, filter]);

  const stats = useMemo(() => ({
    total: safeTasks.length,
    today: categorizedTasks.todayTasks.length,
    upcoming: categorizedTasks.upcomingTasks.length,
    overdue: categorizedTasks.overdueTasks.length,
    completed: categorizedTasks.completedTasks.length,
    pending: safeTasks.filter(t => !t.completed).length
  }), [safeTasks, categorizedTasks]);

  const formatDate = useCallback((dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
    });
  }, []);

  const formatTime = useCallback((timeString) => {
    if (!timeString) return '';
    const [hours, minutes] = timeString.split(':');
    const time = new Date();
    time.setHours(parseInt(hours, 10));
    time.setMinutes(parseInt(minutes, 10));
    return time.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  }, []);

  const getTaskPriority = useCallback((task) => {
    if (task.completed) return 'completed';
    
    const taskDateTime = new Date(`${task.date}T${task.time || '00:00'}`);
    const hoursUntilDue = (taskDateTime - new Date()) / (1000 * 60 * 60);
    
    if (hoursUntilDue < 0) return 'high'; // Overdue
    if (hoursUntilDue <= 2) return 'high'; // Due within 2 hours
    if (hoursUntilDue <= 24) return 'medium'; // Due within 24 hours
    return 'low'; // Due later
  }, []);

  const TaskSection = React.memo(({ title, tasks, icon }) => {
    if (tasks.length === 0) return null;
    
    return (
      <div className="task-section">
        <div className="task-section-header">
          <div className="task-section-title">
            <span className="task-section-icon">{icon}</span>
            {title}
          </div>
          <div className="task-section-count">
            {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'}
          </div>
        </div>
        <ul className="task-list">
          {tasks.map((task) => (
            <TaskItem
              key={task._id}
              task={task}
              editingTask={editingTask}
              editTitle={editTitle}
              editDate={editDate}
              editTime={editTime}
              editReminderType={editReminderType}
              reminderTypes={reminderTypes}
              deletingTasks={deletingTasks}
              completingTasks={completingTasks}
              onTitleChange={handleTitleChange}
              onDateChange={handleDateChange}
              onTimeChange={handleTimeChange}
              onReminderTypeChange={handleReminderTypeChange}
              onStartEdit={startEdit}
              onSaveEdit={saveEdit}
              onCancelEdit={cancelEdit}
              onMarkComplete={markComplete}
              onDeleteTask={deleteTask}
              formatDate={formatDate}
              formatTime={formatTime}
              getTaskPriority={getTaskPriority}
            />
          ))}
        </ul>
      </div>
    );
  });

  if (loading) {
    return (
      <div className="task-list-container">
        <div className="task-loading">
          <div className="task-spinner"></div>
          <p>Loading your tasks...</p>
        </div>
      </div>
    );
  }

  if (safeTasks.length === 0) {
    return (
      <div className="task-list-container">
        <div className="task-empty-state">
          <div className="task-empty-icon">📝</div>
          <h3 className="task-empty-title">No tasks yet</h3>
          <p className="task-empty-description">Create your first task to get started!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="task-list-container">
      <div className="task-list-header">
        <h1 className="task-list-title">My Tasks</h1>
        <p className="task-list-subtitle">Stay organized and productive</p>
      </div>

      {/* Task Statistics */}
      <div className="task-stats">
        <div className="task-stat-card">
          <div className="task-stat-number">{stats.total}</div>
          <div className="task-stat-label">Total</div>
        </div>
        <div className="task-stat-card">
          <div className="task-stat-number">{stats.pending}</div>
          <div className="task-stat-label">Pending</div>
        </div>
        <div className="task-stat-card">
          <div className="task-stat-number">{stats.today}</div>
          <div className="task-stat-label">Today</div>
        </div>
        <div className="task-stat-card">
          <div className="task-stat-number">{stats.upcoming}</div>
          <div className="task-stat-label">Upcoming</div>
        </div>
        <div className="task-stat-card">
          <div className="task-stat-number">{stats.overdue}</div>
          <div className="task-stat-label">Overdue</div>
        </div>
        <div className="task-stat-card">
          <div className="task-stat-number">{stats.completed}</div>
          <div className="task-stat-label">Completed</div>
        </div>
      </div>

      {/* Filter Buttons */}
      <div className="task-filters">
        <button 
          className={`filter-btn ${filter === 'all' ? 'active' : ''}`} 
          onClick={() => setFilter('all')}
        >
          All ({stats.total})
        </button>
        <button 
          className={`filter-btn ${filter === 'today' ? 'active' : ''}`} 
          onClick={() => setFilter('today')}
        >
          Today ({stats.today})
        </button>
        <button 
          className={`filter-btn ${filter === 'upcoming' ? 'active' : ''}`} 
          onClick={() => setFilter('upcoming')}
        >
          Upcoming ({stats.upcoming})
        </button>
        <button 
          className={`filter-btn ${filter === 'overdue' ? 'active' : ''}`} 
          onClick={() => setFilter('overdue')}
        >
          Overdue ({stats.overdue})
        </button>
        <button 
          className={`filter-btn ${filter === 'completed' ? 'active' : ''}`} 
          onClick={() => setFilter('completed')}
        >
          Completed ({stats.completed})
        </button>
      </div>

      {/* Task Sections */}
      <TaskSection title="🚨 Overdue Tasks" tasks={filteredTasks.overdueTasks} icon="⚠️" />
      <TaskSection title="📅 Today's Tasks" tasks={filteredTasks.todayTasks} icon="📅" />
      <TaskSection title="⏰ Upcoming Tasks" tasks={filteredTasks.upcomingTasks} icon="⏰" />
      
      {/* Completed Tasks Section */}
      {filter === 'all' || filter === 'completed' ? (
        <div className="completed-section">
          <div className="completed-header">
            <h3>✅ Completed Tasks ({stats.completed})</h3>
            <button 
              className="toggle-btn" 
              onClick={() => setShowCompleted(!showCompleted)}
            >
              {showCompleted ? "Hide" : "Show"}
            </button>
          </div>
          {showCompleted && stats.completed > 0 && (
            <TaskSection title="" tasks={filteredTasks.completedTasks} icon="" />
          )}
        </div>
      ) : null}

      {/* Empty State for Filtered Views */}
      {Object.values(filteredTasks).every(taskArray => taskArray.length === 0) && (
        <div className="task-empty-state">
          <div className="task-empty-icon">🔍</div>
          <h3 className="task-empty-title">No tasks found</h3>
          <p className="task-empty-description">
            {filter === 'today' && "You have no tasks for today!"}
            {filter === 'upcoming' && "No upcoming tasks scheduled."}
            {filter === 'overdue' && "Great! No overdue tasks."}
            {filter === 'completed' && "No completed tasks yet."}
          </p>
        </div>
      )}
    </div>
  );
}

const TaskItem = React.memo(({
  task, editingTask, editTitle, editDate, editTime, editReminderType, reminderTypes,
  deletingTasks, completingTasks,
  onTitleChange, onDateChange, onTimeChange, onReminderTypeChange,
  onStartEdit, onSaveEdit, onCancelEdit, onMarkComplete,
  onDeleteTask, formatDate, formatTime, getTaskPriority
}) => {
  const isDeleting = deletingTasks.has(task._id);
  const isCompleting = completingTasks.has(task._id);

  return (
    <li className={`task-item ${task.category} ${task.completed ? 'completed' : ''} ${isDeleting ? 'deleting' : ''}`}>
      <div className="task-content">
        {editingTask === task._id ? (
          <div className="task-edit-form">
            <input 
              type="text" 
              value={editTitle} 
              onChange={onTitleChange} 
              className="task-edit-title" 
              placeholder="Task title" 
              autoFocus 
            />
            <div className="task-edit-datetime">
              <input 
                type="date" 
                value={editDate} 
                onChange={onDateChange} 
                className="task-edit-date" 
              />
              <input 
                type="time" 
                value={editTime} 
                onChange={onTimeChange} 
                className="task-edit-time" 
              />
              <select
                value={editReminderType}
                onChange={onReminderTypeChange}
                className="task-edit-reminder"
              >
                {reminderTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
            <div className="task-edit-actions">
              <button 
                className="task-edit-btn btn-save" 
                onClick={onSaveEdit} 
                disabled={!editTitle.trim() || !editDate || !editTime}
              >
                Save
              </button>
              <button 
                className="task-edit-btn btn-cancel" 
                onClick={onCancelEdit}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <>
            <h3 className="task-title">{task.title}</h3>
            <div className="task-meta">
              <div className="task-date">
                <span>📅</span>
                <span>{formatDate(task.date)}</span>
              </div>
              {task.time && (
                <div className="task-time">
                  <span>⏰</span>
                  <span>{formatTime(task.time)}</span>
                </div>
              )}
              {task.reminderType && task.reminderType !== 'Custom' && (
                <div className="task-reminder">
                  <span>🔔</span>
                  <span>{task.reminderType}</span>
                </div>
              )}
              {task.reminderFrequency && (
                <div className="task-frequency">
                  <span>🔂</span>
                  <span>{task.reminderFrequency}</span>
                </div>
              )}
              <div className={`task-priority ${getTaskPriority(task)}`}>
                {getTaskPriority(task)} priority
              </div>
            </div>
          </>
        )}
      </div>

      {editingTask !== task._id && (
        <div className="task-actions">
          <button
            className={`task-action-btn btn-complete ${task.completed ? 'completed' : ''}`}
            onClick={() => onMarkComplete(task)}
            title={task.completed ? "Mark as pending" : "Mark as complete"}
            disabled={isCompleting || isDeleting}
          >
            {isCompleting ? "..." : (task.completed ? "↩️" : "✓")}
          </button>
          <button 
            className="task-action-btn btn-edit" 
            onClick={() => onStartEdit(task)} 
            title="Edit" 
            disabled={isCompleting || isDeleting}
          >
            ✏️
          </button>
          <button 
            className="task-action-btn btn-delete" 
            onClick={() => onDeleteTask(task._id)} 
            disabled={isDeleting || isCompleting} 
            title="Delete"
          >
            🗑️
          </button>
        </div>
      )}
    </li>
  );
});

export default TaskList;