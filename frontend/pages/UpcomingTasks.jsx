import React, { useState, useEffect, useMemo } from 'react';
import Navbar from '../components/Navbar';

const UpcomingTasks = ({ token, user }) => {
  const [upcomingTasks, setUpcomingTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [viewMode, setViewMode] = useState('grid');

  // Mock upcoming tasks data
  const mockUpcomingTasks = [
    {
      _id: '1',
      title: 'Team standup meeting',
      date: '2024-09-15',
      time: '09:00',
      reminderType: 'Daily',
      priority: 'high',
      category: 'Meeting',
      assignedTo: 'Development Team',
      description: 'Daily standup to discuss progress and blockers'
    },
    {
      _id: '2',
      title: 'Code review for new feature',
      date: '2024-09-16',
      time: '14:30',
      reminderType: 'Custom',
      priority: 'medium',
      category: 'Development',
      assignedTo: 'John Doe',
      description: 'Review pull request for user authentication feature'
    },
    {
      _id: '3',
      title: 'Client presentation prep',
      date: '2024-09-18',
      time: '10:00',
      reminderType: 'Weekly',
      priority: 'high',
      category: 'Business',
      assignedTo: 'Sarah Wilson',
      description: 'Prepare slides for quarterly business review'
    },
    {
      _id: '4',
      title: 'Database backup verification',
      date: '2024-09-20',
      time: '16:00',
      reminderType: 'Monthly',
      priority: 'medium',
      category: 'Maintenance',
      assignedTo: 'IT Team',
      description: 'Verify all database backups are working correctly'
    },
    {
      _id: '5',
      title: 'Security audit review',
      date: '2024-09-25',
      time: '11:00',
      reminderType: 'Quarterly',
      priority: 'high',
      category: 'Security',
      assignedTo: 'Security Team',
      description: 'Review quarterly security audit findings'
    },
    {
      _id: '6',
      title: 'Employee training session',
      date: '2024-10-02',
      time: '13:00',
      reminderType: 'Monthly',
      priority: 'low',
      category: 'HR',
      assignedTo: 'HR Department',
      description: 'Monthly training on new company policies'
    }
  ];

  useEffect(() => {
    setTimeout(() => {
      setUpcomingTasks(mockUpcomingTasks);
      setLoading(false);
    }, 1000);
  }, []);

  const markAsComplete = (taskId) => {
    setUpcomingTasks(prev => prev.filter(task => task._id !== taskId));
    console.log(`Marking task ${taskId} as complete`);
  };

  const editTask = (taskId) => {
    console.log(`Editing task ${taskId}`);
  };

  const deleteTask = (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    setUpcomingTasks(prev => prev.filter(task => task._id !== taskId));
    console.log(`Deleting task ${taskId}`);
  };

  const filteredAndSortedTasks = useMemo(() => {
    let filtered = upcomingTasks.filter(task =>
      task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.assignedTo.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (filter !== 'all') {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(now.getDate() + 1);
      const weekEnd = new Date(now);
      weekEnd.setDate(now.getDate() + 7);
      const monthEnd = new Date(now);
      monthEnd.setMonth(now.getMonth() + 1);

      filtered = filtered.filter(task => {
        const taskDate = new Date(task.date);
        switch (filter) {
          case 'today':
            return taskDate.toDateString() === now.toDateString();
          case 'tomorrow':
            return taskDate.toDateString() === tomorrow.toDateString();
          case 'week':
            return taskDate <= weekEnd;
          case 'month':
            return taskDate <= monthEnd;
          case 'priority':
            return task.priority === 'high';
          default:
            return true;
        }
      });
    }

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'title':
          return a.title.localeCompare(b.title);
        case 'priority':
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        case 'category':
          return a.category.localeCompare(b.category);
        case 'date':
        default:
          return new Date(a.date) - new Date(b.date);
      }
    });
  }, [upcomingTasks, filter, searchTerm, sortBy]);

  const stats = useMemo(() => {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);
    const weekEnd = new Date(now);
    weekEnd.setDate(now.getDate() + 7);

    return {
      total: upcomingTasks.length,
      today: upcomingTasks.filter(t => new Date(t.date).toDateString() === now.toDateString()).length,
      tomorrow: upcomingTasks.filter(t => new Date(t.date).toDateString() === tomorrow.toDateString()).length,
      thisWeek: upcomingTasks.filter(t => new Date(t.date) <= weekEnd).length,
      highPriority: upcomingTasks.filter(t => t.priority === 'high').length
    };
  }, [upcomingTasks]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
    
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (timeString) => {
    if (!timeString) return '';
    const [hours, minutes] = timeString.split(':');
    const time = new Date();
    time.setHours(parseInt(hours, 10));
    time.setMinutes(parseInt(minutes, 10));
    return time.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit', 
      hour12: true 
    });
  };

  const getDaysUntilDue = (dateString) => {
    const taskDate = new Date(dateString);
    const today = new Date();
    const diffTime = taskDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays > 0) return `In ${diffDays} days`;
    return `${Math.abs(diffDays)} days overdue`;
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'from-red-400 to-red-600';
      case 'medium': return 'from-yellow-400 to-yellow-600';
      case 'low': return 'from-green-400 to-green-600';
      default: return 'from-gray-400 to-gray-600';
    }
  };

  const getCategoryIcon = (category) => {
    const icons = {
      'Meeting': '👥',
      'Development': '💻',
      'Business': '📊',
      'Maintenance': '🔧',
      'Security': '🔒',
      'HR': '👤'
    };
    return icons[category] || '📋';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-800 p-8">
        <div className="flex flex-col items-center justify-center h-96 text-white">
          <div className="w-16 h-16 border-4 border-white/30 border-t-white rounded-full animate-spin mb-4"></div>
          <p className="text-xl">Loading upcoming tasks...</p>
        </div>
      </div>
    );
  }

  return (
    <>
    <Navbar/>
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-800 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 text-white">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r ">
            📅 Upcoming Tasks
          </h1>
          <p className="text-xl opacity-90">Stay ahead with your scheduled tasks</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          {[
            { label: 'Total Tasks', value: stats.total, icon: '📋', color: 'from-blue-400 to-blue-600', filter: 'all' },
            { label: 'Today', value: stats.today, icon: '🌅', color: 'from-orange-400 to-orange-600', filter: 'today' },
            { label: 'Tomorrow', value: stats.tomorrow, icon: '🌇', color: 'from-purple-400 to-purple-600', filter: 'tomorrow' },
            { label: 'This Week', value: stats.thisWeek, icon: '📊', color: 'from-green-400 to-green-600', filter: 'week' },
            { label: 'High Priority', value: stats.highPriority, icon: '🚨', color: 'from-red-400 to-red-600', filter: 'priority' }
          ].map((stat, index) => (
            <div
              key={stat.label}
              className={`bg-gradient-to-r ${stat.color} p-6 rounded-2xl shadow-lg cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-xl animate-fade-in-up`}
              onClick={() => setFilter(stat.filter)}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="flex items-center justify-between text-white">
                <div>
                  <p className="text-2xl md:text-3xl font-bold">{stat.value}</p>
                  <p className="text-xs md:text-sm opacity-90">{stat.label}</p>
                </div>
                <div className="text-2xl md:text-3xl opacity-80">{stat.icon}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Controls */}
        <div className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl border border-white/20 mb-8">
          <div className="flex flex-col lg:flex-row gap-4 mb-4">
            <input
              type="text"
              placeholder="Search tasks, categories, or assignees..."
              className="flex-1 px-4 py-3 rounded-xl bg-white/90 border-0 focus:ring-2 focus:ring-blue-300 focus:outline-none transition-all duration-300"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <select
              className="px-4 py-3 rounded-xl bg-white/90 border-0 focus:ring-2 focus:ring-blue-300 focus:outline-none cursor-pointer"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="all">All Tasks</option>
              <option value="today">Today</option>
              <option value="tomorrow">Tomorrow</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="priority">High Priority</option>
            </select>
            <select
              className="px-4 py-3 rounded-xl bg-white/90 border-0 focus:ring-2 focus:ring-blue-300 focus:outline-none cursor-pointer"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="date">Due Date</option>
              <option value="priority">Priority</option>
              <option value="title">Task Name</option>
              <option value="category">Category</option>
            </select>
          </div>
          
          {/* View Mode Toggle */}
          <div className="flex gap-2">
            <button
              className={`px-4 py-2 rounded-lg transition-all duration-300 ${
                viewMode === 'grid' 
                  ? 'bg-white text-blue-600 shadow-lg' 
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
              onClick={() => setViewMode('grid')}
            >
              🔲 Grid View
            </button>
            <button
              className={`px-4 py-2 rounded-lg transition-all duration-300 ${
                viewMode === 'list' 
                  ? 'bg-white text-blue-600 shadow-lg' 
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
              onClick={() => setViewMode('list')}
            >
              📋 List View
            </button>
          </div>
        </div>

        {/* Empty State */}
        {filteredAndSortedTasks.length === 0 ? (
          <div className="text-center py-16 text-white">
            <div className="text-6xl mb-4">📅</div>
            <h3 className="text-2xl font-bold mb-2">
              {searchTerm ? 'No matching tasks found' : 'No upcoming tasks'}
            </h3>
            <p className="text-lg opacity-80">
              {searchTerm
                ? 'Try adjusting your search or filter criteria'
                : 'All caught up! No upcoming tasks scheduled.'}
            </p>
          </div>
        ) : (
          /* Tasks Display */
          <div className={viewMode === 'grid' 
            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            : "space-y-4"
          }>
            {filteredAndSortedTasks.map((task, index) => (
              <div
                key={task._id}
                className={`bg-white/95 rounded-2xl p-6 shadow-lg border border-white/20 transform transition-all duration-300 hover:scale-105 hover:shadow-xl animate-slide-in-up ${
                  viewMode === 'list' ? 'flex items-center gap-6' : ''
                }`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {/* Task Header */}
                <div className={`${viewMode === 'list' ? 'flex-1' : 'mb-4'}`}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">{getCategoryIcon(task.category)}</div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800">
                          {task.title}
                        </h3>
                        <p className="text-sm text-gray-600">{task.category}</p>
                      </div>
                    </div>
                    <div className={`bg-gradient-to-r ${getPriorityColor(task.priority)} text-white px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1`}>
                      <span>{task.priority === 'high' ? '🔥' : task.priority === 'medium' ? '⚡' : '🟢'}</span>
                      {task.priority}
                    </div>
                  </div>

                  {/* Task Description */}
                  {viewMode === 'grid' && (
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                      {task.description}
                    </p>
                  )}

                  {/* Task Meta */}
                  <div className={`${viewMode === 'list' ? 'flex gap-6' : 'space-y-2'} text-sm text-gray-600 mb-4`}>
                    <div className="flex items-center gap-2">
                      <span>📅</span>
                      <span>{formatDate(task.date)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>⏰</span>
                      <span>{formatTime(task.time)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>👤</span>
                      <span>{task.assignedTo}</span>
                    </div>
                    {task.reminderType && task.reminderType !== 'Custom' && (
                      <div className="flex items-center gap-2">
                        <span>🔔</span>
                        <span>{task.reminderType}</span>
                      </div>
                    )}
                  </div>

                  {/* Time Until Due */}
                  <div className="bg-blue-50 rounded-lg p-3 mb-4">
                    <div className="flex items-center gap-2 text-blue-700">
                      <span>⏳</span>
                      <span className="font-medium">{getDaysUntilDue(task.date)}</span>
                    </div>
                  </div>
                </div>

                {/* Task Actions */}
                <div className={`flex gap-2 ${viewMode === 'list' ? 'flex-col' : 'justify-end'}`}>
                  <button
                    className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 transform hover:scale-105 flex items-center gap-2"
                    onClick={() => markAsComplete(task._id)}
                    title="Mark as complete"
                  >
                    <span>✅</span>
                    {viewMode === 'list' ? 'Complete' : ''}
                  </button>
                  <button
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 transform hover:scale-105 flex items-center gap-2"
                    onClick={() => editTask(task._id)}
                    title="Edit task"
                  >
                    <span>✏️</span>
                    {viewMode === 'list' ? 'Edit' : ''}
                  </button>
                  <button
                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 transform hover:scale-105 flex items-center gap-2"
                    onClick={() => deleteTask(task._id)}
                    title="Delete task"
                  >
                    <span>🗑️</span>
                    {viewMode === 'list' ? 'Delete' : ''}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Summary Banner */}
        {upcomingTasks.length > 0 && (
          <div className="mt-12 bg-gradient-to-r from-blue-400 to-indigo-600 rounded-2xl p-8 text-center text-white">
            <div className="text-4xl mb-4">🎯</div>
            <h3 className="text-2xl font-bold mb-2">Stay Organized!</h3>
            <p className="text-lg">
              You have {stats.total} upcoming tasks. 
              {stats.today > 0 && ` ${stats.today} due today.`}
              {stats.highPriority > 0 && ` ${stats.highPriority} high priority tasks need attention.`}
            </p>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slide-in-up {
          from {
            opacity: 0;
            transform: translateY(30px) scale(0.9);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .animate-fade-in-up {
          animation: fade-in-up 0.6s ease-out forwards;
        }

        .animate-slide-in-up {
          animation: slide-in-up 0.6s ease-out forwards;
        }

        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
    </>
  );
};

export default UpcomingTasks;