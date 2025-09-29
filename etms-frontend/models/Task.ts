import mongoose, { type Document, Schema } from "mongoose"

export interface ITask extends Document {
  title: string
  description: string
  assignedTo: mongoose.Types.ObjectId[]
  assignedBy: mongoose.Types.ObjectId
  project?: string
  priority: "low" | "medium" | "high" | "urgent"
  status: "todo" | "in_progress" | "review" | "completed" | "cancelled"
  startDate: Date
  dueDate: Date
  completedDate?: Date
  estimatedHours: number
  actualHours: number
  tags: string[]
  attachments: string[]
  comments: {
    author: mongoose.Types.ObjectId
    content: string
    createdAt: Date
  }[]
  createdAt: Date
  updatedAt: Date
}

const TaskSchema = new Schema<ITask>(
  {
    title: {
      type: String,
      required: [true, "Task title is required"],
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      required: [true, "Task description is required"],
      maxlength: 1000,
    },
    assignedTo: [
      {
        type: Schema.Types.ObjectId,
        ref: "Employee",
        required: true,
      },
    ],
    assignedBy: {
      type: Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    project: {
      type: String,
      trim: true,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },
    status: {
      type: String,
      enum: ["todo", "in_progress", "review", "completed", "cancelled"],
      default: "todo",
    },
    startDate: {
      type: Date,
      required: true,
    },
    dueDate: {
      type: Date,
      required: true,
    },
    completedDate: Date,
    estimatedHours: {
      type: Number,
      required: true,
      min: 0,
    },
    actualHours: {
      type: Number,
      default: 0,
      min: 0,
    },
    tags: [String],
    attachments: [String],
    comments: [
      {
        author: {
          type: Schema.Types.ObjectId,
          ref: "Employee",
          required: true,
        },
        content: {
          type: String,
          required: true,
          maxlength: 500,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  },
)

// Set completed date when status changes to completed
TaskSchema.pre("save", function (next) {
  if (this.isModified("status") && this.status === "completed" && !this.completedDate) {
    this.completedDate = new Date()
  }
  next()
})

export default mongoose.models.Task || mongoose.model<ITask>("Task", TaskSchema)
