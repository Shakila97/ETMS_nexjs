const mongoose = require("mongoose")

const attendanceSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    checkIn: {
      time: Date,
      location: {
        latitude: Number,
        longitude: Number,
        address: String,
      },
      method: {
        type: String,
        enum: ["manual", "biometric", "mobile"],
        default: "manual",
      },
    },
    checkOut: {
      time: Date,
      location: {
        latitude: Number,
        longitude: Number,
        address: String,
      },
      method: {
        type: String,
        enum: ["manual", "biometric", "mobile"],
        default: "manual",
      },
    },
    breakTime: [
      {
        start: Date,
        end: Date,
        duration: Number, // in minutes
      },
    ],
    totalHours: {
      type: Number,
      default: 0,
    },
    overtimeHours: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["present", "absent", "late", "half-day"],
      default: "present",
    },
    notes: String,
  },
  {
    timestamps: true,
  },
)

// Index for efficient queries
attendanceSchema.index({ employee: 1, date: 1 }, { unique: true })

module.exports = mongoose.model("Attendance", attendanceSchema)
