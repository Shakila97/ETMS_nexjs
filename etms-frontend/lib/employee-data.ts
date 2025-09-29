export interface Employee {
  id: string
  employeeId: string
  name: string
  email: string
  phone: string
  department: string
  position: string
  manager: string
  hireDate: string
  salary: number
  status: "active" | "inactive" | "terminated"
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

// Mock employee data
export const mockEmployees: Employee[] = [
  {
    id: "1",
    employeeId: "EMP001",
    name: "John Smith",
    email: "john.smith@company.com",
    phone: "+1 (555) 123-4567",
    department: "Engineering",
    position: "Senior Software Engineer",
    manager: "Mike Chen",
    hireDate: "2022-03-15",
    salary: 95000,
    status: "active",
    avatar: "/professional-male-engineer.jpg",
    address: {
      street: "123 Main St",
      city: "San Francisco",
      state: "CA",
      zipCode: "94105",
    },
    emergencyContact: {
      name: "Jane Smith",
      relationship: "Spouse",
      phone: "+1 (555) 987-6543",
    },
  },
  {
    id: "2",
    employeeId: "EMP002",
    name: "Emily Johnson",
    email: "emily.johnson@company.com",
    phone: "+1 (555) 234-5678",
    department: "Marketing",
    position: "Marketing Manager",
    manager: "Sarah Wilson",
    hireDate: "2021-08-20",
    salary: 78000,
    status: "active",
    avatar: "/professional-female-marketing-manager.jpg",
    address: {
      street: "456 Oak Ave",
      city: "San Francisco",
      state: "CA",
      zipCode: "94107",
    },
    emergencyContact: {
      name: "Robert Johnson",
      relationship: "Father",
      phone: "+1 (555) 876-5432",
    },
  },
  {
    id: "3",
    employeeId: "EMP003",
    name: "David Rodriguez",
    email: "david.rodriguez@company.com",
    phone: "+1 (555) 345-6789",
    department: "Sales",
    position: "Sales Representative",
    manager: "Lisa Brown",
    hireDate: "2023-01-10",
    salary: 65000,
    status: "active",
    avatar: "/professional-male-sales-representative.jpg",
    address: {
      street: "789 Pine St",
      city: "San Francisco",
      state: "CA",
      zipCode: "94108",
    },
    emergencyContact: {
      name: "Maria Rodriguez",
      relationship: "Mother",
      phone: "+1 (555) 765-4321",
    },
  },
  {
    id: "4",
    employeeId: "EMP004",
    name: "Sarah Wilson",
    email: "sarah.wilson@company.com",
    phone: "+1 (555) 456-7890",
    department: "Marketing",
    position: "Marketing Director",
    manager: "CEO",
    hireDate: "2020-05-12",
    salary: 110000,
    status: "active",
    avatar: "/professional-female-marketing-director.png",
    address: {
      street: "321 Elm St",
      city: "San Francisco",
      state: "CA",
      zipCode: "94109",
    },
    emergencyContact: {
      name: "Tom Wilson",
      relationship: "Husband",
      phone: "+1 (555) 654-3210",
    },
  },
  {
    id: "5",
    employeeId: "EMP005",
    name: "Michael Brown",
    email: "michael.brown@company.com",
    phone: "+1 (555) 567-8901",
    department: "Finance",
    position: "Financial Analyst",
    manager: "Jennifer Davis",
    hireDate: "2022-11-03",
    salary: 72000,
    status: "inactive",
    avatar: "/professional-male-financial-analyst.png",
    address: {
      street: "654 Maple Ave",
      city: "San Francisco",
      state: "CA",
      zipCode: "94110",
    },
    emergencyContact: {
      name: "Linda Brown",
      relationship: "Sister",
      phone: "+1 (555) 543-2109",
    },
  },
]

export const departments = [
  "Engineering",
  "Marketing",
  "Sales",
  "Finance",
  "Human Resources",
  "Operations",
  "Customer Support",
]

export const positions = [
  "Software Engineer",
  "Senior Software Engineer",
  "Marketing Manager",
  "Marketing Director",
  "Sales Representative",
  "Sales Manager",
  "Financial Analyst",
  "HR Manager",
  "Operations Manager",
  "Customer Support Specialist",
]
