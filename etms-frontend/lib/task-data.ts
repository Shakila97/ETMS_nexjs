export interface Task {
  id: string
  title: string
  description: string
  assignedTo: string
  assignedToName: string
  assignedBy: string
  assignedByName: string
  project: string
  priority: "low" | "medium" | "high" | "urgent"
  status: "todo" | "in-progress" | "review" | "completed" | "cancelled"
  dueDate: string
  createdDate: string
  completedDate?: string
  estimatedHours: number
  actualHours?: number
  tags: string[]
  attachments?: string[]
  comments: TaskComment[]
}

export interface TaskComment {
  id: string
  taskId: string
  author: string
  authorName: string
  content: string
  createdDate: string
}

export interface Project {
  id: string
  name: string
  description: string
  manager: string
  managerName: string
  status: "planning" | "active" | "on-hold" | "completed" | "cancelled"
  startDate: string
  endDate: string
  progress: number
  teamMembers: string[]
}

export const mockProjects: Project[] = [
  {
    id: "1",
    name: "Website Redesign",
    description: "Complete overhaul of company website with modern design and improved UX",
    manager: "EMP004",
    managerName: "Sarah Wilson",
    status: "active",
    startDate: "2024-01-01",
    endDate: "2024-03-31",
    progress: 65,
    teamMembers: ["EMP001", "EMP002", "EMP003"],
  },
  {
    id: "2",
    name: "Mobile App Development",
    description: "Native mobile application for iOS and Android platforms",
    manager: "EMP001",
    managerName: "John Smith",
    status: "active",
    startDate: "2024-02-01",
    endDate: "2024-06-30",
    progress: 30,
    teamMembers: ["EMP001", "EMP005"],
  },
  {
    id: "3",
    name: "HR System Integration",
    description: "Integration of new HR management system with existing infrastructure",
    manager: "EMP004",
    managerName: "Sarah Wilson",
    status: "planning",
    startDate: "2024-03-01",
    endDate: "2024-05-31",
    progress: 10,
    teamMembers: ["EMP002", "EMP004"],
  },
]

export const mockTasks: Task[] = [
  {
    id: "1",
    title: "Design Homepage Mockups",
    description: "Create wireframes and high-fidelity mockups for the new homepage design",
    assignedTo: "EMP002",
    assignedToName: "Emily Johnson",
    assignedBy: "EMP004",
    assignedByName: "Sarah Wilson",
    project: "Website Redesign",
    priority: "high",
    status: "in-progress",
    dueDate: "2024-02-15",
    createdDate: "2024-01-20",
    estimatedHours: 16,
    actualHours: 12,
    tags: ["design", "ui/ux", "homepage"],
    comments: [
      {
        id: "1",
        taskId: "1",
        author: "EMP002",
        authorName: "Emily Johnson",
        content: "Started working on the initial wireframes. Should have first draft ready by tomorrow.",
        createdDate: "2024-01-21",
      },
    ],
  },
  {
    id: "2",
    title: "Implement User Authentication",
    description: "Set up secure user authentication system with JWT tokens and password hashing",
    assignedTo: "EMP001",
    assignedToName: "John Smith",
    assignedBy: "EMP004",
    assignedByName: "Sarah Wilson",
    project: "Website Redesign",
    priority: "urgent",
    status: "completed",
    dueDate: "2024-01-30",
    createdDate: "2024-01-15",
    completedDate: "2024-01-28",
    estimatedHours: 24,
    actualHours: 20,
    tags: ["backend", "security", "authentication"],
    comments: [
      {
        id: "2",
        taskId: "2",
        author: "EMP001",
        authorName: "John Smith",
        content: "Authentication system is complete and tested. Ready for review.",
        createdDate: "2024-01-28",
      },
    ],
  },
  {
    id: "3",
    title: "Database Schema Design",
    description: "Design and implement the database schema for the new system",
    assignedTo: "EMP003",
    assignedToName: "David Rodriguez",
    assignedBy: "EMP001",
    assignedByName: "John Smith",
    project: "Mobile App Development",
    priority: "medium",
    status: "review",
    dueDate: "2024-02-10",
    createdDate: "2024-01-25",
    estimatedHours: 12,
    actualHours: 14,
    tags: ["database", "backend", "schema"],
    comments: [],
  },
  {
    id: "4",
    title: "Market Research Analysis",
    description: "Conduct comprehensive market research for the mobile app target audience",
    assignedTo: "EMP005",
    assignedToName: "Michael Brown",
    assignedBy: "EMP001",
    assignedByName: "John Smith",
    project: "Mobile App Development",
    priority: "low",
    status: "todo",
    dueDate: "2024-02-20",
    createdDate: "2024-01-30",
    estimatedHours: 8,
    tags: ["research", "marketing", "analysis"],
    comments: [],
  },
  {
    id: "5",
    title: "API Documentation",
    description: "Create comprehensive API documentation for all endpoints",
    assignedTo: "EMP001",
    assignedToName: "John Smith",
    assignedBy: "EMP004",
    assignedByName: "Sarah Wilson",
    project: "Website Redesign",
    priority: "medium",
    status: "todo",
    dueDate: "2024-02-25",
    createdDate: "2024-02-01",
    estimatedHours: 6,
    tags: ["documentation", "api", "backend"],
    comments: [],
  },
]

export const priorityColors = {
  low: "bg-gray-100 text-gray-800",
  medium: "bg-blue-100 text-blue-800",
  high: "bg-orange-100 text-orange-800",
  urgent: "bg-red-100 text-red-800",
}

export const statusColors = {
  todo: "bg-gray-100 text-gray-800",
  "in-progress": "bg-blue-100 text-blue-800",
  review: "bg-purple-100 text-purple-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
}

export const projectStatusColors = {
  planning: "bg-yellow-100 text-yellow-800",
  active: "bg-green-100 text-green-800",
  "on-hold": "bg-orange-100 text-orange-800",
  completed: "bg-blue-100 text-blue-800",
  cancelled: "bg-red-100 text-red-800",
}
