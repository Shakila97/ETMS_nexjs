import mongoose, { type Document, Schema } from "mongoose"

export interface IPerformance extends Document {
  employeeId: mongoose.Types.ObjectId
  reviewerId: mongoose.Types.ObjectId
  period: {
    startDate: Date
    endDate: Date
  }
  type: "quarterly" | "annual" | "probation" | "project_based"
  overallRating: number
  categories: {
    name: string
    rating: number
    comments?: string
  }[]
  goals: {
    title: string
    description: string
    targetDate: Date
    status: "not_started" | "in_progress" | "completed" | "overdue"
    progress: number
    comments?: string
  }[]
  strengths: string[]
  areasForImprovement: string[]
  developmentPlan: string
  managerComments: string
  employeeComments?: string
  status: "draft" | "submitted" | "approved" | "acknowledged"
  submittedDate?: Date
  approvedDate?: Date
  createdAt: Date
  updatedAt: Date
}

const PerformanceSchema = new Schema<IPerformance>(
  {
    employeeId: {
      type: Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    reviewerId: {
      type: Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    period: {
      startDate: {
        type: Date,
        required: true,
      },
      endDate: {
        type: Date,
        required: true,
      },
    },
    type: {
      type: String,
      enum: ["quarterly", "annual", "probation", "project_based"],
      required: true,
    },
    overallRating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    categories: [
      {
        name: {
          type: String,
          required: true,
        },
        rating: {
          type: Number,
          required: true,
          min: 1,
          max: 5,
        },
        comments: String,
      },
    ],
    goals: [
      {
        title: {
          type: String,
          required: true,
        },
        description: {
          type: String,
          required: true,
        },
        targetDate: {
          type: Date,
          required: true,
        },
        status: {
          type: String,
          enum: ["not_started", "in_progress", "completed", "overdue"],
          default: "not_started",
        },
        progress: {
          type: Number,
          default: 0,
          min: 0,
          max: 100,
        },
        comments: String,
      },
    ],
    strengths: [String],
    areasForImprovement: [String],
    developmentPlan: {
      type: String,
      required: true,
    },
    managerComments: {
      type: String,
      required: true,
    },
    employeeComments: String,
    status: {
      type: String,
      enum: ["draft", "submitted", "approved", "acknowledged"],
      default: "draft",
    },
    submittedDate: Date,
    approvedDate: Date,
  },
  {
    timestamps: true,
  },
)

export default mongoose.models.Performance || mongoose.model<IPerformance>("Performance", PerformanceSchema)
