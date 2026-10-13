'use client';
import React, { useState, useEffect } from 'react';
import { Search, Filter, Download, ChevronUp, ChevronDown, ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight, RefreshCw, Trash2, Edit2, Eye, TrendingUp } from 'lucide-react';
import { employeeApi, Employee, EmployeeMeta, EmployeeListParams } from '@/lib/api';
import { exportApi } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';

interface Props {
  meta: EmployeeMeta;
  onView: (emp: Employee) => void;
  onEdit: (emp: Employee) => void;
  onSalaryUpdate: (emp: Employee) => void;
  onDelete: (emp: Employee) => void;
  refreshKey: number;
}

export default function EmployeeTable({ meta, onView, onEdit, onSalaryUpdate, onDelete, refreshKey }: Props) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [params, setParams] = useState<EmployeeListParams>({ page: 1, limit: 20, sort: 'last_name', order: 'ASC' });
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ department: '', country: '', employment_type: '', currency: '' });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    let ignore = false;

    employeeApi.list({
      ...params,
      search: search || undefined,
      ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v)),
    })
      .then(res => {
        if (!ignore) {
          setEmployees(res.data);
          setTotal(res.total);
          setTotalPages(res.total_pages);
          setLoading(false);
        }
      })
      .catch(err => {
        if (!ignore) {
          console.error(err);
          setLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [params, search, filters, refreshKey]);

  const handleRefresh = async () => {
    setLoading(true);
    try {
      const res = await employeeApi.list({
        ...params,
        search: search || undefined,
        ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v)),
      });
      setEmployees(res.data);
      setTotal(res.total);
      setTotalPages(res.total_pages);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const setSort = (col: string) => {
    setParams(p => ({ ...p, sort: col, order: p.sort === col && p.order === 'ASC' ? 'DESC' : 'ASC', page: 1 }));
  };

  const SortIcon = ({ col }: { col: string }) => {
    if (params.sort !== col) return <ChevronUp size={14} className="text-gray-600" />;
    return params.order === 'ASC' ? <ChevronUp size={14} className="text-violet-400" /> : <ChevronDown size={14} className="text-violet-400" />;
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setParams(p => ({ ...p, page: 1 }));
  };

  const handleExport = () => {
    const activeFilters: Record<string, string> = {};
    if (search) activeFilters.search = search;
    Object.entries(filters).forEach(([k, v]) => { if (v) activeFilters[k] = v; });
    exportApi.csv(activeFilters);
  };

  const cols = [
    { key: 'employee_id', label: 'ID' },
    { key: 'first_name', label: 'Name' },
    { key: 'department', label: 'Department' },
    { key: 'job_title', label: 'Job Title' },
    { key: 'country', label: 'Country' },
    { key: 'employment_type', label: 'Type' },
    { key: 'salary', label: 'Salary' },
    { key: 'hire_date', label: 'Hire Date' },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex gap-3 mb-4 flex-wrap">
        <form onSubmit={handleSearch} className="flex-1 min-w-64 relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            value={search}
            onChange={e => {
              setSearch(e.target.value);
              setParams(p => ({ ...p, page: 1 }));
            }}
            placeholder="Search by name, email, or ID..."
            className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg pl-9 pr-4 py-2.5 text-sm focus:border-violet-500 focus:outline-none transition-colors placeholder:text-gray-600"
          />
        </form>
        <button onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm transition-colors cursor-pointer ${showFilters ? 'bg-violet-600/20 border-violet-500/50 text-violet-400' : 'bg-gray-800 border-gray-700 text-gray-300 hover:border-gray-600'}`}>
          <Filter size={16} /> Filters
          {Object.values(filters).some(Boolean) && <span className="w-2 h-2 bg-violet-500 rounded-full"></span>}
        </button>
        <button onClick={handleRefresh}
          className={`p-2.5 bg-gray-800 border border-gray-700 text-gray-300 hover:text-white rounded-lg transition-colors cursor-pointer ${loading ? 'animate-spin' : ''}`}>
          <RefreshCw size={16} />
        </button>
        <button onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2.5 bg-gray-800 border border-gray-700 text-gray-300 hover:text-green-400 hover:border-green-500/50 rounded-lg text-sm transition-colors cursor-pointer">
          <Download size={16} /> Export CSV
        </button>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4 p-4 bg-gray-800/40 rounded-xl border border-gray-700">
          {[
            { key: 'department', options: meta.departments, label: 'Department' },
            { key: 'country', options: meta.countries, label: 'Country' },
            { key: 'employment_type', options: meta.employment_types, label: 'Type' },
            { key: 'currency', options: meta.currencies, label: 'Currency' },
          ].map(({ key, options, label }) => (
            <div key={key}>
              <label className="block text-gray-500 text-xs mb-1">{label}</label>
              <select
                value={filters[key as keyof typeof filters]}
                onChange={e => { setFilters(f => ({ ...f, [key]: e.target.value })); setParams(p => ({ ...p, page: 1 })); }}
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:border-violet-500 focus:outline-none cursor-pointer">
                <option value="">All</option>
                {options.map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
          ))}
          <div className="col-span-full flex justify-end">
            <button onClick={() => { setFilters({ department: '', country: '', employment_type: '', currency: '' }); setParams(p => ({ ...p, page: 1 })); }}
              className="text-xs text-gray-400 hover:text-white transition-colors cursor-pointer">
              Clear Filters
            </button>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="flex items-center gap-2 mb-3 text-sm text-gray-500">
        <span>{total.toLocaleString()} employees</span>
        {Object.values(filters).some(Boolean) || search ? <span className="text-violet-400">(filtered)</span> : null}
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto rounded-xl border border-gray-800">
        <table className="w-full text-sm">
          <thead className="bg-gray-800/80 sticky top-0 z-10">
            <tr>
              {cols.map(col => (
                <th key={col.key} onClick={() => setSort(col.key)}
                  className="text-left px-4 py-3 text-gray-400 font-medium cursor-pointer hover:text-white transition-colors whitespace-nowrap select-none">
                  <div className="flex items-center gap-1">{col.label} <SortIcon col={col.key} /></div>
                </th>
              ))}
              <th className="text-left px-4 py-3 text-gray-400 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && employees.length === 0 ? (
              <tr><td colSpan={9} className="text-center py-16 text-gray-500">Loading...</td></tr>
            ) : employees.length === 0 ? (
              <tr><td colSpan={9} className="text-center py-16 text-gray-500">No employees found</td></tr>
            ) : employees.map((emp, i) => (
              <tr key={emp.id} className={`border-t border-gray-800 hover:bg-gray-800/40 transition-colors ${i % 2 === 0 ? '' : 'bg-gray-800/10'}`}>
                <td className="px-4 py-3 text-gray-400 font-mono text-xs whitespace-nowrap">{emp.employee_id}</td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                      {emp.first_name.charAt(0)}{emp.last_name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-white font-medium">{emp.first_name} {emp.last_name}</p>
                      <p className="text-gray-500 text-xs">{emp.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className="inline-block whitespace-nowrap px-2 py-1 bg-indigo-500/10 text-indigo-400 text-xs rounded-md border border-indigo-500/20">{emp.department}</span>
                </td>
                <td className="px-4 py-3 text-gray-300 whitespace-nowrap">{emp.job_title}</td>
                <td className="px-4 py-3 text-gray-300 whitespace-nowrap">{emp.country}</td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className={`inline-block whitespace-nowrap px-2.5 py-1 text-xs rounded-md border font-medium ${
                    emp.employment_type === 'Full-time' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                    emp.employment_type === 'Part-time' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' :
                    'bg-orange-500/10 text-orange-400 border-orange-500/20'
                  }`}>{emp.employment_type}</span>
                </td>
                <td className="px-4 py-3 text-white font-medium whitespace-nowrap">
                  {emp.current_salary ? formatCurrency(emp.current_salary, emp.salary_currency || 'USD') : '—'}
                </td>
                <td className="px-4 py-3 text-gray-400 whitespace-nowrap">{formatDate(emp.hire_date)}</td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="flex items-center gap-1">
                    <button onClick={() => onView(emp)} title="View" className="p-1.5 text-gray-500 hover:text-violet-400 hover:bg-violet-400/10 rounded-lg transition-colors cursor-pointer"><Eye size={15} /></button>
                    <button onClick={() => onEdit(emp)} title="Edit" className="p-1.5 text-gray-500 hover:text-blue-400 hover:bg-blue-400/10 rounded-lg transition-colors cursor-pointer"><Edit2 size={15} /></button>
                    <button onClick={() => onSalaryUpdate(emp)} title="Update Salary" className="p-1.5 text-gray-500 hover:text-green-400 hover:bg-green-400/10 rounded-lg transition-colors cursor-pointer"><TrendingUp size={15} /></button>
                    <button onClick={() => onDelete(emp)} title="Delete" className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors cursor-pointer"><Trash2 size={15} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-4 text-sm">
        <div className="flex items-center gap-2">
          <span className="text-gray-500">Rows per page:</span>
          <select value={params.limit} onChange={e => setParams(p => ({ ...p, limit: Number(e.target.value), page: 1 }))}
            className="bg-gray-800 border border-gray-700 text-white rounded px-2 py-1 text-xs cursor-pointer">
            {[10, 20, 50, 100].map(n => <option key={n}>{n}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-gray-500 mr-2">Page {params.page} of {totalPages}</span>
          <button onClick={() => setParams(p => ({ ...p, page: 1 }))} disabled={params.page === 1} className="p-1 text-gray-500 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer rounded transition-colors"><ChevronsLeft size={16} /></button>
          <button onClick={() => setParams(p => ({ ...p, page: p.page! - 1 }))} disabled={params.page === 1} className="p-1 text-gray-500 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer rounded transition-colors"><ChevronLeft size={16} /></button>
          <button onClick={() => setParams(p => ({ ...p, page: p.page! + 1 }))} disabled={params.page === totalPages} className="p-1 text-gray-500 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer rounded transition-colors"><ChevronRight size={16} /></button>
          <button onClick={() => setParams(p => ({ ...p, page: totalPages }))} disabled={params.page === totalPages} className="p-1 text-gray-500 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer rounded transition-colors"><ChevronsRight size={16} /></button>
        </div>
      </div>
    </div>
  );
}
