import mongoose, { type Document, Schema } from "mongoose"

export interface IAttendance extends Document {
  employeeId: mongoose.Types.ObjectId
  date: Date
  checkIn?: Date
  checkOut?: Date
  breakStart?: Date
  breakEnd?: Date
  status: "present" | "absent" | "late" | "half_day" | "work_from_home"
  workingHours: number
  overtime: number
  notes?: string
  location?: {
    latitude: number
    longitude: number
    address: string
  }
  createdAt: Date
  updatedAt: Date
}

const AttendanceSchema = new Schema<IAttendance>(
  {
    employeeId: {
      type: Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    checkIn: Date,
    checkOut: Date,
    breakStart: Date,
    breakEnd: Date,
    status: {
      type: String,
      enum: ["present", "absent", "late", "half_day", "work_from_home"],
      default: "present",
    },
    workingHours: {
      type: Number,
      default: 0,
      min: 0,
    },
    overtime: {
      type: Number,
      default: 0,
      min: 0,
    },
    notes: String,
    location: {
      latitude: Number,
      longitude: Number,
      address: String,
    },
  },
  {
    timestamps: true,
  },
)

// Compound index for employee and date
AttendanceSchema.index({ employeeId: 1, date: 1 }, { unique: true })

// Calculate working hours before saving
AttendanceSchema.pre("save", function (next) {
  if (this.checkIn && this.checkOut) {
    const workStart = new Date(this.checkIn)
    const workEnd = new Date(this.checkOut)
    let totalMinutes = (workEnd.getTime() - workStart.getTime()) / (1000 * 60)

    // Subtract break time if available
    if (this.breakStart && this.breakEnd) {
      const breakMinutes = (this.breakEnd.getTime() - this.breakStart.getTime()) / (1000 * 60)
      totalMinutes -= breakMinutes
    }

    this.workingHours = Math.max(0, totalMinutes / 60)

    // Calculate overtime (assuming 8 hours is standard)
    this.overtime = Math.max(0, this.workingHours - 8)
  }
  next()
})

export default mongoose.models.Attendance || mongoose.model<IAttendance>("Attendance", AttendanceSchema)
