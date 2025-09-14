import React, { useState, useEffect, useMemo } from 'react';
import "./complete.css";
import Navbar from '../components/Navbar';

const CompletedTasks = ({ token, user }) => {
  const [completedTasks, setCompletedTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('completedAt');
  const [animateCards, setAnimateCards] = useState(false);

  // Simulate backend data
  const mockCompletedTasks = [
    {
      _id: '1',
      title: 'Complete project presentation',
      date: '2024-09-10',
      time: '14:30',
      reminderType: 'Weekly',
      completed: true,
      updatedAt: '2024-09-12T10:30:00Z',
      completedBy: 'John Doe'
    },
    {
      _id: '2',
      title: 'Review team performance',
      date: '2024-09-11',
      time: '09:00',
      reminderType: 'Monthly',
      completed: true,
      updatedAt: '2024-09-13T15:45:00Z',
      completedBy: 'Jane Smith'
    },
    {
      _id: '3',
      title: 'Submit quarterly report',
      date: '2024-09-05',
      time: '17:00',
      reminderType: 'Quarterly',
      completed: true,
      updatedAt: '2024-09-14T12:00:00Z',
      completedBy: 'Mike Johnson'
    },
    {
      _id: '4',
      title: 'Client meeting preparation',
      date: '2024-09-08',
      time: '11:00',
      reminderType: 'Custom',
      completed: true,
      updatedAt: '2024-09-14T08:30:00Z',
      completedBy: 'Sarah Wilson'
    }
  ];

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setCompletedTasks(mockCompletedTasks);
      setLoading(false);
    }, 1000);
  }, []);

  useEffect(() => {
    setAnimateCards(true);
    const timer = setTimeout(() => setAnimateCards(false), 300);
    return () => clearTimeout(timer);
  }, [filter, sortBy]);

  const restoreTask = (taskId) => {
    setCompletedTasks(prev => prev.filter(task => task._id !== taskId));
    console.log(`Restoring task ${taskId}`);
  };

  const deleteTask = (taskId) => {
    if (!window.confirm('Are you sure you want to permanently delete this task?')) return;
    setCompletedTasks(prev => prev.filter(task => task._id !== taskId));
    console.log(`Deleting task ${taskId}`);
  };

  const filteredAndSortedTasks = useMemo(() => {
    let filtered = completedTasks.filter(task =>
      task.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (filter !== 'all') {
      const now = new Date();
      const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekStart = new Date(dayStart);
      weekStart.setDate(dayStart.getDate() - dayStart.getDay());
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      filtered = filtered.filter(task => {
        const completedDate = new Date(task.updatedAt || task.date);
        switch (filter) {
          case 'today':
            return completedDate >= dayStart;
          case 'week':
            return completedDate >= weekStart;
          case 'month':
            return completedDate >= monthStart;
          default:
            return true;
        }
      });
    }

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'title':
          return a.title.localeCompare(b.title);
        case 'date':
          return new Date(a.date) - new Date(b.date);
        case 'completedAt':
        default:
          return new Date(b.updatedAt || b.date) - new Date(a.updatedAt || a.date);
      }
    });
  }, [completedTasks, filter, searchTerm, sortBy]);

  const stats = useMemo(() => {
    const now = new Date();
    const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(dayStart);
    weekStart.setDate(dayStart.getDate() - dayStart.getDay());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    return {
      total: completedTasks.length,
      today: completedTasks.filter(t => new Date(t.updatedAt || t.date) >= dayStart).length,
      week: completedTasks.filter(t => new Date(t.updatedAt || t.date) >= weekStart).length,
      month: completedTasks.filter(t => new Date(t.updatedAt || t.date) >= monthStart).length
    };
  }, [completedTasks]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
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

  const getCompletionTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = now - date;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-purple-800 p-8">
        <div className="flex flex-col items-center justify-center h-96 text-white">
          <div className="w-16 h-16 border-4 border-white/30 border-t-white rounded-full animate-spin mb-4"></div>
          <p className="text-xl">Loading completed tasks...</p>
        </div>
      </div>
    );
  }

  return (
    <>
    <Navbar/>
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-purple-800 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 text-white">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r ">
            ✅ Completed Tasks
          </h1>
          <p className="text-xl opacity-90">Tasks you've accomplished with excellence</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[
            { label: 'Total Completed', value: stats.total, icon: '🏆', color: 'from-green-400 to-green-600', filter: 'all' },
            { label: 'Today', value: stats.today, icon: '📅', color: 'from-blue-400 to-blue-600', filter: 'today' },
            { label: 'This Week', value: stats.week, icon: '📊', color: 'from-purple-400 to-purple-600', filter: 'week' },
            { label: 'This Month', value: stats.month, icon: '📈', color: 'from-pink-400 to-pink-600', filter: 'month' }
          ].map((stat, index) => (
            <div
              key={stat.label}
              className={`bg-gradient-to-r ${stat.color} p-6 rounded-2xl shadow-lg cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-xl animate-fade-in-up`}
              onClick={() => setFilter(stat.filter)}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="flex items-center justify-between text-white">
                <div>
                  <p className="text-3xl font-bold">{stat.value}</p>
                  <p className="text-sm opacity-90">{stat.label}</p>
                </div>
                <div className="text-3xl opacity-80">{stat.icon}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Controls */}
        <div className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl border border-white/20 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            <input
              type="text"
              placeholder="Search completed tasks..."
              className="flex-1 px-4 py-3 rounded-xl bg-white/90 border-0 focus:ring-2 focus:ring-purple-300 focus:outline-none transition-all duration-300"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <select
              className="px-4 py-3 rounded-xl bg-white/90 border-0 focus:ring-2 focus:ring-purple-300 focus:outline-none cursor-pointer"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </select>
            <select
              className="px-4 py-3 rounded-xl bg-white/90 border-0 focus:ring-2 focus:ring-purple-300 focus:outline-none cursor-pointer"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="completedAt">Completion Date</option>
              <option value="title">Task Name</option>
              <option value="date">Original Due Date</option>
            </select>
          </div>
        </div>

        {/* Empty State */}
        {filteredAndSortedTasks.length === 0 ? (
          <div className="text-center py-16 text-white">
            <div className="text-6xl mb-4">🎉</div>
            <h3 className="text-2xl font-bold mb-2">
              {searchTerm ? 'No matching tasks found' : 'No completed tasks yet'}
            </h3>
            <p className="text-lg opacity-80">
              {searchTerm
                ? 'Try adjusting your search or filter criteria'
                : 'Complete some tasks to see them here!'}
            </p>
          </div>
        ) : (
          /* Tasks Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAndSortedTasks.map((task, index) => (
              <div
                key={task._id}
                className={`bg-white/95 rounded-2xl p-6 shadow-lg border border-white/20 transform transition-all duration-300 hover:scale-105 hover:shadow-xl ${animateCards ? 'animate-slide-in-up' : ''}`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {/* Task Header */}
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-800 line-through opacity-70 flex-1">
                    {task.title}
                  </h3>
                  <div className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                    <span>✅</span>
                    Complete
                  </div>
                </div>

                {/* Task Meta */}
                <div className="space-y-2 mb-4 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <span>📅</span>
                    <span>Due: {formatDate(task.date)}</span>
                  </div>
                  {task.time && (
                    <div className="flex items-center gap-2">
                      <span>⏰</span>
                      <span>{formatTime(task.time)}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <span>🏆</span>
                    <span>Completed {getCompletionTime(task.updatedAt || task.date)}</span>
                  </div>
                  {task.reminderType && task.reminderType !== 'Custom' && (
                    <div className="flex items-center gap-2">
                      <span>🔔</span>
                      <span>{task.reminderType}</span>
                    </div>
                  )}
                  {task.completedBy && (
                    <div className="flex items-center gap-2">
                      <span>👤</span>
                      <span>By {task.completedBy}</span>
                    </div>
                  )}
                </div>

                {/* Task Actions */}
                <div className="flex gap-2 justify-end">
                  <button
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 transform hover:scale-105 flex items-center gap-2"
                    onClick={() => restoreTask(task._id)}
                    title="Restore task"
                  >
                    <span>↩️</span>
                    Restore
                  </button>
                  <button
                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 transform hover:scale-105 flex items-center gap-2"
                    onClick={() => deleteTask(task._id)}
                    title="Delete permanently"
                  >
                    <span>🗑️</span>
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Achievement Banner */}
        {completedTasks.length > 0 && (
          <div className="mt-12 bg-gradient-to-r from-green-400 to-green-600 rounded-2xl p-8 text-center text-white">
            <div className="text-4xl mb-4">🎉</div>
            <h3 className="text-2xl font-bold mb-2">Great Job!</h3>
            <p className="text-lg">
              You've completed {stats.total} tasks. Keep up the excellent work!
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
      `}</style>
    </div>
    </>
  );
};

export default CompletedTasks;