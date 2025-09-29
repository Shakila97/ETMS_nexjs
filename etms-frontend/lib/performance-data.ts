export interface PerformanceReview {
  id: string
  employeeId: string
  employeeName: string
  reviewerId: string
  reviewerName: string
  reviewPeriod: string
  reviewType: "quarterly" | "annual" | "probation" | "project-based"
  status: "draft" | "in-progress" | "completed" | "approved"
  overallRating: number
  categories: PerformanceCategory[]
  goals: Goal[]
  feedback: string
  employeeFeedback?: string
  createdDate: string
  completedDate?: string
  nextReviewDate: string
}

export interface PerformanceCategory {
  id: string
  name: string
  description: string
  rating: number
  weight: number
  comments: string
}

export interface Goal {
  id: string
  title: string
  description: string
  targetDate: string
  status: "not-started" | "in-progress" | "completed" | "overdue"
  progress: number
  category: "professional" | "personal" | "skill" | "project"
  priority: "low" | "medium" | "high"
  createdDate: string
  completedDate?: string
}

export interface PerformanceMetrics {
  employeeId: string
  employeeName: string
  currentRating: number
  previousRating: number
  trend: "improving" | "stable" | "declining"
  completedGoals: number
  totalGoals: number
  reviewsCompleted: number
  lastReviewDate: string
  nextReviewDate: string
}

export const performanceCategories = [
  {
    id: "1",
    name: "Technical Skills",
    description: "Proficiency in job-related technical competencies",
    weight: 25,
  },
  {
    id: "2",
    name: "Communication",
    description: "Effectiveness in verbal and written communication",
    weight: 20,
  },
  {
    id: "3",
    name: "Teamwork",
    description: "Collaboration and team contribution",
    weight: 20,
  },
  {
    id: "4",
    name: "Problem Solving",
    description: "Ability to identify and resolve issues",
    weight: 15,
  },
  {
    id: "5",
    name: "Leadership",
    description: "Leadership potential and initiative",
    weight: 10,
  },
  {
    id: "6",
    name: "Reliability",
    description: "Consistency and dependability",
    weight: 10,
  },
]

export const mockPerformanceReviews: PerformanceReview[] = [
  {
    id: "1",
    employeeId: "EMP001",
    employeeName: "John Smith",
    reviewerId: "EMP004",
    reviewerName: "Sarah Wilson",
    reviewPeriod: "Q4 2023",
    reviewType: "quarterly",
    status: "completed",
    overallRating: 4.2,
    categories: [
      {
        id: "1",
        name: "Technical Skills",
        description: "Proficiency in job-related technical competencies",
        rating: 4.5,
        weight: 25,
        comments: "Excellent technical skills, consistently delivers high-quality code",
      },
      {
        id: "2",
        name: "Communication",
        description: "Effectiveness in verbal and written communication",
        rating: 4.0,
        weight: 20,
        comments: "Good communication skills, could improve presentation abilities",
      },
      {
        id: "3",
        name: "Teamwork",
        description: "Collaboration and team contribution",
        rating: 4.2,
        weight: 20,
        comments: "Great team player, always willing to help colleagues",
      },
    ],
    goals: [
      {
        id: "1",
        title: "Complete React Certification",
        description: "Obtain React Developer certification to enhance frontend skills",
        targetDate: "2024-03-31",
        status: "in-progress",
        progress: 75,
        category: "skill",
        priority: "high",
        createdDate: "2024-01-01",
      },
    ],
    feedback:
      "John has shown excellent technical growth this quarter. His code quality and problem-solving skills continue to improve.",
    employeeFeedback: "I appreciate the feedback and am committed to improving my presentation skills.",
    createdDate: "2023-12-01",
    completedDate: "2023-12-15",
    nextReviewDate: "2024-03-31",
  },
  {
    id: "2",
    employeeId: "EMP002",
    employeeName: "Emily Johnson",
    reviewerId: "EMP004",
    reviewerName: "Sarah Wilson",
    reviewPeriod: "Q4 2023",
    reviewType: "quarterly",
    status: "in-progress",
    overallRating: 4.0,
    categories: [
      {
        id: "1",
        name: "Technical Skills",
        description: "Proficiency in job-related technical competencies",
        rating: 3.8,
        weight: 25,
        comments: "Solid technical foundation, room for growth in advanced concepts",
      },
      {
        id: "2",
        name: "Communication",
        description: "Effectiveness in verbal and written communication",
        rating: 4.5,
        weight: 20,
        comments: "Excellent communication skills, great at explaining complex concepts",
      },
    ],
    goals: [
      {
        id: "2",
        title: "Lead Marketing Campaign",
        description: "Successfully lead the Q1 2024 product launch campaign",
        targetDate: "2024-03-31",
        status: "in-progress",
        progress: 40,
        category: "project",
        priority: "high",
        createdDate: "2024-01-01",
      },
    ],
    feedback: "Emily shows strong leadership potential and excellent communication skills.",
    createdDate: "2023-12-01",
    nextReviewDate: "2024-03-31",
  },
]

export const mockGoals: Goal[] = [
  {
    id: "1",
    title: "Complete React Certification",
    description: "Obtain React Developer certification to enhance frontend skills",
    targetDate: "2024-03-31",
    status: "in-progress",
    progress: 75,
    category: "skill",
    priority: "high",
    createdDate: "2024-01-01",
  },
  {
    id: "2",
    title: "Lead Marketing Campaign",
    description: "Successfully lead the Q1 2024 product launch campaign",
    targetDate: "2024-03-31",
    status: "in-progress",
    progress: 40,
    category: "project",
    priority: "high",
    createdDate: "2024-01-01",
  },
  {
    id: "3",
    title: "Improve Public Speaking",
    description: "Join Toastmasters and complete 5 speeches",
    targetDate: "2024-06-30",
    status: "not-started",
    progress: 0,
    category: "personal",
    priority: "medium",
    createdDate: "2024-01-15",
  },
  {
    id: "4",
    title: "Mentor Junior Developer",
    description: "Provide mentorship to new team member",
    targetDate: "2024-12-31",
    status: "in-progress",
    progress: 60,
    category: "professional",
    priority: "medium",
    createdDate: "2024-01-01",
  },
]

export const mockPerformanceMetrics: PerformanceMetrics[] = [
  {
    employeeId: "EMP001",
    employeeName: "John Smith",
    currentRating: 4.2,
    previousRating: 3.8,
    trend: "improving",
    completedGoals: 3,
    totalGoals: 5,
    reviewsCompleted: 4,
    lastReviewDate: "2023-12-15",
    nextReviewDate: "2024-03-31",
  },
  {
    employeeId: "EMP002",
    employeeName: "Emily Johnson",
    currentRating: 4.0,
    previousRating: 4.1,
    trend: "stable",
    completedGoals: 2,
    totalGoals: 4,
    reviewsCompleted: 3,
    lastReviewDate: "2023-12-10",
    nextReviewDate: "2024-03-31",
  },
  {
    employeeId: "EMP003",
    employeeName: "David Rodriguez",
    currentRating: 3.5,
    previousRating: 3.2,
    trend: "improving",
    completedGoals: 1,
    totalGoals: 3,
    reviewsCompleted: 2,
    lastReviewDate: "2023-12-05",
    nextReviewDate: "2024-03-31",
  },
  {
    employeeId: "EMP004",
    employeeName: "Sarah Wilson",
    currentRating: 4.5,
    previousRating: 4.4,
    trend: "stable",
    completedGoals: 4,
    totalGoals: 5,
    reviewsCompleted: 5,
    lastReviewDate: "2023-12-20",
    nextReviewDate: "2024-03-31",
  },
  {
    employeeId: "EMP005",
    employeeName: "Michael Brown",
    currentRating: 3.2,
    previousRating: 3.6,
    trend: "declining",
    completedGoals: 0,
    totalGoals: 2,
    reviewsCompleted: 1,
    lastReviewDate: "2023-11-30",
    nextReviewDate: "2024-02-29",
  },
]

export const getStatusColor = (status: Goal["status"]) => {
  switch (status) {
    case "completed":
      return "bg-green-100 text-green-800"
    case "in-progress":
      return "bg-blue-100 text-blue-800"
    case "overdue":
      return "bg-red-100 text-red-800"
    case "not-started":
      return "bg-gray-100 text-gray-800"
    default:
      return "bg-gray-100 text-gray-800"
  }
}

export const getTrendColor = (trend: PerformanceMetrics["trend"]) => {
  switch (trend) {
    case "improving":
      return "text-green-600"
    case "stable":
      return "text-blue-600"
    case "declining":
      return "text-red-600"
    default:
      return "text-gray-600"
  }
}

export const getTrendIcon = (trend: PerformanceMetrics["trend"]) => {
  switch (trend) {
    case "improving":
      return "↗"
    case "stable":
      return "→"
    case "declining":
      return "↘"
    default:
      return "→"
  }
}
