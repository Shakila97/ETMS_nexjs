const mongoose = require("mongoose")

const payrollSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    payPeriod: {
      startDate: {
        type: Date,
        required: true,
      },
      endDate: {
        type: Date,
        required: true,
      },
    },
    basicSalary: {
      type: Number,
      required: true,
    },
    overtime: {
      hours: {
        type: Number,
        default: 0,
      },
      rate: {
        type: Number,
        default: 0,
      },
      amount: {
        type: Number,
        default: 0,
      },
    },
    allowances: {
      transport: {
        type: Number,
        default: 0,
      },
      meal: {
        type: Number,
        default: 0,
      },
      medical: {
        type: Number,
        default: 0,
      },
      other: {
        type: Number,
        default: 0,
      },
    },
    deductions: {
      tax: {
        type: Number,
        default: 0,
      },
      insurance: {
        type: Number,
        default: 0,
      },
      providentFund: {
        type: Number,
        default: 0,
      },
      other: {
        type: Number,
        default: 0,
      },
    },
    grossSalary: {
      type: Number,
      required: true,
    },
    netSalary: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["draft", "processed", "paid"],
      default: "draft",
    },
    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
    },
    processedDate: Date,
    paymentDate: Date,
  },
  {
    timestamps: true,
  },
)

module.exports = mongoose.model("Payroll", payrollSchema)
