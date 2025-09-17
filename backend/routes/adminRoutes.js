import express from "express";


import {
  // User Management
  getAllUsers,
  getUserDetails,
  updateUser,
  deleteUser,
  
  // Task Management
  getAllTasks,
  bulkUpdateTasks,
  bulkDeleteTasks,
  
  // System Analytics
  getSystemStats,
  
  // Reminder Management
  getPendingReminders,
  sendManualReminder
} from "../controllers/adminController.js";

const router = express.Router();



// ===========================
// USER MANAGEMENT ROUTES
// ===========================

// @route GET /api/admin/users
// @desc Get all users with statistics
router.get("/users", getAllUsers);

// @route GET /api/admin/users/:userId
// @desc Get specific user details with tasks and analytics
router.get("/users/:userId", getUserDetails);

// @route PUT /api/admin/users/:userId
// @desc Update user (bulk operations on user's tasks)
// @body { action: 'reassign_tasks|complete_all_tasks|reset_all_tasks', taskIds?: [], newUserId?: string }
router.put("/users/:userId", updateUser);

// @route DELETE /api/admin/users/:userId
// @desc Delete user and all their tasks
// @body { confirmDelete: true }
router.delete("/users/:userId", deleteUser);

// ===========================
// TASK MANAGEMENT ROUTES
// ===========================

// @route GET /api/admin/tasks
// @desc Get all tasks with advanced filtering and pagination
// @query page, limit, status, reminderType, userId, sortBy, sortOrder, search
router.get("/tasks", getAllTasks);

// @route PUT /api/admin/tasks/bulk-update
// @desc Bulk update multiple tasks
// @body { taskIds: [], action: 'complete|uncomplete|update_reminder_type|reassign_user|custom', updateData?: {} }
router.put("/tasks/bulk-update", bulkUpdateTasks);

// @route DELETE /api/admin/tasks/bulk-delete
// @desc Bulk delete multiple tasks
// @body { taskIds: [], confirmDelete: true }
router.delete("/tasks/bulk-delete", bulkDeleteTasks);

// ===========================
// SYSTEM ANALYTICS ROUTES
// ===========================

// @route GET /api/admin/stats
// @desc Get comprehensive system statistics and analytics
router.get("/stats", getSystemStats);

// ===========================
// REMINDER MANAGEMENT ROUTES
// ===========================

// @route GET /api/admin/reminders/pending
// @desc Get all pending reminders across the system
router.get("/reminders/pending", getPendingReminders);

// @route POST /api/admin/reminders/:taskId/send
// @desc Send manual reminder for specific task
// @body { userEmail: string }
router.post("/reminders/:taskId/send", sendManualReminder);

export default router;