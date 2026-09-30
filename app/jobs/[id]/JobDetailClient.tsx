'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowLeft,
  Briefcase,
  MapPin,
  DollarSign,
  Clock,
  GraduationCap,
  Sparkles,
  CheckCircle2,
  XCircle,
  Building2,
  Send,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MatchScoreCard } from '@/components/matching/MatchScoreCard';
import { formatSalary } from '@/lib/utils';
import { MatchExplanation } from '@/types';

export default function JobDetailClient({ initialJobId }: { initialJobId?: string }) {
  const params = useParams();
  const jobId = (initialJobId || params?.id) as string;

  const [job, setJob] = React.useState<any>(null);
  const [matchData, setMatchData] = React.useState<MatchExplanation | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [applying, setApplying] = React.useState(false);
  const [applied, setApplied] = React.useState(false);

  React.useEffect(() => {
    async function fetchJobAndMatch() {
      try {
        setLoading(true);
        const jobRes = await fetch(`/api/jobs/${jobId}`);
        if (jobRes.ok) {
          const jData = await jobRes.json();
          setJob(jData.job);
        }

        // Try to fetch match against active candidate
        const matchRes = await fetch(`/api/candidates/recommendations`);
        if (matchRes.ok) {
          const mData = await matchRes.json();
          const found = mData.recommendations?.find((r: any) => r.job.id === jobId);
          if (found) {
            setMatchData(found.match);
            if (found.job.hasApplied) setApplied(true);
          }
        }
      } catch (err) {
        console.error('Failed to load job details:', err);
      } finally {
        setLoading(false);
      }
    }

    if (jobId) {
      fetchJobAndMatch();
    }
  }, [jobId]);

  const handleApply = async () => {
    try {
      setApplying(true);
      const res = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId }),
      });
      if (res.ok) {
        setApplied(true);
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to submit application');
      }
    } catch (err) {
      console.error('Apply error:', err);
    } finally {
      setApplying(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h2 className="text-xl font-bold">Job position not found</h2>
        <Link href="/jobs" className="text-indigo-600 hover:underline mt-2 inline-block">
          Return to jobs
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <Link
          href="/jobs"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 transition-colors mb-3"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to All Positions
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Column: Job Description & Details */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <Badge variant="outline" className="text-xs uppercase font-bold text-indigo-600 mb-2">
                    {job.remoteType} • {job.type}
                  </Badge>
                  <CardTitle className="text-3xl font-black text-slate-900 dark:text-white">
                    {job.title}
                  </CardTitle>
                  <div className="flex items-center gap-2 text-sm text-slate-500 font-semibold mt-1">
                    <Building2 className="h-4 w-4 text-slate-400" />
                    <span>{job.company}</span>
                    <span>•</span>
                    <MapPin className="h-4 w-4 text-slate-400" />
                    <span>{job.location}</span>
                  </div>
                </div>

                <Button
                  size="lg"
                  disabled={applied || applying}
                  onClick={handleApply}
                  className={
                    applied
                      ? 'bg-emerald-600 hover:bg-emerald-600 text-white font-bold'
                      : 'bg-indigo-600 hover:bg-indigo-700 text-white font-bold'
                  }
                >
                  {applied ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 mr-2" /> Applied
                    </>
                  ) : applying ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" /> Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" /> Easy Apply
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>

            <CardContent className="space-y-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-sm">
              {/* Highlights bar */}
              <div className="grid grid-cols-3 gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 text-xs">
                <div>
                  <span className="text-slate-400 font-medium">Compensation</span>
                  <p className="font-bold text-slate-900 dark:text-white text-sm mt-0.5">
                    {formatSalary(job.minSalary)} - {formatSalary(job.maxSalary)} / yr
                  </p>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Required Experience</span>
                  <p className="font-bold text-slate-900 dark:text-white text-sm mt-0.5">
                    {job.minExperience} - {job.maxExperience} Years
                  </p>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Education</span>
                  <p className="font-bold text-slate-900 dark:text-white text-sm mt-0.5">
                    {job.educationLevel}
                  </p>
                </div>
              </div>

              {/* Skills required & preferred */}
              <div className="space-y-2">
                <h3 className="font-bold uppercase tracking-wider text-xs text-slate-400">
                  Target Stack & Skills
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {job.skills?.map((js: any) => (
                    <Badge
                      key={js.id || js.skill.name}
                      variant={js.isRequired ? 'default' : 'secondary'}
                      className="px-3 py-1 font-semibold text-xs"
                    >
                      {js.skill.name}
                      {js.isRequired && (
                        <span className="ml-1 text-[10px] text-indigo-600 dark:text-indigo-400">
                          (Req)
                        </span>
                      )}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div className="space-y-3">
                <h3 className="font-bold uppercase tracking-wider text-xs text-slate-400">
                  Role Overview & Architecture
                </h3>
                <div className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                  {job.description}
                </div>
              </div>

              {/* Requirements */}
              {job.requirements && (
                <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <h3 className="font-bold uppercase tracking-wider text-xs text-slate-400">
                    Requirements
                  </h3>
                  <div className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                    {job.requirements}
                  </div>
                </div>
              )}

              {/* Benefits */}
              {job.benefits && (
                <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <h3 className="font-bold uppercase tracking-wider text-xs text-slate-400">
                    Benefits & Perks
                  </h3>
                  <div className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                    {job.benefits}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: AI Match Explanation Card */}
        <div className="space-y-6">
          {matchData ? (
            <MatchScoreCard
              match={matchData}
              jobTitle={job.title}
              candidateName="Your Profile"
            />
          ) : (
            <Card className="p-6 text-center space-y-3">
              <Sparkles className="h-8 w-8 text-indigo-500 mx-auto" />
              <h3 className="font-bold text-base">Check Your Role Compatibility</h3>
              <p className="text-xs text-slate-500">
                Log in or upload your resume in the Candidate Portal to generate a live 5-criteria match breakdown.
              </p>
              <Link href="/dashboard/candidate">
                <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700">
                  Go to Candidate Portal
                </Button>
              </Link>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
