import api from "./axios";

export interface Payroll {
    _id: string;
    employee: any;
    payPeriod: {
        startDate: string;
        endDate: string;
    };
    basicSalary: number;
    overtime: {
        hours: number;
        rate: number;
        amount: number;
    };
    allowances: {
        transport: number;
        meal: number;
        medical: number;
        other: number;
    };
    deductions: {
        tax: number;
        insurance: number;
        providentFund: number;
        other: number;
    };
    grossSalary: number;
    netSalary: number;
    status: "draft" | "processed" | "paid";
    paymentDate?: string;
    processedBy: any;
    createdAt: string;
}

export interface PayrollStats {
    overview: {
        totalPayrolls: number;
        totalGrossSalary: number;
        totalNetSalary: number;
        totalDeductions: number;
        totalOvertimeAmount: number;
        processedPayrolls: number;
        paidPayrolls: number;
    };
    departmentBreakdown: any[];
}

export const getPayrolls = async (params: any = {}) => {
    const response = await api.get("/payroll", { params });
    return response.data;
};

export const getPayrollStats = async (params: any = {}) => {
    const response = await api.get("/payroll/stats/overview", { params });
    return response.data;
};

export const createPayroll = async (data: any) => {
    const response = await api.post("/payroll/calculate", data);
    return response.data;
};

export const updatePayrollStatus = async (id: string, data: { status: string; paymentDate?: string }) => {
    const response = await api.put(`/payroll/${id}/status`, data);
    return response.data;
};

export const getPayrollById = async (id: string) => {
    const response = await api.get(`/payroll/${id}`);
    return response.data;
};
