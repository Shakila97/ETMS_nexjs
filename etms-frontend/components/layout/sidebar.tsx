"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Users,
  Clock,
  Calendar,
  CheckSquare,
  TrendingUp,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  Building2,
} from "lucide-react"
import type { User } from "@/lib/auth"
import { cn } from "@/lib/utils"

interface SidebarProps {
  user: User
  activeModule: string
  onModuleChange: (module: string) => void
  onLogout: () => void
}

const navigationItems = [
  { id: "dashboard", label: "Dashboard", icon: BarChart3 },
  { id: "employees", label: "Employees", icon: Users },
  { id: "attendance", label: "Attendance", icon: Clock },
  { id: "leave", label: "Leave Management", icon: Calendar },
  { id: "tasks", label: "Task Management", icon: CheckSquare },
  { id: "performance", label: "Performance", icon: TrendingUp },
  { id: "reports", label: "Reports", icon: BarChart3 },
]

export function Sidebar({ user, activeModule, onModuleChange, onLogout }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)

  return (
    <>
      {/* Mobile overlay */}
      {!isCollapsed && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setIsCollapsed(true)} />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed left-0 top-0 z-50 h-full bg-sidebar border-r border-sidebar-border transition-all duration-300 lg:relative lg:z-auto",
          isCollapsed ? "-translate-x-full lg:translate-x-0 lg:w-16" : "w-64",
        )}
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
            <div className={cn("flex items-center gap-2", isCollapsed && "lg:justify-center")}>
              <Building2 className="h-8 w-8 text-sidebar-primary" />
              {!isCollapsed && <span className="font-bold text-sidebar-foreground">ETMS</span>}
            </div>
            <Button variant="ghost" size="sm" onClick={() => setIsCollapsed(!isCollapsed)} className="lg:hidden">
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4">
            <ul className="space-y-2">
              {navigationItems.map((item) => {
                const Icon = item.icon
                const isActive = activeModule === item.id

                return (
                  <li key={item.id}>
                    <Button
                      variant={isActive ? "default" : "ghost"}
                      className={cn(
                        "w-full justify-start gap-2 h-10",
                        isActive && "bg-sidebar-primary text-sidebar-primary-foreground",
                        isCollapsed && "lg:justify-center lg:px-2",
                      )}
                      onClick={() => onModuleChange(item.id)}
                    >
                      <Icon className="h-4 w-4 flex-shrink-0" />
                      {!isCollapsed && <span>{item.label}</span>}
                    </Button>
                  </li>
                )
              })}
            </ul>
          </nav>

          {/* User section */}
          <div className="p-4 border-t border-sidebar-border">
            <div className={cn("flex items-center gap-3 mb-3", isCollapsed && "lg:justify-center")}>
              <Avatar className="h-8 w-8">
                <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
                <AvatarFallback>
                  {(user.name ?? "")
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              {!isCollapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-sidebar-foreground truncate">{user.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{user.role}</p>
                </div>
              )}
            </div>

            <div className="space-y-1">
              <Button
                variant="ghost"
                size="sm"
                className={cn("w-full justify-start gap-2", isCollapsed && "lg:justify-center lg:px-2")}
              >
                <Settings className="h-4 w-4" />
                {!isCollapsed && <span>Settings</span>}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "w-full justify-start gap-2 text-destructive hover:text-destructive",
                  isCollapsed && "lg:justify-center lg:px-2",
                )}
                onClick={onLogout}
              >
                <LogOut className="h-4 w-4" />
                {!isCollapsed && <span>Logout</span>}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu button */}
      <Button
        variant="outline"
        size="sm"
        className="fixed top-4 left-4 z-50 lg:hidden bg-transparent"
        onClick={() => setIsCollapsed(false)}
      >
        <Menu className="h-4 w-4" />
      </Button>
    </>
  )
}
