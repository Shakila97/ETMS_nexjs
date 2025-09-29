"use client"

import { useState, useEffect } from "react"
import axios from "axios" // ✅ import axios
import { LoginForm } from "@/components/auth/login-form"
import { Sidebar } from "@/components/layout/sidebar"
import { DashboardModule } from "@/components/modules/dashboard"
import { EmployeesModule } from "@/components/modules/employees"
import { AttendanceModule } from "@/components/modules/attendance"
import { LeaveModule } from "@/components/modules/leave"
import { TasksModule } from "@/components/modules/tasks"
import { PerformanceModule } from "@/components/modules/performance"
import { AnalyticsModule } from "@/components/modules/analytics"
import { type User, getCurrentUser, setCurrentUser } from "@/lib/auth"

export default function HomePage() {
  const [user, setUser] = useState<User | null>(null)
  const [activeModule, setActiveModule] = useState("dashboard")
  const [isLoading, setIsLoading] = useState(true)

  // ✅ Example backend connection test
  useEffect(() => {
    axios
      .get(`${process.env.NEXT_PUBLIC_API_URL}/api/test`)
      .then((res) => {
        console.log("✅ Backend Response:", res.data)
      })
      .catch((err) => {
        console.error("❌ API Error:", err)
      })
  }, [])

  useEffect(() => {
    const currentUser = getCurrentUser()
    setUser(currentUser)
    setIsLoading(false)
  }, [])

  const handleLogin = (loggedInUser: User) => {
    setUser(loggedInUser)
  }

  const handleLogout = () => {
    setCurrentUser(null)
    setUser(null)
    setActiveModule("dashboard")
  }

  const handleModuleChange = (module: string) => {
    setActiveModule(module)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!user) {
    return <LoginForm onLogin={handleLogin} />
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar
        user={user}
        activeModule={activeModule}
        onModuleChange={handleModuleChange}
        onLogout={handleLogout}
      />
      <main className="flex-1 overflow-auto">
        <div className="p-6">
          {activeModule === "dashboard" && <DashboardModule user={user} />}
          {activeModule === "employees" && <EmployeesModule user={user} />}
          {activeModule === "attendance" && <AttendanceModule user={user} />}
          {activeModule === "leave" && <LeaveModule user={user} />}
          {activeModule === "tasks" && <TasksModule user={user} />}
          {activeModule === "performance" && <PerformanceModule user={user} />}
          {activeModule === "reports" && <AnalyticsModule user={user} />}
        </div>
      </main>
    </div>
  )
}
