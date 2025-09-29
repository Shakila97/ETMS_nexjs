export interface AnalyticsData {
  employeeGrowth: { month: string; employees: number }[]
  attendanceRate: { month: string; rate: number }[]
  leaveDistribution: { type: string; count: number; color: string }[]
  departmentPerformance: { department: string; score: number; employees: number }[]
  taskCompletion: { month: string; completed: number; total: number }[]
  topPerformers: { name: string; score: number; department: string; avatar: string }[]
  attendanceTrends: { day: string; present: number; absent: number; late: number }[]
  salaryDistribution: { range: string; count: number }[]
}

export const getAnalyticsData = (): AnalyticsData => {
  return {
    employeeGrowth: [
      { month: "Jan", employees: 45 },
      { month: "Feb", employees: 48 },
      { month: "Mar", employees: 52 },
      { month: "Apr", employees: 55 },
      { month: "May", employees: 58 },
      { month: "Jun", employees: 62 },
    ],
    attendanceRate: [
      { month: "Jan", rate: 92 },
      { month: "Feb", rate: 89 },
      { month: "Mar", rate: 94 },
      { month: "Apr", rate: 91 },
      { month: "May", rate: 96 },
      { month: "Jun", rate: 93 },
    ],
    leaveDistribution: [
      { type: "Annual Leave", count: 45, color: "#8b5cf6" },
      { type: "Sick Leave", count: 23, color: "#ef4444" },
      { type: "Personal Leave", count: 12, color: "#f59e0b" },
      { type: "Maternity/Paternity", count: 8, color: "#10b981" },
      { type: "Emergency Leave", count: 5, color: "#6b7280" },
    ],
    departmentPerformance: [
      { department: "Engineering", score: 4.2, employees: 15 },
      { department: "Marketing", score: 4.0, employees: 8 },
      { department: "Sales", score: 3.8, employees: 12 },
      { department: "HR", score: 4.1, employees: 5 },
      { department: "Finance", score: 3.9, employees: 6 },
    ],
    taskCompletion: [
      { month: "Jan", completed: 85, total: 100 },
      { month: "Feb", completed: 92, total: 105 },
      { month: "Mar", completed: 78, total: 95 },
      { month: "Apr", completed: 88, total: 98 },
      { month: "May", completed: 95, total: 102 },
      { month: "Jun", completed: 89, total: 96 },
    ],
    topPerformers: [
      {
        name: "Sarah Johnson",
        score: 4.8,
        department: "Engineering",
        avatar: "/professional-female-marketing-manager.jpg",
      },
      { name: "Michael Chen", score: 4.7, department: "Marketing", avatar: "/professional-male-engineer.jpg" },
      { name: "Emily Davis", score: 4.6, department: "Sales", avatar: "/professional-female-marketing-director.png" },
      { name: "David Wilson", score: 4.5, department: "Finance", avatar: "/professional-male-financial-analyst.png" },
      { name: "Lisa Anderson", score: 4.4, department: "HR", avatar: "/hr-manager-avatar.jpg" },
    ],
    attendanceTrends: [
      { day: "Mon", present: 58, absent: 3, late: 1 },
      { day: "Tue", present: 60, absent: 1, late: 1 },
      { day: "Wed", present: 59, absent: 2, late: 1 },
      { day: "Thu", present: 61, absent: 1, late: 0 },
      { day: "Fri", present: 57, absent: 4, late: 1 },
      { day: "Sat", present: 25, absent: 37, late: 0 },
      { day: "Sun", present: 12, absent: 50, late: 0 },
    ],
    salaryDistribution: [
      { range: "$30k-$40k", count: 8 },
      { range: "$40k-$50k", count: 15 },
      { range: "$50k-$60k", count: 18 },
      { range: "$60k-$70k", count: 12 },
      { range: "$70k-$80k", count: 6 },
      { range: "$80k+", count: 3 },
    ],
  }
}
