'use client';
import React, { useState } from 'react';
import AppLayout from '@/components/AppLayout';
import { useFullAnalytics } from '@/hooks/useAnalytics';
import { formatCurrency, CHART_COLORS } from '@/lib/utils';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  CartesianGrid, AreaChart, Area,
} from 'recharts';
import {
  TrendingUp, Users, DollarSign, Globe, BarChart3, Award, Activity,
  ArrowUpRight, ArrowDownRight, RefreshCw, AlertCircle,
} from 'lucide-react';

// ─── Custom Tooltip ──────────────────────────────────────────────────────────
interface TooltipPayload { name: string; value: number | string; color?: string; }

const ChartTooltip = ({ active, payload, label, currency }: {
  active?: boolean; payload?: TooltipPayload[]; label?: string | number; currency: string;
}) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-3 text-sm shadow-xl">
      <p className="text-gray-400 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="font-semibold">
          {p.name}: {typeof p.value === 'number' && p.value > 1000
            ? formatCurrency(p.value, currency)
            : p.value?.toLocaleString()}
        </p>
      ))}
    </div>
  );
};

const CURRENCIES = ['USD', 'GBP', 'EUR', 'INR', 'JPY', 'CAD', 'AUD', 'SGD'];

// ─── Page ────────────────────────────────────────────────────────────────────
export default function AnalyticsPage() {
  const [currency, setCurrency] = useState('USD');

  const {
    data,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
    genderData,
    employmentData,
  } = useFullAnalytics(currency);

  const { summary, deptData, countryData, distribution, topEarners } = data ?? {
    summary: null, deptData: [], countryData: [], distribution: [], topEarners: [],
  };

  const spinning = isLoading || isFetching;

  return (
    <AppLayout title="Analytics">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Salary Analytics</h2>
            <p className="text-gray-400 text-xs sm:text-sm mt-0.5">Deep insights into compensation patterns across the organization</p>
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
          </div>
        </div>

        {/* Error Banner */}
        {isError && (
          <div className="flex items-center justify-between p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
            <div className="flex items-center gap-2">
              <AlertCircle size={18} />
              <span>{error?.message ?? 'Failed to load analytics data'}</span>
            </div>
            <button
              onClick={() => refetch()}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg text-xs font-medium transition-colors"
            >
              <RefreshCw size={14} /> Retry
            </button>
          </div>
        )}

        {/* KPI Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
          {[
            { label: 'Total Headcount',       value: summary?.total_employees?.toLocaleString(),                      icon: Users,      sub: 'Active employees',   color: 'violet' },
            { label: 'Annual Payroll',         value: summary ? formatCurrency(summary.total_payroll * 12, currency) : '—', icon: DollarSign, sub: 'Projected annual',  color: 'emerald' },
            { label: 'Avg Compensation',       value: summary ? formatCurrency(summary.avg_salary, currency) : '—',   icon: TrendingUp, sub: 'Organization mean',   color: 'blue' },
            { label: 'Median Compensation',    value: summary ? formatCurrency(summary.median_salary, currency) : '—',icon: Activity,   sub: '50th percentile',    color: 'amber' },
          ].map(({ label, value, icon: Icon, sub, color }) => (
            <div key={label} className="p-4 sm:p-5 bg-gray-900 rounded-2xl border border-gray-800 hover:border-gray-700 transition-all">
              <div className={`w-10 h-10 rounded-xl bg-${color}-500/10 border border-${color}-500/20 flex items-center justify-center mb-3 sm:mb-4`}>
                <Icon size={18} className={`text-${color}-400`} />
              </div>
              <p className="text-xl sm:text-2xl font-bold text-white">{isLoading ? '...' : (value || '—')}</p>
              <p className="text-gray-400 text-xs font-medium mt-1">{label}</p>
              <p className="text-gray-600 text-xs">{sub}</p>
            </div>
          ))}
        </div>

        {/* Department Comparison */}
        <div className="p-6 bg-gray-900 rounded-2xl border border-gray-800">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-white font-semibold flex items-center gap-2">
              <BarChart3 size={18} className="text-violet-400" /> Average Salary by Department
            </h3>
            <span className="text-gray-500 text-xs">{deptData.length} departments</span>
          </div>
          {isLoading ? (
            <div className="h-72 flex items-center justify-center text-gray-500">Loading chart...</div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={deptData} margin={{ bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="department" tick={{ fill: '#6b7280', fontSize: 10 }} angle={-30} textAnchor="end" height={60} />
                <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} tickFormatter={v => formatCurrency(v, currency)} />
                <Tooltip content={<ChartTooltip currency={currency} />} />
                <Bar dataKey="avg_salary" name="Avg Salary" radius={[4, 4, 0, 0]}>
                  {deptData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Country + Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Country */}
          <div className="p-6 bg-gray-900 rounded-2xl border border-gray-800">
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
              <Globe size={18} className="text-violet-400" /> Salary by Country
            </h3>
            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {isLoading ? (
                <p className="text-gray-500 text-sm">Loading...</p>
              ) : countryData.map((c, i) => {
                const maxSalary = countryData[0]?.avg_salary || 1;
                const pct = Math.round(c.avg_salary / maxSalary * 100);
                return (
                  <div key={c.country}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-300 text-sm">{c.country}</span>
                        <span className="text-gray-600 text-xs">({c.headcount?.toLocaleString()})</span>
                      </div>
                      <span className="text-white font-medium text-sm">{formatCurrency(c.avg_salary, currency)}</span>
                    </div>
                    <div className="h-2 bg-gray-800 rounded-full">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${pct}%`, backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Distribution */}
          <div className="p-6 bg-gray-900 rounded-2xl border border-gray-800">
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
              <Activity size={18} className="text-violet-400" /> Salary Distribution
            </h3>
            {isLoading ? (
              <div className="h-72 flex items-center justify-center text-gray-500">Loading...</div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={distribution} margin={{ left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                  <XAxis dataKey="label" tick={{ fill: '#6b7280', fontSize: 9 }} angle={-20} textAnchor="end" height={50} />
                  <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} />
                  <Tooltip content={<ChartTooltip currency={currency} />} />
                  <defs>
                    <linearGradient id="distGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Area type="monotone" dataKey="count" name="Employees" stroke="#6366f1" fill="url(#distGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Gender Pay + Top Earners */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Gender Pay */}
          <div className="p-6 bg-gray-900 rounded-2xl border border-gray-800">
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
              <Users size={18} className="text-violet-400" /> Gender Pay Analysis
            </h3>
            {isLoading ? (
              <p className="text-gray-500">Loading...</p>
            ) : (
              <div className="space-y-4">
                {genderData.map((g, i) => (
                  <div key={g.name} className="p-4 bg-gray-800/50 rounded-xl border border-gray-700/50">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ background: CHART_COLORS[i] }} />
                        <span className="text-gray-300 text-sm font-medium">{g.name}</span>
                      </div>
                      <span className="text-white font-semibold text-sm">{formatCurrency(g.avgSalary, currency)} avg</span>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>{g.count?.toLocaleString()} employees</span>
                      <span>{summary ? Math.round(g.count / summary.total_employees * 100) : 0}% of workforce</span>
                    </div>
                  </div>
                ))}
                {/* Pay gap indicator */}
                {(() => {
                  const male   = genderData.find(g => g.name === 'Male');
                  const female = genderData.find(g => g.name === 'Female');
                  if (!male || !female) return null;
                  const gap = (male.avgSalary - female.avgSalary) / male.avgSalary * 100;
                  return (
                    <div className={`p-3 rounded-xl border ${gap > 5 ? 'bg-red-500/10 border-red-500/20' : gap > 0 ? 'bg-yellow-500/10 border-yellow-500/20' : 'bg-green-500/10 border-green-500/20'}`}>
                      <div className="flex items-center gap-2">
                        {gap > 0
                          ? <ArrowUpRight size={14} className="text-red-400" />
                          : <ArrowDownRight size={14} className="text-green-400" />}
                        <p className={`text-sm font-medium ${gap > 5 ? 'text-red-400' : gap > 0 ? 'text-yellow-400' : 'text-green-400'}`}>
                          {Math.abs(gap).toFixed(1)}% {gap > 0 ? 'gender pay gap (M vs F)' : 'women earn more'}
                        </p>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>

          {/* Top Earners */}
          <div className="p-6 bg-gray-900 rounded-2xl border border-gray-800">
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
              <Award size={18} className="text-amber-400" /> Top 10 Earners
            </h3>
            <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
              {isLoading ? (
                <p className="text-gray-500">Loading...</p>
              ) : topEarners.map((emp, i) => (
                <div key={emp.id} className="flex items-center gap-3 p-2.5 bg-gray-800/40 rounded-lg hover:bg-gray-800/60 transition-colors">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                    i === 0 ? 'bg-amber-500 text-amber-950' : i === 1 ? 'bg-gray-400 text-gray-900' : i === 2 ? 'bg-orange-600 text-orange-100' : 'bg-gray-700 text-gray-400'
                  }`}>{i + 1}</span>
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                    {emp.first_name.charAt(0)}{emp.last_name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm truncate">{emp.first_name} {emp.last_name}</p>
                    <p className="text-gray-500 text-xs truncate">{emp.department} · {emp.country}</p>
                  </div>
                  <span className="text-white font-semibold text-sm shrink-0">{formatCurrency(emp.salary_in_base, currency)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Employment Type Breakdown */}
        <div className="p-6 bg-gray-900 rounded-2xl border border-gray-800">
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
            <Users size={18} className="text-violet-400" /> Employment Type Breakdown
          </h3>
          <div className="grid grid-cols-3 gap-4">
            {employmentData.map((d, i) => {
              const total = summary?.total_employees || 1;
              const pct = Math.round(d.value / total * 100);
              return (
                <div key={d.name} className="p-5 bg-gray-800/40 rounded-xl border border-gray-700/50 text-center">
                  <div
                    className="w-14 h-14 rounded-full border-4 flex items-center justify-center mx-auto mb-3"
                    style={{ borderColor: CHART_COLORS[i], background: `${CHART_COLORS[i]}15` }}
                  >
                    <span className="text-white font-bold text-lg">{pct}%</span>
                  </div>
                  <p className="text-white font-semibold">{d.value?.toLocaleString()}</p>
                  <p className="text-gray-400 text-sm">{d.name}</p>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </AppLayout>
  );
}
