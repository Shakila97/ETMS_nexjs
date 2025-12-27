"use client"

import { useState, useEffect } from "react"
import axios from "@/lib/axios"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Search, Plus, MoreHorizontal, Edit, Trash2, Eye, Phone, Mail, MapPin, Calendar } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { positions } from "@/lib/employee-data"
import type { User } from "@/lib/auth"

interface Employee {
  _id: string
  employeeId: string
  firstName: string
  lastName: string
  email: string
  phone: string
  department: {
    _id: string
    name: string
  }
  position: string
  manager?: {
    _id: string
    firstName: string
    lastName: string
  }
  status: "active" | "inactive" | "terminated"
  hireDate: string
  salary: number
  avatar?: string
  address: {
    street: string
    city: string
    state: string
    zipCode: string
  }
  emergencyContact: {
    name: string
    relationship: string
    phone: string
  }
}

interface EmployeesModuleProps {
  user: User
}

export function EmployeesModule({ user }: EmployeesModuleProps) {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [departmentsList, setDepartmentsList] = useState<{ _id: string; name: string }[]>([])
  const [managersList, setManagersList] = useState<{ _id: string; firstName: string; lastName: string }[]>([])

  // Fetch employees, departments and managers on mount
  useEffect(() => {
    async function fetchAll() {
      try {
        const [empRes, deptRes, mgrRes] = await Promise.all([
          axios.get("/employees"),
          axios.get("/departments"),
          axios.get("/employees?role=manager"),
        ])

        const employeesData = empRes.data?.data?.employees || empRes.data?.employees || []
        setEmployees(employeesData)

        const departmentsData = deptRes.data?.data?.departments || deptRes.data?.departments || []
        setDepartmentsList(departmentsData)

        const managersData = (mgrRes.data?.data?.employees || mgrRes.data?.employees || []).map((m: any) => ({
          _id: m._id,
          firstName: m.firstName,
          lastName: m.lastName,
        }))
        setManagersList(managersData)
      } catch (err) {
        console.error("Failed to fetch initial data:", err)
      }
    }
    fetchAll()
  }, [])

  const [searchTerm, setSearchTerm] = useState("")
  const [departmentFilter, setDepartmentFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)

  const [isEditing, setIsEditing] = useState(false)
  const [currentEmployeeId, setCurrentEmployeeId] = useState<string | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [employeeToDelete, setEmployeeToDelete] = useState<Employee | null>(null)

  // Form state for adding/editing employee
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    department: "",
    position: "",
    manager: "",
    hireDate: "",
    salary: "",
    status: "active",
    createUserAccount: false,
    password: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState("")

  // Filter employees based on search and filters
  const filteredEmployees = employees.filter((employee) => {
    const fullName = `${employee.firstName} ${employee.lastName}`
    const matchesSearch =
      fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (employee.email || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (employee.employeeId || "").toLowerCase().includes(searchTerm.toLowerCase())

    const matchesDepartment = departmentFilter === "all" || employee.department?._id === departmentFilter
    const matchesStatus = statusFilter === "all" || employee.status === statusFilter

    return matchesSearch && matchesDepartment && matchesStatus
  })

  const handleViewEmployee = (employee: Employee) => {
    setSelectedEmployee(employee)
    setIsViewDialogOpen(true)
  }

  const handleEditEmployee = (employee: Employee) => {
    setIsEditing(true)
    setCurrentEmployeeId(employee._id)
    setFormData({
      fullName: `${employee.firstName} ${employee.lastName}`,
      email: employee.email,
      phone: employee.phone,
      department: employee.department?._id || "",
      position: employee.position,
      manager: employee.manager?._id || "",
      hireDate: employee.hireDate ? new Date(employee.hireDate).toISOString().split('T')[0] : "",
      salary: employee.salary.toString(),
      status: employee.status,
      createUserAccount: false,
      password: "",
    })
    setIsAddDialogOpen(true)
  }

  const handleDeleteEmployee = (employee: Employee) => {
    setEmployeeToDelete(employee)
    setIsDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!employeeToDelete) return

    try {
      await axios.delete(`/employees/${employeeToDelete._id}`)
      setEmployees(employees.filter(e => e._id !== employeeToDelete._id))
      setIsDeleteDialogOpen(false)
      setEmployeeToDelete(null)
    } catch (error) {
      console.error("Delete employee error:", error)
    }
  }

  const getStatusBadge = (status: Employee["status"]) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Active</Badge>
      case "inactive":
        return <Badge variant="secondary">Inactive</Badge>
      case "terminated":
        return <Badge variant="destructive">Terminated</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  // Handle form input changes
  const handleFormChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setFormError("")
  }

  // Reset form
  const resetForm = () => {
    setFormData({
      fullName: "",
      email: "",
      phone: "",
      department: "",
      position: "",
      manager: "",
      hireDate: "",
      salary: "",
      status: "active",
      createUserAccount: false,
      password: "",
    })
    setFormError("")
    setIsSubmitting(false)
    setIsEditing(false)
    setCurrentEmployeeId(null)
  }

  // Handle add/edit employee
  const handleSubmit = async () => {
    try {
      setFormError("")
      setIsSubmitting(true)

      if (!formData.fullName || !formData.email || !formData.phone || !formData.department || !formData.position || !formData.hireDate || !formData.salary) {
        setFormError("Please fill in all required fields")
        setIsSubmitting(false)
        return
      }

      const nameParts = formData.fullName.trim().split(" ")
      const firstName = nameParts[0] || ""
      const lastName = nameParts.slice(1).join(" ") || ""

      if (!firstName || !lastName) {
        setFormError("Please enter both first and last name")
        setIsSubmitting(false)
        return
      }

      const employeeData = {
        firstName,
        lastName,
        email: formData.email,
        phone: formData.phone,
        department: formData.department,
        position: formData.position,
        manager: formData.manager || undefined,
        hireDate: formData.hireDate,
        salary: Number.parseFloat(formData.salary),
        status: formData.status,
        createUserAccount: formData.createUserAccount,
        password: formData.password,
        // Include default values for required nested objects if creating new
        ...(!isEditing && {
          address: {
            street: "",
            city: "",
            state: "",
            zipCode: "",
            country: ""
          },
          emergencyContact: {
            name: "",
            relationship: "",
            phone: ""
          },
          bankDetails: {
            accountNumber: "",
            bankName: "",
            routingNumber: ""
          },
          workSchedule: {
            startTime: "09:00",
            endTime: "17:00",
            workDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
          }
        })
      }

      let response
      if (isEditing && currentEmployeeId) {
        response = await axios.put(`/employees/${currentEmployeeId}`, employeeData)
      } else {
        response = await axios.post("/employees", employeeData)
      }

      if (response.data.success) {
        const empRes = await axios.get("/employees")
        const employeesData = empRes.data?.data?.employees || empRes.data?.employees || []
        setEmployees(employeesData)
        setIsAddDialogOpen(false)
        resetForm()
      } else {
        setFormError(response.data.message || `Failed to ${isEditing ? 'update' : 'add'} employee`)
      }
    } catch (error: any) {
      console.error(`${isEditing ? 'Update' : 'Add'} employee error:`, error)
      setFormError(error.response?.data?.message || `Failed to ${isEditing ? 'update' : 'add'} employee. Please try again.`)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Employee Management</h1>
          <p className="text-muted-foreground mt-2">Manage your organization's workforce</p>
        </div>
        <Button onClick={() => {
          resetForm()
          setIsAddDialogOpen(true)
        }}>
          <Plus className="h-4 w-4 mr-2" />
          Add Employee
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{employees.length}</div>
            <p className="text-sm text-muted-foreground">Total Employees</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">
              {employees.filter((e) => e.status === "active").length}
            </div>
            <p className="text-sm text-muted-foreground">Active</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-orange-600">
              {employees.filter((e) => e.status === "inactive").length}
            </div>
            <p className="text-sm text-muted-foreground">Inactive</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">
              {employees.filter((e) => e.status === "terminated").length}
            </div>
            <p className="text-sm text-muted-foreground">Terminated</p>
          </CardContent>
        </Card>
      </div>

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
            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {departmentsList.map((dept) => (
                  <SelectItem key={dept._id} value={dept._id}>
                    {dept.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="terminated">Terminated</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Employees ({filteredEmployees.length})</CardTitle>
          <CardDescription>A list of all employees in your organization</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>ID</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead>Manager</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEmployees.map((employee) => (
                  <TableRow key={employee._id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={employee.avatar || "/placeholder.svg"} alt={employee.firstName} />
                          <AvatarFallback>
                            {(employee.firstName?.[0] || "") + (employee.lastName?.[0] || "")}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{employee.firstName} {employee.lastName}</div>
                          <div className="text-sm text-muted-foreground">{employee.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{employee.employeeId}</TableCell>
                    <TableCell>{employee.department?.name || "-"}</TableCell>
                    <TableCell>{employee.position}</TableCell>
                    <TableCell>
                      {employee.manager
                        ? `${employee.manager.firstName} ${employee.manager.lastName}`
                        : "-"}
                    </TableCell>
                    <TableCell>{getStatusBadge(employee.status)}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleViewEmployee(employee)}>
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEditEmployee(employee)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => handleDeleteEmployee(employee)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
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

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isEditing ? "Edit Employee" : "Add New Employee"}</DialogTitle>
            <DialogDescription>
              {isEditing
                ? "Update the employee's information below."
                : "Enter the employee's information to add them to the system."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                placeholder="John Doe"
                value={formData.fullName}
                onChange={(e) => handleFormChange("fullName", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="john.doe@company.com"
                value={formData.email}
                onChange={(e) => handleFormChange("email", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone *</Label>
              <Input
                id="phone"
                placeholder="+1 (555) 123-4567"
                value={formData.phone}
                onChange={(e) => handleFormChange("phone", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="department">Department *</Label>
              <Select value={formData.department} onValueChange={(value) => handleFormChange("department", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {departmentsList.map((dept) => (
                    <SelectItem key={dept._id} value={dept._id}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="position">Position *</Label>
              <Select value={formData.position} onValueChange={(value) => handleFormChange("position", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select position" />
                </SelectTrigger>
                <SelectContent>
                  {positions.map((pos) => (
                    <SelectItem key={pos} value={pos}>
                      {pos}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="manager">Manager</Label>
              <Select value={formData.manager} onValueChange={(value) => handleFormChange("manager", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select manager" />
                </SelectTrigger>
                <SelectContent>
                  {managersList.map((mgr) => (
                    <SelectItem key={mgr._id} value={mgr._id}>
                      {mgr.firstName} {mgr.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="hireDate">Hire Date *</Label>
              <Input
                id="hireDate"
                type="date"
                value={formData.hireDate}
                onChange={(e) => handleFormChange("hireDate", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="salary">Salary *</Label>
              <Input
                id="salary"
                type="number"
                placeholder="75000"
                value={formData.salary}
                onChange={(e) => handleFormChange("salary", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => handleFormChange("status", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  {isEditing && <SelectItem value="terminated">Terminated</SelectItem>}
                </SelectContent>
              </Select>
            </div>

            {!isEditing && (
              <div className="col-span-1 md:col-span-2 space-y-4 border-t pt-4 mt-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="createUserAccount"
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    checked={formData.createUserAccount}
                    onChange={(e) => handleFormChange("createUserAccount", e.target.checked)}
                  />
                  <Label htmlFor="createUserAccount" className="cursor-pointer">Create User Account for this Employee</Label>
                </div>

                {formData.createUserAccount && (
                  <div className="space-y-2">
                    <Label htmlFor="password">Password (Optional)</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Default: Password@123"
                      value={formData.password}
                      onChange={(e) => handleFormChange("password", e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      If left blank, the default password will be <strong>Password@123</strong>
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
          {formError && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-3">
              {formError}
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsAddDialogOpen(false)
                resetForm()
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (isEditing ? "Updating..." : "Adding...") : (isEditing ? "Update Employee" : "Add Employee")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedEmployee && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={selectedEmployee.avatar || "/placeholder.svg"} alt={selectedEmployee.firstName} />
                    <AvatarFallback>
                      {(selectedEmployee.firstName?.[0] || "") + (selectedEmployee.lastName?.[0] || "")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="text-xl font-bold">{selectedEmployee.firstName} {selectedEmployee.lastName}</div>
                    <div className="text-sm text-muted-foreground">{selectedEmployee.position}</div>
                  </div>
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-6 py-4">
                <div>
                  <h3 className="text-lg font-semibold mb-3">Basic Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{selectedEmployee.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{selectedEmployee.phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Hired: {new Date(selectedEmployee.hireDate).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">Status: {getStatusBadge(selectedEmployee.status)}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">Work Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Employee ID:</span> {selectedEmployee.employeeId}
                    </div>
                    <div>
                      <span className="font-medium">Department:</span> {selectedEmployee.department?.name || "-"}
                    </div>
                    <div>
                      <span className="font-medium">Position:</span> {selectedEmployee.position}
                    </div>
                    <div>
                      <span className="font-medium">Manager:</span> {selectedEmployee.manager ? `${selectedEmployee.manager.firstName} ${selectedEmployee.manager.lastName}` : "-"}
                    </div>
                    <div>
                      <span className="font-medium">Salary:</span> ${selectedEmployee.salary?.toLocaleString()}
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">Address</h3>
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div className="text-sm">
                      <div>{selectedEmployee.address?.street}</div>
                      <div>
                        {selectedEmployee.address?.city}, {selectedEmployee.address?.state}{" "}
                        {selectedEmployee.address?.zipCode}
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">Emergency Contact</h3>
                  <div className="text-sm space-y-1">
                    <div>
                      <span className="font-medium">Name:</span> {selectedEmployee.emergencyContact?.name}
                    </div>
                    <div>
                      <span className="font-medium">Relationship:</span>{" "}
                      {selectedEmployee.emergencyContact?.relationship}
                    </div>
                    <div>
                      <span className="font-medium">Phone:</span> {selectedEmployee.emergencyContact?.phone}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Employee</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {employeeToDelete?.firstName} {employeeToDelete?.lastName}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
