import React, { useState, useEffect, useMemo } from 'react';
import Navbar from '../components/Navbar';

const ReportsPage = ({ token, user }) => {
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [selectedChart, setSelectedChart] = useState('productivity');
  const [tasksData, setTasksData] = useState([]);
  const [animateCharts, setAnimateCharts] = useState(false);

  // Mock data for reports
  const mockTasksData = [
    { id: 1, title: 'Project A', completed: true, date: '2024-09-01', category: 'Development', priority: 'high', timeSpent: 120 },
    { id: 2, title: 'Meeting with client', completed: true, date: '2024-09-02', category: 'Business', priority: 'medium', timeSpent: 60 },
    { id: 3, title: 'Code review', completed: true, date: '2024-09-03', category: 'Development', priority: 'low', timeSpent: 45 },
    { id: 4, title: 'Database optimization', completed: false, date: '2024-09-05', category: 'Development', priority: 'high', timeSpent: 0 },
    { id: 5, title: 'Team training', completed: true, date: '2024-09-07', category: 'HR', priority: 'medium', timeSpent: 180 },
    { id: 6, title: 'Security audit', completed: true, date: '2024-09-10', category: 'Security', priority: 'high', timeSpent: 240 },
    { id: 7, title: 'UI/UX improvements', completed: false, date: '2024-09-12', category: 'Design', priority: 'medium', timeSpent: 0 },
    { id: 8, title: 'Performance testing', completed: true, date: '2024-09-14', category: 'QA', priority: 'high', timeSpent: 90 }
  ];

  useEffect(() => {
    setTimeout(() => {
      setTasksData(mockTasksData);
      setLoading(false);
      setAnimateCharts(true);
    }, 1000);
  }, []);

  const analytics = useMemo(() => {
    const completed = tasksData.filter(task => task.completed);
    const pending = tasksData.filter(task => !task.completed);
    
    const categoryStats = tasksData.reduce((acc, task) => {
      if (!acc[task.category]) {
        acc[task.category] = { total: 0, completed: 0, timeSpent: 0 };
      }
      acc[task.category].total++;
      if (task.completed) acc[task.category].completed++;
      acc[task.category].timeSpent += task.timeSpent;
      return acc;
    }, {});

    const priorityStats = tasksData.reduce((acc, task) => {
      if (!acc[task.priority]) {
        acc[task.priority] = { total: 0, completed: 0 };
      }
      acc[task.priority].total++;
      if (task.completed) acc[task.priority].completed++;
      return acc;
    }, {});

    const completionRate = tasksData.length > 0 ? (completed.length / tasksData.length) * 100 : 0;
    const totalTimeSpent = completed.reduce((sum, task) => sum + task.timeSpent, 0);
    const avgTimePerTask = completed.length > 0 ? totalTimeSpent / completed.length : 0;

    return {
      totalTasks: tasksData.length,
      completedTasks: completed.length,
      pendingTasks: pending.length,
      completionRate,
      totalTimeSpent,
      avgTimePerTask,
      categoryStats,
      priorityStats
    };
  }, [tasksData]);

  const chartData = useMemo(() => {
    switch (selectedChart) {
      case 'productivity':
        return Object.entries(analytics.categoryStats).map(([category, stats]) => ({
          name: category,
          completed: stats.completed,
          total: stats.total,
          percentage: stats.total > 0 ? (stats.completed / stats.total) * 100 : 0
        }));
      case 'priority':
        return Object.entries(analytics.priorityStats).map(([priority, stats]) => ({
          name: priority,
          completed: stats.completed,
          total: stats.total,
          percentage: stats.total > 0 ? (stats.completed / stats.total) * 100 : 0
        }));
      case 'time':
        return Object.entries(analytics.categoryStats).map(([category, stats]) => ({
          name: category,
          timeSpent: stats.timeSpent,
          avgTime: stats.completed > 0 ? stats.timeSpent / stats.completed : 0
        }));
      default:
        return [];
    }
  }, [analytics, selectedChart]);

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return '#EF4444';
      case 'medium': return '#F59E0B';
      case 'low': return '#10B981';
      default: return '#6B7280';
    }
  };

  const getCategoryColor = (index) => {
    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#84CC16', '#F97316'];
    return colors[index % colors.length];
  };

  const formatTime = (minutes) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  };

  const generateReport = (type) => {
    const reportData = {
      period: selectedPeriod,
      generatedAt: new Date().toISOString(),
      analytics,
      tasks: tasksData
    };
    
    console.log(`Generating ${type} report:`, reportData);
    alert(`${type.toUpperCase()} report generated! Check console for data.`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-600 via-teal-600 to-blue-800 p-8">
        <div className="flex flex-col items-center justify-center h-96 text-white">
          <div className="w-16 h-16 border-4 border-white/30 border-t-white rounded-full animate-spin mb-4"></div>
          <p className="text-xl">Generating reports...</p>
        </div>
      </div>
    );
  }

  return (
    <>
    <Navbar/>
    <div className="min-h-screen bg-gradient-to-br from-green-600 via-teal-600 to-blue-800 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 text-white">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r ">
            📈 Reports Dashboard
          </h1>
          <p className="text-xl opacity-90">Insights and analytics for your productivity</p>
        </div>

        {/* Controls */}
        <div className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl border border-white/20 mb-8">
          <div className="flex flex-col lg:flex-row gap-4 mb-4">
            <select
              className="px-4 py-3 rounded-xl bg-white/90 border-0 focus:ring-2 focus:ring-green-300 focus:outline-none cursor-pointer"
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
            >
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="quarter">This Quarter</option>
              <option value="year">This Year</option>
            </select>
            <select
              className="px-4 py-3 rounded-xl bg-white/90 border-0 focus:ring-2 focus:ring-green-300 focus:outline-none cursor-pointer"
              value={selectedChart}
              onChange={(e) => setSelectedChart(e.target.value)}
            >
              <option value="productivity">Productivity by Category</option>
              <option value="priority">Tasks by Priority</option>
              <option value="time">Time Analytics</option>
            </select>
          </div>
          
          <div className="flex gap-2 flex-wrap">
            <button
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-all duration-300 transform hover:scale-105"
              onClick={() => generateReport('pdf')}
            >
              📄 Generate PDF
            </button>
            <button
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-all duration-300 transform hover:scale-105"
              onClick={() => generateReport('excel')}
            >
              📊 Export to Excel
            </button>
            <button
              className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg transition-all duration-300 transform hover:scale-105"
              onClick={() => generateReport('csv')}
            >
              📋 Export CSV
            </button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[
            { 
              label: 'Total Tasks', 
              value: analytics.totalTasks, 
              icon: '📋', 
              color: 'from-blue-400 to-blue-600',
              subtext: 'All tasks'
            },
            { 
              label: 'Completion Rate', 
              value: `${analytics.completionRate.toFixed(1)}%`, 
              icon: '🎯', 
              color: 'from-green-400 to-green-600',
              subtext: `${analytics.completedTasks}/${analytics.totalTasks}`
            },
            { 
              label: 'Total Time', 
              value: formatTime(analytics.totalTimeSpent), 
              icon: '⏱️', 
              color: 'from-purple-400 to-purple-600',
              subtext: 'Time invested'
            },
            { 
              label: 'Avg Time/Task', 
              value: formatTime(Math.round(analytics.avgTimePerTask)), 
              icon: '📊', 
              color: 'from-orange-400 to-orange-600',
              subtext: 'Per completed task'
            }
          ].map((metric, index) => (
            <div
              key={metric.label}
              className={`bg-gradient-to-r ${metric.color} p-6 rounded-2xl shadow-lg transform transition-all duration-300 hover:scale-105 hover:shadow-xl animate-fade-in-up`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="flex items-center justify-between text-white">
                <div>
                  <p className="text-2xl md:text-3xl font-bold">{metric.value}</p>
                  <p className="text-sm opacity-90">{metric.label}</p>
                  <p className="text-xs opacity-75">{metric.subtext}</p>
                </div>
                <div className="text-3xl opacity-80">{metric.icon}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Main Chart */}
          <div className="bg-white/95 rounded-2xl p-6 shadow-lg">
            <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              📊 {selectedChart === 'productivity' ? 'Productivity by Category' : 
                   selectedChart === 'priority' ? 'Tasks by Priority' : 'Time Analytics'}
            </h3>
            <div className="space-y-4">
              {chartData.map((item, index) => (
                <div key={item.name} className="relative">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700 capitalize">{item.name}</span>
                    <span className="text-sm text-gray-600">
                      {selectedChart === 'time' 
                        ? formatTime(item.timeSpent)
                        : `${item.completed}/${item.total} (${item.percentage.toFixed(1)}%)`
                      }
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="h-3 rounded-full transition-all duration-1000 ease-out"
                      style={{
                        width: selectedChart === 'time' 
                          ? `${Math.min((item.timeSpent / Math.max(...chartData.map(d => d.timeSpent))) * 100, 100)}%`
                          : `${item.percentage}%`,
                        backgroundColor: selectedChart === 'priority' 
                          ? getPriorityColor(item.name) 
                          : getCategoryColor(index),
                        transform: animateCharts ? 'scaleX(1)' : 'scaleX(0)',
                        transformOrigin: 'left',
                        transitionDelay: `${index * 0.2}s`
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Category Breakdown */}
          <div className="bg-white/95 rounded-2xl p-6 shadow-lg">
            <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              🏷️ Category Breakdown
            </h3>
            <div className="space-y-4">
              {Object.entries(analytics.categoryStats).map(([category, stats], index) => (
                <div key={category} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold text-gray-800 capitalize">{category}</h4>
                    <div className="text-right text-sm text-gray-600">
                      <div>{stats.completed}/{stats.total} tasks</div>
                      <div>{formatTime(stats.timeSpent)} spent</div>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="h-2 rounded-full transition-all duration-1000 ease-out"
                      style={{
                        width: `${stats.total > 0 ? (stats.completed / stats.total) * 100 : 0}%`,
                        backgroundColor: getCategoryColor(index),
                        transform: animateCharts ? 'scaleX(1)' : 'scaleX(0)',
                        transformOrigin: 'left',
                        transitionDelay: `${index * 0.15}s`
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Priority Analysis */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {Object.entries(analytics.priorityStats).map(([priority, stats]) => (
            <div key={priority} className="bg-white/95 rounded-2xl p-6 shadow-lg">
              <div className="flex items-center gap-3 mb-4">
                <div 
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: getPriorityColor(priority) }}
                />
                <h3 className="text-lg font-bold text-gray-800 capitalize">{priority} Priority</h3>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total:</span>
                  <span className="font-semibold">{stats.total}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Completed:</span>
                  <span className="font-semibold text-green-600">{stats.completed}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Pending:</span>
                  <span className="font-semibold text-orange-600">{stats.total - stats.completed}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Rate:</span>
                  <span className="font-semibold">
                    {stats.total > 0 ? ((stats.completed / stats.total) * 100).toFixed(1) : 0}%
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Recent Tasks Table */}
        <div className="bg-white/95 rounded-2xl p-6 shadow-lg">
          <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            📋 Recent Tasks Overview
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-2 font-semibold text-gray-700">Task</th>
                  <th className="text-left py-3 px-2 font-semibold text-gray-700">Category</th>
                  <th className="text-left py-3 px-2 font-semibold text-gray-700">Priority</th>
                  <th className="text-left py-3 px-2 font-semibold text-gray-700">Status</th>
                  <th className="text-left py-3 px-2 font-semibold text-gray-700">Time Spent</th>
                  <th className="text-left py-3 px-2 font-semibold text-gray-700">Date</th>
                </tr>
              </thead>
              <tbody>
                {tasksData.slice(0, 6).map((task) => (
                  <tr key={task.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-2">
                      <span className={task.completed ? 'line-through text-gray-500' : ''}>
                        {task.title}
                      </span>
                    </td>
                    <td className="py-3 px-2">
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                        {task.category}
                      </span>
                    </td>
                    <td className="py-3 px-2">
                      <span 
                        className="px-2 py-1 rounded text-xs text-white font-medium"
                        style={{ backgroundColor: getPriorityColor(task.priority) }}
                      >
                        {task.priority}
                      </span>
                    </td>
                    <td className="py-3 px-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        task.completed 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-orange-100 text-orange-800'
                      }`}>
                        {task.completed ? '✅ Completed' : '⏳ Pending'}
                      </span>
                    </td>
                    <td className="py-3 px-2">
                      {task.timeSpent > 0 ? formatTime(task.timeSpent) : '-'}
                    </td>
                    <td className="py-3 px-2 text-gray-600 text-sm">
                      {new Date(task.date).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Insights */}
        <div className="mt-8 bg-gradient-to-r from-teal-400 to-blue-600 rounded-2xl p-8 text-center text-white">
          <div className="text-4xl mb-4">💡</div>
          <h3 className="text-2xl font-bold mb-4">Productivity Insights</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="font-semibold">Most Productive Category:</p>
              <p>{Object.entries(analytics.categoryStats)
                .sort(([,a], [,b]) => b.completed - a.completed)[0]?.[0] || 'N/A'}</p>
            </div>
            <div>
              <p className="font-semibold">Average Task Completion:</p>
              <p>{analytics.completionRate.toFixed(1)}% success rate</p>
            </div>
            <div>
              <p className="font-semibold">Time Efficiency:</p>
              <p>{formatTime(Math.round(analytics.avgTimePerTask))} per task</p>
            </div>
          </div>
        </div>
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

        .animate-fade-in-up {
          animation: fade-in-up 0.6s ease-out forwards;
        }
      `}</style>
    </div>
    </>
  );
};

export default ReportsPage;