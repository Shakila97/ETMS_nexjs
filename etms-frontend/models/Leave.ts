import mongoose, { type Document, Schema } from "mongoose"

export interface ILeave extends Document {
  employeeId: mongoose.Types.ObjectId
  type: "annual" | "sick" | "maternity" | "paternity" | "personal" | "emergency"
  startDate: Date
  endDate: Date
  days: number
  reason: string
  status: "pending" | "approved" | "rejected" | "cancelled"
  appliedDate: Date
  approvedBy?: mongoose.Types.ObjectId
  approvedDate?: Date
  rejectionReason?: string
  documents?: string[]
  createdAt: Date
  updatedAt: Date
}

const LeaveSchema = new Schema<ILeave>(
  {
    employeeId: {
      type: Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    type: {
      type: String,
      enum: ["annual", "sick", "maternity", "paternity", "personal", "emergency"],
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    days: {
      type: Number,
      required: true,
      min: 0.5,
    },
    reason: {
      type: String,
      required: true,
      maxlength: 500,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "cancelled"],
      default: "pending",
    },
    appliedDate: {
      type: Date,
      default: Date.now,
    },
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: "Employee",
    },
    approvedDate: Date,
    rejectionReason: String,
    documents: [String],
  },
  {
    timestamps: true,
  },
)

// Calculate days before saving
LeaveSchema.pre("save", function (next) {
  if (this.startDate && this.endDate) {
    const timeDiff = this.endDate.getTime() - this.startDate.getTime()
    this.days = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1
  }
  next()
})

export default mongoose.models.Leave || mongoose.model<ILeave>("Leave", LeaveSchema)
