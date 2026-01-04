"use client"

import { useState } from "react"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreVertical, CheckCircle, Clock, Banknote, FileText } from "lucide-react"
import { format } from "date-fns"
import type { Payroll } from "@/lib/payroll-data"
import { updatePayrollStatus } from "@/lib/payroll-data"
import { toast } from "@/components/ui/use-toast"

interface PayrollListProps {
    payrolls: Payroll[]
    onUpdate: () => void
}

export function PayrollList({ payrolls, onUpdate }: PayrollListProps) {
    const [loading, setLoading] = useState<string | null>(null)

    const handleStatusUpdate = async (id: string, newStatus: string) => {
        try {
            setLoading(id)
            await updatePayrollStatus(id, {
                status: newStatus,
                paymentDate: newStatus === "paid" ? new Date().toISOString() : undefined,
            })
            toast({
                title: "Status Updated",
                description: `Payroll records marked as ${newStatus}`,
            })
            onUpdate()
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to update status",
                variant: "destructive",
            })
        } finally {
            setLoading(null)
        }
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "paid":
                return <Badge className="bg-green-500 hover:bg-green-600">Paid</Badge>
            case "processed":
                return <Badge variant="secondary" className="bg-blue-100 text-blue-800 hover:bg-blue-200">Processed</Badge>
            case "draft":
                return <Badge variant="outline" className="text-yellow-600 border-yellow-600">Draft</Badge>
            default:
                return <Badge variant="outline">{status}</Badge>
        }
    }

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Employee</TableHead>
                        <TableHead>Pay Period</TableHead>
                        <TableHead>Basic Salary</TableHead>
                        <TableHead>Additions</TableHead>
                        <TableHead>Deductions</TableHead>
                        <TableHead className="font-bold">Net Salary</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {payrolls.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                                No payroll records found.
                            </TableCell>
                        </TableRow>
                    ) : (
                        payrolls.map((payroll) => {
                            const totalAllowances = Object.values(payroll.allowances).reduce((a, b) => a + b, 0) + payroll.overtime.amount
                            const totalDeductions = Object.values(payroll.deductions).reduce((a, b) => a + b, 0)

                            return (
                                <TableRow key={payroll._id}>
                                    <TableCell>
                                        <div className="font-medium">
                                            {payroll.employee?.firstName} {payroll.employee?.lastName}
                                        </div>
                                        <div className="text-xs text-muted-foreground">{payroll.employee?.employeeId}</div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="text-sm">
                                            {format(new Date(payroll.payPeriod.startDate), "MMM d")} - {format(new Date(payroll.payPeriod.endDate), "MMM d, yyyy")}
                                        </div>
                                    </TableCell>
                                    <TableCell>Rs. {payroll.basicSalary.toLocaleString()}</TableCell>
                                    <TableCell className="text-green-600">+ Rs. {totalAllowances.toLocaleString()}</TableCell>
                                    <TableCell className="text-red-600">- Rs. {totalDeductions.toLocaleString()}</TableCell>
                                    <TableCell className="font-bold">Rs. {payroll.netSalary.toLocaleString()}</TableCell>
                                    <TableCell>{getStatusBadge(payroll.status)}</TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                    <span className="sr-only">Open menu</span>
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => {
                                                    // View details handler (future implementation)
                                                }}>
                                                    <FileText className="mr-2 h-4 w-4" />
                                                    View Details
                                                </DropdownMenuItem>
                                                {payroll.status === "draft" && (
                                                    <DropdownMenuItem onClick={() => handleStatusUpdate(payroll._id, "processed")}>
                                                        <Clock className="mr-2 h-4 w-4" />
                                                        Mark as Processed
                                                    </DropdownMenuItem>
                                                )}
                                                {payroll.status === "processed" && (
                                                    <DropdownMenuItem onClick={() => handleStatusUpdate(payroll._id, "paid")}>
                                                        <CheckCircle className="mr-2 h-4 w-4" />
                                                        Mark as Paid
                                                    </DropdownMenuItem>
                                                )}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            )
                        })
                    )}
                </TableBody>
            </Table>
        </div>
    )
}
