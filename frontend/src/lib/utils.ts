// src/lib/utils.ts
export function formatCurrency(amount: number, currency: string): string {
  const symbols: Record<string, string> = {
    USD: '$', GBP: '£', EUR: '€', INR: '₹', JPY: '¥',
    CAD: 'CA$', AUD: 'AU$', SGD: 'S$', BRL: 'R$', MXN: 'MX$', PLN: 'PLN'
  };
  const sym = symbols[currency] || currency + ' ';

  if (amount >= 1_000_000) return `${sym}${(amount / 1_000_000).toFixed(2)}M`;
  if (amount >= 1_000) return `${sym}${(amount / 1_000).toFixed(1)}K`;
  return `${sym}${amount.toLocaleString()}`;
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

export const CURRENCIES = ['USD', 'GBP', 'EUR', 'INR', 'JPY', 'CAD', 'AUD', 'SGD', 'BRL', 'MXN', 'PLN'];

export const CHART_COLORS = [
  '#6366f1', '#8b5cf6', '#a78bfa', '#c4b5fd',
  '#38bdf8', '#34d399', '#fbbf24', '#f87171',
  '#fb923c', '#e879f9', '#22d3ee', '#4ade80',
  '#facc15', '#f472b6', '#818cf8'
];

export const EMPLOYMENT_TYPES = ['Full-time', 'Part-time', 'Contract'];
export const GENDERS = ['Male', 'Female', 'Non-binary', 'Prefer not to say'];
