const mongoose = require("mongoose")

const employeeSchema = new mongoose.Schema(
  {
    employeeId: {
      type: String,
      required: true,
      unique: true,
    },
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    phone: {
      type: String,
      required: true,
    },
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String,
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      required: true,
    },
    position: {
      type: String,
    },
    salary: {
      type: Number,
      required: true,
    },
    hireDate: {
      type: Date,
      required: true,
    },
    manager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
    },
    profileImage: {
      type: String,
    },
    emergencyContact: {
      name: String,
      relationship: String,
      phone: String,
    },
    bankDetails: {
      accountNumber: String,
      bankName: String,
      routingNumber: String,
    },
    status: {
      type: String,
      enum: ["active", "inactive", "terminated"],
      default: "active",
    },
    workSchedule: {
      startTime: String,
      endTime: String,
      workDays: [String],
    },
  },
  {
    timestamps: true,
  },
)

// Virtual for full name
employeeSchema.virtual("fullName").get(function () {
  return `${this.firstName} ${this.lastName}`
})

// Ensure virtual fields are serialized
employeeSchema.set("toJSON", { virtuals: true })

module.exports = mongoose.model("Employee", employeeSchema)
