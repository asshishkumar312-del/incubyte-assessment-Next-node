'use client';
import React, { useState } from 'react';
import { X, Plus, Save, DollarSign } from 'lucide-react';
import { employeeApi, CreateEmployeePayload, EmployeeMeta } from '@/lib/api';
import { EMPLOYMENT_TYPES, GENDERS } from '@/lib/utils';

interface Props {
  meta: EmployeeMeta;
  onClose: () => void;
  onSuccess: () => void;
}

const initialForm: CreateEmployeePayload = {
  first_name: '', last_name: '', email: '', department: '',
  job_title: '', country: '', employment_type: 'Full-time',
  gender: '', hire_date: '', salary_amount: 0, salary_currency: 'USD'
};

export default function EmployeeModal({ meta, onClose, onSuccess }: Props) {
  const [form, setForm] = useState<CreateEmployeePayload>(initialForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<1 | 2>(1);

  const set = (field: keyof CreateEmployeePayload, value: string | number) =>
    setForm(f => ({ ...f, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await employeeApi.create(form);
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create employee');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-gray-900 rounded-2xl border border-gray-700 w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
              <Plus size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-white font-bold text-lg">Add New Employee</h2>
              <p className="text-gray-400 text-sm">Step {step} of 2 — {step === 1 ? 'Personal Info' : 'Salary Details'}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white p-2 rounded-lg hover:bg-gray-800 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Step indicators */}
        <div className="flex gap-1 px-6 pt-4">
          {[1, 2].map(s => (
            <div key={s} className={`h-1 flex-1 rounded-full transition-colors ${s <= step ? 'bg-violet-500' : 'bg-gray-700'}`} />
          ))}
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">{error}</div>
          )}

          {step === 1 && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <Field label="First Name" required value={form.first_name} onChange={v => set('first_name', v)} placeholder="John" />
                <Field label="Last Name" required value={form.last_name} onChange={v => set('last_name', v)} placeholder="Doe" />
              </div>
              <Field label="Email Address" required type="email" value={form.email} onChange={v => set('email', v)} placeholder="john.doe@acme.com" />
              <div className="grid grid-cols-2 gap-4">
                <SelectField label="Department" required value={form.department} onChange={v => set('department', v)} options={meta.departments} placeholder="Select Department" />
                <Field label="Job Title" required value={form.job_title} onChange={v => set('job_title', v)} placeholder="Software Engineer" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <SelectField label="Country" required value={form.country} onChange={v => set('country', v)} options={meta.countries} placeholder="Select Country" />
                <SelectField label="Employment Type" required value={form.employment_type} onChange={v => set('employment_type', v)} options={EMPLOYMENT_TYPES} placeholder="Select Type" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <SelectField label="Gender" value={form.gender || ''} onChange={v => set('gender', v)} options={GENDERS} placeholder="Select Gender" />
                <Field label="Hire Date" required type="date" value={form.hire_date} onChange={v => set('hire_date', v)} />
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div className="p-4 bg-gray-800/50 rounded-xl border border-gray-700">
                <div className="flex items-center gap-2 mb-4">
                  <DollarSign size={18} className="text-violet-400" />
                  <span className="text-white font-medium">Initial Salary Information</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-400 text-sm mb-1.5">Salary Amount *</label>
                    <input
                      type="number" required min={0}
                      value={form.salary_amount || ''}
                      onChange={e => set('salary_amount', Number(e.target.value))}
                      className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2.5 text-sm focus:border-violet-500 focus:outline-none transition-colors"
                      placeholder="90000"
                    />
                  </div>
                  <SelectField label="Currency *" required value={form.salary_currency} onChange={v => set('salary_currency', v)} options={meta.currencies} placeholder="Select Currency" />
                </div>
              </div>
              <div className="p-4 bg-gray-800/30 rounded-xl border border-gray-700">
                <h3 className="text-gray-400 text-sm mb-3 font-medium">Summary</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {[
                    ['Name', `${form.first_name} ${form.last_name}`],
                    ['Email', form.email],
                    ['Department', form.department],
                    ['Title', form.job_title],
                    ['Country', form.country],
                    ['Hire Date', form.hire_date],
                  ].map(([k, v]) => (
                    <div key={k}>
                      <span className="text-gray-500">{k}: </span>
                      <span className="text-gray-200">{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          <div className="flex gap-3 pt-2">
            {step === 2 && (
              <button type="button" onClick={() => setStep(1)}
                className="flex-1 px-4 py-2.5 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm">
                Back
              </button>
            )}
            {step === 1 && (
              <button type="button" onClick={() => {
                if (!form.first_name || !form.last_name || !form.email || !form.department || !form.job_title || !form.country || !form.hire_date) {
                  setError('Please fill in all required fields');
                  return;
                }
                setError('');
                setStep(2);
              }}
                className="flex-1 px-4 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-lg transition-colors text-sm font-medium">
                Next Step
              </button>
            )}
            {step === 2 && (
              <button type="submit" disabled={loading}
                className="flex-1 px-4 py-2.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white rounded-lg transition-colors text-sm font-medium flex items-center justify-center gap-2">
                <Save size={16} />
                {loading ? 'Creating...' : 'Create Employee'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

interface FieldProps {
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
}

function Field({ label, value, onChange, type = 'text', placeholder = '', required = false }: FieldProps) {
  return (
    <div>
      <label className="block text-gray-400 text-sm mb-1.5">{label}{required && ' *'}</label>
      <input
        type={type} required={required} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2.5 text-sm focus:border-violet-500 focus:outline-none transition-colors placeholder:text-gray-600"
      />
    </div>
  );
}

interface SelectFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
  required?: boolean;
}

function SelectField({ label, value, onChange, options, placeholder, required = false }: SelectFieldProps) {
  return (
    <div>
      <label className="block text-gray-400 text-sm mb-1.5">{label}{required && ' *'}</label>
      <select
        value={value} onChange={e => onChange(e.target.value)} required={required}
        className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2.5 text-sm focus:border-violet-500 focus:outline-none transition-colors"
      >
        <option value="">{placeholder}</option>
        {options.map((o: string) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}
