"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { format } from "date-fns"
import { CalendarIcon, Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import { toast } from "@/components/ui/use-toast"
import { createPayroll } from "@/lib/payroll-data"
import { getEmployees } from "@/lib/employee-data"
import { getDepartments } from "@/lib/department-data"

const formSchema = z.object({
    employeeId: z.string().min(1, "Employee is required"),
    payPeriodStart: z.date({
        required_error: "Start date is required",
    }),
    payPeriodEnd: z.date({
        required_error: "End date is required",
    }),
})

interface PayrollFormProps {
    onSuccess: () => void
    onCancel: () => void
}

export function PayrollForm({ onSuccess, onCancel }: PayrollFormProps) {
    const [employees, setEmployees] = useState<any[]>([])
    const [departments, setDepartments] = useState<any[]>([])
    const [filteredEmployees, setFilteredEmployees] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const [selectedDepartment, setSelectedDepartment] = useState<string>("all")
    const [open, setOpen] = useState(false)

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            employeeId: "",
        },
    })

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch active employees
                const empData = await getEmployees({ status: "active", limit: 100 })
                const emps = empData.employees || []
                setEmployees(emps)
                setFilteredEmployees(emps)

                // Fetch departments
                const deptData = await getDepartments()
                setDepartments(deptData || [])
            } catch (error) {
                console.error("Failed to fetch data", error)
            }
        }
        fetchData()
    }, [])

    useEffect(() => {
        if (selectedDepartment === "all") {
            setFilteredEmployees(employees)
        } else {
            setFilteredEmployees(employees.filter(emp => {
                // Handle both populated object and direct ID string
                const deptId = typeof emp.department === 'object' && emp.department !== null
                    ? (emp.department as any)._id
                    : emp.department
                return deptId === selectedDepartment
            }))
        }
    }, [selectedDepartment, employees])

    async function onSubmit(values: z.infer<typeof formSchema>) {
        try {
            setLoading(true)
            const data = {
                employeeId: values.employeeId,
                payPeriodStart: values.payPeriodStart.toISOString(),
                payPeriodEnd: values.payPeriodEnd.toISOString(),
            }

            await createPayroll(data)
            toast({
                title: "Payroll Created",
                description: "Payroll has been successfully calculated and created.",
            })
            onSuccess()
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.response?.data?.message || "Failed to create payroll",
                variant: "destructive",
            })
        } finally {
            setLoading(false)
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

                {/* Department Filter */}
                <div className="space-y-2">
                    <FormLabel>Filter by Department</FormLabel>
                    <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                        <SelectTrigger>
                            <SelectValue placeholder="All Departments" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Departments</SelectItem>
                            {departments.map((dept) => (
                                <SelectItem key={dept._id} value={dept._id}>
                                    {dept.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <FormField
                    control={form.control}
                    name="employeeId"
                    render={({ field }) => (
                        <FormItem className="flex flex-col">
                            <FormLabel>Employee</FormLabel>
                            <Popover open={open} onOpenChange={setOpen}>
                                <PopoverTrigger asChild>
                                    <FormControl>
                                        <Button
                                            variant="outline"
                                            role="combobox"
                                            aria-expanded={open}
                                            className={cn(
                                                "w-full justify-between",
                                                !field.value && "text-muted-foreground"
                                            )}
                                        >
                                            {field.value
                                                ? employees.find((employee) => employee._id === field.value)?.firstName + " " + employees.find((employee) => employee._id === field.value)?.lastName
                                                : "Select employee..."}
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                    <Command>
                                        <CommandInput placeholder="Search employee by name or ID..." />
                                        <CommandEmpty>No employee found.</CommandEmpty>
                                        <CommandList>
                                            <CommandGroup>
                                                {filteredEmployees.map((employee) => (
                                                    <CommandItem
                                                        value={`${employee.firstName} ${employee.lastName} ${employee.employeeId}`} // Searchable content
                                                        key={employee._id}
                                                        onSelect={() => {
                                                            form.setValue("employeeId", employee._id)
                                                            setOpen(false)
                                                        }}
                                                    >
                                                        <Check
                                                            className={cn(
                                                                "mr-2 h-4 w-4",
                                                                employee._id === field.value
                                                                    ? "opacity-100"
                                                                    : "opacity-0"
                                                            )}
                                                        />
                                                        <div className="flex flex-col">
                                                            <span>{employee.firstName} {employee.lastName}</span>
                                                            <span className="text-xs text-muted-foreground">{employee.employeeId}</span>
                                                        </div>
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="payPeriodStart"
                        render={({ field }) => (
                            <FormItem className="flex flex-col">
                                <FormLabel>Start Date</FormLabel>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <FormControl>
                                            <Button
                                                variant={"outline"}
                                                className={cn(
                                                    "pl-3 text-left font-normal",
                                                    !field.value && "text-muted-foreground"
                                                )}
                                            >
                                                {field.value ? (
                                                    format(field.value, "PPP")
                                                ) : (
                                                    <span>Pick a date</span>
                                                )}
                                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                            </Button>
                                        </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={field.value}
                                            onSelect={field.onChange}
                                            disabled={(date) =>
                                                date > new Date() || date < new Date("2020-01-01")
                                            }
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="payPeriodEnd"
                        render={({ field }) => (
                            <FormItem className="flex flex-col">
                                <FormLabel>End Date</FormLabel>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <FormControl>
                                            <Button
                                                variant={"outline"}
                                                className={cn(
                                                    "pl-3 text-left font-normal",
                                                    !field.value && "text-muted-foreground"
                                                )}
                                            >
                                                {field.value ? (
                                                    format(field.value, "PPP")
                                                ) : (
                                                    <span>Pick a date</span>
                                                )}
                                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                            </Button>
                                        </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={field.value}
                                            onSelect={field.onChange}
                                            disabled={(date) =>
                                                date > new Date() || date < new Date("2020-01-01")
                                            }
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                    <Button variant="outline" onClick={onCancel} type="button">
                        Cancel
                    </Button>
                    <Button type="submit" disabled={loading}>
                        {loading ? "Creating..." : "Create Payroll"}
                    </Button>
                </div>
            </form>
        </Form>
    )
}
