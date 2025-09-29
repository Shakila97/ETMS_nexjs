import mongoose, { type Document, Schema } from "mongoose"

export interface IEmployee extends Document {
  employeeId: string
  firstName: string
  lastName: string
  email: string
  phone: string
  department: string
  position: string
  manager?: mongoose.Types.ObjectId
  hireDate: Date
  salary: number
  status: "active" | "inactive" | "terminated"
  address: {
    street: string
    city: string
    state: string
    zipCode: string
    country: string
  }
  emergencyContact: {
    name: string
    relationship: string
    phone: string
  }
  avatar?: string
  skills: string[]
  notes?: string
  createdAt: Date
  updatedAt: Date
}

const EmployeeSchema = new Schema<IEmployee>(
  {
    employeeId: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
    },
    firstName: {
      type: String,
      required: [true, "First name is required"],
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, "Last name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
    },
    department: {
      type: String,
      required: [true, "Department is required"],
      enum: ["Engineering", "Marketing", "Sales", "HR", "Finance", "Operations"],
    },
    position: {
      type: String,
      required: [true, "Position is required"],
    },
    manager: {
      type: Schema.Types.ObjectId,
      ref: "Employee",
    },
    hireDate: {
      type: Date,
      required: [true, "Hire date is required"],
    },
    salary: {
      type: Number,
      required: [true, "Salary is required"],
      min: 0,
    },
    status: {
      type: String,
      enum: ["active", "inactive", "terminated"],
      default: "active",
    },
    address: {
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      zipCode: { type: String, required: true },
      country: { type: String, default: "USA" },
    },
    emergencyContact: {
      name: { type: String, required: true },
      relationship: { type: String, required: true },
      phone: { type: String, required: true },
    },
    avatar: String,
    skills: [String],
    notes: String,
  },
  {
    timestamps: true,
  },
)

// Virtual for full name
EmployeeSchema.virtual("fullName").get(function () {
  return `${this.firstName} ${this.lastName}`
})

// Generate employee ID before saving
EmployeeSchema.pre("save", async function (next) {
  if (!this.employeeId) {
    const count = await mongoose.model("Employee").countDocuments()
    this.employeeId = `EMP${String(count + 1).padStart(4, "0")}`
  }
  next()
})

export default mongoose.models.Employee || mongoose.model<IEmployee>("Employee", EmployeeSchema)
