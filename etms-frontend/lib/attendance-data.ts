export interface AttendanceRecord {
  id: string
  employeeId: string
  employeeName: string
  date: string
  checkIn: string | null
  checkOut: string | null
  breakStart: string | null
  breakEnd: string | null
  totalHours: number
  status: "present" | "absent" | "late" | "half-day" | "on-break"
  notes?: string
}

export interface AttendanceSummary {
  employeeId: string
  employeeName: string
  totalDays: number
  presentDays: number
  absentDays: number
  lateDays: number
  totalHours: number
  averageHours: number
}

// Mock attendance data for the current week
export const mockAttendanceRecords: AttendanceRecord[] = [
  {
    id: "1",
    employeeId: "EMP001",
    employeeName: "John Smith",
    date: "2024-01-15",
    checkIn: "09:00",
    checkOut: "17:30",
    breakStart: "12:00",
    breakEnd: "13:00",
    totalHours: 7.5,
    status: "present",
  },
  {
    id: "2",
    employeeId: "EMP002",
    employeeName: "Emily Johnson",
    date: "2024-01-15",
    checkIn: "09:15",
    checkOut: "17:45",
    breakStart: "12:30",
    breakEnd: "13:30",
    totalHours: 7.5,
    status: "late",
    notes: "Traffic delay",
  },
  {
    id: "3",
    employeeId: "EMP003",
    employeeName: "David Rodriguez",
    date: "2024-01-15",
    checkIn: null,
    checkOut: null,
    breakStart: null,
    breakEnd: null,
    totalHours: 0,
    status: "absent",
    notes: "Sick leave",
  },
  {
    id: "4",
    employeeId: "EMP004",
    employeeName: "Sarah Wilson",
    date: "2024-01-15",
    checkIn: "08:45",
    checkOut: "17:15",
    breakStart: "12:00",
    breakEnd: "13:00",
    totalHours: 7.5,
    status: "present",
  },
  {
    id: "5",
    employeeId: "EMP005",
    employeeName: "Michael Brown",
    date: "2024-01-15",
    checkIn: "09:00",
    checkOut: "13:00",
    breakStart: null,
    breakEnd: null,
    totalHours: 4,
    status: "half-day",
    notes: "Medical appointment",
  },
  // Previous day records
  {
    id: "6",
    employeeId: "EMP001",
    employeeName: "John Smith",
    date: "2024-01-14",
    checkIn: "08:55",
    checkOut: "17:25",
    breakStart: "12:00",
    breakEnd: "13:00",
    totalHours: 7.5,
    status: "present",
  },
  {
    id: "7",
    employeeId: "EMP002",
    employeeName: "Emily Johnson",
    date: "2024-01-14",
    checkIn: "09:00",
    checkOut: "17:30",
    breakStart: "12:30",
    breakEnd: "13:30",
    totalHours: 7.5,
    status: "present",
  },
]

export const mockAttendanceSummary: AttendanceSummary[] = [
  {
    employeeId: "EMP001",
    employeeName: "John Smith",
    totalDays: 22,
    presentDays: 21,
    absentDays: 1,
    lateDays: 2,
    totalHours: 165,
    averageHours: 7.5,
  },
  {
    employeeId: "EMP002",
    employeeName: "Emily Johnson",
    totalDays: 22,
    presentDays: 20,
    absentDays: 2,
    lateDays: 4,
    totalHours: 158,
    averageHours: 7.4,
  },
  {
    employeeId: "EMP003",
    employeeName: "David Rodriguez",
    totalDays: 22,
    presentDays: 19,
    absentDays: 3,
    lateDays: 1,
    totalHours: 148,
    averageHours: 7.3,
  },
  {
    employeeId: "EMP004",
    employeeName: "Sarah Wilson",
    totalDays: 22,
    presentDays: 22,
    absentDays: 0,
    lateDays: 0,
    totalHours: 172,
    averageHours: 7.8,
  },
  {
    employeeId: "EMP005",
    employeeName: "Michael Brown",
    totalDays: 22,
    presentDays: 18,
    absentDays: 4,
    lateDays: 3,
    totalHours: 142,
    averageHours: 7.1,
  },
]

export const getAttendanceStatusColor = (status: AttendanceRecord["status"]) => {
  switch (status) {
    case "present":
      return "text-green-600 bg-green-50"
    case "late":
      return "text-orange-600 bg-orange-50"
    case "absent":
      return "text-red-600 bg-red-50"
    case "half-day":
      return "text-blue-600 bg-blue-50"
    case "on-break":
      return "text-purple-600 bg-purple-50"
    default:
      return "text-gray-600 bg-gray-50"
  }
}
