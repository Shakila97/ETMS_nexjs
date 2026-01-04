import api from "@/lib/axios"

export interface Department {
    _id: string
    name: string
    description?: string
    manager?: any
    createdAt?: string
    updatedAt?: string
}

export async function getDepartments(params: any = {}) {
    try {
        const res = await api.get("/departments", { params })
        return res.data.data.departments
    } catch (error) {
        console.error("Get departments error:", error)
        return []
    }
}
