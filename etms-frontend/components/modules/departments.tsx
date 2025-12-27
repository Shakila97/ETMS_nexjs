"use client"

import { useState, useEffect } from "react"
import axios from "@/lib/axios"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Search, Plus, MoreHorizontal, Edit, Trash2, Eye, Users, DollarSign, MapPin } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import type { User } from "@/lib/auth"

interface DepartmentsModuleProps {
    user: User
}

interface Department {
    _id: string
    name: string
    description?: string
    manager?: {
        _id: string
        firstName: string
        lastName: string
        employeeId: string
    }
    budget?: number
    location?: string
    isActive: boolean
    employeeCount?: number
    createdAt: string
}

export function DepartmentsModule({ user }: DepartmentsModuleProps) {
    const [departments, setDepartments] = useState<Department[]>([])
    const [managersList, setManagersList] = useState<{ _id: string; firstName: string; lastName: string }[]>([])

    // Fetch departments and managers on mount
    useEffect(() => {
        fetchDepartments()
        fetchManagers()
    }, [])

    const fetchDepartments = async () => {
        try {
            const response = await axios.get("/departments")
            const departmentsData = response.data?.data?.departments || response.data?.departments || []
            setDepartments(departmentsData)
        } catch (err) {
            console.error("Failed to fetch departments:", err)
        }
    }

    const fetchManagers = async () => {
        try {
            const response = await axios.get("/employees?role=manager")
            const managersData = (response.data?.data?.employees || response.data?.employees || []).map((m: any) => ({
                _id: m._id,
                firstName: m.firstName,
                lastName: m.lastName,
            }))
            setManagersList(managersData)
        } catch (err) {
            console.error("Failed to fetch managers:", err)
        }
    }

    const [searchTerm, setSearchTerm] = useState("")
    const [statusFilter, setStatusFilter] = useState("all")
    const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null)
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
    const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

    // Form state for adding department
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        manager: "",
        budget: "",
        location: "",
    })
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [formError, setFormError] = useState("")

    // Filter departments based on search and filters
    const filteredDepartments = departments.filter((department) => {
        const matchesSearch =
            department.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (department.description || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
            (department.location || "").toLowerCase().includes(searchTerm.toLowerCase())

        const matchesStatus = statusFilter === "all" ||
            (statusFilter === "active" && department.isActive) ||
            (statusFilter === "inactive" && !department.isActive)

        return matchesSearch && matchesStatus
    })

    const handleViewDepartment = (department: Department) => {
        setSelectedDepartment(department)
        setIsViewDialogOpen(true)
    }

    const handleDeleteClick = (department: Department) => {
        setSelectedDepartment(department)
        setIsDeleteDialogOpen(true)
    }

    const handleFormChange = (field: string, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }))
        setFormError("")
    }

    const resetForm = () => {
        setFormData({
            name: "",
            description: "",
            manager: "",
            budget: "",
            location: "",
        })
        setFormError("")
        setIsSubmitting(false)
    }

    const handleAddDepartment = async () => {
        try {
            setFormError("")
            setIsSubmitting(true)

            // Validate required fields
            if (!formData.name) {
                setFormError("Department name is required")
                setIsSubmitting(false)
                return
            }

            // Prepare department data
            const departmentData: any = {
                name: formData.name,
                description: formData.description || undefined,
                manager: formData.manager || undefined,
                location: formData.location || undefined,
            }

            if (formData.budget) {
                departmentData.budget = Number.parseFloat(formData.budget)
            }

            // Submit to API
            const response = await axios.post("/departments", departmentData)

            if (response.data.success) {
                // Refresh department list
                await fetchDepartments()

                // Close dialog and reset form
                setIsAddDialogOpen(false)
                resetForm()
            } else {
                setFormError(response.data.message || "Failed to add department")
            }
        } catch (error: any) {
            console.error("Add department error:", error)
            setFormError(error.response?.data?.message || "Failed to add department. Please try again.")
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleDeleteDepartment = async () => {
        if (!selectedDepartment) return

        try {
            setIsSubmitting(true)
            const response = await axios.delete(`/departments/${selectedDepartment._id}`)

            if (response.data.success) {
                // Refresh department list
                await fetchDepartments()
                setIsDeleteDialogOpen(false)
                setSelectedDepartment(null)
            } else {
                setFormError(response.data.message || "Failed to delete department")
            }
        } catch (error: any) {
            console.error("Delete department error:", error)
            setFormError(error.response?.data?.message || "Failed to delete department. Please try again.")
        } finally {
            setIsSubmitting(false)
        }
    }

    const getStatusBadge = (isActive: boolean) => {
        return isActive ? (
            <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Active</Badge>
        ) : (
            <Badge variant="secondary">Inactive</Badge>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Department Management</h1>
                    <p className="text-muted-foreground mt-2">Manage your organization's departments</p>
                </div>
                <Button onClick={() => setIsAddDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Department
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardContent className="p-4">
                        <div className="text-2xl font-bold">{departments.length}</div>
                        <p className="text-sm text-muted-foreground">Total Departments</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="text-2xl font-bold text-green-600">
                            {departments.filter((d) => d.isActive).length}
                        </div>
                        <p className="text-sm text-muted-foreground">Active</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="text-2xl font-bold text-orange-600">
                            {departments.filter((d) => !d.isActive).length}
                        </div>
                        <p className="text-sm text-muted-foreground">Inactive</p>
                    </CardContent>
                </Card>
            </div>

            {/* Filters and Search */}
            <Card>
                <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-1">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search departments..."
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
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="inactive">Inactive</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Department Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Departments ({filteredDepartments.length})</CardTitle>
                    <CardDescription>A list of all departments in your organization</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Manager</TableHead>
                                    <TableHead>Employees</TableHead>
                                    <TableHead>Budget</TableHead>
                                    <TableHead>Location</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredDepartments.map((department) => (
                                    <TableRow key={department._id}>
                                        <TableCell>
                                            <div>
                                                <div className="font-medium">{department.name}</div>
                                                {department.description && (
                                                    <div className="text-sm text-muted-foreground truncate max-w-xs">
                                                        {department.description}
                                                    </div>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {department.manager
                                                ? `${department.manager.firstName} ${department.manager.lastName}`
                                                : "-"}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1">
                                                <Users className="h-4 w-4 text-muted-foreground" />
                                                <span>{department.employeeCount || 0}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {department.budget ? (
                                                <div className="flex items-center gap-1">
                                                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                                                    <span>{department.budget.toLocaleString()}</span>
                                                </div>
                                            ) : (
                                                "-"
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {department.location ? (
                                                <div className="flex items-center gap-1">
                                                    <MapPin className="h-4 w-4 text-muted-foreground" />
                                                    <span>{department.location}</span>
                                                </div>
                                            ) : (
                                                "-"
                                            )}
                                        </TableCell>
                                        <TableCell>{getStatusBadge(department.isActive)}</TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="sm">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => handleViewDepartment(department)}>
                                                        <Eye className="h-4 w-4 mr-2" />
                                                        View Details
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteClick(department)}>
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

            {/* Add Department Dialog */}
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Add New Department</DialogTitle>
                        <DialogDescription>Enter the department information to add it to the system.</DialogDescription>
                    </DialogHeader>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
                        <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="name">Department Name *</Label>
                            <Input
                                id="name"
                                placeholder="Engineering"
                                value={formData.name}
                                onChange={(e) => handleFormChange("name", e.target.value)}
                            />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                placeholder="Department description..."
                                value={formData.description}
                                onChange={(e) => handleFormChange("description", e.target.value)}
                                rows={3}
                            />
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
                            <Label htmlFor="budget">Budget</Label>
                            <Input
                                id="budget"
                                type="number"
                                placeholder="100000"
                                value={formData.budget}
                                onChange={(e) => handleFormChange("budget", e.target.value)}
                            />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="location">Location</Label>
                            <Input
                                id="location"
                                placeholder="Floor 3, Building A"
                                value={formData.location}
                                onChange={(e) => handleFormChange("location", e.target.value)}
                            />
                        </div>
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
                        <Button onClick={handleAddDepartment} disabled={isSubmitting}>
                            {isSubmitting ? "Adding..." : "Add Department"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* View Department Dialog */}
            <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    {selectedDepartment && (
                        <>
                            <DialogHeader>
                                <DialogTitle className="text-xl font-bold">{selectedDepartment.name}</DialogTitle>
                                <DialogDescription>Department Details</DialogDescription>
                            </DialogHeader>

                            <div className="space-y-6 py-4">
                                {/* Basic Information */}
                                <div>
                                    <h3 className="text-lg font-semibold mb-3">Basic Information</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <span className="font-medium">Status:</span> {getStatusBadge(selectedDepartment.isActive)}
                                        </div>
                                        <div>
                                            <span className="font-medium">Employees:</span> {selectedDepartment.employeeCount || 0}
                                        </div>
                                        {selectedDepartment.manager && (
                                            <div>
                                                <span className="font-medium">Manager:</span>{" "}
                                                {selectedDepartment.manager.firstName} {selectedDepartment.manager.lastName}
                                            </div>
                                        )}
                                        {selectedDepartment.budget && (
                                            <div>
                                                <span className="font-medium">Budget:</span> ${selectedDepartment.budget.toLocaleString()}
                                            </div>
                                        )}
                                        {selectedDepartment.location && (
                                            <div className="md:col-span-2">
                                                <span className="font-medium">Location:</span> {selectedDepartment.location}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Description */}
                                {selectedDepartment.description && (
                                    <div>
                                        <h3 className="text-lg font-semibold mb-3">Description</h3>
                                        <p className="text-sm text-muted-foreground">{selectedDepartment.description}</p>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Department</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete "{selectedDepartment?.name}"? This action cannot be undone.
                            {selectedDepartment && selectedDepartment.employeeCount && selectedDepartment.employeeCount > 0 && (
                                <div className="mt-2 text-red-600">
                                    Warning: This department has {selectedDepartment.employeeCount} active employee(s). You must reassign them first.
                                </div>
                            )}
                        </DialogDescription>
                    </DialogHeader>
                    {formError && (
                        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-3">
                            {formError}
                        </div>
                    )}
                    <div className="flex justify-end gap-2">
                        <Button
                            variant="outline"
                            onClick={() => {
                                setIsDeleteDialogOpen(false)
                                setFormError("")
                            }}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleDeleteDepartment} disabled={isSubmitting}>
                            {isSubmitting ? "Deleting..." : "Delete"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
