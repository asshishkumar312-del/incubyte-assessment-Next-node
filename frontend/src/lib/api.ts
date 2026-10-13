const getApiBase = (): string => {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  if (
    process.env.NODE_ENV === 'production' ||
    (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1')
  ) {
    return 'https://incubyte-assessment-next-node.onrender.com';
  }
  return 'http://localhost:5000';
};

const API_BASE = getApiBase();

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('ems_token') : null;

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  const data = await res.json();

  if (!res.ok) {
    throw new ApiError(res.status, data.message || 'Request failed');
  }

  return data;
}

// Auth
export const authApi = {
  login: (username: string, password: string) =>
    request<{ success: boolean; data: { token: string; user: User } }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),
  logout: () => request('/api/auth/logout', { method: 'POST' }),
  me: () => request<{ success: boolean; data: { user: User } }>('/api/auth/me'),
};

// Employees
export const employeeApi = {
  list: (params: EmployeeListParams) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== '' && v !== null) searchParams.set(k, String(v)); });
    return request<EmployeeListResponse>(`/api/employees?${searchParams}`);
  },
  get: (id: string) => request<{ success: boolean; data: EmployeeWithHistory }>(`/api/employees/${id}`),
  create: (data: CreateEmployeePayload) =>
    request<{ success: boolean; data: EmployeeWithHistory }>('/api/employees', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<Employee>) =>
    request<{ success: boolean; data: EmployeeWithHistory }>(`/api/employees/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => request(`/api/employees/${id}`, { method: 'DELETE' }),
  addSalary: (id: string, data: SalaryPayload) =>
    request<{ success: boolean; data: Salary }>(`/api/employees/${id}/salary`, { method: 'POST', body: JSON.stringify(data) }),
  bulkUpdate: (data: BulkUpdatePayload) =>
    request('/api/employees/bulk-update', { method: 'POST', body: JSON.stringify(data) }),
  meta: () => request<{ success: boolean; data: EmployeeMeta }>('/api/employees/meta'),
};

// Analytics
export const analyticsApi = {
  summary: (currency = 'USD') => request<{ success: boolean; data: AnalyticsSummary }>(`/api/analytics/summary?currency=${currency}`),
  byDepartment: (currency = 'USD') => request<{ success: boolean; data: DeptData[] }>(`/api/analytics/by-department?currency=${currency}`),
  byCountry: (currency = 'USD') => request<{ success: boolean; data: CountryData[] }>(`/api/analytics/by-country?currency=${currency}`),
  distribution: (currency = 'USD', buckets = 10) => request<{ success: boolean; data: DistributionBucket[] }>(`/api/analytics/distribution?currency=${currency}&buckets=${buckets}`),
  topEarners: (currency = 'USD', limit = 10) => request<{ success: boolean; data: TopEarner[] }>(`/api/analytics/top-earners?currency=${currency}&limit=${limit}`),
  exchangeRates: () => request<{ success: boolean; data: Record<string, number> }>('/api/analytics/exchange-rates'),
};

// Export
export const exportApi = {
  csv: (params: Record<string, string>) => {
    const token = localStorage.getItem('ems_token');
    const searchParams = new URLSearchParams(params);
    window.open(`${API_BASE}/api/export/csv?${searchParams}`, '_blank');
  },
};

// Types
export interface User { id: string; username: string; full_name: string; }
export interface Employee {
  id: string; employee_id: string; first_name: string; last_name: string; email: string;
  department: string; job_title: string; country: string; employment_type: string;
  gender: string; hire_date: string; is_active: number; current_salary?: number;
  salary_currency?: string; salary_effective_date?: string;
}
export interface Salary {
  id: string; employee_id: string; amount: number; currency: string;
  effective_date: string; reason?: string; changed_by?: string; created_at: string;
}
export interface EmployeeWithHistory extends Employee { salary_history: Salary[]; }
export interface EmployeeListResponse { success: boolean; data: Employee[]; total: number; page: number; limit: number; total_pages: number; }
export interface EmployeeListParams { page?: number; limit?: number; sort?: string; order?: string; search?: string; department?: string; country?: string; employment_type?: string; currency?: string; salary_min?: number; salary_max?: number; }
export interface CreateEmployeePayload { first_name: string; last_name: string; email: string; department: string; job_title: string; country: string; employment_type: string; gender?: string; hire_date: string; salary_amount: number; salary_currency: string; }
export interface SalaryPayload { amount: number; currency: string; effective_date: string; reason?: string; }
export interface BulkUpdatePayload { filters: Record<string, string>; percentage_change: number; reason?: string; }
export interface EmployeeMeta { departments: string[]; countries: string[]; currencies: string[]; employment_types: string[]; }
export interface AnalyticsSummary { total_employees: number; total_payroll: number; avg_salary: number; median_salary: number; currency: string; by_gender: Record<string, { count: number; total: number }>; by_employment_type: Record<string, number>; }
export interface DeptData { department: string; avg_salary: number; headcount: number; currency: string; }
export interface CountryData { country: string; avg_salary: number; headcount: number; currency: string; }
export interface DistributionBucket { range_start: number; range_end: number; label: string; count: number; }
export interface TopEarner extends Employee { salary_in_base: number; currency: string; }
export { ApiError };
