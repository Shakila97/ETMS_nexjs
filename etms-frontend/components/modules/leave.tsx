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
import { Progress } from "@/components/ui/progress"
import {
  Search,
  Plus,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  Download,
  MoreHorizontal,
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  mockLeaveRequests,
  mockLeaveBalances,
  leaveTypes,
  getLeaveTypeInfo,
  getStatusColor,
  type LeaveRequest,
  type LeaveBalance,
} from "@/lib/leave-data"
import type { User } from "@/lib/auth"
import { cn } from "@/lib/utils"

interface LeaveModuleProps {
  user: User
}

export function LeaveModule({ user }: LeaveModuleProps) {
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>(mockLeaveRequests)
  const [leaveBalances, setLeaveBalances] = useState<LeaveBalance[]>(mockLeaveBalances)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")
  const [isApplyLeaveOpen, setIsApplyLeaveOpen] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null)
  const [isViewRequestOpen, setIsViewRequestOpen] = useState(false)

  // Filter requests based on search and filters
  const filteredRequests = leaveRequests.filter((request) => {
    const matchesSearch = request.employeeName.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || request.status === statusFilter
    const matchesType = typeFilter === "all" || request.leaveType === typeFilter

    return matchesSearch && matchesStatus && matchesType
  })

  // Calculate summary stats
  const summaryStats = {
    total: leaveRequests.length,
    pending: leaveRequests.filter((r) => r.status === "pending").length,
    approved: leaveRequests.filter((r) => r.status === "approved").length,
    rejected: leaveRequests.filter((r) => r.status === "rejected").length,
  }

  const handleViewRequest = (request: LeaveRequest) => {
    setSelectedRequest(request)
    setIsViewRequestOpen(true)
  }

  const handleApproveRequest = (requestId: string) => {
    setLeaveRequests((prev) =>
      prev.map((req) =>
        req.id === requestId
          ? {
              ...req,
              status: "approved" as const,
              approvedBy: user.name,
              approvedDate: new Date().toISOString().split("T")[0],
            }
          : req,
      ),
    )
  }

  const handleRejectRequest = (requestId: string) => {
    setLeaveRequests((prev) =>
      prev.map((req) => (req.id === requestId ? { ...req, status: "rejected" as const } : req)),
    )
  }

  const getStatusBadge = (status: LeaveRequest["status"]) => {
    const colorClass = getStatusColor(status)
    const icon =
      status === "approved" ? (
        <CheckCircle className="h-3 w-3" />
      ) : status === "rejected" ? (
        <XCircle className="h-3 w-3" />
      ) : status === "pending" ? (
        <Clock className="h-3 w-3" />
      ) : (
        <AlertCircle className="h-3 w-3" />
      )

    return (
      <Badge className={cn("flex items-center gap-1", colorClass)} variant="outline">
        {icon}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  const getLeaveTypeBadge = (type: LeaveRequest["leaveType"]) => {
    const typeInfo = getLeaveTypeInfo(type)
    return (
      <Badge className={cn("flex items-center gap-1", typeInfo.color)} variant="outline">
        {typeInfo.label}
      </Badge>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Leave Management</h1>
          <p className="text-muted-foreground mt-2">Manage employee leave requests and balances</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button onClick={() => setIsApplyLeaveOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Apply Leave
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-blue-600" />
              <div>
                <div className="text-2xl font-bold">{summaryStats.total}</div>
                <p className="text-sm text-muted-foreground">Total Requests</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-yellow-600" />
              <div>
                <div className="text-2xl font-bold text-yellow-600">{summaryStats.pending}</div>
                <p className="text-sm text-muted-foreground">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <div>
                <div className="text-2xl font-bold text-green-600">{summaryStats.approved}</div>
                <p className="text-sm text-muted-foreground">Approved</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-600" />
              <div>
                <div className="text-2xl font-bold text-red-600">{summaryStats.rejected}</div>
                <p className="text-sm text-muted-foreground">Rejected</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="requests" className="space-y-4">
        <TabsList>
          <TabsTrigger value="requests">Leave Requests</TabsTrigger>
          <TabsTrigger value="balances">Leave Balances</TabsTrigger>
        </TabsList>

        <TabsContent value="requests" className="space-y-4">
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
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-32">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-full sm:w-40">
                    <SelectValue placeholder="Leave Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {leaveTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Leave Requests Table */}
          <Card>
            <CardHeader>
              <CardTitle>Leave Requests ({filteredRequests.length})</CardTitle>
              <CardDescription>All leave requests from employees</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Leave Type</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Days</TableHead>
                      <TableHead>Applied Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRequests.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src="/placeholder.svg" alt={request.employeeName} />
                              <AvatarFallback>
                                {request.employeeName
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{request.employeeName}</div>
                              <div className="text-sm text-muted-foreground">{request.employeeId}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{getLeaveTypeBadge(request.leaveType)}</TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{new Date(request.startDate).toLocaleDateString()}</div>
                            <div className="text-muted-foreground">
                              to {new Date(request.endDate).toLocaleDateString()}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{request.days}</TableCell>
                        <TableCell>{new Date(request.appliedDate).toLocaleDateString()}</TableCell>
                        <TableCell>{getStatusBadge(request.status)}</TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleViewRequest(request)}>
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              {request.status === "pending" && (
                                <>
                                  <DropdownMenuItem onClick={() => handleApproveRequest(request.id)}>
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    Approve
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleRejectRequest(request.id)}>
                                    <XCircle className="h-4 w-4 mr-2" />
                                    Reject
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="balances" className="space-y-4">
          {/* Leave Balances */}
          <Card>
            <CardHeader>
              <CardTitle>Employee Leave Balances</CardTitle>
              <CardDescription>Current leave balance for all employees</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {leaveBalances.map((balance) => (
                  <div key={balance.employeeId} className="border rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-4">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src="/placeholder.svg" alt={balance.employeeName} />
                        <AvatarFallback>
                          {balance.employeeName
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium text-lg">{balance.employeeName}</div>
                        <div className="text-sm text-muted-foreground">{balance.employeeId}</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {Object.entries(balance)
                        .filter(([key]) => key !== "employeeId" && key !== "employeeName")
                        .map(([leaveType, data]) => {
                          const typedData = data as { total: number; used: number; remaining: number }
                          const usagePercentage = typedData.total > 0 ? (typedData.used / typedData.total) * 100 : 0
                          const typeInfo = getLeaveTypeInfo(leaveType as any)

                          return (
                            <div key={leaveType} className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">{typeInfo.label}</span>
                                <span className="text-sm text-muted-foreground">
                                  {typedData.remaining}/{typedData.total}
                                </span>
                              </div>
                              <Progress value={usagePercentage} className="h-2" />
                              <div className="flex justify-between text-xs text-muted-foreground">
                                <span>Used: {typedData.used}</span>
                                <span>Remaining: {typedData.remaining}</span>
                              </div>
                            </div>
                          )
                        })}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Apply Leave Dialog */}
      <Dialog open={isApplyLeaveOpen} onOpenChange={setIsApplyLeaveOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Apply for Leave</DialogTitle>
            <DialogDescription>Submit a new leave request</DialogDescription>
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
              <Label htmlFor="leaveType">Leave Type</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select leave type" />
                </SelectTrigger>
                <SelectContent>
                  {leaveTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input id="startDate" type="date" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">End Date</Label>
                <Input id="endDate" type="date" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="reason">Reason</Label>
              <Textarea id="reason" placeholder="Please provide a reason for your leave..." rows={3} />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsApplyLeaveOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setIsApplyLeaveOpen(false)}>Submit Request</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Request Dialog */}
      <Dialog open={isViewRequestOpen} onOpenChange={setIsViewRequestOpen}>
        <DialogContent className="max-w-2xl">
          {selectedRequest && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src="/placeholder.svg" alt={selectedRequest.employeeName} />
                    <AvatarFallback>
                      {selectedRequest.employeeName
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="text-xl font-bold">{selectedRequest.employeeName}</div>
                    <div className="text-sm text-muted-foreground">Leave Request Details</div>
                  </div>
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-6 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Leave Type</Label>
                    <div className="mt-1">{getLeaveTypeBadge(selectedRequest.leaveType)}</div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Status</Label>
                    <div className="mt-1">{getStatusBadge(selectedRequest.status)}</div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Start Date</Label>
                    <div className="mt-1 font-medium">{new Date(selectedRequest.startDate).toLocaleDateString()}</div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">End Date</Label>
                    <div className="mt-1 font-medium">{new Date(selectedRequest.endDate).toLocaleDateString()}</div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Duration</Label>
                    <div className="mt-1 font-medium">{selectedRequest.days} days</div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Applied Date</Label>
                    <div className="mt-1 font-medium">{new Date(selectedRequest.appliedDate).toLocaleDateString()}</div>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Reason</Label>
                  <div className="mt-1 p-3 bg-muted rounded-md">{selectedRequest.reason}</div>
                </div>

                {selectedRequest.status === "approved" && selectedRequest.approvedBy && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Approved By</Label>
                      <div className="mt-1 font-medium">{selectedRequest.approvedBy}</div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Approved Date</Label>
                      <div className="mt-1 font-medium">
                        {selectedRequest.approvedDate && new Date(selectedRequest.approvedDate).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                )}

                {selectedRequest.status === "rejected" && selectedRequest.rejectionReason && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Rejection Reason</Label>
                    <div className="mt-1 p-3 bg-red-50 border border-red-200 rounded-md text-red-800">
                      {selectedRequest.rejectionReason}
                    </div>
                  </div>
                )}
              </div>

              {selectedRequest.status === "pending" && (
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => handleRejectRequest(selectedRequest.id)}>
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject
                  </Button>
                  <Button onClick={() => handleApproveRequest(selectedRequest.id)}>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approve
                  </Button>
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
