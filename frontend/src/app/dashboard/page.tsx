'use client';
import React, { useState } from 'react';
import AppLayout from '@/components/AppLayout';
import { useDashboard } from '@/hooks/useAnalytics';
import { formatCurrency } from '@/lib/utils';
import { Users, DollarSign, TrendingUp, Activity, Award, Globe, Briefcase, RefreshCw, AlertCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { CHART_COLORS } from '@/lib/utils';
import Link from 'next/link';

const CURRENCIES = ['USD', 'GBP', 'EUR', 'INR', 'JPY', 'CAD', 'AUD', 'SGD'];

export default function DashboardPage() {
  const [currency, setCurrency] = useState('USD');

  const {
    data,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
    employmentData,
    genderData,
  } = useDashboard(currency);

  const { summary, deptData, topEarners } = data ?? {
    summary: null,
    deptData: [],
    topEarners: [],
  };

  const spinning = isLoading || isFetching;

  return (
    <AppLayout title="Dashboard">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Overview Dashboard</h2>
            <p className="text-gray-400 text-xs sm:text-sm mt-0.5">Real-time compensation insights across all employees</p>
          </div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={() => refetch()}
              title="Refresh Data"
              className={`p-2 bg-gray-800 border border-gray-700 text-gray-300 hover:text-white rounded-lg transition-colors cursor-pointer ${spinning ? 'animate-spin' : ''}`}
            >
              <RefreshCw size={16} />
            </button>
            <select
              value={currency}
              onChange={e => setCurrency(e.target.value)}
              className="bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-xs sm:text-sm focus:border-violet-500 focus:outline-none"
            >
              {CURRENCIES.map(c => <option key={c}>{c}</option>)}
            </select>
            <Link
              href="/analytics"
              className="px-3.5 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-lg text-xs sm:text-sm font-medium transition-colors"
            >
              Full Analytics →
            </Link>
          </div>
        </div>

        {/* Error Banner */}
        {isError && (
          <div className="flex items-center justify-between p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
            <div className="flex items-center gap-2">
              <AlertCircle size={18} />
              <span>{error?.message ?? 'Failed to load dashboard data'}</span>
            </div>
            <button
              onClick={() => refetch()}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg text-xs font-medium transition-colors"
            >
              <RefreshCw size={14} /> Retry
            </button>
          </div>
        )}

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
          {[
            { label: 'Total Employees', value: summary?.total_employees?.toLocaleString() ?? '—', icon: Users,      color: 'violet',  desc: 'Active employees' },
            { label: 'Total Payroll',   value: summary ? formatCurrency(summary.total_payroll, currency) : '—',     icon: DollarSign, color: 'emerald', desc: `Monthly (${currency})` },
            { label: 'Avg Salary',      value: summary ? formatCurrency(summary.avg_salary, currency)    : '—',     icon: TrendingUp, color: 'blue',    desc: 'Organization average' },
            { label: 'Median Salary',   value: summary ? formatCurrency(summary.median_salary, currency) : '—',     icon: Activity,   color: 'orange',  desc: 'Distribution midpoint' },
          ].map(({ label, value, icon: Icon, color, desc }) => (
            <div key={label} className="p-4 sm:p-5 bg-gray-900 rounded-2xl border border-gray-800 hover:border-gray-700 transition-all group">
              <div className="flex items-start justify-between mb-3 sm:mb-4">
                <div className={`w-10 h-10 rounded-xl bg-${color}-500/10 border border-${color}-500/20 flex items-center justify-center`}>
                  <Icon size={18} className={`text-${color}-400`} />
                </div>
              </div>
              <p className="text-xl sm:text-2xl font-bold text-white mb-1">{isLoading ? '...' : value}</p>
              <p className="text-gray-400 text-xs font-medium">{label}</p>
              <p className="text-gray-600 text-xs mt-0.5">{desc}</p>
            </div>
          ))}
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* Salary by Dept */}
          <div className="lg:col-span-2 p-5 bg-gray-900 rounded-2xl border border-gray-800">
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
              <Briefcase size={16} className="text-violet-400" />
              Avg Salary by Department
            </h3>
            {isLoading ? (
              <div className="h-64 flex items-center justify-center text-gray-500">Loading...</div>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={deptData} layout="vertical" margin={{ left: 100, right: 20 }}>
                  <XAxis type="number" tick={{ fill: '#6b7280', fontSize: 11 }}
                    tickFormatter={v => formatCurrency(v, currency)} />
                  <YAxis type="category" dataKey="department" tick={{ fill: '#9ca3af', fontSize: 11 }} width={95} />
                  <Tooltip
                    contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: '8px', color: '#fff' }}
                    formatter={(v: unknown) => [formatCurrency(Number(v) || 0, currency), 'Avg Salary']}
                  />
                  <Bar dataKey="avg_salary" radius={[0, 4, 4, 0]}>
                    {deptData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Employment Type Pie */}
          <div className="p-5 bg-gray-900 rounded-2xl border border-gray-800">
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
              <Users size={16} className="text-violet-400" />
              Employment Types
            </h3>
            {isLoading ? (
              <div className="h-64 flex items-center justify-center text-gray-500">Loading...</div>
            ) : (
              <div>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={employmentData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} innerRadius={40}>
                      {employmentData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: '8px', color: '#fff' }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2 mt-2">
                  {employmentData.map((d, i) => (
                    <div key={d.name} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: CHART_COLORS[i] }} />
                        <span className="text-gray-300">{d.name}</span>
                      </div>
                      <span className="text-gray-500">{d.value?.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Top Earners + Gender Split */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* Top Earners */}
          <div className="lg:col-span-2 p-5 bg-gray-900 rounded-2xl border border-gray-800">
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
              <Award size={16} className="text-amber-400" />
              Top 5 Earners
            </h3>
            <div className="space-y-3">
              {isLoading ? (
                <p className="text-gray-500 text-sm">Loading...</p>
              ) : topEarners.map((emp, i) => (
                <div key={emp.id} className="flex items-center gap-3 p-3 bg-gray-800/40 rounded-xl hover:bg-gray-800/60 transition-colors">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                    i === 0 ? 'bg-amber-500 text-amber-950' : i === 1 ? 'bg-gray-400 text-gray-900' : i === 2 ? 'bg-orange-600 text-orange-100' : 'bg-gray-700 text-gray-300'
                  }`}>{i + 1}</div>
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                    {emp.first_name.charAt(0)}{emp.last_name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">{emp.first_name} {emp.last_name}</p>
                    <p className="text-gray-500 text-xs truncate">{emp.department} · {emp.job_title}</p>
                  </div>
                  <p className="text-white font-semibold text-sm shrink-0">{formatCurrency(emp.salary_in_base, currency)}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Gender Distribution */}
          <div className="p-5 bg-gray-900 rounded-2xl border border-gray-800">
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
              <Globe size={16} className="text-violet-400" />
              Gender Distribution
            </h3>
            {isLoading ? (
              <p className="text-gray-500 text-sm">Loading...</p>
            ) : (
              <div className="space-y-4">
                {genderData.map((g, i) => {
                  const total = genderData.reduce((s, d) => s + d.value, 0);
                  const pct = total ? Math.round(g.value / total * 100) : 0;
                  return (
                    <div key={g.name}>
                      <div className="flex justify-between mb-1.5">
                        <span className="text-gray-300 text-sm">{g.name}</span>
                        <span className="text-gray-400 text-sm">{g.value?.toLocaleString()} ({pct}%)</span>
                      </div>
                      <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${pct}%`, backgroundColor: CHART_COLORS[i] }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

      </div>
    </AppLayout>
  );
}
