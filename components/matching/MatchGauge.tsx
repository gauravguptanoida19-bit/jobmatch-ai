'use client';

import * as React from 'react';
import { getScoreColor } from '@/lib/utils';

interface MatchGaugeProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export function MatchGauge({ score, size = 'md', showLabel = true }: MatchGaugeProps) {
  const percentage = Math.min(100, Math.max(0, Math.round(score)));
  const colors = getScoreColor(percentage);

  const dimensions = {
    sm: { size: 64, stroke: 6, text: 'text-base font-bold' },
    md: { size: 96, stroke: 8, text: 'text-2xl font-black' },
    lg: { size: 128, stroke: 10, text: 'text-3xl font-black' },
  }[size];

  const radius = (dimensions.size - dimensions.stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative inline-flex items-center justify-center">
        <svg
          width={dimensions.size}
          height={dimensions.size}
          className="transform -rotate-90"
        >
          {/* Background circle */}
          <circle
            cx={dimensions.size / 2}
            cy={dimensions.size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={dimensions.stroke}
            className="text-slate-100 dark:text-slate-800"
            fill="transparent"
          />
          {/* Progress circle */}
          <circle
            cx={dimensions.size / 2}
            cy={dimensions.size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={dimensions.stroke}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className={`${colors.ring} transition-all duration-700 ease-out`}
            fill="transparent"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`${dimensions.text} ${colors.text}`}>
            {percentage}%
          </span>
        </div>
      </div>
      {showLabel && (
        <span className="mt-1 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Match Score
        </span>
      )}
    </div>
  );
}
