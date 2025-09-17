import React, { useState } from "react";
import axios from "axios"; // ✅ Make sure axios is imported

function TaskForm({ fetchTasks, token, isOpen, onClose }) {
  const [title, setTitle] = useState("");
  const [reminderType, setReminderType] = useState("Custom");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [enableReminders, setEnableReminders] = useState(false);
  const [reminderFrequency, setReminderFrequency] = useState("Once");
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [errors, setErrors] = useState({});

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

  const reminderFrequencies = ["Once", "Twice", "Thrice"];

  const resetForm = () => {
    setTitle("");
    setReminderType("Custom");
    setDate("");
    setTime("");
    setEnableReminders(false);
    setReminderFrequency("Once");
    setErrors({});
    setShowSuccess(false);
  };

  const addTask = async () => {
    // Reset errors
    setErrors({});

    // Validation
    const newErrors = {};
    if (!title.trim()) newErrors.title = true;
    if (!date) newErrors.date = true;
    if (!time) newErrors.time = true;

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);

    try {
      // Get user data from token
      let userId = "user123"; // fallback
      
      if (token) {
        try {
          const tokenData = JSON.parse(atob(token.split('.')[1]));
          userId = tokenData.userId || tokenData.id || "user123";
        } catch (tokenError) {
          console.warn("Error parsing token, using fallback userId:", tokenError);
        }
      }

      const taskData = {
        title: title.trim(),
        date,
        time,
        userId: userId,
        reminderType,
        reminderFrequency: enableReminders ? reminderFrequency : null
      };

      // ✅ Actual API call (uncommented)
      await axios.post("https://taskmanager-r5m8.onrender.com/api/tasks", taskData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log("Task created successfully:", taskData);

      // Show success state
      setShowSuccess(true);
      
      // Refresh tasks list if function provided
      if (fetchTasks) {
        await fetchTasks();
      }

      // Auto-close after showing success
      setTimeout(() => {
        resetForm();
        onClose();
      }, 2000);

    } catch (error) {
      console.error("Error adding task:", error);
      setIsLoading(false);
      
      let errorMessage = "Failed to add task. Please try again.";
      if (error.response) {
        errorMessage = error.response.data?.message || errorMessage;
      }
      
      alert(errorMessage);
    }
  };

  const handleSubmit = () => {
    if (!isLoading && !showSuccess) {
      addTask();
    }
  };

  const handleClose = () => {
    if (!isLoading && !showSuccess) {
      resetForm();
      onClose();
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !isLoading && !showSuccess) {
      addTask();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {showSuccess ? (
          <div className="success-state">
            <div className="success-icon">
              ✓
            </div>
            <h2>Thank You!</h2>
            <p>Task created successfully</p>
          </div>
        ) : (
          <>
            <div className="modal-header">
              <h2>Add New Task</h2>
              <button 
                className="close-btn" 
                onClick={handleClose}
                disabled={isLoading}
                type="button"
              >
                ×
              </button>
            </div>

            <div className="task-form">
              {/* 1. Task Title */}
              <div className="form-group">
                <label>Task Title *</label>
                <input
                  type="text"
                  placeholder="Enter task title"
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    if (errors.title) {
                      setErrors(prev => ({ ...prev, title: false }));
                    }
                  }}
                  onKeyPress={handleKeyPress}
                  className={`form-input ${errors.title ? 'error' : ''}`}
                  disabled={isLoading}
                />
                {errors.title && <span className="error-text">Title is required</span>}
              </div>

              {/* 2. Reminder Type */}
              <div className="form-group">
                <label>Reminder Type</label>
                <select
                  value={reminderType}
                  onChange={(e) => setReminderType(e.target.value)}
                  className="form-input form-select"
                  disabled={isLoading}
                >
                  {reminderTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              {/* 3. Date */}
              <div className="form-group">
                <label>Date *</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => {
                    setDate(e.target.value);
                    if (errors.date) {
                      setErrors(prev => ({ ...prev, date: false }));
                    }
                  }}
                  onKeyPress={handleKeyPress}
                  className={`form-input ${errors.date ? 'error' : ''}`}
                  disabled={isLoading}
                />
                {errors.date && <span className="error-text">Date is required</span>}
              </div>

              {/* 4. Time */}
              <div className="form-group">
                <label>Time *</label>
                <input
                  type="time"
                  value={time}
                  onChange={(e) => {
                    setTime(e.target.value);
                    if (errors.time) {
                      setErrors(prev => ({ ...prev, time: false }));
                    }
                  }}
                  onKeyPress={handleKeyPress}
                  className={`form-input ${errors.time ? 'error' : ''}`}
                  disabled={isLoading}
                />
                {errors.time && <span className="error-text">Time is required</span>}
              </div>

              {/* 5. How many times to remind - Toggle */}
              <div className="form-group">
                <div className="toggle-container">
                  <label className="toggle-label">
                    <input
                      type="checkbox"
                      checked={enableReminders}
                      onChange={(e) => setEnableReminders(e.target.checked)}
                      disabled={isLoading}
                    />
                    <span className="toggle-slider"></span>
                    How many times to remind?
                  </label>
                </div>
              </div>

              {/* Reminder Frequency Options */}
              {enableReminders && (
                <div className="form-group">
                  <label>Select Frequency</label>
                  <div className="radio-group">
                    {reminderFrequencies.map((freq) => (
                      <label key={freq} className="radio-label">
                        <input
                          type="radio"
                          name="reminderFrequency"
                          value={freq}
                          checked={reminderFrequency === freq}
                          onChange={(e) => setReminderFrequency(e.target.value)}
                          disabled={isLoading}
                        />
                        <span className="radio-custom"></span>
                        {freq}
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <div className="form-actions">
                <button 
                  type="button"
                  onClick={handleSubmit}
                  disabled={isLoading}
                  className={`submit-btn ${isLoading ? 'loading' : ''}`}
                >
                  {isLoading ? (
                    <>
                      <span className="loading-spinner"></span>
                      Adding Task...
                    </>
                  ) : (
                    'Add New Task'
                  )}
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      <style jsx>{`
        * {
          box-sizing: border-box;
        }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
          backdrop-filter: blur(4px);
        }

        .modal-content {
          background: white;
          border-radius: 16px;
          padding: 28px;
          width: 100%;
          max-width: 500px;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          animation: modalSlideIn 0.3s ease-out;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        @keyframes modalSlideIn {
          from {
            opacity: 0;
            transform: translateY(-30px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 28px;
          padding-bottom: 16px;
          border-bottom: 1px solid #f1f5f9;
        }

        .modal-header h2 {
          margin: 0;
          color: #1e293b;
          font-size: 24px;
          font-weight: 700;
        }

        .close-btn {
          background: none;
          border: none;
          font-size: 28px;
          color: #64748b;
          cursor: pointer;
          padding: 6px;
          border-radius: 8px;
          transition: all 0.2s ease;
          line-height: 1;
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .close-btn:hover {
          background: #f1f5f9;
          color: #334155;
        }

        .close-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .task-form {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .form-group label {
          font-weight: 600;
          color: #374151;
          font-size: 14px;
          margin-bottom: 4px;
        }

        .form-input {
          padding: 14px 16px;
          border: 2px solid #e2e8f0;
          border-radius: 10px;
          font-size: 15px;
          transition: all 0.2s ease;
          background: #ffffff;
          font-family: inherit;
        }

        .form-input:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
        }

        .form-input.error {
          border-color: #ef4444;
          box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.1);
        }

        .form-input:disabled {
          background: #f8fafc;
          color: #64748b;
          cursor: not-allowed;
        }

        .form-select {
          appearance: none;
          background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
          background-position: right 12px center;
          background-repeat: no-repeat;
          background-size: 16px;
          padding-right: 40px;
          cursor: pointer;
        }

        .error-text {
          color: #ef4444;
          font-size: 13px;
          font-weight: 500;
          margin-top: 4px;
        }

        .toggle-container {
          padding: 4px 0;
        }

        .toggle-label {
          display: flex;
          align-items: center;
          gap: 14px;
          cursor: pointer;
          user-select: none;
          font-weight: 500;
          color: #374151;
        }

        .toggle-label input[type="checkbox"] {
          display: none;
        }

        .toggle-slider {
          position: relative;
          width: 50px;
          height: 26px;
          background: #e2e8f0;
          border-radius: 26px;
          transition: all 0.3s ease;
          border: 2px solid transparent;
        }

        .toggle-slider::before {
          content: '';
          position: absolute;
          top: 2px;
          left: 2px;
          width: 18px;
          height: 18px;
          background: white;
          border-radius: 50%;
          transition: all 0.3s ease;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
        }

        .toggle-label input:checked + .toggle-slider {
          background: #3b82f6;
        }

        .toggle-label input:checked + .toggle-slider::before {
          transform: translateX(24px);
        }

        .radio-group {
          display: flex;
          gap: 18px;
          flex-wrap: wrap;
          padding: 8px 0;
        }

        .radio-label {
          display: flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
          user-select: none;
          font-size: 14px;
          font-weight: 500;
          color: #374151;
          padding: 8px 12px;
          border-radius: 8px;
          transition: all 0.2s ease;
        }

        .radio-label:hover {
          background: #f8fafc;
        }

        .radio-label input[type="radio"] {
          display: none;
        }

        .radio-custom {
          width: 20px;
          height: 20px;
          border: 2px solid #cbd5e1;
          border-radius: 50%;
          position: relative;
          transition: all 0.2s ease;
        }

        .radio-custom::after {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) scale(0);
          width: 10px;
          height: 10px;
          background: #3b82f6;
          border-radius: 50%;
          transition: all 0.2s ease;
        }

        .radio-label input:checked + .radio-custom {
          border-color: #3b82f6;
          background: #eff6ff;
        }

        .radio-label input:checked + .radio-custom::after {
          transform: translate(-50%, -50%) scale(1);
        }

        .form-actions {
          margin-top: 8px;
          padding-top: 8px;
        }

        .submit-btn {
          width: 100%;
          padding: 16px 24px;
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
          color: white;
          border: none;
          border-radius: 12px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
        }

        .submit-btn:hover {
          background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(59, 130, 246, 0.4);
        }

        .submit-btn:active {
          transform: translateY(0);
        }

        .submit-btn:disabled {
          background: #94a3b8;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }

        .loading-spinner {
          width: 20px;
          height: 20px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-radius: 50%;
          border-top-color: white;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        .success-state {
          text-align: center;
          padding: 50px 30px;
        }

        .success-icon {
          width: 80px;
          height: 80px;
          margin: 0 auto 24px;
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 36px;
          font-weight: bold;
          animation: successBounce 0.6s ease-out;
          box-shadow: 0 8px 25px rgba(16, 185, 129, 0.3);
        }

        @keyframes successBounce {
          0% {
            transform: scale(0);
          }
          50% {
            transform: scale(1.1);
          }
          100% {
            transform: scale(1);
          }
        }

        .success-state h2 {
          color: #1e293b;
          margin: 0 0 12px 0;
          font-size: 28px;
          font-weight: 700;
        }

        .success-state p {
          color: #64748b;
          margin: 0;
          font-size: 16px;
          font-weight: 500;
        }

        @media (max-width: 640px) {
          .modal-content {
            margin: 10px;
            padding: 24px;
            max-height: 95vh;
          }

          .modal-header h2 {
            font-size: 20px;
          }

          .radio-group {
            flex-direction: column;
            gap: 12px;
          }

          .success-state {
            padding: 40px 20px;
          }

          .success-icon {
            width: 70px;
            height: 70px;
            font-size: 30px;
          }
        }
      `}</style>
    </div>
  );
}

export default TaskForm;