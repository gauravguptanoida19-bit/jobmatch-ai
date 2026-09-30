'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowLeft,
  Users,
  Sparkles,
  CheckCircle2,
  XCircle,
  FileText,
  MapPin,
  Briefcase,
  GraduationCap,
  Layers,
  ChevronRight,
  Filter,
  Eye,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { MatchScoreCard } from '@/components/matching/MatchScoreCard';
import { Sidebar } from '@/components/layout/Sidebar';
import { getStatusBadgeVariant } from '@/lib/utils';
import { MatchExplanation } from '@/types';

export default function JobApplicantsClient({ initialJobId }: { initialJobId?: string }) {
  const params = useParams();
  const jobId = (initialJobId || params?.id) as string;

  const [loading, setLoading] = React.useState(true);
  const [job, setJob] = React.useState<any>(null);
  const [applicants, setApplicants] = React.useState<any[]>([]);
  const [scoreFilter, setScoreFilter] = React.useState<number>(0);
  const [statusFilter, setStatusFilter] = React.useState<string>('ALL');

  // Selected candidate for deep inspection modal
  const [selectedApplicant, setSelectedApplicant] = React.useState<any | null>(null);

  const loadData = React.useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/jobs/${jobId}/applicants`);
      if (res.ok) {
        const data = await res.json();
        setJob(data.job);
        setApplicants(data.applicants || []);
      }
    } catch (err) {
      console.error('Failed to load job applicants:', err);
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  const handleStatusChange = async (applicationId: string, newStatus: string) => {
    try {
      const res = await fetch('/api/applications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicationId, status: newStatus }),
      });
      if (res.ok) {
        setApplicants((prev) =>
          prev.map((app) =>
            app.applicationId === applicationId ? { ...app, status: newStatus } : app
          )
        );
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  // Filter applicants
  const filteredApplicants = applicants.filter((app) => {
    if (app.match.overallScore < scoreFilter) return false;
    if (statusFilter !== 'ALL' && app.status !== statusFilter) return false;
    return true;
  });

  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      <Sidebar role="RECRUITER" />

      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        {/* Navigation Breadcrumb */}
        <div>
          <Link
            href="/dashboard/recruiter"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to All Jobs
          </Link>
        </div>

        {/* Job Header Card */}
        <Card className="shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs uppercase font-bold text-indigo-600">Applicant Pipeline</span>
                <CardTitle className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">
                  {job?.title || 'Job Applicants'}
                </CardTitle>
                <p className="text-sm text-slate-500 font-medium">
                  {job?.company}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="text-xs font-semibold">
                  {applicants.length} Total Applicants
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0 border-t border-slate-100 dark:border-slate-800 space-y-2 pt-3">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="font-bold text-slate-400 uppercase">Required:</span>
              {job?.requiredSkills?.map((sk: string) => (
                <Badge key={sk} variant="default" className="text-[10px] py-0">
                  {sk}
                </Badge>
              ))}
              {job?.preferredSkills?.length > 0 && (
                <>
                  <span className="font-bold text-slate-400 uppercase ml-2">Preferred:</span>
                  {job.preferredSkills.map((sk: string) => (
                    <Badge key={sk} variant="secondary" className="text-[10px] py-0">
                      {sk}
                    </Badge>
                  ))}
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Filters */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm text-xs">
          <div className="flex items-center gap-2 font-bold text-slate-700 dark:text-slate-300">
            <Filter className="h-4 w-4 text-indigo-500" />
            <span>Filter Candidates:</span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500">Min Score:</span>
              <select
                value={scoreFilter}
                onChange={(e) => setScoreFilter(Number(e.target.value))}
                className="h-8 px-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-semibold"
              >
                <option value={0}>All Scores</option>
                <option value={70}>70%+ Match</option>
                <option value={80}>80%+ Match</option>
                <option value={85}>85%+ Top Tier</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-slate-500">Stage:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-8 px-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-semibold"
              >
                <option value="ALL">All Stages</option>
                <option value="APPLIED">Applied</option>
                <option value="SCREENING">Screening</option>
                <option value="INTERVIEW">Interview</option>
                <option value="OFFER">Offer</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>
          </div>
        </div>

        {/* Ranked Applicants Table */}
        <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-xs uppercase text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-5 py-4">Rank & Candidate</th>
                <th className="px-5 py-4">Overall Fit</th>
                <th className="px-5 py-4">Match Sub-Scores</th>
                <th className="px-5 py-4">Missing Skills</th>
                <th className="px-5 py-4">Status & Pipeline</th>
                <th className="px-5 py-4 text-right">Deep Dive</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredApplicants.map((app, index) => {
                const { candidate, match } = app;
                return (
                  <tr
                    key={app.applicationId}
                    className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 font-mono text-xs font-bold text-slate-600 dark:text-slate-300">
                          #{index + 1}
                        </span>
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white">
                            {candidate.name}
                          </div>
                          <p className="text-xs text-slate-500 line-clamp-1">
                            {candidate.headline || `${candidate.yearsOfExperience} yrs experience`}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-xl font-black text-indigo-600 dark:text-indigo-400">
                          {match.overallScore}%
                        </span>
                        <Badge
                          variant={match.overallScore >= 85 ? 'success' : 'default'}
                          className="text-[10px] py-0"
                        >
                          {match.overallScore >= 85 ? 'Top Fit' : 'Qualified'}
                        </Badge>
                      </div>
                    </td>

                    <td className="px-5 py-4 text-xs">
                      <div className="space-y-1 w-44">
                        <div className="flex justify-between text-[11px] text-slate-500">
                          <span>Skills: {match.breakdown.skillsMatch}%</span>
                          <span>Semantic: {match.breakdown.semanticMatch}%</span>
                        </div>
                        <Progress value={match.overallScore} className="h-1.5" />
                        <div className="flex justify-between text-[10px] text-slate-400">
                          <span>Exp: {match.breakdown.experienceMatch}%</span>
                          <span>Edu: {match.breakdown.educationMatch}%</span>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {match.missingSkills.length > 0 ? (
                          match.missingSkills.slice(0, 3).map((sk: string) => (
                            <span
                              key={sk}
                              className="px-2 py-0.5 rounded text-[10px] bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900 font-medium"
                            >
                              {sk}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-emerald-600 font-semibold">
                            Full Stack Match
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <select
                        value={app.status}
                        onChange={(e) => handleStatusChange(app.applicationId, e.target.value)}
                        className={`text-xs font-bold rounded-lg px-2.5 py-1.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 cursor-pointer ${getStatusBadgeVariant(
                          app.status
                        )}`}
                      >
                        <option value="APPLIED">Applied</option>
                        <option value="SCREENING">Screening</option>
                        <option value="INTERVIEW">Interview</option>
                        <option value="OFFER">Offer</option>
                        <option value="REJECTED">Rejected</option>
                      </select>
                    </td>

                    <td className="px-5 py-4 text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          setSelectedApplicant({
                            candidate,
                            match,
                            jobTitle: job?.title,
                            coverLetter: app.coverLetter,
                          })
                        }
                        className="text-xs gap-1"
                      >
                        <Eye className="h-3.5 w-3.5" /> Explain Fit
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </main>

      {/* Deep Inspection Explainability Modal */}
      <Dialog
        open={!!selectedApplicant}
        onOpenChange={(open) => {
          if (!open) setSelectedApplicant(null);
        }}
      >
        {selectedApplicant && (
          <DialogContent onClose={() => setSelectedApplicant(null)}>
            <div className="space-y-4">
              <MatchScoreCard
                match={selectedApplicant.match}
                jobTitle={selectedApplicant.jobTitle}
                candidateName={selectedApplicant.candidate.name}
              />

              {/* Candidate Info Highlights */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-xs space-y-2">
                <h4 className="font-bold uppercase tracking-wider text-slate-500">
                  Candidate Profile Details
                </h4>
                <div className="grid grid-cols-2 gap-2 text-slate-700 dark:text-slate-300">
                  <p>
                    <span className="font-semibold text-slate-400">Email:</span>{' '}
                    {selectedApplicant.candidate.email}
                  </p>
                  <p>
                    <span className="font-semibold text-slate-400">Experience:</span>{' '}
                    {selectedApplicant.candidate.yearsOfExperience} Years
                  </p>
                  <p>
                    <span className="font-semibold text-slate-400">Education:</span>{' '}
                    {selectedApplicant.candidate.educationLevel}
                  </p>
                  <p>
                    <span className="font-semibold text-slate-400">Location:</span>{' '}
                    {selectedApplicant.candidate.location || 'Remote'}
                  </p>
                </div>
                {selectedApplicant.coverLetter && (
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                    <span className="font-semibold text-slate-400">Application Note:</span>
                    <p className="mt-0.5 italic text-slate-600 dark:text-slate-400">
                      &quot;{selectedApplicant.coverLetter}&quot;
                    </p>
                  </div>
                )}
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
