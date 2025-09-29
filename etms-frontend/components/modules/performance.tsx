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
import { Search, Plus, Star, Target, Eye, Calendar, Award, BarChart3, Users } from "lucide-react"
import {
  mockPerformanceReviews,
  mockGoals,
  mockPerformanceMetrics,
  getStatusColor,
  getTrendColor,
  getTrendIcon,
  type PerformanceReview,
  type Goal,
  type PerformanceMetrics,
} from "@/lib/performance-data"
import type { User } from "@/lib/auth"
import { cn } from "@/lib/utils"

interface PerformanceModuleProps {
  user: User
}

export function PerformanceModule({ user }: PerformanceModuleProps) {
  const [reviews, setReviews] = useState<PerformanceReview[]>(mockPerformanceReviews)
  const [goals, setGoals] = useState<Goal[]>(mockGoals)
  const [metrics, setMetrics] = useState<PerformanceMetrics[]>(mockPerformanceMetrics)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [isCreateReviewOpen, setIsCreateReviewOpen] = useState(false)
  const [isCreateGoalOpen, setIsCreateGoalOpen] = useState(false)
  const [selectedReview, setSelectedReview] = useState<PerformanceReview | null>(null)
  const [isViewReviewOpen, setIsViewReviewOpen] = useState(false)

  // Filter reviews based on search and filters
  const filteredReviews = reviews.filter((review) => {
    const matchesSearch = review.employeeName.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || review.status === statusFilter
    return matchesSearch && matchesStatus
  })

  // Calculate summary stats
  const summaryStats = {
    totalReviews: reviews.length,
    completedReviews: reviews.filter((r) => r.status === "completed").length,
    pendingReviews: reviews.filter((r) => r.status === "in-progress").length,
    averageRating: reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.overallRating, 0) / reviews.length : 0,
    totalGoals: goals.length,
    completedGoals: goals.filter((g) => g.status === "completed").length,
    inProgressGoals: goals.filter((g) => g.status === "in-progress").length,
  }

  const handleViewReview = (review: PerformanceReview) => {
    setSelectedReview(review)
    setIsViewReviewOpen(true)
  }

  const getRatingStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={cn("h-4 w-4", i < Math.floor(rating) ? "fill-yellow-400 text-yellow-400" : "text-gray-300")}
      />
    ))
  }

  const getStatusBadge = (status: Goal["status"]) => {
    const colorClass = getStatusColor(status)
    return (
      <Badge className={cn("flex items-center gap-1", colorClass)} variant="outline">
        {status.charAt(0).toUpperCase() + status.slice(1).replace("-", " ")}
      </Badge>
    )
  }

  const getReviewStatusBadge = (status: PerformanceReview["status"]) => {
    const colors = {
      draft: "bg-gray-100 text-gray-800",
      "in-progress": "bg-blue-100 text-blue-800",
      completed: "bg-green-100 text-green-800",
      approved: "bg-purple-100 text-purple-800",
    }
    return (
      <Badge className={cn("flex items-center gap-1", colors[status])} variant="outline">
        {status.charAt(0).toUpperCase() + status.slice(1).replace("-", " ")}
      </Badge>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Performance Monitoring</h1>
          <p className="text-muted-foreground mt-2">Track employee performance, reviews, and goals</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsCreateGoalOpen(true)}>
            <Target className="h-4 w-4 mr-2" />
            New Goal
          </Button>
          <Button onClick={() => setIsCreateReviewOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Review
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-blue-600" />
              <div>
                <div className="text-2xl font-bold">{summaryStats.averageRating.toFixed(1)}</div>
                <p className="text-sm text-muted-foreground">Avg Rating</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-green-600" />
              <div>
                <div className="text-2xl font-bold text-green-600">{summaryStats.completedReviews}</div>
                <p className="text-sm text-muted-foreground">Reviews Done</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-orange-600" />
              <div>
                <div className="text-2xl font-bold text-orange-600">{summaryStats.pendingReviews}</div>
                <p className="text-sm text-muted-foreground">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Award className="h-4 w-4 text-purple-600" />
              <div>
                <div className="text-2xl font-bold text-purple-600">{summaryStats.completedGoals}</div>
                <p className="text-sm text-muted-foreground">Goals Achieved</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="reviews">Reviews</TabsTrigger>
          <TabsTrigger value="goals">Goals</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Performance Metrics */}
          <Card>
            <CardHeader>
              <CardTitle>Employee Performance Overview</CardTitle>
              <CardDescription>Current performance metrics for all employees</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Current Rating</TableHead>
                      <TableHead>Trend</TableHead>
                      <TableHead>Goals Progress</TableHead>
                      <TableHead>Reviews</TableHead>
                      <TableHead>Last Review</TableHead>
                      <TableHead>Next Review</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {metrics.map((metric) => (
                      <TableRow key={metric.employeeId}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src="/placeholder.svg" alt={metric.employeeName} />
                              <AvatarFallback>
                                {metric.employeeName
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{metric.employeeName}</div>
                              <div className="text-sm text-muted-foreground">{metric.employeeId}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="flex">{getRatingStars(metric.currentRating)}</div>
                            <span className="font-medium">{metric.currentRating.toFixed(1)}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className={cn("flex items-center gap-1 font-medium", getTrendColor(metric.trend))}>
                            <span>{getTrendIcon(metric.trend)}</span>
                            <span className="capitalize">{metric.trend}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress value={(metric.completedGoals / metric.totalGoals) * 100} className="w-16 h-2" />
                            <span className="text-sm text-muted-foreground">
                              {metric.completedGoals}/{metric.totalGoals}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{metric.reviewsCompleted}</Badge>
                        </TableCell>
                        <TableCell>{new Date(metric.lastReviewDate).toLocaleDateString()}</TableCell>
                        <TableCell>{new Date(metric.nextReviewDate).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reviews" className="space-y-4">
          {/* Review Filters */}
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
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Reviews Table */}
          <Card>
            <CardHeader>
              <CardTitle>Performance Reviews ({filteredReviews.length})</CardTitle>
              <CardDescription>All performance reviews and evaluations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Review Period</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Rating</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Reviewer</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredReviews.map((review) => (
                      <TableRow key={review.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src="/placeholder.svg" alt={review.employeeName} />
                              <AvatarFallback>
                                {review.employeeName
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{review.employeeName}</div>
                              <div className="text-sm text-muted-foreground">{review.employeeId}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{review.reviewPeriod}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{review.reviewType.replace("-", " ")}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="flex">{getRatingStars(review.overallRating)}</div>
                            <span className="font-medium">{review.overallRating.toFixed(1)}</span>
                          </div>
                        </TableCell>
                        <TableCell>{getReviewStatusBadge(review.status)}</TableCell>
                        <TableCell>{review.reviewerName}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" onClick={() => handleViewReview(review)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="goals" className="space-y-4">
          {/* Goals Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {goals.map((goal) => (
              <Card key={goal.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{goal.title}</CardTitle>
                      <CardDescription className="mt-1">{goal.description}</CardDescription>
                    </div>
                    {getStatusBadge(goal.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span>Progress</span>
                        <span>{goal.progress}%</span>
                      </div>
                      <Progress value={goal.progress} className="h-2" />
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Category</span>
                        <div className="font-medium capitalize">{goal.category}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Priority</span>
                        <div className="font-medium capitalize">{goal.priority}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Target Date</span>
                        <div className="font-medium">{new Date(goal.targetDate).toLocaleDateString()}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Created</span>
                        <div className="font-medium">{new Date(goal.createdDate).toLocaleDateString()}</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Create Review Dialog */}
      <Dialog open={isCreateReviewOpen} onOpenChange={setIsCreateReviewOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Performance Review</DialogTitle>
            <DialogDescription>Start a new performance review for an employee</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
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
                  <SelectItem value="EMP005">Michael Brown</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="reviewType">Review Type</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                  <SelectItem value="annual">Annual</SelectItem>
                  <SelectItem value="probation">Probation</SelectItem>
                  <SelectItem value="project-based">Project Based</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="reviewPeriod">Review Period</Label>
              <Input id="reviewPeriod" placeholder="Q1 2024" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nextReviewDate">Next Review Date</Label>
              <Input id="nextReviewDate" type="date" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="feedback">Initial Feedback</Label>
              <Textarea id="feedback" placeholder="Enter initial feedback..." rows={4} />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsCreateReviewOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setIsCreateReviewOpen(false)}>Create Review</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Goal Dialog */}
      <Dialog open={isCreateGoalOpen} onOpenChange={setIsCreateGoalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Goal</DialogTitle>
            <DialogDescription>Set a new goal for employee development</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="goalTitle">Goal Title</Label>
              <Input id="goalTitle" placeholder="Enter goal title" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="goalDescription">Description</Label>
              <Textarea id="goalDescription" placeholder="Describe the goal..." rows={3} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="personal">Personal</SelectItem>
                  <SelectItem value="skill">Skill</SelectItem>
                  <SelectItem value="project">Project</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="targetDate">Target Date</Label>
              <Input id="targetDate" type="date" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="assignee">Assign To</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EMP001">John Smith</SelectItem>
                  <SelectItem value="EMP002">Emily Johnson</SelectItem>
                  <SelectItem value="EMP003">David Rodriguez</SelectItem>
                  <SelectItem value="EMP005">Michael Brown</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsCreateGoalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setIsCreateGoalOpen(false)}>Create Goal</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Review Dialog */}
      <Dialog open={isViewReviewOpen} onOpenChange={setIsViewReviewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedReview && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src="/placeholder.svg" alt={selectedReview.employeeName} />
                    <AvatarFallback>
                      {selectedReview.employeeName
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="text-xl font-bold">{selectedReview.employeeName}</div>
                    <div className="text-sm text-muted-foreground">
                      {selectedReview.reviewPeriod} Performance Review
                    </div>
                  </div>
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-6 py-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Overall Rating</Label>
                    <div className="mt-1 flex items-center gap-2">
                      <div className="flex">{getRatingStars(selectedReview.overallRating)}</div>
                      <span className="font-bold text-lg">{selectedReview.overallRating.toFixed(1)}</span>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Status</Label>
                    <div className="mt-1">{getReviewStatusBadge(selectedReview.status)}</div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Review Type</Label>
                    <div className="mt-1 font-medium capitalize">{selectedReview.reviewType.replace("-", " ")}</div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Reviewer</Label>
                    <div className="mt-1 font-medium">{selectedReview.reviewerName}</div>
                  </div>
                </div>

                {selectedReview.categories.length > 0 && (
                  <div>
                    <Label className="text-lg font-semibold mb-4 block">Performance Categories</Label>
                    <div className="space-y-4">
                      {selectedReview.categories.map((category) => (
                        <div key={category.id} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium">{category.name}</h4>
                            <div className="flex items-center gap-2">
                              <div className="flex">{getRatingStars(category.rating)}</div>
                              <span className="font-medium">{category.rating.toFixed(1)}</span>
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{category.description}</p>
                          <p className="text-sm">{category.comments}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <Label className="text-lg font-semibold mb-3 block">Manager Feedback</Label>
                  <div className="p-4 bg-muted rounded-lg">{selectedReview.feedback}</div>
                </div>

                {selectedReview.employeeFeedback && (
                  <div>
                    <Label className="text-lg font-semibold mb-3 block">Employee Response</Label>
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      {selectedReview.employeeFeedback}
                    </div>
                  </div>
                )}

                {selectedReview.goals.length > 0 && (
                  <div>
                    <Label className="text-lg font-semibold mb-3 block">Associated Goals</Label>
                    <div className="space-y-3">
                      {selectedReview.goals.map((goal) => (
                        <div key={goal.id} className="border rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium">{goal.title}</h4>
                            {getStatusBadge(goal.status)}
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{goal.description}</p>
                          <div className="flex items-center gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">Progress: </span>
                              <span className="font-medium">{goal.progress}%</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Target: </span>
                              <span className="font-medium">{new Date(goal.targetDate).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
