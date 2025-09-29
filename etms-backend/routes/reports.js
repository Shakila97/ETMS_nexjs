const express = require("express")
const moment = require("moment")
const Employee = require("../models/Employee")
const Attendance = require("../models/Attendance")
const Task = require("../models/Task")
const Leave = require("../models/Leave")
const Payroll = require("../models/Payroll")
const Location = require("../models/Location")
const Department = require("../models/Department")
const { adminOrManager, allRoles } = require("../middleware/roleAuth")

const router = express.Router()

// @route   GET /api/reports/dashboard
// @desc    Get dashboard overview data
// @access  Private
router.get("/dashboard", allRoles, async (req, res) => {
  try {
    const today = moment().startOf("day").toDate()
    const tomorrow = moment().add(1, "day").startOf("day").toDate()
    const thisMonth = moment().startOf("month").toDate()
    const nextMonth = moment().add(1, "month").startOf("month").toDate()

    // Employee statistics
    const totalEmployees = await Employee.countDocuments({ status: "active" })
    const totalDepartments = await Department.countDocuments({ isActive: true })

    // Today's attendance
    const todayAttendance = await Attendance.aggregate([
      {
        $match: {
          date: { $gte: today, $lt: tomorrow },
        },
      },
      {
        $group: {
          _id: null,
          present: { $sum: { $cond: [{ $ne: ["$checkIn.time", null] }, 1, 0] } },
          onBreak: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $ne: ["$checkIn.time", null] },
                    { $eq: ["$checkOut.time", null] },
                    {
                      $gt: [
                        {
                          $size: {
                            $filter: {
                              input: "$breakTime",
                              cond: { $and: [{ $ne: ["$$this.start", null] }, { $eq: ["$$this.end", null] }] },
                            },
                          },
                        },
                        0,
                      ],
                    },
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
    ])

    // Task statistics
    const taskStats = await Task.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          pending: { $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] } },
          inProgress: { $sum: { $cond: [{ $eq: ["$status", "in-progress"] }, 1, 0] } },
          completed: { $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] } },
          overdue: {
            $sum: {
              $cond: [
                {
                  $and: [{ $lt: ["$dueDate", new Date()] }, { $ne: ["$status", "completed"] }],
                },
                1,
                0,
              ],
            },
          },
        },
      },
    ])

    // Leave requests this month
    const leaveStats = await Leave.aggregate([
      {
        $match: {
          createdAt: { $gte: thisMonth, $lt: nextMonth },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          pending: { $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] } },
          approved: { $sum: { $cond: [{ $eq: ["$status", "approved"] }, 1, 0] } },
          rejected: { $sum: { $cond: [{ $eq: ["$status", "rejected"] }, 1, 0] } },
        },
      },
    ])

    // Recent activities (for admin/manager)
    let recentActivities = []
    if (req.user.role !== "employee") {
      recentActivities = await Task.find()
        .populate("assignedTo", "firstName lastName")
        .populate("assignedBy", "firstName lastName")
        .sort({ createdAt: -1 })
        .limit(5)
        .select("title status createdAt assignedTo assignedBy")
    }

    const dashboardData = {
      overview: {
        totalEmployees,
        totalDepartments,
        todayPresent: todayAttendance[0]?.present || 0,
        onBreak: todayAttendance[0]?.onBreak || 0,
      },
      tasks: taskStats[0] || { total: 0, pending: 0, inProgress: 0, completed: 0, overdue: 0 },
      leaves: leaveStats[0] || { total: 0, pending: 0, approved: 0, rejected: 0 },
      recentActivities,
    }

    res.json({
      success: true,
      data: dashboardData,
    })
  } catch (error) {
    console.error("Get dashboard error:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
    })
  }
})

// @route   GET /api/reports/attendance
// @desc    Get attendance report
// @access  Private (Admin/Manager)
router.get("/attendance", adminOrManager, async (req, res) => {
  try {
    const {
      startDate = moment().startOf("month").format("YYYY-MM-DD"),
      endDate = moment().endOf("month").format("YYYY-MM-DD"),
      employeeId,
      departmentId,
      format = "summary",
    } = req.query

    // Build employee query
    const employeeQuery = { status: "active" }
    if (employeeId) employeeQuery._id = employeeId
    if (departmentId) employeeQuery.department = departmentId

    const employees = await Employee.find(employeeQuery).populate("department", "name")

    const attendanceReport = []

    for (const employee of employees) {
      const attendanceRecords = await Attendance.find({
        employee: employee._id,
        date: {
          $gte: new Date(startDate),
          $lte: new Date(endDate),
        },
      })

      const stats = {
        employeeId: employee.employeeId,
        employeeName: `${employee.firstName} ${employee.lastName}`,
        department: employee.department.name,
        totalDays: attendanceRecords.length,
        presentDays: attendanceRecords.filter((r) => r.status === "present").length,
        absentDays: attendanceRecords.filter((r) => r.status === "absent").length,
        lateDays: attendanceRecords.filter((r) => r.status === "late").length,
        totalHours: attendanceRecords.reduce((sum, r) => sum + (r.totalHours || 0), 0),
        overtimeHours: attendanceRecords.reduce((sum, r) => sum + (r.overtimeHours || 0), 0),
        attendancePercentage:
          attendanceRecords.length > 0
            ? (attendanceRecords.filter((r) => r.status === "present").length / attendanceRecords.length) * 100
            : 0,
      }

      if (format === "detailed") {
        stats.records = attendanceRecords
      }

      attendanceReport.push(stats)
    }

    res.json({
      success: true,
      data: {
        report: attendanceReport,
        period: { startDate, endDate },
        summary: {
          totalEmployees: attendanceReport.length,
          averageAttendance:
            attendanceReport.length > 0
              ? attendanceReport.reduce((sum, emp) => sum + emp.attendancePercentage, 0) / attendanceReport.length
              : 0,
          totalHours: attendanceReport.reduce((sum, emp) => sum + emp.totalHours, 0),
          totalOvertimeHours: attendanceReport.reduce((sum, emp) => sum + emp.overtimeHours, 0),
        },
      },
    })
  } catch (error) {
    console.error("Get attendance report error:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
    })
  }
})

// @route   GET /api/reports/tasks
// @desc    Get task report
// @access  Private (Admin/Manager)
router.get("/tasks", adminOrManager, async (req, res) => {
  try {
    const {
      startDate = moment().startOf("month").format("YYYY-MM-DD"),
      endDate = moment().endOf("month").format("YYYY-MM-DD"),
      employeeId,
      departmentId,
      status,
      priority,
    } = req.query

    // Build query
    const query = {
      createdAt: {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      },
    }

    if (status) query.status = status
    if (priority) query.priority = priority

    // Employee filter
    if (employeeId) {
      query.assignedTo = employeeId
    } else if (departmentId) {
      const employees = await Employee.find({ department: departmentId }).select("_id")
      query.assignedTo = { $in: employees.map((emp) => emp._id) }
    }

    const tasks = await Task.find(query)
      .populate("assignedTo", "firstName lastName employeeId department")
      .populate("assignedBy", "firstName lastName employeeId")
      .populate("assignedTo.department", "name")

    // Task statistics
    const taskStats = {
      total: tasks.length,
      completed: tasks.filter((t) => t.status === "completed").length,
      pending: tasks.filter((t) => t.status === "pending").length,
      inProgress: tasks.filter((t) => t.status === "in-progress").length,
      cancelled: tasks.filter((t) => t.status === "cancelled").length,
      overdue: tasks.filter((t) => t.dueDate < new Date() && t.status !== "completed").length,
    }

    // Priority breakdown
    const priorityStats = tasks.reduce((acc, task) => {
      acc[task.priority] = (acc[task.priority] || 0) + 1
      return acc
    }, {})

    // Employee performance
    const employeeStats = tasks.reduce((acc, task) => {
      const empId = task.assignedTo._id.toString()
      if (!acc[empId]) {
        acc[empId] = {
          employeeId: task.assignedTo.employeeId,
          employeeName: `${task.assignedTo.firstName} ${task.assignedTo.lastName}`,
          department: task.assignedTo.department?.name || "N/A",
          total: 0,
          completed: 0,
          pending: 0,
          inProgress: 0,
          overdue: 0,
        }
      }
      acc[empId].total++
      acc[empId][task.status.replace("-", "")]++
      if (task.dueDate < new Date() && task.status !== "completed") {
        acc[empId].overdue++
      }
      return acc
    }, {})

    res.json({
      success: true,
      data: {
        tasks,
        period: { startDate, endDate },
        statistics: taskStats,
        priorityBreakdown: priorityStats,
        employeePerformance: Object.values(employeeStats),
      },
    })
  } catch (error) {
    console.error("Get task report error:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
    })
  }
})

// @route   GET /api/reports/leaves
// @desc    Get leave report
// @access  Private (Admin/Manager)
router.get("/leaves", adminOrManager, async (req, res) => {
  try {
    const {
      startDate = moment().startOf("year").format("YYYY-MM-DD"),
      endDate = moment().endOf("year").format("YYYY-MM-DD"),
      employeeId,
      departmentId,
      type,
      status,
    } = req.query

    // Build query
    const query = {
      startDate: {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      },
    }

    if (type) query.type = type
    if (status) query.status = status

    // Employee filter
    if (employeeId) {
      query.employee = employeeId
    } else if (departmentId) {
      const employees = await Employee.find({ department: departmentId }).select("_id")
      query.employee = { $in: employees.map((emp) => emp._id) }
    }

    const leaves = await Leave.find(query)
      .populate("employee", "firstName lastName employeeId department")
      .populate("employee.department", "name")
      .populate("approvedBy", "firstName lastName employeeId")

    // Leave statistics
    const leaveStats = {
      total: leaves.length,
      approved: leaves.filter((l) => l.status === "approved").length,
      pending: leaves.filter((l) => l.status === "pending").length,
      rejected: leaves.filter((l) => l.status === "rejected").length,
      cancelled: leaves.filter((l) => l.status === "cancelled").length,
      totalDays: leaves.filter((l) => l.status === "approved").reduce((sum, l) => sum + l.totalDays, 0),
    }

    // Type breakdown
    const typeStats = leaves.reduce((acc, leave) => {
      if (!acc[leave.type]) {
        acc[leave.type] = { count: 0, days: 0 }
      }
      acc[leave.type].count++
      if (leave.status === "approved") {
        acc[leave.type].days += leave.totalDays
      }
      return acc
    }, {})

    // Employee leave summary
    const employeeStats = leaves.reduce((acc, leave) => {
      const empId = leave.employee._id.toString()
      if (!acc[empId]) {
        acc[empId] = {
          employeeId: leave.employee.employeeId,
          employeeName: `${leave.employee.firstName} ${leave.employee.lastName}`,
          department: leave.employee.department?.name || "N/A",
          totalRequests: 0,
          approvedRequests: 0,
          totalDaysTaken: 0,
          byType: {},
        }
      }
      acc[empId].totalRequests++
      if (leave.status === "approved") {
        acc[empId].approvedRequests++
        acc[empId].totalDaysTaken += leave.totalDays
        acc[empId].byType[leave.type] = (acc[empId].byType[leave.type] || 0) + leave.totalDays
      }
      return acc
    }, {})

    res.json({
      success: true,
      data: {
        leaves,
        period: { startDate, endDate },
        statistics: leaveStats,
        typeBreakdown: typeStats,
        employeeSummary: Object.values(employeeStats),
      },
    })
  } catch (error) {
    console.error("Get leave report error:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
    })
  }
})

// @route   GET /api/reports/payroll
// @desc    Get payroll report
// @access  Private (Admin/Manager)
router.get("/payroll", adminOrManager, async (req, res) => {
  try {
    const { year = new Date().getFullYear(), month, departmentId, status } = req.query

    // Build date query
    const dateQuery = {}
    if (month) {
      const startDate = new Date(year, month - 1, 1)
      const endDate = new Date(year, month, 0)
      dateQuery["payPeriod.startDate"] = { $gte: startDate, $lte: endDate }
    } else {
      const startDate = new Date(year, 0, 1)
      const endDate = new Date(year, 11, 31)
      dateQuery["payPeriod.startDate"] = { $gte: startDate, $lte: endDate }
    }

    // Build query
    const query = { ...dateQuery }
    if (status) query.status = status

    let payrolls = await Payroll.find(query)
      .populate("employee", "firstName lastName employeeId department")
      .populate("employee.department", "name")
      .populate("processedBy", "firstName lastName employeeId")

    // Department filter
    if (departmentId) {
      payrolls = payrolls.filter((p) => p.employee.department._id.toString() === departmentId)
    }

    // Calculate statistics
    const totalGross = payrolls.reduce((sum, p) => sum + p.grossSalary, 0)
    const totalNet = payrolls.reduce((sum, p) => sum + p.netSalary, 0)
    const totalDeductions = totalGross - totalNet

    // Department breakdown
    const departmentStats = payrolls.reduce((acc, payroll) => {
      const deptName = payroll.employee.department?.name || "N/A"
      if (!acc[deptName]) {
        acc[deptName] = {
          employees: 0,
          totalGross: 0,
          totalNet: 0,
          totalDeductions: 0,
        }
      }
      acc[deptName].employees++
      acc[deptName].totalGross += payroll.grossSalary
      acc[deptName].totalNet += payroll.netSalary
      acc[deptName].totalDeductions += payroll.grossSalary - payroll.netSalary
      return acc
    }, {})

    res.json({
      success: true,
      data: {
        payrolls,
        period: { year, month },
        summary: {
          totalEmployees: payrolls.length,
          totalGrossSalary: totalGross,
          totalNetSalary: totalNet,
          totalDeductions,
          averageGrossSalary: payrolls.length > 0 ? totalGross / payrolls.length : 0,
          averageNetSalary: payrolls.length > 0 ? totalNet / payrolls.length : 0,
        },
        departmentBreakdown: Object.entries(departmentStats).map(([name, stats]) => ({
          department: name,
          ...stats,
        })),
      },
    })
  } catch (error) {
    console.error("Get payroll report error:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
    })
  }
})

// @route   GET /api/reports/employee-performance
// @desc    Get employee performance report
// @access  Private (Admin/Manager)
router.get("/employee-performance", adminOrManager, async (req, res) => {
  try {
    const {
      startDate = moment().startOf("month").format("YYYY-MM-DD"),
      endDate = moment().endOf("month").format("YYYY-MM-DD"),
      employeeId,
      departmentId,
    } = req.query

    // Build employee query
    const employeeQuery = { status: "active" }
    if (employeeId) employeeQuery._id = employeeId
    if (departmentId) employeeQuery.department = departmentId

    const employees = await Employee.find(employeeQuery).populate("department", "name")

    const performanceReport = []

    for (const employee of employees) {
      // Attendance data
      const attendanceRecords = await Attendance.find({
        employee: employee._id,
        date: { $gte: new Date(startDate), $lte: new Date(endDate) },
      })

      // Task data
      const tasks = await Task.find({
        assignedTo: employee._id,
        createdAt: { $gte: new Date(startDate), $lte: new Date(endDate) },
      })

      // Leave data
      const leaves = await Leave.find({
        employee: employee._id,
        startDate: { $gte: new Date(startDate), $lte: new Date(endDate) },
        status: "approved",
      })

      const performance = {
        employeeId: employee.employeeId,
        employeeName: `${employee.firstName} ${employee.lastName}`,
        department: employee.department.name,
        attendance: {
          totalDays: attendanceRecords.length,
          presentDays: attendanceRecords.filter((r) => r.status === "present").length,
          totalHours: attendanceRecords.reduce((sum, r) => sum + (r.totalHours || 0), 0),
          overtimeHours: attendanceRecords.reduce((sum, r) => sum + (r.overtimeHours || 0), 0),
          attendanceRate:
            attendanceRecords.length > 0
              ? (attendanceRecords.filter((r) => r.status === "present").length / attendanceRecords.length) * 100
              : 0,
        },
        tasks: {
          total: tasks.length,
          completed: tasks.filter((t) => t.status === "completed").length,
          pending: tasks.filter((t) => t.status === "pending").length,
          overdue: tasks.filter((t) => t.dueDate < new Date() && t.status !== "completed").length,
          completionRate:
            tasks.length > 0 ? (tasks.filter((t) => t.status === "completed").length / tasks.length) * 100 : 0,
        },
        leaves: {
          totalRequests: leaves.length,
          totalDays: leaves.reduce((sum, l) => sum + l.totalDays, 0),
        },
      }

      // Calculate overall performance score
      const attendanceScore = performance.attendance.attendanceRate
      const taskScore = performance.tasks.completionRate
      const punctualityScore = attendanceRecords.filter((r) => r.status === "late").length === 0 ? 100 : 80

      performance.overallScore = Math.round((attendanceScore + taskScore + punctualityScore) / 3)

      performanceReport.push(performance)
    }

    // Sort by overall score
    performanceReport.sort((a, b) => b.overallScore - a.overallScore)

    res.json({
      success: true,
      data: {
        report: performanceReport,
        period: { startDate, endDate },
        summary: {
          totalEmployees: performanceReport.length,
          averageAttendanceRate:
            performanceReport.length > 0
              ? performanceReport.reduce((sum, emp) => sum + emp.attendance.attendanceRate, 0) /
                performanceReport.length
              : 0,
          averageTaskCompletionRate:
            performanceReport.length > 0
              ? performanceReport.reduce((sum, emp) => sum + emp.tasks.completionRate, 0) / performanceReport.length
              : 0,
          averageOverallScore:
            performanceReport.length > 0
              ? performanceReport.reduce((sum, emp) => sum + emp.overallScore, 0) / performanceReport.length
              : 0,
        },
      },
    })
  } catch (error) {
    console.error("Get employee performance report error:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
    })
  }
})

module.exports = router
