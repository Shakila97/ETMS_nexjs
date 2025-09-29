"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, Plus, Clock, Users, Download, CheckCircle, XCircle, AlertCircle, Coffee } from "lucide-react"
import {
  mockAttendanceRecords,
  mockAttendanceSummary,
  getAttendanceStatusColor,
  type AttendanceRecord,
  type AttendanceSummary,
} from "@/lib/attendance-data"
import type { User } from "@/lib/auth"
import { cn } from "@/lib/utils"

interface AttendanceModuleProps {
  user: User
}

export function AttendanceModule({ user }: AttendanceModuleProps) {
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>(mockAttendanceRecords)
  const [attendanceSummary, setAttendanceSummary] = useState<AttendanceSummary[]>(mockAttendanceSummary)
  const [searchTerm, setSearchTerm] = useState("")
  const [dateFilter, setDateFilter] = useState("today")
  const [statusFilter, setStatusFilter] = useState("all")
  const [isMarkAttendanceOpen, setIsMarkAttendanceOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0])

  // Filter records based on search and filters
  const filteredRecords = attendanceRecords.filter((record) => {
    const matchesSearch = record.employeeName.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || record.status === statusFilter

    let matchesDate = true
    if (dateFilter === "today") {
      matchesDate = record.date === new Date().toISOString().split("T")[0]
    } else if (dateFilter === "week") {
      // Simple week filter - in real app would be more sophisticated
      const recordDate = new Date(record.date)
      const today = new Date()
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
      matchesDate = recordDate >= weekAgo && recordDate <= today
    }

    return matchesSearch && matchesStatus && matchesDate
  })

  // Calculate today's stats
  const todayRecords = attendanceRecords.filter((record) => record.date === new Date().toISOString().split("T")[0])
  const todayStats = {
    total: todayRecords.length,
    present: todayRecords.filter((r) => r.status === "present").length,
    late: todayRecords.filter((r) => r.status === "late").length,
    absent: todayRecords.filter((r) => r.status === "absent").length,
    onBreak: todayRecords.filter((r) => r.status === "on-break").length,
  }

  const getStatusIcon = (status: AttendanceRecord["status"]) => {
    switch (status) {
      case "present":
        return <CheckCircle className="h-4 w-4" />
      case "late":
        return <AlertCircle className="h-4 w-4" />
      case "absent":
        return <XCircle className="h-4 w-4" />
      case "half-day":
        return <Clock className="h-4 w-4" />
      case "on-break":
        return <Coffee className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const getStatusBadge = (status: AttendanceRecord["status"]) => {
    const colorClass = getAttendanceStatusColor(status)
    const icon = getStatusIcon(status)

    return (
      <Badge className={cn("flex items-center gap-1", colorClass)} variant="outline">
        {icon}
        {status.charAt(0).toUpperCase() + status.slice(1).replace("-", " ")}
      </Badge>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Attendance Tracking</h1>
          <p className="text-muted-foreground mt-2">Monitor employee attendance and working hours</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button onClick={() => setIsMarkAttendanceOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Mark Attendance
          </Button>
        </div>
      </div>

      {/* Today's Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-600" />
              <div>
                <div className="text-2xl font-bold">{todayStats.total}</div>
                <p className="text-sm text-muted-foreground">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <div>
                <div className="text-2xl font-bold text-green-600">{todayStats.present}</div>
                <p className="text-sm text-muted-foreground">Present</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-orange-600" />
              <div>
                <div className="text-2xl font-bold text-orange-600">{todayStats.late}</div>
                <p className="text-sm text-muted-foreground">Late</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-600" />
              <div>
                <div className="text-2xl font-bold text-red-600">{todayStats.absent}</div>
                <p className="text-sm text-muted-foreground">Absent</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Coffee className="h-4 w-4 text-purple-600" />
              <div>
                <div className="text-2xl font-bold text-purple-600">{todayStats.onBreak}</div>
                <p className="text-sm text-muted-foreground">On Break</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="daily" className="space-y-4">
        <TabsList>
          <TabsTrigger value="daily">Daily Records</TabsTrigger>
          <TabsTrigger value="summary">Monthly Summary</TabsTrigger>
        </TabsList>

        <TabsContent value="daily" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search employees..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={dateFilter} onValueChange={setDateFilter}>
                  <SelectTrigger className="w-full sm:w-32">
                    <SelectValue placeholder="Date" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="week">This Week</SelectItem>
                    <SelectItem value="month">This Month</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-32">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="present">Present</SelectItem>
                    <SelectItem value="late">Late</SelectItem>
                    <SelectItem value="absent">Absent</SelectItem>
                    <SelectItem value="half-day">Half Day</SelectItem>
                    <SelectItem value="on-break">On Break</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Daily Records Table */}
          <Card>
            <CardHeader>
              <CardTitle>Attendance Records ({filteredRecords.length})</CardTitle>
              <CardDescription>Daily attendance tracking for all employees</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Check In</TableHead>
                      <TableHead>Check Out</TableHead>
                      <TableHead>Break</TableHead>
                      <TableHead>Total Hours</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRecords.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src="/placeholder.svg" alt={record.employeeName} />
                              <AvatarFallback>
                                {record.employeeName
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{record.employeeName}</div>
                              <div className="text-sm text-muted-foreground">{record.employeeId}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{new Date(record.date).toLocaleDateString()}</TableCell>
                        <TableCell>{record.checkIn || "-"}</TableCell>
                        <TableCell>{record.checkOut || "-"}</TableCell>
                        <TableCell>
                          {record.breakStart && record.breakEnd ? `${record.breakStart} - ${record.breakEnd}` : "-"}
                        </TableCell>
                        <TableCell>{record.totalHours}h</TableCell>
                        <TableCell>{getStatusBadge(record.status)}</TableCell>
                        <TableCell className="max-w-32 truncate">{record.notes || "-"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="summary" className="space-y-4">
          {/* Monthly Summary Table */}
          <Card>
            <CardHeader>
              <CardTitle>Monthly Attendance Summary</CardTitle>
              <CardDescription>Comprehensive attendance overview for the current month</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Total Days</TableHead>
                      <TableHead>Present</TableHead>
                      <TableHead>Absent</TableHead>
                      <TableHead>Late</TableHead>
                      <TableHead>Total Hours</TableHead>
                      <TableHead>Avg Hours/Day</TableHead>
                      <TableHead>Attendance %</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {attendanceSummary.map((summary) => {
                      const attendancePercentage = Math.round((summary.presentDays / summary.totalDays) * 100)
                      return (
                        <TableRow key={summary.employeeId}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src="/placeholder.svg" alt={summary.employeeName} />
                                <AvatarFallback>
                                  {summary.employeeName
                                    .split(" ")
                                    .map((n) => n[0])
                                    .join("")}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium">{summary.employeeName}</div>
                                <div className="text-sm text-muted-foreground">{summary.employeeId}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{summary.totalDays}</TableCell>
                          <TableCell className="text-green-600 font-medium">{summary.presentDays}</TableCell>
                          <TableCell className="text-red-600 font-medium">{summary.absentDays}</TableCell>
                          <TableCell className="text-orange-600 font-medium">{summary.lateDays}</TableCell>
                          <TableCell>{summary.totalHours}h</TableCell>
                          <TableCell>{summary.averageHours}h</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="w-16 bg-gray-200 rounded-full h-2">
                                <div
                                  className={cn(
                                    "h-2 rounded-full",
                                    attendancePercentage >= 95
                                      ? "bg-green-500"
                                      : attendancePercentage >= 85
                                        ? "bg-orange-500"
                                        : "bg-red-500",
                                  )}
                                  style={{ width: `${attendancePercentage}%` }}
                                />
                              </div>
                              <span className="text-sm font-medium">{attendancePercentage}%</span>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Mark Attendance Dialog */}
      <Dialog open={isMarkAttendanceOpen} onOpenChange={setIsMarkAttendanceOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Mark Attendance</DialogTitle>
            <DialogDescription>Record attendance for an employee</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="employee">Employee</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EMP001">John Smith</SelectItem>
                  <SelectItem value="EMP002">Emily Johnson</SelectItem>
                  <SelectItem value="EMP003">David Rodriguez</SelectItem>
                  <SelectItem value="EMP004">Sarah Wilson</SelectItem>
                  <SelectItem value="EMP005">Michael Brown</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input id="date" type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="present">Present</SelectItem>
                  <SelectItem value="late">Late</SelectItem>
                  <SelectItem value="absent">Absent</SelectItem>
                  <SelectItem value="half-day">Half Day</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="checkIn">Check In</Label>
                <Input id="checkIn" type="time" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="checkOut">Check Out</Label>
                <Input id="checkOut" type="time" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea id="notes" placeholder="Add any notes..." rows={3} />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsMarkAttendanceOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setIsMarkAttendanceOpen(false)}>Save Attendance</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
