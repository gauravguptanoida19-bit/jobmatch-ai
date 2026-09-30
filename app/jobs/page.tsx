'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Briefcase,
  Search,
  MapPin,
  DollarSign,
  Filter,
  Sparkles,
  ArrowRight,
  Clock,
  Layers,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { formatSalary } from '@/lib/utils';

export default function JobsPage() {
  const [jobs, setJobs] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');
  const [remoteFilter, setRemoteFilter] = React.useState('');

  const loadJobs = React.useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (remoteFilter) params.set('remoteType', remoteFilter);

      const res = await fetch(`/api/jobs?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setJobs(data.jobs || []);
      }
    } catch (err) {
      console.error('Failed to load jobs:', err);
    } finally {
      setLoading(false);
    }
  }, [search, remoteFilter]);

  React.useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-black text-slate-900 dark:text-white">
              Explore Tech Opportunities
            </h1>
            <Badge variant="default" className="text-xs">
              {jobs.length} Active Positions
            </Badge>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Browse verified tech engineering positions with transparent compensation and instant match scoring.
          </p>
        </div>

        <Link href="/jobs/search">
          <Button variant="outline" className="gap-2 border-indigo-200 text-indigo-600 hover:bg-indigo-50 dark:border-indigo-800 dark:text-indigo-400">
            <Sparkles className="h-4 w-4" />
            Switch to AI Semantic Search
          </Button>
        </Link>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by job title, company, or tech stack..."
            className="pl-10"
          />
        </div>

        <select
          value={remoteFilter}
          onChange={(e) => setRemoteFilter(e.target.value)}
          className="h-10 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-medium"
        >
          <option value="">All Work Modes</option>
          <option value="REMOTE">Remote Only</option>
          <option value="HYBRID">Hybrid</option>
          <option value="ONSITE">On-Site</option>
        </select>
      </div>

      {/* Job Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {jobs.map((job) => (
          <Card
            key={job.id}
            className="flex flex-col justify-between hover:shadow-md transition-all border-slate-200 dark:border-slate-800 group"
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <Badge variant="outline" className="text-[10px] uppercase font-bold text-indigo-600 mb-1.5">
                    {job.remoteType}
                  </Badge>
                  <CardTitle className="text-base font-bold text-slate-900 dark:text-white line-clamp-1 group-hover:text-indigo-600 transition-colors">
                    {job.title}
                  </CardTitle>
                  <p className="text-xs text-slate-500 font-medium">{job.company}</p>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4 text-xs">
              <div className="flex flex-wrap items-center gap-3 text-slate-500">
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" /> {job.location}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" /> {job.minExperience}-{job.maxExperience} Yrs
                </span>
              </div>

              <div className="flex items-center gap-1 text-slate-800 dark:text-slate-200 font-bold text-sm">
                <DollarSign className="h-4 w-4 text-emerald-500" />
                {formatSalary(job.minSalary)} - {formatSalary(job.maxSalary)} / yr
              </div>

              <p className="text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                {job.description}
              </p>

              <div className="space-y-1 pt-1 border-t border-slate-100 dark:border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400">Core Skills:</span>
                <div className="flex flex-wrap gap-1">
                  {job.skills?.slice(0, 4).map((js: any) => (
                    <Badge
                      key={js.id || js.skill.name}
                      variant="secondary"
                      className="text-[10px] py-0 px-1.5 bg-slate-100 dark:bg-slate-800"
                    >
                      {js.skill.name}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>

            <div className="p-4 pt-0 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between mt-2">
              <span className="text-[11px] text-slate-400">
                {job._count?.applications || 0} applicants
              </span>
              <Link href={`/jobs/${job.id}`}>
                <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-xs gap-1">
                  View & Fit Match <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
