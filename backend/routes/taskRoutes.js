import express from "express";
import { 
  addTask, 
  getTasks, 
  updateTask, 
  deleteTask,
  getTaskStats
} from "../controllers/taskController.js";

const router = express.Router();

// @route POST /api/tasks
// @desc Create new task with enhanced reminder features
router.post("/", addTask);

// @route GET /api/tasks
// @desc Get tasks with filtering options
router.get("/", getTasks);

// @route GET /api/tasks/stats
// @desc Get task statistics
router.get("/stats", getTaskStats);

// @route PUT /api/tasks/:id
// @desc Update task (handles edits + completion toggle + reminders)
router.put("/:id", updateTask);

// @route DELETE /api/tasks/:id
// @desc Delete task
router.delete("/:id", deleteTask);

export default router;