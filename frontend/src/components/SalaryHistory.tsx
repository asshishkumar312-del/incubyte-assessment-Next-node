'use client';
import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Salary } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function SalaryHistory({ history }: { history: Salary[] }) {
  if (!history || history.length === 0) {
    return <p className="text-gray-500 text-sm py-4">No salary history available</p>;
  }

  return (
    <div className="space-y-3">
      {history.map((record, idx) => {
        const prev = history[idx + 1];
        const change = prev ? ((record.amount - prev.amount) / prev.amount * 100) : null;

        return (
          <div key={record.id} className="flex items-start gap-4 p-4 bg-gray-800/40 rounded-xl border border-gray-700/50 hover:border-gray-600 transition-colors">
            <div className="flex flex-col items-center gap-1 pt-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                idx === 0 ? 'bg-violet-500/20 border border-violet-500/40' : 'bg-gray-700/50 border border-gray-600/40'
              }`}>
                {change === null ? (
                  <Minus size={14} className="text-gray-400" />
                ) : change > 0 ? (
                  <TrendingUp size={14} className="text-green-400" />
                ) : (
                  <TrendingDown size={14} className="text-red-400" />
                )}
              </div>
              {idx < history.length - 1 && <div className="w-px h-4 bg-gray-700" />}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div>
                  <span className="text-white font-semibold text-base">
                    {formatCurrency(record.amount, record.currency)}
                  </span>
                  <span className="text-gray-500 text-xs ml-2">{record.currency}</span>
                  {idx === 0 && (
                    <span className="ml-2 px-2 py-0.5 bg-violet-500/20 text-violet-400 text-xs rounded-full border border-violet-500/30">Current</span>
                  )}
                </div>
                {change !== null && (
                  <span className={`text-sm font-medium ${change > 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {change > 0 ? '+' : ''}{change.toFixed(1)}%
                  </span>
                )}
              </div>
              <div className="mt-1 flex items-center gap-3 text-xs text-gray-500">
                <span>Effective: {formatDate(record.effective_date)}</span>
                {record.reason && <span>· {record.reason}</span>}
                {record.changed_by && <span>· by {record.changed_by}</span>}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
