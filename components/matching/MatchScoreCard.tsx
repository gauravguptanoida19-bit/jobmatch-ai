'use client';

import * as React from 'react';
import {
  CheckCircle2,
  XCircle,
  Lightbulb,
  Sparkles,
  Layers,
  GraduationCap,
  Briefcase,
  Compass,
  Cpu,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { MatchGauge } from '@/components/matching/MatchGauge';
import { MatchExplanation } from '@/types';
import { getScoreColor } from '@/lib/utils';

interface MatchScoreCardProps {
  match: MatchExplanation;
  candidateName?: string;
  jobTitle?: string;
  compact?: boolean;
}

export function MatchScoreCard({
  match,
  candidateName,
  jobTitle,
  compact = false,
}: MatchScoreCardProps) {
  const { breakdown, overallScore, matchingSkills, missingSkills, strengths, recommendations, summary } =
    match;

  const scoreBadgeColors = getScoreColor(overallScore);

  const subMetrics = [
    {
      label: 'Skills Match',
      weight: '35%',
      value: breakdown.skillsMatch,
      icon: Layers,
      color: 'bg-indigo-600',
    },
    {
      label: 'Semantic Match',
      weight: '25%',
      value: breakdown.semanticMatch,
      icon: Cpu,
      color: 'bg-violet-600',
    },
    {
      label: 'Experience Match',
      weight: '20%',
      value: breakdown.experienceMatch,
      icon: Briefcase,
      color: 'bg-emerald-600',
    },
    {
      label: 'Education Match',
      weight: '10%',
      value: breakdown.educationMatch,
      icon: GraduationCap,
      color: 'bg-amber-600',
    },
    {
      label: 'Preferences Match',
      weight: '10%',
      value: breakdown.preferencesMatch,
      icon: Compass,
      color: 'bg-cyan-600',
    },
  ];

  return (
    <Card className="overflow-hidden border-slate-200 dark:border-slate-800 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-slate-50 to-indigo-50/40 dark:from-slate-900 dark:to-indigo-950/20 pb-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="flex h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
              <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                AI Match Intelligence
              </span>
            </div>
            <CardTitle className="text-xl font-bold text-slate-900 dark:text-white">
              {jobTitle ? `${jobTitle} Fit Analysis` : 'Match Compatibility'}
            </CardTitle>
            {candidateName && (
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Evaluated for <span className="font-semibold text-slate-700 dark:text-slate-200">{candidateName}</span>
              </p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <MatchGauge score={overallScore} size={compact ? 'sm' : 'md'} showLabel={false} />
            <div className="text-right">
              <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                {overallScore}%
              </span>
              <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">
                Overall Fit
              </p>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6 pt-6">
        {/* Summary banner */}
        {summary && (
          <div className="p-3.5 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900 text-sm text-indigo-900 dark:text-indigo-200 flex items-start gap-2.5">
            <Sparkles className="h-5 w-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed font-medium">{summary}</p>
          </div>
        )}

        {/* 5-Criteria Multi-Weighted Breakdown */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
            Weighted Score Breakdown
          </h4>
          <div className="space-y-3">
            {subMetrics.map((metric) => {
              const Icon = metric.icon;
              return (
                <div key={metric.label} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
                      <Icon className="h-3.5 w-3.5 text-slate-400" />
                      <span>{metric.label}</span>
                      <span className="text-slate-400 font-normal">({metric.weight})</span>
                    </div>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {metric.value}%
                    </span>
                  </div>
                  <Progress
                    value={metric.value}
                    indicatorClassName={metric.color}
                    className="h-2"
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* Why this candidate matches */}
        {strengths && strengths.length > 0 && (
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4" />
              Why this candidate matches
            </h4>
            <ul className="space-y-1.5">
              {strengths.map((str, idx) => (
                <li
                  key={idx}
                  className="text-sm text-slate-700 dark:text-slate-300 flex items-start gap-2"
                >
                  <span className="text-emerald-500 font-bold mt-0.5">•</span>
                  <span>{str}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Missing Skills */}
        {missingSkills && missingSkills.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
              <XCircle className="h-4 w-4" />
              Missing Skills
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {missingSkills.map((sk, idx) => (
                <Badge
                  key={idx}
                  variant="destructive"
                  className="bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900"
                >
                  {sk}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Matching Skills */}
        {matchingSkills && matchingSkills.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              Matching Skills Found ({matchingSkills.length})
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {matchingSkills.map((sk, idx) => (
                <Badge
                  key={idx}
                  variant="success"
                  className="bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800"
                >
                  {sk}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Actionable Recommendations */}
        {recommendations && recommendations.length > 0 && (
          <div className="p-4 rounded-xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/50 space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-400 flex items-center gap-1.5">
              <Lightbulb className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              Candidate Recommendation
            </h4>
            <ul className="space-y-1.5">
              {recommendations.map((rec, idx) => (
                <li
                  key={idx}
                  className="text-xs leading-relaxed text-amber-950 dark:text-amber-200"
                >
                  {rec}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
