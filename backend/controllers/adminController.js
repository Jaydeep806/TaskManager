import Task from "../models/Task.js";
import User from "../models/User.js"; // <-- ADD THIS LINE
import nodemailer from "nodemailer";
import mongoose from "mongoose";

// Validate required environment variables
const validateEnvVars = () => {
  const required = ['EMAIL_USER', 'EMAIL_PASS', 'JWT_SECRET'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.warn(`Warning: Missing environment variables: ${missing.join(', ')}`);
    console.warn('Some features may not work properly');
  }
};

// Call validation on module load
validateEnvVars();

// ===========================
// USER MANAGEMENT OPERATIONS
// ===========================

export const getAllUsers = async (req, res) => {
  try {
    const usersWithStats = await User.aggregate([ // <-- CHANGE `Task.aggregate` to `User.aggregate`
      {
        $lookup: {
          from: "tasks", // The name of the tasks collection
          localField: "_id",
          foreignField: "userId",
          as: "userTasks"
        }
      },
      {
        $project: {
          email: 1, // Include the user's email
          totalTasks: { $size: "$userTasks" },
          completedTasks: { 
            $size: {
              $filter: {
                input: "$userTasks",
                as: "task",
                cond: { $eq: ["$$task.completed", true] }
              }
            }
          },
          lastTaskCreated: { $max: "$userTasks.createdAt" }
        }
      },
      {
        $addFields: {
          completionRate: {
            $round: [
              {
                $cond: [
                  { $eq: ["$totalTasks", 0] },
                  0,
                  { $multiply: [{ $divide: ["$completedTasks", "$totalTasks"] }, 100] }
                ]
              },
              2
            ]
          }
        }
      },
      { $sort: { lastTaskCreated: -1 } }
    ]);

    res.json({
      success: true,
      message: "Users retrieved successfully",
      count: usersWithStats.length,
      users: usersWithStats
    });

  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch users",
      error: error.message
    });
  }
};

export const getUserDetails = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required"
      });
    }

    // Get user statistics
    const userStats = await Task.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: "$userId",
          totalTasks: { $sum: 1 },
          completedTasks: { 
            $sum: { $cond: [{ $eq: ["$completed", true] }, 1, 0] } 
          },
          pendingTasks: { 
            $sum: { $cond: [{ $eq: ["$completed", false] }, 1, 0] } 
          },
          overdueTasks: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$completed", false] },
                    { $lt: ["$date", new Date()] }
                  ]
                },
                1,
                0
              ]
            }
          },
          firstTaskCreated: { $min: "$createdAt" },
          lastTaskCreated: { $max: "$createdAt" }
        }
      }
    ]);

    if (!userStats.length) {
      return res.status(404).json({
        success: false,
        message: "User not found or has no tasks"
      });
    }

    // Get recent tasks and populate with user email
    const recentTasks = await Task.find({ userId })
      .populate('userId', 'email') // Populates the userId field with the User document's email
      .sort({ createdAt: -1 })
      .limit(10)
      .select('title date time completed reminderType createdAt');

    // Get task distribution by reminder type
    const reminderTypeDistribution = await Task.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
      { 
        $group: { 
          _id: "$reminderType", 
          count: { $sum: 1 } 
        } 
      },
      { $sort: { count: -1 } }
    ]);

    const userDetail = {
      ...userStats[0],
      completionRate: userStats[0].totalTasks > 0 
        ? Math.round((userStats[0].completedTasks / userStats[0].totalTasks) * 100) 
        : 0,
      recentTasks,
      reminderTypeDistribution
    };

    res.json({
      success: true,
      message: "User details retrieved successfully",
      user: userDetail
    });

  } catch (error) {
    console.error("Error fetching user details:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch user details",
      error: error.message
    });
  }
};

export const updateUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { action, taskIds, newUserId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required"
      });
    }

    let result;

    switch (action) {
      case 'reassign_tasks':
        if (!newUserId) {
          return res.status(400).json({
            success: false,
            message: "New user ID is required for reassignment"
          });
        }
        
        const filter = taskIds && taskIds.length > 0 
          ? { userId, _id: { $in: taskIds.map(id => new mongoose.Types.ObjectId(id)) } }
          : { userId };
          
        result = await Task.updateMany(filter, { userId: newUserId });
        break;

      case 'complete_all_tasks':
        result = await Task.updateMany(
          { userId, completed: false }, 
          { completed: true }
        );
        break;

      case 'reset_all_tasks':
        result = await Task.updateMany(
          { userId, completed: true }, 
          { completed: false }
        );
        break;

      default:
        return res.status(400).json({
          success: false,
          message: "Invalid action. Use: reassign_tasks, complete_all_tasks, reset_all_tasks"
        });
    }

    res.json({
      success: true,
      message: `User update completed: ${action}`,
      modifiedCount: result.modifiedCount,
      action
    });

  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update user",
      error: error.message
    });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { confirmDelete } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required"
      });
    }

    if (!confirmDelete) {
      return res.status(400).json({
        success: false,
        message: "Please confirm deletion by sending confirmDelete: true"
      });
    }

    // Get task count before deletion
    const taskCount = await Task.countDocuments({ userId });

    if (taskCount === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found or has no tasks"
      });
    }

    // Delete all user's tasks
    const result = await Task.deleteMany({ userId });

    res.json({
      success: true,
      message: "User and all tasks deleted successfully",
      deletedUserId: userId,
      deletedTasksCount: result.deletedCount
    });

  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete user",
      error: error.message
    });
  }
};

// ===========================
// TASK MANAGEMENT OPERATIONS
// ===========================

export const getAllTasks = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 50, 
      status, 
      reminderType, 
      userId, 
      sortBy = 'createdAt', 
      sortOrder = 'desc',
      search
    } = req.query;

    // Build filter object
    const filter = {};
    
    if (status === 'completed') filter.completed = true;
    if (status === 'pending') filter.completed = false;
    if (status === 'overdue') {
      filter.completed = false;
      filter.date = { $lt: new Date() };
    }
    
    if (reminderType && reminderType !== 'all') {
      filter.reminderType = reminderType;
    }
    
    if (userId) {
      filter.userId = userId;
    }

    if (search) {
      filter.title = { $regex: search, $options: 'i' };
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Get tasks with pagination
    const [tasks, totalTasks] = await Promise.all([
      Task.find(filter)
        .populate('userId', 'email') // <-- ADD THIS LINE
        .sort(sortOptions)
        .skip(skip)
        .limit(parseInt(limit))
        .select('-__v'),
      Task.countDocuments(filter)
    ]);

    // Calculate pagination info
    const totalPages = Math.ceil(totalTasks / parseInt(limit));
    const hasNextPage = parseInt(page) < totalPages;
    const hasPrevPage = parseInt(page) > 1;

    res.json({
      success: true,
      message: "Tasks retrieved successfully",
      tasks,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalTasks,
        tasksPerPage: parseInt(limit),
        hasNextPage,
        hasPrevPage
      },
      filters: {
        status,
        reminderType,
        userId,
        search,
        sortBy,
        sortOrder
      }
    });

  } catch (error) {
    console.error("Error fetching all tasks:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch tasks",
      error: error.message
    });
  }
};

export const bulkUpdateTasks = async (req, res) => {
  try {
    const { taskIds, action, updateData } = req.body;
    if (!taskIds || !Array.isArray(taskIds) || taskIds.length === 0) {
      return res.status(400).json({ success: false, message: "Task IDs array is required" });
    }
    if (!action) {
      return res.status(400).json({ success: false, message: "Action is required" });
    }

    // Validate ObjectIds
    const validTaskIds = taskIds.map(id => {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Error(`Invalid task ID: ${id}`);
      }
      return new mongoose.Types.ObjectId(id);
    });

    let updateQuery = {};
    let result;

    switch (action) {
      case 'complete':
        updateQuery = { completed: true };
        break;
      case 'uncomplete':
        updateQuery = { completed: false };
        break;
      case 'update_reminder_type':
        if (!updateData?.reminderType) {
          return res.status(400).json({ success: false, message: "reminderType is required for this action" });
        }
        updateQuery = { reminderType: updateData.reminderType };
        break;
      case 'reassign_user':
        if (!updateData?.userId) {
          return res.status(400).json({ success: false, message: "userId is required for this action" });
        }
        updateQuery = { userId: updateData.userId };
        break;
      case 'custom':
        if (!updateData) {
          return res.status(400).json({ success: false, message: "updateData is required for custom action" });
        }
        updateQuery = updateData;
        break;
      default:
        return res.status(400).json({ success: false, message: "Invalid action. Use: complete, uncomplete, update_reminder_type, reassign_user, custom" });
    }

    result = await Task.updateMany(
      { _id: { $in: validTaskIds } },
      { $set: updateQuery }
    );

    res.json({
      success: true,
      message: `Bulk update completed: ${action}`,
      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount,
      action,
      taskIds: taskIds
    });

  } catch (error) {
    console.error("Error in bulk update:", error);
    res.status(500).json({
      success: false,
      message: "Failed to perform bulk update",
      error: error.message
    });
  }
};

export const bulkDeleteTasks = async (req, res) => {
  try {
    const { taskIds, confirmDelete } = req.body;
    if (!taskIds || !Array.isArray(taskIds) || taskIds.length === 0) {
      return res.status(400).json({ success: false, message: "Task IDs array is required" });
    }
    if (!confirmDelete) {
      return res.status(400).json({ success: false, message: "Please confirm deletion by sending confirmDelete: true" });
    }

    // Validate ObjectIds
    const validTaskIds = taskIds.map(id => {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Error(`Invalid task ID: ${id}`);
      }
      return new mongoose.Types.ObjectId(id);
    });

    const result = await Task.deleteMany({ _id: { $in: validTaskIds } });

    res.json({
      success: true,
      message: "Tasks deleted successfully",
      deletedCount: result.deletedCount
    });

  } catch (error) {
    console.error("Error in bulk delete:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete tasks",
      error: error.message
    });
  }
};

export const getSystemStats = async (req, res) => {
  try {
    const [totalUsers, totalTasks, completedTasks, pendingTasks, todayTasks] = await Promise.all([
      User.countDocuments(),
      Task.countDocuments(),
      Task.countDocuments({ completed: true }),
      Task.countDocuments({ completed: false }),
      Task.countDocuments({ createdAt: { $gte: new Date().setHours(0, 0, 0, 0), $lt: new Date().setHours(23, 59, 59, 999) } })
    ]);

    res.json({
      success: true,
      message: "System stats retrieved successfully",
      stats: {
        overview: {
          totalUsers,
          totalTasks,
          completedTasks,
          pendingTasks,
          todayTasks
        }
      }
    });

  } catch (error) {
    console.error("Error fetching system stats:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch system stats",
      error: error.message
    });
  }
};

export const getPendingReminders = async (req, res) => {
  try {
    // Get all pending tasks that have a reminder
    const pendingReminders = await Task.find({
      completed: false,
      reminderType: { $ne: null }
    }).select('title userId date time reminderType');

    res.json({
      success: true,
      message: "Pending reminders retrieved successfully",
      count: pendingReminders.length,
      reminders: pendingReminders
    });

  } catch (error) {
    console.error("Error fetching pending reminders:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch pending reminders",
      error: error.message
    });
  }
};

export const sendManualReminder = async (req, res) => {
  try {
    const { taskId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(taskId)) {
      return res.status(400).json({ success: false, message: "Invalid task ID" });
    }

    const task = await Task.findById(taskId).populate('userId', 'email');

    if (!task) {
      return res.status(404).json({ success: false, message: "Task not found" });
    }

    if (!task.userId || !task.userId.email) {
      return res.status(404).json({ success: false, message: "User not found or email is missing for this task" });
    }

    const email = task.userId.email;
    
    let transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    });

    const taskDateTime = new Date(`${task.date.toISOString().split('T')[0]}T${task.time}`);

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: `🔔 Admin Reminder: ${task.title}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #dc2626; color: white; padding: 20px; border-radius: 8px; text-align: center;">
            <h1 style="margin: 0;">🚨 Admin Task Reminder</h1>
            <p style="margin: 10px 0 0 0;">Manual reminder sent by administrator</p>
          </div>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2 style="color: #333; margin-top: 0;">${task.title}</h2>
            <p><strong>📅 Date:</strong> ${taskDateTime.toDateString()}</p>
            <p><strong>🕐 Time:</strong> ${task.time}</p>
            <p><strong>📋 Type:</strong> ${task.reminderType}</p>
            <p><strong>⚡ Priority:</strong> Admin Override</p>
          </div>
          
          <div style="text-align: center; padding: 20px 0; border-top: 1px solid #e2e8f0;">
            <p style="margin: 0; color: #64748b; font-size: 14px;">This reminder was sent from the Task Manager Admin Panel.</p>
          </div>
        </div>
      `
    });
    
    res.json({ success: true, message: "Manual reminder sent successfully." });

  } catch (error) {
    console.error("Error sending manual reminder:", error);
    res.status(500).json({
      success: false,
      message: "Failed to send manual reminder",
      error: error.message
    });
  }
};