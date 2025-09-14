import mongoose from "mongoose";

const taskSchema = new mongoose.Schema({
  title: { 
    type: String, 
    required: true,
    trim: true,
    maxlength: 200
  },
  date: { 
    type: Date, 
    required: true 
  },
  time: { 
    type: String, 
    required: true,
    match: /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/
  },
  userId: { 
    type: String, 
    required: true 
  },
  completed: { 
    type: Boolean, 
    default: false 
  },
  // NEW FIELDS FOR ENHANCED FUNCTIONALITY
  reminderType: {
    type: String,
    enum: [
      'Custom',
      'Weekly', 
      'Fortnightly',
      'Monthly',
      'Bimonthly',
      'Quarterly',
      'Half yearly',
      'Annually',
      'Bi annually',
      'Tri annually'
    ],
    default: 'Custom'
  },
  reminderFrequency: {
    type: String,
    enum: ['Once', 'Twice', 'Thrice', null],
    default: null
  },
  // Reminder tracking data
  remindersData: {
    totalReminders: { type: Number, default: 0 },
    sentReminders: { type: Number, default: 0 },
    lastReminderSent: { type: Date, default: null },
    nextReminderDue: { type: Date, default: null },
    reminderHistory: [{
      sentAt: Date,
      reminderNumber: Number,
      status: { type: String, enum: ['sent', 'failed'], default: 'sent' }
    }]
  },
  // Metadata
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Update the updatedAt field on save
taskSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Method to calculate next reminder date based on reminder type
taskSchema.methods.calculateNextReminder = function() {
  const taskDateTime = new Date(`${this.date.toISOString().split('T')[0]}T${this.time}`);
  const now = new Date();
  
  // If task is in the past, don't set reminders
  if (taskDateTime <= now) {
    return null;
  }

  let nextReminder = new Date(taskDateTime);
  
  switch (this.reminderType) {
    case 'Weekly':
      nextReminder.setDate(nextReminder.getDate() - 7);
      break;
    case 'Fortnightly':
      nextReminder.setDate(nextReminder.getDate() - 14);
      break;
    case 'Monthly':
      nextReminder.setMonth(nextReminder.getMonth() - 1);
      break;
    case 'Bimonthly':
      nextReminder.setMonth(nextReminder.getMonth() - 2);
      break;
    case 'Quarterly':
      nextReminder.setMonth(nextReminder.getMonth() - 3);
      break;
    case 'Half yearly':
      nextReminder.setMonth(nextReminder.getMonth() - 6);
      break;
    case 'Annually':
      nextReminder.setFullYear(nextReminder.getFullYear() - 1);
      break;
    case 'Bi annually':
      nextReminder.setFullYear(nextReminder.getFullYear() - 2);
      break;
    case 'Tri annually':
      nextReminder.setFullYear(nextReminder.getFullYear() - 3);
      break;
    case 'Custom':
    default:
      // For custom, remind 1 day before
      nextReminder.setDate(nextReminder.getDate() - 1);
      break;
  }
  
  // Don't set reminders in the past
  if (nextReminder <= now) {
    return null;
  }
  
  return nextReminder;
};

export default mongoose.model("Task", taskSchema);