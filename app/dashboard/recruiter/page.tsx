'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Briefcase,
  Users,
  BarChart3,
  PlusCircle,
  Sparkles,
  MapPin,
  Clock,
  DollarSign,
  ChevronRight,
  TrendingUp,
  Search,
  CheckCircle2,
  Trash2,
  Layers,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Sidebar } from '@/components/layout/Sidebar';
import { formatSalary } from '@/lib/utils';

export default function RecruiterDashboard() {
  const [loading, setLoading] = React.useState(true);
  const [jobs, setJobs] = React.useState<any[]>([]);
  const [stats, setStats] = React.useState<any>({
    totalJobs: 0,
    totalCandidates: 0,
    totalApplications: 0,
    shortlistedCandidates: 0,
    averageMatchScore: 84,
  });

  // Job creation modal state
  const [createModalOpen, setCreateModalOpen] = React.useState(false);
  const [creating, setCreating] = React.useState(false);
  const [newJob, setNewJob] = React.useState({
    title: '',
    company: 'Tech Recruiting Co.',
    location: 'San Francisco, CA / Remote',
    remoteType: 'REMOTE',
    type: 'FULL_TIME',
    minExperience: 3,
    maxExperience: 6,
    educationLevel: "Bachelor's",
    minSalary: 120000,
    maxSalary: 170000,
    description: '',
    requiredSkills: '',
    preferredSkills: '',
  });

  const loadData = React.useCallback(async () => {
    try {
      setLoading(true);
      const [jobsRes, analyticsRes] = await Promise.all([
        fetch('/api/jobs'),
        fetch('/api/analytics'),
      ]);

      if (jobsRes.ok) {
        const jData = await jobsRes.json();
        setJobs(jData.jobs || []);
      }

      if (analyticsRes.ok) {
        const aData = await analyticsRes.json();
        if (aData.metrics) {
          setStats(aData.metrics);
        }
      }
    } catch (err) {
      console.error('Failed to load recruiter data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setCreating(true);
      const reqSkills = newJob.requiredSkills
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      const prefSkills = newJob.preferredSkills
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const res = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newJob,
          minExperience: Number(newJob.minExperience),
          maxExperience: Number(newJob.maxExperience),
          minSalary: Number(newJob.minSalary),
          maxSalary: Number(newJob.maxSalary),
          requiredSkills: reqSkills,
          preferredSkills: prefSkills,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to create job');
      }

      setCreateModalOpen(false);
      // Reset form
      setNewJob({
        title: '',
        company: 'Tech Recruiting Co.',
        location: 'San Francisco, CA / Remote',
        remoteType: 'REMOTE',
        type: 'FULL_TIME',
        minExperience: 3,
        maxExperience: 6,
        educationLevel: "Bachelor's",
        minSalary: 120000,
        maxSalary: 170000,
        description: '',
        requiredSkills: '',
        preferredSkills: '',
      });
      await loadData();
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteJob = async (jobId: string) => {
    if (!confirm('Are you sure you want to delete this job position?')) return;
    try {
      const res = await fetch(`/api/jobs/${jobId}`, { method: 'DELETE' });
      if (res.ok) {
        await loadData();
      }
    } catch (err) {
      console.error('Failed to delete job:', err);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      <Sidebar role="RECRUITER" />

      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                Recruiter Talent Suite
              </h1>
              <Badge variant="default" className="text-xs bg-indigo-600">
                ATS & Matching
              </Badge>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Manage open requisitions, inspect AI-ranked applicants, and search candidates semantically.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Link href="/dashboard/recruiter/search">
              <Button variant="outline" size="sm" className="gap-1.5">
                <Search className="h-4 w-4" />
                Semantic Candidate Search
              </Button>
            </Link>
            <Button
              onClick={() => setCreateModalOpen(true)}
              size="sm"
              className="gap-1.5 bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-500/20"
            >
              <PlusCircle className="h-4 w-4" />
              Post New Position
            </Button>
          </div>
        </div>

        {/* KPI Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card className="p-4 shadow-sm">
            <span className="text-xs text-slate-400 font-semibold uppercase">Active Jobs</span>
            <div className="flex items-center justify-between mt-1">
              <span className="text-2xl font-black text-slate-900 dark:text-white">
                {stats.totalJobs || jobs.length}
              </span>
              <Briefcase className="h-5 w-5 text-indigo-500" />
            </div>
          </Card>

          <Card className="p-4 shadow-sm">
            <span className="text-xs text-slate-400 font-semibold uppercase">Total Candidates</span>
            <div className="flex items-center justify-between mt-1">
              <span className="text-2xl font-black text-slate-900 dark:text-white">
                {stats.totalCandidates || 16}
              </span>
              <Users className="h-5 w-5 text-violet-500" />
            </div>
          </Card>

          <Card className="p-4 shadow-sm">
            <span className="text-xs text-slate-400 font-semibold uppercase">Applications</span>
            <div className="flex items-center justify-between mt-1">
              <span className="text-2xl font-black text-slate-900 dark:text-white">
                {stats.totalApplications || 24}
              </span>
              <TrendingUp className="h-5 w-5 text-emerald-500" />
            </div>
          </Card>

          <Card className="p-4 shadow-sm">
            <span className="text-xs text-slate-400 font-semibold uppercase">Shortlisted</span>
            <div className="flex items-center justify-between mt-1">
              <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                {stats.shortlistedCandidates || 8}
              </span>
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            </div>
          </Card>

          <Card className="p-4 shadow-sm col-span-2 md:col-span-1">
            <span className="text-xs text-slate-400 font-semibold uppercase">Avg Match Score</span>
            <div className="flex items-center justify-between mt-1">
              <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
                {stats.averageMatchScore || 82}%
              </span>
              <Sparkles className="h-5 w-5 text-indigo-500" />
            </div>
          </Card>
        </div>

        {/* Active Jobs Table */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black text-slate-900 dark:text-white">
              Job Positions ({jobs.length})
            </h2>
            <Link href="/dashboard/recruiter/analytics">
              <Button variant="ghost" size="sm" className="text-indigo-600 gap-1 text-xs">
                <BarChart3 className="h-4 w-4" />
                View Analytics
              </Button>
            </Link>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-xs uppercase text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-5 py-4">Title & Details</th>
                  <th className="px-5 py-4">Required Stack</th>
                  <th className="px-5 py-4">Compensation</th>
                  <th className="px-5 py-4">Applicants</th>
                  <th className="px-5 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {jobs.map((job) => (
                  <tr
                    key={job.id}
                    className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="px-5 py-4">
                      <div>
                        <Link
                          href={`/dashboard/recruiter/jobs/${job.id}`}
                          className="font-bold text-slate-900 dark:text-white hover:text-indigo-600 transition-colors text-base"
                        >
                          {job.title}
                        </Link>
                        <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                          <span className="font-semibold">{job.company}</span>
                          <span>•</span>
                          <span>{job.location}</span>
                          <span>•</span>
                          <Badge variant="outline" className="text-[10px] py-0">
                            {job.remoteType}
                          </Badge>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {job.skills?.slice(0, 4).map((js: any) => (
                          <Badge
                            key={js.id || js.skill.name}
                            variant={js.isRequired ? 'default' : 'secondary'}
                            className="text-[10px] py-0 px-1.5"
                          >
                            {js.skill.name}
                          </Badge>
                        ))}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {formatSalary(job.minSalary)} - {formatSalary(job.maxSalary)}
                    </td>
                    <td className="px-5 py-4">
                      <Link href={`/dashboard/recruiter/jobs/${job.id}`}>
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 text-xs font-bold transition-colors">
                          <Users className="h-3.5 w-3.5" />
                          <span>{job._count?.applications ?? 0} Ranked</span>
                        </div>
                      </Link>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/dashboard/recruiter/jobs/${job.id}`}>
                          <Button size="sm" variant="outline" className="text-xs gap-1">
                            Applicants <ChevronRight className="h-3.5 w-3.5" />
                          </Button>
                        </Link>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteJob(job.id)}
                          className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 p-2"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      {/* Create Job Dialog */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent onClose={() => setCreateModalOpen(false)}>
          <DialogHeader>
            <DialogTitle>Post a New Tech Position</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreateJob} className="space-y-4 pt-4 text-sm">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Job Title *
              </label>
              <Input
                required
                value={newJob.title}
                onChange={(e) => setNewJob({ ...newJob, title: e.target.value })}
                placeholder="e.g. Senior AI Engineer / LLM Platform"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Company Name *
                </label>
                <Input
                  required
                  value={newJob.company}
                  onChange={(e) => setNewJob({ ...newJob, company: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Location *
                </label>
                <Input
                  required
                  value={newJob.location}
                  onChange={(e) => setNewJob({ ...newJob, location: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Work Mode
                </label>
                <select
                  value={newJob.remoteType}
                  onChange={(e) => setNewJob({ ...newJob, remoteType: e.target.value })}
                  className="w-full h-10 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
                >
                  <option value="REMOTE">Remote</option>
                  <option value="HYBRID">Hybrid</option>
                  <option value="ONSITE">On-site</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Min Exp (Years)
                </label>
                <Input
                  type="number"
                  value={newJob.minExperience}
                  onChange={(e) =>
                    setNewJob({ ...newJob, minExperience: parseInt(e.target.value, 10) })
                  }
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Max Exp (Years)
                </label>
                <Input
                  type="number"
                  value={newJob.maxExperience}
                  onChange={(e) =>
                    setNewJob({ ...newJob, maxExperience: parseInt(e.target.value, 10) })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Min Salary ($)
                </label>
                <Input
                  type="number"
                  value={newJob.minSalary}
                  onChange={(e) =>
                    setNewJob({ ...newJob, minSalary: parseInt(e.target.value, 10) })
                  }
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Max Salary ($)
                </label>
                <Input
                  type="number"
                  value={newJob.maxSalary}
                  onChange={(e) =>
                    setNewJob({ ...newJob, maxSalary: parseInt(e.target.value, 10) })
                  }
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Required Skills (comma-separated) *
              </label>
              <Input
                required
                value={newJob.requiredSkills}
                onChange={(e) => setNewJob({ ...newJob, requiredSkills: e.target.value })}
                placeholder="Python, PyTorch, PostgreSQL, pgvector"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Preferred Skills (comma-separated)
              </label>
              <Input
                value={newJob.preferredSkills}
                onChange={(e) => setNewJob({ ...newJob, preferredSkills: e.target.value })}
                placeholder="Docker, Kubernetes, Kafka"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Job Description *
              </label>
              <textarea
                required
                rows={4}
                value={newJob.description}
                onChange={(e) => setNewJob({ ...newJob, description: e.target.value })}
                placeholder="Describe role responsibilities, tech architecture, and expectations..."
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={creating}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                {creating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-1" /> Generating Embedding &
                    Publishing...
                  </>
                ) : (
                  'Publish Position'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
