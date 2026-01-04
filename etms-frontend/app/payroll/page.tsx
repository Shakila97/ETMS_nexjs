"use client"

import { useState, useEffect } from "react"
import { Plus, Banknote, Calendar, BadgeDollarSign } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { PayrollList } from "@/components/modules/payroll/payroll-list"
import { PayrollForm } from "@/components/modules/payroll/payroll-form"
import { getPayrolls, getPayrollStats } from "@/lib/payroll-data"
import { Sidebar } from "@/components/layout/sidebar"
import { useAuth } from "@/lib/auth"
import { useRouter } from "next/navigation"

export default function PayrollPage() {
    const [payrolls, setPayrolls] = useState([])
    const [stats, setStats] = useState({
        overview: {
            totalPayrolls: 0,
            totalNetSalary: 0,
            processedPayrolls: 0,
            paidPayrolls: 0,
        },
    })
    const [loading, setLoading] = useState(true)
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
    const { user, logout } = useAuth()
    const router = useRouter()

    const fetchData = async () => {
        try {
            setLoading(true)
            const [payrollsData, statsData] = await Promise.all([
                getPayrolls({ limit: 50 }),
                getPayrollStats(),
            ])

            setPayrolls(payrollsData.data.payrolls)
            setStats(statsData.data)
        } catch (error) {
            console.error("Failed to fetch payroll data", error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (!user) {
            router.push("/login")
            return
        }
        fetchData()
    }, [user, router])

    if (!user) return null

    return (
        <div className="flex h-screen bg-background">
            <Sidebar
                user={user}
                activeModule="payroll"
                onModuleChange={(module) => {
                    if (module === 'dashboard') router.push('/')
                    else router.push(`/${module}`)
                }}
                onLogout={logout}
            />

            <main className="flex-1 overflow-y-auto p-8">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Payroll</h1>
                        <p className="text-muted-foreground mt-1">
                            Manage and process employee salaries and payments
                        </p>
                    </div>
                    <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="mr-2 h-4 w-4" />
                                Create Payroll
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[500px]">
                            <DialogHeader>
                                <DialogTitle>Create New Payroll</DialogTitle>
                            </DialogHeader>
                            <PayrollForm
                                onSuccess={() => {
                                    setIsCreateDialogOpen(false)
                                    fetchData()
                                }}
                                onCancel={() => setIsCreateDialogOpen(false)}
                            />
                        </DialogContent>
                    </Dialog>
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Payout</CardTitle>
                            <Banknote className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">Rs. {stats.overview.totalNetSalary.toLocaleString()}</div>
                            <p className="text-xs text-muted-foreground">
                                Total net salary generated
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Processed</CardTitle>
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.overview.processedPayrolls}</div>
                            <p className="text-xs text-muted-foreground">
                                Payrolls waiting for payment
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Paid</CardTitle>
                            <BadgeDollarSign className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.overview.paidPayrolls}</div>
                            <p className="text-xs text-muted-foreground">
                                Completed payments
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Records</CardTitle>
                            <Banknote className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.overview.totalPayrolls}</div>
                            <p className="text-xs text-muted-foreground">
                                All time payroll records
                            </p>
                        </CardContent>
                    </Card>
                </div>

                <PayrollList payrolls={payrolls} onUpdate={fetchData} />
            </main>
        </div>
    )
}
