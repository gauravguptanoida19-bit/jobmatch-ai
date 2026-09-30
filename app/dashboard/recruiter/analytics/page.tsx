'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  BarChart3,
  TrendingUp,
  Users,
  Briefcase,
  CheckCircle2,
  Sparkles,
  ArrowLeft,
  Layers,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sidebar } from '@/components/layout/Sidebar';

export default function AnalyticsDashboardPage() {
  const [data, setData] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function fetchAnalytics() {
      try {
        setLoading(true);
        const res = await fetch('/api/analytics');
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (err) {
        console.error('Failed to load analytics:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchAnalytics();
  }, []);

  const COLORS = ['#6366f1', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'];

  const scoreData = data?.scoreDistribution || [
    { name: '90-100%', count: 8 },
    { name: '80-89%', count: 12 },
    { name: '70-79%', count: 7 },
    { name: '60-69%', count: 3 },
    { name: '<60%', count: 1 },
  ];

  const skillsData = data?.skillsComparison || [
    { skill: 'Python', demand: 8, supply: 12 },
    { skill: 'TypeScript', demand: 9, supply: 14 },
    { skill: 'PostgreSQL', demand: 7, supply: 10 },
    { skill: 'React', demand: 9, supply: 15 },
    { skill: 'Docker', demand: 6, supply: 8 },
    { skill: 'PyTorch', demand: 5, supply: 4 },
    { skill: 'Kubernetes', demand: 5, supply: 3 },
    { skill: 'Kafka', demand: 4, supply: 2 },
  ];

  const funnelData = data?.pipelineFunnel || [
    { stage: 'Applied', count: 31 },
    { stage: 'Screening', count: 18 },
    { stage: 'Interview', count: 10 },
    { stage: 'Offer', count: 4 },
  ];

  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      <Sidebar role="RECRUITER" />

      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
        <div>
          <Link
            href="/dashboard/recruiter"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 transition-colors mb-2"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to ATS
          </Link>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              Recruitment Analytics & Skill Gap Intelligence
            </h1>
            <Badge variant="default" className="text-xs bg-indigo-600">
              Live Recharts
            </Badge>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time candidate match distributions, talent pipeline throughput, and market skill shortages.
          </p>
        </div>

        {/* Top KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card className="p-4 shadow-sm">
            <span className="text-xs text-slate-400 font-semibold uppercase">Total Jobs</span>
            <div className="flex items-center justify-between mt-1">
              <span className="text-2xl font-black">{data?.metrics?.totalJobs ?? 12}</span>
              <Briefcase className="h-5 w-5 text-indigo-500" />
            </div>
          </Card>

          <Card className="p-4 shadow-sm">
            <span className="text-xs text-slate-400 font-semibold uppercase">Candidates</span>
            <div className="flex items-center justify-between mt-1">
              <span className="text-2xl font-black">{data?.metrics?.totalCandidates ?? 16}</span>
              <Users className="h-5 w-5 text-violet-500" />
            </div>
          </Card>

          <Card className="p-4 shadow-sm">
            <span className="text-xs text-slate-400 font-semibold uppercase">Applications</span>
            <div className="flex items-center justify-between mt-1">
              <span className="text-2xl font-black">{data?.metrics?.totalApplications ?? 31}</span>
              <TrendingUp className="h-5 w-5 text-blue-500" />
            </div>
          </Card>

          <Card className="p-4 shadow-sm">
            <span className="text-xs text-slate-400 font-semibold uppercase">Shortlisted</span>
            <div className="flex items-center justify-between mt-1">
              <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                {data?.metrics?.shortlistedCandidates ?? 10}
              </span>
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            </div>
          </Card>

          <Card className="p-4 shadow-sm col-span-2 md:col-span-1">
            <span className="text-xs text-slate-400 font-semibold uppercase">Avg Match Score</span>
            <div className="flex items-center justify-between mt-1">
              <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
                {data?.metrics?.averageMatchScore ?? 84}%
              </span>
              <Sparkles className="h-5 w-5 text-indigo-500" />
            </div>
          </Card>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Match Score Distribution */}
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-indigo-600" />
                Candidate Match Score Distribution
              </CardTitle>
              <CardDescription className="text-xs">
                Distribution of candidate overall fit scores across current applications.
              </CardDescription>
            </CardHeader>
            <CardContent className="h-72 pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={scoreData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#6366f1" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Application Pipeline Funnel */}
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-emerald-600" />
                Recruitment Pipeline Throughput
              </CardTitle>
              <CardDescription className="text-xs">
                Candidate progression across hiring stages from application to final offer.
              </CardDescription>
            </CardHeader>
            <CardContent className="h-72 pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={funnelData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis type="number" tick={{ fontSize: 12 }} />
                  <YAxis dataKey="stage" type="category" tick={{ fontSize: 12 }} width={80} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#10b981" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Skill In-Demand vs Candidate Supply */}
          <Card className="shadow-sm lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Layers className="h-4 w-4 text-violet-600" />
                Skills Market Analysis: Requisition Demand vs Candidate Supply
              </CardTitle>
              <CardDescription className="text-xs">
                Identifies top hiring skill bottlenecks and applicant talent surpluses.
              </CardDescription>
            </CardHeader>
            <CardContent className="h-80 pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={skillsData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="skill" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="demand" name="Requisition Demand" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="supply" name="Candidate Availability" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
