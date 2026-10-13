import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import EmployeeTable from './EmployeeTable';
import { employeeApi } from '@/lib/api';

jest.mock('@/lib/api', () => ({
  employeeApi: {
    list: jest.fn(),
  },
  exportApi: {
    download: jest.fn(),
  },
}));

const mockMeta = {
  departments: ['Engineering', 'Marketing'],
  countries: ['US', 'UK'],
  currencies: ['USD', 'GBP'],
  employment_types: ['Full-time', 'Part-time', 'Contract'],
};

const mockEmployees = [
  {
    id: 'emp-1',
    employee_id: 'EMP001',
    first_name: 'Jane',
    last_name: 'Doe',
    email: 'jane.doe@example.com',
    department: 'Engineering',
    job_title: 'Software Engineer',
    country: 'US',
    employment_type: 'Full-time',
    current_salary: 120000,
    salary_currency: 'USD',
    hire_date: '2023-01-15T00:00:00Z',
    status: 'ACTIVE',
  },
  {
    id: 'emp-2',
    employee_id: 'EMP002',
    first_name: 'John',
    last_name: 'Smith',
    email: 'john.smith@example.com',
    department: 'Marketing',
    job_title: 'Marketing Specialist',
    country: 'UK',
    employment_type: 'Part-time',
    current_salary: 60000,
    salary_currency: 'GBP',
    hire_date: '2023-03-20T00:00:00Z',
    status: 'ACTIVE',
  },
];

describe('EmployeeTable Component', () => {
  const onView = jest.fn();
  const onEdit = jest.fn();
  const onSalaryUpdate = jest.fn();
  const onDelete = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading state initially while fetching employees', async () => {
    (employeeApi.list as jest.Mock).mockReturnValue(new Promise(() => {})); // pending promise

    render(
      <EmployeeTable
        meta={mockMeta}
        onView={onView}
        onEdit={onEdit}
        onSalaryUpdate={onSalaryUpdate}
        onDelete={onDelete}
        refreshKey={0}
      />
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('renders employee rows and badges properly when loaded', async () => {
    (employeeApi.list as jest.Mock).mockResolvedValue({
      data: mockEmployees,
      total: 2,
      page: 1,
      limit: 20,
      total_pages: 1,
    });

    render(
      <EmployeeTable
        meta={mockMeta}
        onView={onView}
        onEdit={onEdit}
        onSalaryUpdate={onSalaryUpdate}
        onDelete={onDelete}
        refreshKey={0}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Jane Doe')).toBeInTheDocument();
      expect(screen.getByText('John Smith')).toBeInTheDocument();
    });

    // Check employee ID
    expect(screen.getByText('EMP001')).toBeInTheDocument();
    expect(screen.getByText('EMP002')).toBeInTheDocument();

    // Check employment type badges
    const fullTimeBadge = screen.getByText('Full-time');
    expect(fullTimeBadge).toBeInTheDocument();
    expect(fullTimeBadge).toHaveClass('whitespace-nowrap');
    expect(fullTimeBadge).toHaveClass('inline-block');

    const partTimeBadge = screen.getByText('Part-time');
    expect(partTimeBadge).toBeInTheDocument();
    expect(partTimeBadge).toHaveClass('whitespace-nowrap');
  });

  it('calls onView, onEdit, onSalaryUpdate, and onDelete when action buttons are clicked', async () => {
    (employeeApi.list as jest.Mock).mockResolvedValue({
      data: [mockEmployees[0]],
      total: 1,
      page: 1,
      limit: 20,
      total_pages: 1,
    });

    render(
      <EmployeeTable
        meta={mockMeta}
        onView={onView}
        onEdit={onEdit}
        onSalaryUpdate={onSalaryUpdate}
        onDelete={onDelete}
        refreshKey={0}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Jane Doe')).toBeInTheDocument();
    });

    const viewButton = screen.getByTitle('View');
    const editButton = screen.getByTitle('Edit');
    const salaryButton = screen.getByTitle('Update Salary');
    const deleteButton = screen.getByTitle('Delete');

    fireEvent.click(viewButton);
    expect(onView).toHaveBeenCalledWith(mockEmployees[0]);

    fireEvent.click(editButton);
    expect(onEdit).toHaveBeenCalledWith(mockEmployees[0]);

    fireEvent.click(salaryButton);
    expect(onSalaryUpdate).toHaveBeenCalledWith(mockEmployees[0]);

    fireEvent.click(deleteButton);
    expect(onDelete).toHaveBeenCalledWith(mockEmployees[0]);
  });

  it('renders "No employees found" when the employee list is empty', async () => {
    (employeeApi.list as jest.Mock).mockResolvedValue({
      data: [],
      total: 0,
      page: 1,
      limit: 20,
      total_pages: 1,
    });

    render(
      <EmployeeTable
        meta={mockMeta}
        onView={onView}
        onEdit={onEdit}
        onSalaryUpdate={onSalaryUpdate}
        onDelete={onDelete}
        refreshKey={0}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('No employees found')).toBeInTheDocument();
    });
  });
});
