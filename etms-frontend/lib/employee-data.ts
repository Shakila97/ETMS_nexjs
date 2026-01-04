export interface Employee {
  _id?: string
  id?: string
  employeeId: string
  firstName?: string
  lastName?: string
  name?: string // Virtual
  email: string
  phone: string
  department: string | { _id: string; name: string }
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

// Mock data has been removed to ensure the application only uses dynamic data from the API.

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

import api from "@/lib/axios"

export async function getEmployees(params: any = {}) {
  try {
    const res = await api.get("/employees", { params })
    return res.data.data // { employees, pagination }
  } catch (error) {
    console.error("Get employees error:", error)
    throw error // Propagate error
  }
}

export async function getEmployee(id: string) {
  try {
    const res = await api.get(`/employees/${id}`)
    return res.data.data.employee
  } catch (error) {
    console.error("Get employee error:", error)
    throw error
  }
}

export async function createEmployee(data: any) {
  try {
    const res = await api.post("/employees", data)
    return res.data
  } catch (error) {
    console.error("Create employee error:", error)
    throw error
  }
}

export async function updateEmployee(id: string, data: any) {
  try {
    const res = await api.put(`/employees/${id}`, data)
    return res.data
  } catch (error) {
    console.error("Update employee error:", error)
    throw error
  }
}

export async function deleteEmployee(id: string) {
  try {
    const res = await api.delete(`/employees/${id}`)
    return res.data
  } catch (error) {
    console.error("Delete employee error:", error)
    throw error
  }
}

export async function getEmployeeStats() {
  try {
    const res = await api.get("/employees/stats/overview")
    return res.data.data
  } catch (error) {
    console.error("Get employee stats error:", error)
    throw error
  }
}
