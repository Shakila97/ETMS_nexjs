"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, Calendar, TrendingUp, AlertCircle, CheckCircle } from "lucide-react"
import type { User } from "@/lib/auth"

interface DashboardModuleProps {
  user: User
}

export function DashboardModule({ user }: DashboardModuleProps) {
  // Mock dashboard data
  const stats = [
    {
      title: "Total Employees",
      value: "247",
      change: "+12 this month",
      icon: Users,
      color: "text-blue-600",
    },
    {
      title: "Present Today",
      value: "231",
      change: "93.5% attendance",
      icon: CheckCircle,
      color: "text-green-600",
    },
    {
      title: "Pending Leaves",
      value: "8",
      change: "3 urgent",
      icon: Calendar,
      color: "text-orange-600",
    },
    {
      title: "Performance Score",
      value: "87%",
      change: "+5% from last quarter",
      icon: TrendingUp,
      color: "text-purple-600",
    },
  ]

  const recentActivities = [
    { id: 1, type: "leave", message: "John Doe submitted sick leave request", time: "2 hours ago", status: "pending" },
    { id: 2, type: "attendance", message: "Sarah Johnson marked late arrival", time: "4 hours ago", status: "info" },
    { id: 3, type: "task", message: "Project Alpha milestone completed", time: "6 hours ago", status: "success" },
    {
      id: 4,
      type: "performance",
      message: "Q4 performance reviews due next week",
      time: "1 day ago",
      status: "warning",
    },
  ]

  const pendingTasks = [
    { id: 1, title: "Review leave applications", count: 8, priority: "high" },
    { id: 2, title: "Update employee records", count: 3, priority: "medium" },
    { id: 3, title: "Schedule performance reviews", count: 15, priority: "high" },
    { id: 4, title: "Process payroll adjustments", count: 2, priority: "low" },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
      <h1 className="text-3xl font-bold text-foreground">
        Welcome back, {user?.username ? user.username.split(" ")[0] : "User"}!
      </h1>
        <p className="text-muted-foreground mt-2">Here's what's happening in your organization today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground mt-1">{stat.change}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activities */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activities</CardTitle>
            <CardDescription>Latest updates from your organization</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3">
                  <div
                    className={`w-2 h-2 rounded-full mt-2 ${
                      activity.status === "success"
                        ? "bg-green-500"
                        : activity.status === "warning"
                          ? "bg-orange-500"
                          : activity.status === "pending"
                            ? "bg-blue-500"
                            : "bg-gray-500"
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{activity.message}</p>
                    <p className="text-xs text-muted-foreground">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Pending Tasks */}
        <Card>
          <CardHeader>
            <CardTitle>Pending Tasks</CardTitle>
            <CardDescription>Items requiring your attention</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendingTasks.map((task) => (
                <div key={task.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">{task.title}</p>
                      <p className="text-xs text-muted-foreground">{task.count} items</p>
                    </div>
                  </div>
                  <Badge
                    variant={
                      task.priority === "high" ? "destructive" : task.priority === "medium" ? "default" : "secondary"
                    }
                  >
                    {task.priority}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
