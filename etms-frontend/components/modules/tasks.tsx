"use client"

import { useState, useEffect, useCallback } from "react"
import axios from "axios"
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
  Clock,
  CheckCircle,
  AlertCircle,
  Eye,
  Edit,
  Trash2,
  MoreHorizontal,
  Users,
  Target,
  TrendingUp,
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  mockProjects,
  priorityColors,
  statusColors,
  projectStatusColors,
  type Task,
  type Project,
} from "@/lib/task-data"
import type { User } from "@/lib/auth"
import { cn } from "@/lib/utils"

interface Employee {
  _id: string
  firstName: string
  lastName: string
  employeeId: string
}

interface TasksModuleProps {
  user: User
}

export function TasksModule({ user }: TasksModuleProps) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [priorityFilter, setPriorityFilter] = useState("all")
  const [projectFilter, setProjectFilter] = useState("all")
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false)
  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)

  // Project Form State
  const [projectFormData, setProjectFormData] = useState({
    name: "",
    description: "",
    manager: "",
    status: "planning",
    startDate: "",
    endDate: "",
  })
  const [isViewTaskOpen, setIsViewTaskOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    assignedTo: "",
    priority: "medium",
    project: "",
    dueDate: "",
    estimatedHours: "",
    tags: "",
    status: "todo"
  })

  const fetchTasks = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await axios.get("/tasks")
      // Transform API data to match Task interface if needed
      // The API returns _id, but interface expects id. We map it.
      const mappedTasks = response.data.data.tasks.map((task: any) => ({
        ...task,
        id: task._id,
        assignedToName: task.assignedTo ? `${task.assignedTo.firstName} ${task.assignedTo.lastName}` : "Unassigned",
        assignedByName: task.assignedBy ? `${task.assignedBy.firstName} ${task.assignedBy.lastName}` : "Unknown",
        project: task.project ? task.project.name : "General",
        projectId: task.project ? task.project._id : null,
        tags: task.tags || [],
        comments: task.comments || []
      }))
      setTasks(mappedTasks)
    } catch (error) {
      console.error("Failed to fetch tasks:", error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const fetchEmployees = useCallback(async () => {
    try {
      const response = await axios.get("/employees")
      setEmployees(response.data.data.employees)
    } catch (error) {
      console.error("Failed to fetch employees:", error)
    }
  }, [])

  const fetchProjects = useCallback(async () => {
    try {
      const response = await axios.get("/projects")
      const mappedProjects = response.data.data.projects.map((p: any) => ({
        ...p,
        id: p._id,
        managerName: p.manager ? `${p.manager.firstName} ${p.manager.lastName}` : "Unknown",
        teamMembers: p.teamMembers ? p.teamMembers.map((tm: any) => tm._id) : []
      }))
      setProjects(mappedProjects)
    } catch (error) {
      console.error("Failed to fetch projects:", error)
    }
  }, [])

  useEffect(() => {
    fetchTasks()
    fetchEmployees()
    fetchProjects()
  }, [fetchTasks, fetchEmployees, fetchProjects])

  // Filter tasks based on search and filters
  const filteredTasks = tasks.filter((task) => {
    const matchesSearch =
      task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.assignedToName.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || task.status === statusFilter
    const matchesPriority = priorityFilter === "all" || task.priority === priorityFilter
    const matchesProject = projectFilter === "all" || task.project === projectFilter

    return matchesSearch && matchesStatus && matchesPriority && matchesProject
  })

  // Calculate summary stats
  const taskStats = {
    total: tasks.length,
    todo: tasks.filter((t) => t.status === "todo" || t.status === "pending").length,
    inProgress: tasks.filter((t) => t.status === "in-progress").length,
    review: tasks.filter((t) => t.status === "review").length,
    completed: tasks.filter((t) => t.status === "completed").length,
    overdue: tasks.filter((t) => new Date(t.dueDate) < new Date() && t.status !== "completed").length,
  }

  const handleViewTask = (task: Task) => {
    setSelectedTask(task)
    setIsViewTaskOpen(true)
  }

  const handleUpdateTaskStatus = async (taskId: string, newStatus: Task["status"]) => {
    try {
      await axios.put(`/tasks/${taskId}/status`, { status: newStatus })
      fetchTasks() // Refresh list
    } catch (error) {
      console.error("Failed to update task status:", error)
    }
  }

  const getPriorityBadge = (priority: Task["priority"]) => {
    const colorClass = priorityColors[priority]
    return (
      <Badge className={cn("flex items-center gap-1", colorClass)} variant="outline">
        {priority === "urgent" && <AlertCircle className="h-3 w-3" />}
        {priority.charAt(0).toUpperCase() + priority.slice(1)}
      </Badge>
    )
  }

  const getStatusBadge = (status: Task["status"]) => {
    const colorClass = statusColors[status]
    const icon =
      status === "completed" ? (
        <CheckCircle className="h-3 w-3" />
      ) : status === "in-progress" ? (
        <Clock className="h-3 w-3" />
      ) : (
        <AlertCircle className="h-3 w-3" />
      )

    return (
      <Badge className={cn("flex items-center gap-1", colorClass)} variant="outline">
        {icon}
        {status.charAt(0).toUpperCase() + status.slice(1).replace("-", " ")}
      </Badge>
    )
  }

  const getProjectStatusBadge = (status: Project["status"]) => {
    const colorClass = projectStatusColors[status]
    return (
      <Badge className={cn("flex items-center gap-1", colorClass)} variant="outline">
        {status.charAt(0).toUpperCase() + status.slice(1).replace("-", " ")}
      </Badge>
    )
  }

  const handleEditTask = (task: Task) => {
    setIsEditing(true)
    setSelectedTask(task)
    setFormData({
      title: task.title,
      description: task.description,
      assignedTo: (task as any).assignedTo?._id || "", // Handle populated object
      priority: task.priority,
      project: (task as any).projectId || "",
      dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : "",
      estimatedHours: task.estimatedHours.toString(),
      tags: task.tags.join(", "),
      status: task.status
    })
    setIsCreateTaskOpen(true)
  }

  const handleCreateProject = async () => {
    try {
      await axios.post("/projects", projectFormData)
      setIsCreateProjectOpen(false)
      fetchProjects()
      // Reset form
      setProjectFormData({
        name: "",
        description: "",
        manager: "",
        status: "planning",
        startDate: "",
        endDate: "",
      })
    } catch (error) {
      console.error("Failed to create project:", error)
    }
  }

  const handleDeleteTask = async (taskId: string) => {
    if (confirm("Are you sure you want to delete this task?")) {
      try {
        await axios.delete(`/tasks/${taskId}`)
        fetchTasks()
      } catch (error) {
        console.error("Failed to delete task:", error)
      }
    }
  }

  const handleSubmit = async () => {
    try {
      const payload = {
        ...formData,
        estimatedHours: Number(formData.estimatedHours),
        // Map status 'todo' to 'pending' if API expects 'pending'
        status: formData.status === 'todo' ? 'pending' : formData.status
      }

      if (isEditing && selectedTask) {
        await axios.put(`/tasks/${selectedTask.id}`, payload)
      } else {
        await axios.post("/tasks", payload)
      }

      setIsCreateTaskOpen(false)
      fetchTasks()
      resetForm()
    } catch (error) {
      console.error("Failed to save task:", error)
    }
  }

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      assignedTo: "",
      priority: "medium",
      project: "",
      dueDate: "",
      estimatedHours: "",
      tags: "",
      status: "todo"
    })
    setIsEditing(false)
    setSelectedTask(null)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Task Management</h1>
          <p className="text-muted-foreground mt-2">Manage tasks and projects across your organization</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsCreateProjectOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Project
          </Button>
          <Button onClick={() => {
            resetForm()
            setIsCreateTaskOpen(true)
          }}>
            <Plus className="h-4 w-4 mr-2" />
            New Task
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-blue-600" />
              <div>
                <div className="text-2xl font-bold">{taskStats.total}</div>
                <p className="text-sm text-muted-foreground">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-gray-600" />
              <div>
                <div className="text-2xl font-bold text-gray-600">{taskStats.todo}</div>
                <p className="text-sm text-muted-foreground">To Do</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              <div>
                <div className="text-2xl font-bold text-blue-600">{taskStats.inProgress}</div>
                <p className="text-sm text-muted-foreground">In Progress</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-purple-600" />
              <div>
                <div className="text-2xl font-bold text-purple-600">{taskStats.review}</div>
                <p className="text-sm text-muted-foreground">Review</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <div>
                <div className="text-2xl font-bold text-green-600">{taskStats.completed}</div>
                <p className="text-sm text-muted-foreground">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <div>
                <div className="text-2xl font-bold text-red-600">{taskStats.overdue}</div>
                <p className="text-sm text-muted-foreground">Overdue</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="tasks" className="space-y-4">
        <TabsList>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
        </TabsList>

        <TabsContent value="tasks" className="space-y-4">
          {/* Task Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search tasks..."
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
                    <SelectItem value="todo">To Do</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="review">Review</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                  <SelectTrigger className="w-full sm:w-32">
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priority</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={projectFilter} onValueChange={setProjectFilter}>
                  <SelectTrigger className="w-full sm:w-40">
                    <SelectValue placeholder="Project" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Projects</SelectItem>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.name}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Tasks Table */}
          <Card>
            <CardHeader>
              <CardTitle>Tasks ({filteredTasks.length})</CardTitle>
              <CardDescription>All tasks across projects</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Task</TableHead>
                      <TableHead>Assigned To</TableHead>
                      <TableHead>Project</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Progress</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8">
                          Loading tasks...
                        </TableCell>
                      </TableRow>
                    ) : filteredTasks.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8">
                          No tasks found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredTasks.map((task) => {
                        const isOverdue = new Date(task.dueDate) < new Date() && task.status !== "completed"
                        const progressPercentage = task.actualHours
                          ? Math.min((task.actualHours / task.estimatedHours) * 100, 100)
                          : 0

                        return (
                          <TableRow key={task.id}>
                            <TableCell>
                              <div>
                                <div className="font-medium">{task.title}</div>
                                <div className="text-sm text-muted-foreground truncate max-w-48">{task.description}</div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Avatar className="h-6 w-6">
                                  <AvatarImage src="/placeholder.svg" alt={task.assignedToName} />
                                  <AvatarFallback className="text-xs">
                                    {task.assignedToName
                                      .split(" ")
                                      .map((n) => n[0])
                                      .join("")}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="text-sm">{task.assignedToName}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{task.project}</Badge>
                            </TableCell>
                            <TableCell>{getPriorityBadge(task.priority)}</TableCell>
                            <TableCell>{getStatusBadge(task.status)}</TableCell>
                            <TableCell>
                              <div className={cn("text-sm", isOverdue && "text-red-600 font-medium")}>
                                {new Date(task.dueDate).toLocaleDateString()}
                                {isOverdue && <div className="text-xs">Overdue</div>}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Progress value={progressPercentage} className="w-16 h-2" />
                                <span className="text-xs text-muted-foreground">{Math.round(progressPercentage)}%</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => handleViewTask(task)}>
                                    <Eye className="h-4 w-4 mr-2" />
                                    View Details
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleEditTask(task)}>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit Task
                                  </DropdownMenuItem>
                                  {task.status !== "completed" && (
                                    <DropdownMenuItem onClick={() => handleUpdateTaskStatus(task.id, "completed")}>
                                      <CheckCircle className="h-4 w-4 mr-2" />
                                      Mark Complete
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteTask(task.id)}>
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        )
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="projects" className="space-y-4">
          {/* Projects Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <Card key={project.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{project.name}</CardTitle>
                      <CardDescription className="mt-1">{project.description}</CardDescription>
                    </div>
                    {getProjectStatusBadge(project.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span>Progress</span>
                        <span>{project.progress}%</span>
                      </div>
                      <Progress value={project.progress} className="h-2" />
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Manager</span>
                        <div className="font-medium">{project.managerName}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Team Size</span>
                        <div className="font-medium">{project.teamMembers.length} members</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Start Date</span>
                        <div className="font-medium">{new Date(project.startDate).toLocaleDateString()}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">End Date</span>
                        <div className="font-medium">{new Date(project.endDate).toLocaleDateString()}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <div className="flex -space-x-2">
                        {project.teamMembers.slice(0, 3).map((memberId, index) => (
                          <Avatar key={memberId} className="h-6 w-6 border-2 border-background">
                            <AvatarImage src="/placeholder.svg" />
                            <AvatarFallback className="text-xs">{memberId.replace("EMP", "")}</AvatarFallback>
                          </Avatar>
                        ))}
                        {project.teamMembers.length > 3 && (
                          <div className="h-6 w-6 rounded-full bg-muted border-2 border-background flex items-center justify-center text-xs">
                            +{project.teamMembers.length - 3}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Create/Edit Task Dialog */}
      <Dialog open={isCreateTaskOpen} onOpenChange={setIsCreateTaskOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isEditing ? "Edit Task" : "Create New Task"}</DialogTitle>
            <DialogDescription>{isEditing ? "Update task details" : "Add a new task to your project"}</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="title">Task Title</Label>
              <Input
                id="title"
                placeholder="Enter task title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe the task..."
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="assignee">Assign To</Label>
              <Select
                value={formData.assignedTo}
                onValueChange={(value) => setFormData({ ...formData, assignedTo: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select assignee" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((emp) => (
                    <SelectItem key={emp._id} value={emp._id}>
                      {emp.firstName} {emp.lastName} ({emp.employeeId})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="project">Project</Label>
              <Select
                value={formData.project}
                onValueChange={(value) => setFormData({ ...formData, project: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) => setFormData({ ...formData, priority: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="dueDate">Due Date</Label>
              <Input
                id="dueDate"
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="estimatedHours">Estimated Hours</Label>
              <Input
                id="estimatedHours"
                type="number"
                placeholder="8"
                value={formData.estimatedHours}
                onChange={(e) => setFormData({ ...formData, estimatedHours: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tags">Tags</Label>
              <Input
                id="tags"
                placeholder="frontend, ui, design"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              />
            </div>
            {isEditing && (
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todo">To Do</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="review">Review</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsCreateTaskOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>
              {isEditing ? "Update Task" : "Create Task"}
            </Button>
          </div>
        </DialogContent>
      </Dialog >

      {/* Create Project Dialog */}
      < Dialog open={isCreateProjectOpen} onOpenChange={setIsCreateProjectOpen} >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
            <DialogDescription>Start a new project for your team</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="projectName">Project Name</Label>
              <Input id="projectName" placeholder="Enter project name" value={projectFormData.name} onChange={(e) => setProjectFormData({ ...projectFormData, name: e.target.value })} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="projectDescription">Description</Label>
              <Textarea id="projectDescription" placeholder="Describe the project..." rows={3} value={projectFormData.description} onChange={(e) => setProjectFormData({ ...projectFormData, description: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="manager">Project Manager</Label>
              <Select value={projectFormData.manager} onValueChange={(value) => setProjectFormData({ ...projectFormData, manager: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select manager" />
                </SelectTrigger>
                <SelectContent>
                  {employees.length > 0 ? employees.map(emp => (
                    <SelectItem key={emp._id} value={emp._id}>{emp.firstName} {emp.lastName}</SelectItem>
                  )) : (
                    <SelectItem value="none" disabled>No employees found</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={projectFormData.status} onValueChange={(value) => setProjectFormData({ ...projectFormData, status: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="planning">Planning</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="on-hold">On Hold</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input id="startDate" type="date" value={projectFormData.startDate} onChange={(e) => setProjectFormData({ ...projectFormData, startDate: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input id="endDate" type="date" value={projectFormData.endDate} onChange={(e) => setProjectFormData({ ...projectFormData, endDate: e.target.value })} />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsCreateProjectOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateProject}>Create Project</Button>
          </div>
        </DialogContent>
      </Dialog >

      {/* View Task Dialog */}
      < Dialog open={isViewTaskOpen} onOpenChange={setIsViewTaskOpen} >
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {selectedTask && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl">{selectedTask.title}</DialogTitle>
                <DialogDescription>{selectedTask.description}</DialogDescription>
              </DialogHeader>

              <div className="space-y-6 py-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Status</Label>
                    <div className="mt-1">{getStatusBadge(selectedTask.status)}</div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Priority</Label>
                    <div className="mt-1">{getPriorityBadge(selectedTask.priority)}</div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Project</Label>
                    <div className="mt-1">
                      <Badge variant="outline">{selectedTask.project}</Badge>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Due Date</Label>
                    <div className="mt-1 font-medium">{new Date(selectedTask.dueDate).toLocaleDateString()}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Assigned To</Label>
                    <div className="mt-1 flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src="/placeholder.svg" alt={selectedTask.assignedToName} />
                        <AvatarFallback className="text-xs">
                          {selectedTask.assignedToName
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{selectedTask.assignedToName}</span>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Assigned By</Label>
                    <div className="mt-1 font-medium">{selectedTask.assignedByName}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Estimated Hours</Label>
                    <div className="mt-1 font-medium">{selectedTask.estimatedHours}h</div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Actual Hours</Label>
                    <div className="mt-1 font-medium">{selectedTask.actualHours || 0}h</div>
                  </div>
                </div>

                {selectedTask.tags.length > 0 && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Tags</Label>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {selectedTask.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {selectedTask.comments.length > 0 && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Comments</Label>
                    <div className="mt-2 space-y-3">
                      {selectedTask.comments.map((comment) => (
                        <div key={comment.id} className="border rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-2">
                            <Avatar className="h-6 w-6">
                              <AvatarImage src="/placeholder.svg" alt={comment.authorName} />
                              <AvatarFallback className="text-xs">
                                {comment.authorName
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium text-sm">{comment.authorName}</span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(comment.createdDate).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-sm">{comment.content}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog >
    </div >
  )
}
