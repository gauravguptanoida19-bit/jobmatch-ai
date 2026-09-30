import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatSalary(amount: number): string {
  if (amount >= 1000) {
    return `$${Math.round(amount / 1000)}k`;
  }
  return `$${amount.toLocaleString()}`;
}

export function formatPercent(val: number): string {
  return `${Math.round(val)}%`;
}

export function getScoreColor(score: number): {
  text: string;
  bg: string;
  border: string;
  ring: string;
} {
  if (score >= 85) {
    return {
      text: 'text-emerald-700 dark:text-emerald-400',
      bg: 'bg-emerald-50 dark:bg-emerald-950/40',
      border: 'border-emerald-200 dark:border-emerald-800',
      ring: 'stroke-emerald-500 text-emerald-500',
    };
  }
  if (score >= 70) {
    return {
      text: 'text-indigo-700 dark:text-indigo-400',
      bg: 'bg-indigo-50 dark:bg-indigo-950/40',
      border: 'border-indigo-200 dark:border-indigo-800',
      ring: 'stroke-indigo-500 text-indigo-500',
    };
  }
  if (score >= 50) {
    return {
      text: 'text-amber-700 dark:text-amber-400',
      bg: 'bg-amber-50 dark:bg-amber-950/40',
      border: 'border-amber-200 dark:border-amber-800',
      ring: 'stroke-amber-500 text-amber-500',
    };
  }
  return {
    text: 'text-rose-700 dark:text-rose-400',
    bg: 'bg-rose-50 dark:bg-rose-950/40',
    border: 'border-rose-200 dark:border-rose-800',
    ring: 'stroke-rose-500 text-rose-500',
  };
}

export function getStatusBadgeVariant(status: string): string {
  switch (status.toUpperCase()) {
    case 'OFFER':
      return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300';
    case 'INTERVIEW':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300';
    case 'SCREENING':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300';
    case 'APPLIED':
      return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300';
    case 'REJECTED':
      return 'bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-300';
    default:
      return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300';
  }
}
