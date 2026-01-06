const mongoose = require("mongoose")

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    // New Project Reference
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: false, // Make optional for now in case of legacy data or general tasks
    },
    description: {
      type: String,
      required: true,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },
    status: {
      type: String,
      enum: ["pending", "in-progress", "completed", "cancelled"],
      default: "pending",
    },
    dueDate: {
      type: Date,
      required: true,
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    completedDate: Date,
    estimatedHours: {
      type: Number,
      default: 0,
    },
    actualHours: {
      type: Number,
      default: 0,
    },
    attachments: [
      {
        filename: String,
        originalName: String,
        path: String,
        size: Number,
      },
    ],
    comments: [
      {
        author: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Employee",
        },
        content: String,
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    tags: [String],
  },
  {
    timestamps: true,
  },
)

module.exports = mongoose.model("Task", taskSchema)
