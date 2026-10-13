'use client';
import React, { useState } from 'react';
import { X, TrendingUp, Calendar } from 'lucide-react';
import { employeeApi } from '@/lib/api';

interface Props {
  employeeId: string;
  employeeName: string;
  currentSalary: number;
  currency: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function SalaryModal({ employeeId, employeeName, currentSalary, currency, onClose, onSuccess }: Props) {
  const [form, setForm] = useState({ amount: currentSalary, currency, effective_date: new Date().toISOString().split('T')[0], reason: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const change = form.amount && currentSalary ? ((form.amount - currentSalary) / currentSalary * 100) : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await employeeApi.addSalary(employeeId, { ...form, amount: Number(form.amount) });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to update salary');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-gray-900 rounded-2xl border border-gray-700 w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
              <TrendingUp size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-white font-bold text-lg">Update Salary</h2>
              <p className="text-gray-400 text-sm">{employeeName}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white p-2 rounded-lg hover:bg-gray-800 transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">{error}</div>}

          {/* Current vs New */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-gray-800/50 rounded-xl border border-gray-700">
              <p className="text-gray-500 text-xs mb-1">Current Salary</p>
              <p className="text-white font-semibold">{currentSalary.toLocaleString()} {currency}</p>
            </div>
            <div className={`p-3 rounded-xl border ${change > 0 ? 'bg-green-500/10 border-green-500/30' : change < 0 ? 'bg-red-500/10 border-red-500/30' : 'bg-gray-800/50 border-gray-700'}`}>
              <p className="text-gray-500 text-xs mb-1">Change</p>
              <p className={`font-semibold ${change > 0 ? 'text-green-400' : change < 0 ? 'text-red-400' : 'text-gray-400'}`}>
                {change > 0 ? '+' : ''}{change.toFixed(1)}%
              </p>
            </div>
          </div>

          <div>
            <label className="block text-gray-400 text-sm mb-1.5">New Salary Amount *</label>
            <div className="flex gap-2">
              <input
                type="number" required min={0}
                value={form.amount}
                onChange={e => setForm(f => ({ ...f, amount: Number(e.target.value) }))}
                className="flex-1 bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2.5 text-sm focus:border-violet-500 focus:outline-none transition-colors"
              />
              <select
                value={form.currency}
                onChange={e => setForm(f => ({ ...f, currency: e.target.value }))}
                className="bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2.5 text-sm focus:border-violet-500 focus:outline-none w-24"
              >
                {['USD','GBP','EUR','INR','JPY','CAD','AUD','SGD','BRL','MXN','PLN'].map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-gray-400 text-sm mb-1.5">Effective Date *</label>
            <div className="relative">
              <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input type="date" required value={form.effective_date}
                onChange={e => setForm(f => ({ ...f, effective_date: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg pl-9 pr-3 py-2.5 text-sm focus:border-violet-500 focus:outline-none transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-gray-400 text-sm mb-1.5">Reason</label>
            <select value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
              className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2.5 text-sm focus:border-violet-500 focus:outline-none">
              <option value="">Select reason...</option>
              {['Annual performance review', 'Promotion', 'Market adjustment', 'Merit increase', 'Role change', 'Correction', 'Other'].map(r => <option key={r}>{r}</option>)}
            </select>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm">
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 px-4 py-2.5 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white rounded-lg transition-colors text-sm font-medium">
              {loading ? 'Saving...' : 'Save Salary'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
