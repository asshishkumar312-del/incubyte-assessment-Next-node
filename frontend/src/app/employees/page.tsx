'use client';
import React, { useState, useEffect, useCallback } from 'react';
import AppLayout from '@/components/AppLayout';
import EmployeeTable from '@/components/EmployeeTable';
import EmployeeModal from '@/components/EmployeeModal';
import SalaryModal from '@/components/SalaryModal';
import SalaryHistory from '@/components/SalaryHistory';
import { employeeApi, Employee, EmployeeMeta, EmployeeWithHistory } from '@/lib/api';
import { formatDate, formatCurrency } from '@/lib/utils';
import { Plus, X, Edit2, Trash2, TrendingUp, User, MapPin, Briefcase, Calendar, Hash } from 'lucide-react';

type ModalType = 'create' | 'edit' | 'view' | 'salary' | 'delete' | null;

export default function EmployeesPage() {
  const [meta, setMeta] = useState<EmployeeMeta>({ departments: [], countries: [], currencies: [], employment_types: [] });
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [employeeDetail, setEmployeeDetail] = useState<EmployeeWithHistory | null>(null);
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [notification, setNotification] = useState('');
  const [editForm, setEditForm] = useState<Partial<Employee>>({});
  const [editLoading, setEditLoading] = useState(false);

  useEffect(() => {
    employeeApi.meta().then(r => setMeta(r.data)).catch(console.error);
  }, []);

  const openModal = useCallback(async (type: ModalType, emp?: Employee) => {
    setSelectedEmployee(emp || null);
    if (type === 'view' && emp) {
      try {
        const res = await employeeApi.get(emp.id);
        setEmployeeDetail(res.data);
        setEditForm({});
      } catch { setEmployeeDetail(null); }
    }
    if (type === 'edit' && emp) {
      setEditForm({ ...emp });
    }
    setActiveModal(type);
  }, []);

  const closeModal = () => { setActiveModal(null); setSelectedEmployee(null); setEmployeeDetail(null); };

  const notify = (msg: string) => { setNotification(msg); setTimeout(() => setNotification(''), 3000); };
  const refresh = () => { setRefreshKey(k => k + 1); closeModal(); };

  const handleDelete = async () => {
    if (!selectedEmployee) return;
    try {
      await employeeApi.delete(selectedEmployee.id);
      notify(`${selectedEmployee.first_name} ${selectedEmployee.last_name} has been deactivated`);
      refresh();
    } catch (err: any) {
      notify('Failed to delete: ' + err.message);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployee) return;
    setEditLoading(true);
    try {
      await employeeApi.update(selectedEmployee.id, editForm);
      notify('Employee updated successfully');
      refresh();
    } catch (err: any) {
      notify('Failed: ' + err.message);
    } finally {
      setEditLoading(false);
    }
  };

  const empTypeBadge = (type: string) =>
    type === 'Full-time' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
    type === 'Part-time' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' :
    'bg-orange-500/10 text-orange-400 border-orange-500/20';

  return (
    <AppLayout title="Employees">
      {/* Toast notification */}
      {notification && (
        <div className="fixed top-4 right-4 z-50 px-4 py-3 bg-gray-800 border border-gray-600 rounded-xl text-white text-sm shadow-lg animate-in slide-in-from-top-2">
          {notification}
        </div>
      )}

      <div className="max-w-full mx-auto h-full flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">Employee Directory</h2>
            <p className="text-gray-400 text-sm mt-1">Search, filter, and manage all employees</p>
          </div>
          <button onClick={() => openModal('create')}
            className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-lg text-sm font-medium transition-colors shadow-lg shadow-violet-500/20">
            <Plus size={18} /> Add Employee
          </button>
        </div>

        {/* Table */}
        <div className="flex-1 min-h-0">
          <EmployeeTable
            meta={meta}
            refreshKey={refreshKey}
            onView={emp => openModal('view', emp)}
            onEdit={emp => openModal('edit', emp)}
            onSalaryUpdate={emp => openModal('salary', emp)}
            onDelete={emp => openModal('delete', emp)}
          />
        </div>
      </div>

      {/* CREATE Modal */}
      {activeModal === 'create' && (
        <EmployeeModal meta={meta} onClose={closeModal} onSuccess={() => { notify('Employee created successfully!'); refresh(); }} />
      )}

      {/* SALARY Modal */}
      {activeModal === 'salary' && selectedEmployee && (
        <SalaryModal
          employeeId={selectedEmployee.id}
          employeeName={`${selectedEmployee.first_name} ${selectedEmployee.last_name}`}
          currentSalary={selectedEmployee.current_salary || 0}
          currency={selectedEmployee.salary_currency || 'USD'}
          onClose={closeModal}
          onSuccess={() => { notify('Salary updated successfully!'); refresh(); }}
        />
      )}

      {/* VIEW Modal */}
      {activeModal === 'view' && employeeDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-gray-900 rounded-2xl border border-gray-700 w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-800">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xl">
                  {employeeDetail.first_name.charAt(0)}{employeeDetail.last_name.charAt(0)}
                </div>
                <div>
                  <h2 className="text-white font-bold text-xl">{employeeDetail.first_name} {employeeDetail.last_name}</h2>
                  <p className="text-gray-400 text-sm">{employeeDetail.job_title} · {employeeDetail.department}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`px-2 py-0.5 text-xs rounded-md border ${empTypeBadge(employeeDetail.employment_type)}`}>{employeeDetail.employment_type}</span>
                    <span className="text-gray-500 text-xs font-mono">{employeeDetail.employee_id}</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => { closeModal(); openModal('salary', employeeDetail); }} className="p-2 text-gray-400 hover:text-green-400 hover:bg-green-400/10 rounded-lg transition-colors" title="Update Salary"><TrendingUp size={18} /></button>
                <button onClick={() => { closeModal(); openModal('edit', employeeDetail); }} className="p-2 text-gray-400 hover:text-blue-400 hover:bg-blue-400/10 rounded-lg transition-colors" title="Edit"><Edit2 size={18} /></button>
                <button onClick={closeModal} className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"><X size={18} /></button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Info Grid */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: Hash, label: 'Employee ID', val: employeeDetail.employee_id },
                  { icon: User, label: 'Email', val: employeeDetail.email },
                  { icon: MapPin, label: 'Country', val: employeeDetail.country },
                  { icon: Calendar, label: 'Hire Date', val: formatDate(employeeDetail.hire_date) },
                  { icon: Briefcase, label: 'Gender', val: employeeDetail.gender || '—' },
                ].map(({ icon: Icon, label, val }) => (
                  <div key={label} className="flex items-start gap-3 p-3 bg-gray-800/40 rounded-xl">
                    <Icon size={15} className="text-gray-500 mt-0.5 shrink-0" />
                    <div><p className="text-gray-500 text-xs">{label}</p><p className="text-gray-200 text-sm">{val}</p></div>
                  </div>
                ))}
                <div className="flex items-start gap-3 p-3 bg-violet-500/10 rounded-xl border border-violet-500/20">
                  <TrendingUp size={15} className="text-violet-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-gray-500 text-xs">Current Salary</p>
                    <p className="text-violet-300 text-sm font-semibold">
                      {employeeDetail.salary_history.length > 0 ? formatCurrency(employeeDetail.salary_history[0].amount, employeeDetail.salary_history[0].currency) : '—'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Salary History */}
              <div>
                <h3 className="text-white font-semibold mb-3">Salary History</h3>
                <SalaryHistory history={employeeDetail.salary_history} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* EDIT Modal */}
      {activeModal === 'edit' && selectedEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-gray-900 rounded-2xl border border-gray-700 w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-gray-800">
              <h2 className="text-white font-bold text-lg">Edit Employee</h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-white p-2 rounded-lg hover:bg-gray-800 transition-colors"><X size={20} /></button>
            </div>
            <form onSubmit={handleEdit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {[
                  { key: 'first_name', label: 'First Name' },
                  { key: 'last_name', label: 'Last Name' },
                  { key: 'email', label: 'Email', type: 'email' },
                  { key: 'job_title', label: 'Job Title' },
                  { key: 'hire_date', label: 'Hire Date', type: 'date' },
                ].map(({ key, label, type = 'text' }) => (
                  <div key={key} className={key === 'email' ? 'col-span-2' : ''}>
                    <label className="block text-gray-400 text-sm mb-1.5">{label}</label>
                    <input type={type} value={(editForm as any)[key] || ''} onChange={e => setEditForm(f => ({ ...f, [key]: e.target.value }))}
                      className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2.5 text-sm focus:border-violet-500 focus:outline-none" />
                  </div>
                ))}
                {[
                  { key: 'department', options: meta.departments, label: 'Department' },
                  { key: 'country', options: meta.countries, label: 'Country' },
                  { key: 'employment_type', options: meta.employment_types, label: 'Employment Type' },
                ].map(({ key, options, label }) => (
                  <div key={key}>
                    <label className="block text-gray-400 text-sm mb-1.5">{label}</label>
                    <select value={(editForm as any)[key] || ''} onChange={e => setEditForm(f => ({ ...f, [key]: e.target.value }))}
                      className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2.5 text-sm focus:border-violet-500 focus:outline-none">
                      {options.map(o => <option key={o}>{o}</option>)}
                    </select>
                  </div>
                ))}
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={closeModal} className="flex-1 px-4 py-2.5 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm">Cancel</button>
                <button type="submit" disabled={editLoading} className="flex-1 px-4 py-2.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white rounded-lg transition-colors text-sm font-medium">
                  {editLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE Confirm */}
      {activeModal === 'delete' && selectedEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-gray-900 rounded-2xl border border-gray-700 w-full max-w-sm shadow-2xl p-6">
            <div className="w-12 h-12 bg-red-500/10 rounded-xl border border-red-500/20 flex items-center justify-center mx-auto mb-4">
              <Trash2 size={22} className="text-red-400" />
            </div>
            <h2 className="text-white font-bold text-lg text-center mb-2">Deactivate Employee</h2>
            <p className="text-gray-400 text-sm text-center mb-6">
              Are you sure you want to deactivate <span className="text-white font-medium">{selectedEmployee.first_name} {selectedEmployee.last_name}</span>? Their data will be retained for audit purposes.
            </p>
            <div className="flex gap-3">
              <button onClick={closeModal} className="flex-1 px-4 py-2.5 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm">Cancel</button>
              <button onClick={handleDelete} className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors text-sm font-medium">Deactivate</button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
