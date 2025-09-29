export interface LeaveRequest {
  id: string
  employeeId: string
  employeeName: string
  leaveType: "annual" | "sick" | "personal" | "maternity" | "paternity" | "emergency"
  startDate: string
  endDate: string
  days: number
  reason: string
  status: "pending" | "approved" | "rejected" | "cancelled"
  appliedDate: string
  approvedBy?: string
  approvedDate?: string
  rejectionReason?: string
  documents?: string[]
}

export interface LeaveBalance {
  employeeId: string
  employeeName: string
  annual: {
    total: number
    used: number
    remaining: number
  }
  sick: {
    total: number
    used: number
    remaining: number
  }
  personal: {
    total: number
    used: number
    remaining: number
  }
  maternity: {
    total: number
    used: number
    remaining: number
  }
  paternity: {
    total: number
    used: number
    remaining: number
  }
  emergency: {
    total: number
    used: number
    remaining: number
  }
}

export const leaveTypes = [
  { value: "annual", label: "Annual Leave", color: "bg-blue-100 text-blue-800" },
  { value: "sick", label: "Sick Leave", color: "bg-red-100 text-red-800" },
  { value: "personal", label: "Personal Leave", color: "bg-purple-100 text-purple-800" },
  { value: "maternity", label: "Maternity Leave", color: "bg-pink-100 text-pink-800" },
  { value: "paternity", label: "Paternity Leave", color: "bg-green-100 text-green-800" },
  { value: "emergency", label: "Emergency Leave", color: "bg-orange-100 text-orange-800" },
]

export const mockLeaveRequests: LeaveRequest[] = [
  {
    id: "1",
    employeeId: "EMP001",
    employeeName: "John Smith",
    leaveType: "annual",
    startDate: "2024-02-15",
    endDate: "2024-02-19",
    days: 5,
    reason: "Family vacation to Hawaii",
    status: "pending",
    appliedDate: "2024-01-20",
  },
  {
    id: "2",
    employeeId: "EMP002",
    employeeName: "Emily Johnson",
    leaveType: "sick",
    startDate: "2024-01-18",
    endDate: "2024-01-19",
    days: 2,
    reason: "Flu symptoms and fever",
    status: "approved",
    appliedDate: "2024-01-17",
    approvedBy: "Sarah Wilson",
    approvedDate: "2024-01-17",
  },
  {
    id: "3",
    employeeId: "EMP003",
    employeeName: "David Rodriguez",
    leaveType: "personal",
    startDate: "2024-02-01",
    endDate: "2024-02-01",
    days: 1,
    reason: "Medical appointment",
    status: "approved",
    appliedDate: "2024-01-25",
    approvedBy: "Sarah Wilson",
    approvedDate: "2024-01-26",
  },
  {
    id: "4",
    employeeId: "EMP004",
    employeeName: "Sarah Wilson",
    leaveType: "annual",
    startDate: "2024-03-10",
    endDate: "2024-03-17",
    days: 6,
    reason: "Spring break with family",
    status: "rejected",
    appliedDate: "2024-01-15",
    rejectionReason: "Insufficient annual leave balance",
  },
  {
    id: "5",
    employeeId: "EMP005",
    employeeName: "Michael Brown",
    leaveType: "emergency",
    startDate: "2024-01-22",
    endDate: "2024-01-24",
    days: 3,
    reason: "Family emergency - father hospitalized",
    status: "approved",
    appliedDate: "2024-01-21",
    approvedBy: "Sarah Wilson",
    approvedDate: "2024-01-21",
  },
]

export const mockLeaveBalances: LeaveBalance[] = [
  {
    employeeId: "EMP001",
    employeeName: "John Smith",
    annual: { total: 25, used: 8, remaining: 17 },
    sick: { total: 10, used: 2, remaining: 8 },
    personal: { total: 5, used: 1, remaining: 4 },
    maternity: { total: 0, used: 0, remaining: 0 },
    paternity: { total: 10, used: 0, remaining: 10 },
    emergency: { total: 3, used: 0, remaining: 3 },
  },
  {
    employeeId: "EMP002",
    employeeName: "Emily Johnson",
    annual: { total: 25, used: 12, remaining: 13 },
    sick: { total: 10, used: 4, remaining: 6 },
    personal: { total: 5, used: 2, remaining: 3 },
    maternity: { total: 90, used: 0, remaining: 90 },
    paternity: { total: 0, used: 0, remaining: 0 },
    emergency: { total: 3, used: 1, remaining: 2 },
  },
  {
    employeeId: "EMP003",
    employeeName: "David Rodriguez",
    annual: { total: 20, used: 5, remaining: 15 },
    sick: { total: 10, used: 1, remaining: 9 },
    personal: { total: 5, used: 3, remaining: 2 },
    maternity: { total: 0, used: 0, remaining: 0 },
    paternity: { total: 10, used: 0, remaining: 10 },
    emergency: { total: 3, used: 0, remaining: 3 },
  },
  {
    employeeId: "EMP004",
    employeeName: "Sarah Wilson",
    annual: { total: 30, used: 18, remaining: 12 },
    sick: { total: 12, used: 3, remaining: 9 },
    personal: { total: 7, used: 2, remaining: 5 },
    maternity: { total: 90, used: 0, remaining: 90 },
    paternity: { total: 0, used: 0, remaining: 0 },
    emergency: { total: 5, used: 1, remaining: 4 },
  },
  {
    employeeId: "EMP005",
    employeeName: "Michael Brown",
    annual: { total: 22, used: 10, remaining: 12 },
    sick: { total: 10, used: 6, remaining: 4 },
    personal: { total: 5, used: 1, remaining: 4 },
    maternity: { total: 0, used: 0, remaining: 0 },
    paternity: { total: 10, used: 0, remaining: 10 },
    emergency: { total: 3, used: 3, remaining: 0 },
  },
]

export const getLeaveTypeInfo = (type: LeaveRequest["leaveType"]) => {
  return leaveTypes.find((lt) => lt.value === type) || leaveTypes[0]
}

export const getStatusColor = (status: LeaveRequest["status"]) => {
  switch (status) {
    case "pending":
      return "bg-yellow-100 text-yellow-800"
    case "approved":
      return "bg-green-100 text-green-800"
    case "rejected":
      return "bg-red-100 text-red-800"
    case "cancelled":
      return "bg-gray-100 text-gray-800"
    default:
      return "bg-gray-100 text-gray-800"
  }
}
