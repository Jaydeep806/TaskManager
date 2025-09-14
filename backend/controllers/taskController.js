import Task from "../models/Task.js";
import nodemailer from "nodemailer";
import jwt from "jsonwebtoken";

// Add task with enhanced reminder features
export const addTask = async (req, res) => {
  try {
    const { title, date, time, userId, reminderType, reminderFrequency } = req.body;

    // Enhanced validation
    if (!title || !date || !time) {
      return res.status(400).json({ 
        success: false,
        message: "Required fields missing", 
        required: ["title", "date", "time"] 
      });
    }

    // Validate time format
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(time)) {
      return res.status(400).json({ 
        success: false,
        message: "Invalid time format. Use HH:MM format" 
      });
    }

    // Validate date
    const taskDate = new Date(date);
    if (isNaN(taskDate.getTime())) {
      return res.status(400).json({ 
        success: false,
        message: "Invalid date format" 
      });
    }

    // Create task data
    const taskData = {
      title: title.trim(),
      date: taskDate,
      time,
      userId: userId || req.user?.id || "default_user",
      reminderType: reminderType || 'Custom',
      reminderFrequency: reminderFrequency || null
    };

    // Set up reminder tracking if frequency is specified
    if (reminderFrequency) {
      const reminderCount = reminderFrequency === 'Once' ? 1 : 
                          reminderFrequency === 'Twice' ? 2 : 3;
      
      taskData.remindersData = {
        totalReminders: reminderCount,
        sentReminders: 0,
        lastReminderSent: null,
        nextReminderDue: null,
        reminderHistory: []
      };
    }

    const task = await Task.create(taskData);

    // Calculate and set next reminder if reminders are enabled
    if (reminderFrequency) {
      const nextReminder = task.calculateNextReminder();
      if (nextReminder) {
        task.remindersData.nextReminderDue = nextReminder;
        await task.save();
        
        console.log(`Next reminder scheduled for: ${nextReminder}`);
      }
    }

    // Schedule email reminder
    const userEmail = getUserEmail(req);
    if (userEmail && reminderFrequency) {
      setImmediate(() => {
        scheduleTaskReminders(task, userEmail);
      });
    }

    res.status(201).json({
      success: true,
      message: "Task created successfully",
      task: task,
      reminderInfo: {
        type: task.reminderType,
        frequency: task.reminderFrequency,
        nextReminder: task.remindersData?.nextReminderDue
      }
    });

  } catch (error) {
    console.error("Error adding task:", error);
    res.status(500).json({ 
      success: false,
      message: "Failed to create task", 
      error: error.message 
    });
  }
};

// Get tasks with enhanced filtering
export const getTasks = async (req, res) => {
  try {
    const { userId, filter, includeCompleted = 'true' } = req.query;

    if (!userId) {
      return res.status(400).json({ 
        success: false,
        message: "User ID is required" 
      });
    }

    let query = { userId };
    
    // Filter by completion status
    if (includeCompleted === 'false') {
      query.completed = false;
    }

    // Additional filters
    if (filter) {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      switch (filter) {
        case 'today':
          query.date = { $gte: today, $lt: tomorrow };
          break;
        case 'upcoming':
          query.date = { $gte: tomorrow };
          break;
        case 'overdue':
          query.date = { $lt: today };
          query.completed = false;
          break;
      }
    }

    const tasks = await Task.find(query)
      .sort({ date: 1, time: 1 })
      .select('-__v');

    res.json({
      success: true,
      count: tasks.length,
      tasks: tasks
    });

  } catch (error) {
    console.error("Error fetching tasks:", error);
    res.status(500).json({ 
      success: false,
      message: "Failed to fetch tasks", 
      error: error.message 
    });
  }
};

// Update task with reminder recalculation
export const updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ 
        success: false,
        message: "Task ID is required" 
      });
    }

    const allowedFields = [
      "title", "date", "time", "completed", 
      "reminderType", "reminderFrequency"
    ];
    
    const updates = {};
    Object.keys(req.body).forEach((key) => {
      if (allowedFields.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    // Validate time format if being updated
    if (updates.time) {
      const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timeRegex.test(updates.time)) {
        return res.status(400).json({ 
          success: false,
          message: "Invalid time format. Use HH:MM format" 
        });
      }
    }

    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({ 
        success: false,
        message: "Task not found" 
      });
    }

    // Update task fields
    Object.assign(task, updates);

    // Recalculate reminders if relevant fields changed
    if (updates.date || updates.time || updates.reminderType || updates.reminderFrequency) {
      if (task.reminderFrequency) {
        const nextReminder = task.calculateNextReminder();
        if (nextReminder && !task.completed) {
          task.remindersData.nextReminderDue = nextReminder;
        } else {
          task.remindersData.nextReminderDue = null;
        }
      }
    }

    // If task is marked as completed, clear pending reminders
    if (updates.completed === true) {
      if (task.remindersData) {
        task.remindersData.nextReminderDue = null;
      }
    }

    await task.save();

    res.json({
      success: true,
      message: "Task updated successfully",
      task: task
    });

  } catch (error) {
    console.error("Error updating task:", error);
    res.status(500).json({ 
      success: false,
      message: "Failed to update task", 
      error: error.message 
    });
  }
};

// Delete task (unchanged but with enhanced response)
export const deleteTask = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ 
        success: false,
        message: "Task ID is required" 
      });
    }

    const deleted = await Task.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ 
        success: false,
        message: "Task not found" 
      });
    }

    res.json({ 
      success: true,
      message: "Task deleted successfully",
      deletedTask: {
        id: deleted._id,
        title: deleted.title
      }
    });

  } catch (error) {
    console.error("Error deleting task:", error);
    res.status(500).json({ 
      success: false,
      message: "Failed to delete task", 
      error: error.message 
    });
  }
};

// NEW: Get task statistics
export const getTaskStats = async (req, res) => {
  try {
    const { userId } = req.query;
    
    if (!userId) {
      return res.status(400).json({ 
        success: false,
        message: "User ID is required" 
      });
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [total, completed, pending, todayTasks, overdue, pendingReminders] = await Promise.all([
      Task.countDocuments({ userId }),
      Task.countDocuments({ userId, completed: true }),
      Task.countDocuments({ userId, completed: false }),
      Task.countDocuments({ 
        userId, 
        date: { $gte: today, $lt: tomorrow },
        completed: false 
      }),
      Task.countDocuments({ 
        userId, 
        date: { $lt: today },
        completed: false 
      }),
      Task.countDocuments({ 
        userId, 
        'remindersData.nextReminderDue': { $lte: now },
        completed: false 
      })
    ]);

    res.json({
      success: true,
      stats: {
        total,
        completed,
        pending,
        today: todayTasks,
        overdue,
        pendingReminders
      }
    });

  } catch (error) {
    console.error("Error getting task stats:", error);
    res.status(500).json({ 
      success: false,
      message: "Failed to get task statistics", 
      error: error.message 
    });
  }
};

// ===========================
// HELPER FUNCTIONS
// ===========================

// Enhanced helper to get user email from token
const getUserEmail = (req) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return null;
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback_secret");
    return decoded.email || null;
  } catch (error) {
    console.error("Error decoding token:", error.message);
    return null;
  }
};

// Enhanced reminder scheduling
const scheduleTaskReminders = (task, userEmail) => {
  try {
    if (!userEmail || !task.reminderFrequency) return;

    const now = new Date();
    const firstReminderTime = task.remindersData?.nextReminderDue;
    
    if (!firstReminderTime || firstReminderTime <= now) return;

    const timeDiff = firstReminderTime.getTime() - now.getTime();
    
    // Only schedule if within 30 days (prevent memory issues)
    if (timeDiff > 0 && timeDiff <= 30 * 24 * 60 * 60 * 1000) {
      console.log(`Scheduling first reminder for task "${task.title}" in ${Math.round(timeDiff / (1000 * 60 * 60))} hours`);
      
      setTimeout(() => {
        sendEnhancedReminderEmail(task, userEmail);
      }, timeDiff);
    }

  } catch (error) {
    console.error("Error scheduling reminders:", error);
  }
};

// Enhanced reminder email with better formatting
const sendEnhancedReminderEmail = async (task, email) => {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.warn("Email configuration missing - skipping reminder");
      return;
    }

    const transporter = nodemailer.createTransporter({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      },
    });

    const taskDateTime = new Date(`${task.date.toISOString().split('T')[0]}T${task.time}`);
    const reminderNumber = (task.remindersData?.sentReminders || 0) + 1;
    const totalReminders = task.remindersData?.totalReminders || 1;

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: `🔔 Task Reminder ${reminderNumber}/${totalReminders}: ${task.title}`,
      text: `
        Task Reminder (${reminderNumber} of ${totalReminders})
        
        📋 Task: ${task.title}
        📅 Date: ${taskDateTime.toDateString()}
        🕒 Time: ${task.time}
        🔁 Type: ${task.reminderType}
        
        Please complete this task on time to stay organized!
      `,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 12px; text-align: center; margin-bottom: 20px;">
            <h1 style="margin: 0; font-size: 28px; font-weight: 700;">🔔 Task Reminder</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Reminder ${reminderNumber} of ${totalReminders}</p>
          </div>
          
          <div style="background: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); border-left: 4px solid #667eea;">
            <h2 style="margin: 0 0 20px 0; color: #1e293b; font-size: 24px;">${task.title}</h2>
            
            <div style="display: grid; gap: 15px; margin-bottom: 20px;">
              <div style="display: flex; align-items: center; padding: 12px; background: #f1f5f9; border-radius: 8px;">
                <span style="font-size: 20px; margin-right: 12px;">📅</span>
                <div>
                  <strong style="color: #334155;">Date:</strong>
                  <span style="color: #64748b; margin-left: 8px;">${taskDateTime.toDateString()}</span>
                </div>
              </div>
              
              <div style="display: flex; align-items: center; padding: 12px; background: #f1f5f9; border-radius: 8px;">
                <span style="font-size: 20px; margin-right: 12px;">🕒</span>
                <div>
                  <strong style="color: #334155;">Time:</strong>
                  <span style="color: #64748b; margin-left: 8px;">${task.time}</span>
                </div>
              </div>
              
              <div style="display: flex; align-items: center; padding: 12px; background: #f1f5f9; border-radius: 8px;">
                <span style="font-size: 20px; margin-right: 12px;">🔁</span>
                <div>
                  <strong style="color: #334155;">Reminder Type:</strong>
                  <span style="color: #64748b; margin-left: 8px;">${task.reminderType}</span>
                </div>
              </div>
            </div>
            
            <div style="text-align: center; padding: 20px 0; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0; color: #64748b; font-size: 16px;">Stay organized and complete your tasks on time! 🎯</p>
            </div>
          </div>
          
          <div style="text-align: center; margin-top: 20px; color: #94a3b8; font-size: 14px;">
            <p>This is an automated reminder from your Task Management System</p>
          </div>
        </div>
      `
    });

    console.log(`✅ Enhanced reminder email sent for task: ${task.title} (${reminderNumber}/${totalReminders})`);

  } catch (error) {
    console.error("❌ Error sending enhanced reminder email:", error);
    throw error;
  }
};

// Keep original function for backward compatibility
const sendReminderEmail = async (task, email) => {
  return sendEnhancedReminderEmail(task, email);
};
