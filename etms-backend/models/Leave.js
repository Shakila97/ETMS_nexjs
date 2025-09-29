const mongoose = require("mongoose")

const leaveSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
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
    totalDays: {
      type: Number,
      required: true,
    },
    reason: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "cancelled"],
      default: "pending",
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
    },
    approvedDate: Date,
    rejectionReason: String,
    attachments: [
      {
        filename: String,
        originalName: String,
        path: String,
      },
    ],
  },
  {
    timestamps: true,
  },
)

module.exports = mongoose.model("Leave", leaveSchema)
