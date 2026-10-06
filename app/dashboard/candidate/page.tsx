'use client';

import * as React from 'react';
import {
  UploadCloud,
  FileText,
  Sparkles,
  CheckCircle2,
  XCircle,
  Briefcase,
  GraduationCap,
  Layers,
  MapPin,
  Clock,
  DollarSign,
  ChevronRight,
  AlertCircle,
  ExternalLink,
  Award,
  Send,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { MatchScoreCard } from '@/components/matching/MatchScoreCard';
import { MatchGauge } from '@/components/matching/MatchGauge';
import { Sidebar } from '@/components/layout/Sidebar';
import { formatSalary, getStatusBadgeVariant } from '@/lib/utils';
import { MatchExplanation } from '@/types';

export default function CandidateDashboard() {
  const [loading, setLoading] = React.useState(true);
  const [uploading, setUploading] = React.useState(false);
  const [profile, setProfile] = React.useState<any>(null);
  const [recommendations, setRecommendations] = React.useState<any[]>([]);
  const [selectedMatch, setSelectedMatch] = React.useState<{
    jobTitle: string;
    candidateName: string;
    match: MatchExplanation;
  } | null>(null);
  const [applyingJobId, setApplyingJobId] = React.useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = React.useState<string | null>(null);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Fetch candidate profile and recommendations
  const loadData = React.useCallback(async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const [profRes, recRes] = await Promise.all([
        fetch('/api/candidate/profile'),
        fetch('/api/candidates/recommendations'),
      ]);

      if (profRes.ok) {
        const ct = profRes.headers.get('content-type') || '';
        if (ct.includes('application/json')) {
          const profData = await profRes.json();
          setProfile(profData.profile);
        }
      }

      if (recRes.ok) {
        const ct = recRes.headers.get('content-type') || '';
        if (ct.includes('application/json')) {
          const recData = await recRes.json();
          setRecommendations(recData.recommendations || []);
        }
      }
    } catch (err) {
      console.error('Failed to load candidate dashboard data:', err);
      setErrorMsg('Failed to load profile or recommendations.');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle resume file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      alert('Please upload a PDF format resume.');
      return;
    }

    try {
      setUploading(true);
      setUploadSuccess(null);
      setErrorMsg(null);

      const formData = new FormData();
      formData.append('file', file);
      if (profile?.id) {
        formData.append('candidateProfileId', profile.id);
      }

      const res = await fetch('/api/resumes/upload', {
        method: 'POST',
        body: formData,
      });

      let data: any = {};
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        data = await res.json();
      } else {
        const text = await res.text();
        try {
          data = JSON.parse(text);
        } catch (_) {
          throw new Error('Server returned an unexpected response format.');
        }
      }

      if (!res.ok) {
        throw new Error(data.error || 'Failed to upload resume');
      }

      setUploadSuccess(`Successfully extracted ${data.data?.parsedData?.skills?.length || 0} skills from ${file.name}!`);
      // Reload profile and recommendations
      await loadData();
    } catch (err) {
      console.error('Upload error:', err);
      setErrorMsg((err as Error).message);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Handle job application
  const handleApply = async (jobId: string) => {
    try {
      setApplyingJobId(jobId);
      const res = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId,
          candidateProfileId: profile?.id,
          coverLetter: 'I am excited about this role and look forward to discussing how my background aligns with your team goals.',
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to submit application');
      }

      // Refresh data
      await loadData();
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setApplyingJobId(null);
    }
  };

  const parsedResume = profile?.resumes?.[0]?.parsedData as any;

  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      <Sidebar role="CANDIDATE" />

      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                Candidate Intelligence Portal
              </h1>
              <Badge variant="default" className="text-xs">
                Candidate
              </Badge>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Automated PDF parsing, skill verification, and semantic matching against open roles.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="file"
              ref={fileInputRef}
              accept=".pdf"
              className="hidden"
              onChange={handleFileUpload}
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="gap-2 bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-500/20"
            >
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Extracting Resume...
                </>
              ) : (
                <>
                  <UploadCloud className="h-4 w-4" />
                  Upload PDF Resume
                </>
              )}
            </Button>
          </div>
        </div>

        {uploadSuccess && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300 text-sm flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
            <span>{uploadSuccess}</span>
          </div>
        )}

        {errorMsg && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-300 text-sm flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Profile Card & Resume Extraction Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Candidate Card */}
          <Card className="lg:col-span-1 shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-white font-black text-xl shadow-md shadow-indigo-500/25">
                  {profile?.user?.name ? profile.user.name.charAt(0) : 'C'}
                </div>
                <div>
                  <CardTitle className="text-lg font-bold">
                    {profile?.user?.name || 'Candidate Profile'}
                  </CardTitle>
                  <p className="text-xs text-slate-500">
                    {profile?.user?.email || 'candidate@jobmatch.ai'}
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div>
                <span className="text-xs font-semibold uppercase text-slate-400">Headline</span>
                <p className="font-semibold text-slate-800 dark:text-slate-200">
                  {profile?.headline || 'Full Stack & AI Engineer'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div>
                  <span className="text-xs text-slate-400">Experience</span>
                  <p className="font-bold text-slate-900 dark:text-white">
                    {profile?.yearsOfExperience || 3} Years
                  </p>
                </div>
                <div>
                  <span className="text-xs text-slate-400">Education</span>
                  <p className="font-bold text-slate-900 dark:text-white">
                    {profile?.educationLevel || "Bachelor's"}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-slate-400">Work Mode</span>
                  <p className="font-bold text-slate-900 dark:text-white">
                    {profile?.remotePreference || 'HYBRID'}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-slate-400">Target Salary</span>
                  <p className="font-bold text-slate-900 dark:text-white">
                    {profile?.desiredSalary ? formatSalary(profile.desiredSalary) : '$110k'}
                  </p>
                </div>
              </div>

              {profile?.resumes?.[0] && (
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <FileText className="h-4 w-4 text-indigo-500" />
                    {profile.resumes[0].fileName}
                  </span>
                  <span>Active Resume</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Extracted Skills & Resume Highlights */}
          <Card className="lg:col-span-2 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <Layers className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                    Verified Skills Profile
                  </CardTitle>
                  <CardDescription>
                    Extracted from resume and validated for semantic similarity calculations.
                  </CardDescription>
                </div>
                <Badge variant="secondary" className="font-mono text-xs">
                  {profile?.skills?.length || 0} Skills Detected
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {profile?.skills && profile.skills.length > 0 ? (
                  profile.skills.map((cs: any) => (
                    <Badge
                      key={cs.id}
                      variant="default"
                      className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-medium"
                    >
                      {cs.skill.name}
                      <span className="ml-1.5 text-[10px] text-indigo-600 dark:text-indigo-400 font-bold">
                        {cs.level || 'MID'}
                      </span>
                    </Badge>
                  ))
                ) : (
                  <p className="text-sm text-slate-500 py-4">
                    No skills extracted yet. Upload a PDF resume above to extract skills automatically.
                  </p>
                )}
              </div>

              {/* Work Experience snippet */}
              {parsedResume?.experience && parsedResume.experience.length > 0 && (
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Latest Experience Record
                  </h4>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-xs space-y-1">
                    <p className="font-bold text-slate-900 dark:text-white">
                      {parsedResume.experience[0].title} — {parsedResume.experience[0].company}
                    </p>
                    <p className="text-slate-500 dark:text-slate-400">
                      {parsedResume.experience[0].description}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recommended Jobs with AI Match Breakdown */}
        <section id="recommended" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                AI Job Recommendations & Fit Scores
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Ranked using 5-factor hybrid scoring (Skills 35%, Semantic 25%, Experience 20%, Education 10%, Preferences 10%).
              </p>
            </div>
            <span className="text-xs font-semibold text-slate-400">
              {recommendations.length} Matched Positions
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recommendations.map((rec: any) => {
              const { job, match } = rec;
              return (
                <Card
                  key={job.id}
                  className="flex flex-col justify-between hover:shadow-md transition-all border-slate-200 dark:border-slate-800"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <Badge
                          variant="outline"
                          className="text-[10px] uppercase font-bold text-indigo-600 border-indigo-200 dark:border-indigo-800 mb-1"
                        >
                          {job.remoteType}
                        </Badge>
                        <CardTitle className="text-base font-bold text-slate-900 dark:text-white line-clamp-1">
                          {job.title}
                        </CardTitle>
                        <p className="text-xs text-slate-500 font-medium">{job.company}</p>
                      </div>
                      <div className="shrink-0 text-right">
                        <span className="text-xl font-black text-indigo-600 dark:text-indigo-400">
                          {match.overallScore}%
                        </span>
                        <p className="text-[10px] text-slate-400 uppercase font-semibold">Match</p>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-3.5 text-xs">
                    <div className="flex items-center gap-3 text-slate-500">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" /> {job.location}
                      </span>
                      <span className="flex items-center gap-1">
                        <DollarSign className="h-3.5 w-3.5" />
                        {formatSalary(job.minSalary)} - {formatSalary(job.maxSalary)}
                      </span>
                    </div>

                    {/* Progress bars for match sub-metrics */}
                    <div className="space-y-1.5 pt-1">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-500">Skills ({match.breakdown.skillsMatch}%)</span>
                        <span className="text-slate-500">Semantic ({match.breakdown.semanticMatch}%)</span>
                        <span className="text-slate-500">Exp ({match.breakdown.experienceMatch}%)</span>
                      </div>
                      <Progress value={match.overallScore} className="h-1.5" />
                    </div>

                    {/* Matching & Missing Skills */}
                    <div className="space-y-1">
                      <div className="flex flex-wrap gap-1">
                        {match.matchingSkills.slice(0, 3).map((sk: string, i: number) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-semibold border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800"
                          >
                            ✓ {sk}
                          </span>
                        ))}
                        {match.missingSkills.slice(0, 2).map((sk: string, i: number) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 text-[10px] font-semibold border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900"
                          >
                            ✕ {sk}
                          </span>
                        ))}
                      </div>
                    </div>
                  </CardContent>

                  <div className="p-4 pt-0 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 mt-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setSelectedMatch({
                          jobTitle: job.title,
                          candidateName: profile?.user?.name || 'You',
                          match,
                        })
                      }
                      className="text-xs text-indigo-600 dark:text-indigo-400 gap-1 p-0 hover:bg-transparent"
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      Explain Fit
                    </Button>

                    <Button
                      size="sm"
                      disabled={job.hasApplied || applyingJobId === job.id}
                      onClick={() => handleApply(job.id)}
                      className={
                        job.hasApplied
                          ? 'bg-emerald-600 hover:bg-emerald-600 text-white text-xs'
                          : 'bg-indigo-600 hover:bg-indigo-700 text-xs'
                      }
                    >
                      {job.hasApplied ? (
                        <>
                          <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Applied
                        </>
                      ) : applyingJobId === job.id ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> Applying...
                        </>
                      ) : (
                        <>
                          <Send className="h-3.5 w-3.5 mr-1" /> Quick Apply
                        </>
                      )}
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        </section>

        {/* Candidate Applications Tracker */}
        {profile?.applications && profile.applications.length > 0 && (
          <section className="space-y-4 pt-6 border-t border-slate-200 dark:border-slate-800">
            <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-indigo-600" />
              Your Applications ({profile.applications.length})
            </h2>

            <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800/50 text-xs uppercase text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-5 py-3.5">Job Title</th>
                    <th className="px-5 py-3.5">Company</th>
                    <th className="px-5 py-3.5">Applied Date</th>
                    <th className="px-5 py-3.5">Match Score</th>
                    <th className="px-5 py-3.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {profile.applications.map((app: any) => (
                    <tr key={app.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="px-5 py-4 font-semibold text-slate-900 dark:text-white">
                        {app.job.title}
                      </td>
                      <td className="px-5 py-4 text-slate-600 dark:text-slate-300">
                        {app.job.company}
                      </td>
                      <td className="px-5 py-4 text-xs text-slate-400">
                        {new Date(app.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-4">
                        <span className="font-bold text-indigo-600 dark:text-indigo-400">
                          {Math.round(app.matchScore || 85)}%
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold ${getStatusBadgeVariant(
                            app.status
                          )}`}
                        >
                          {app.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </main>

      {/* Explainability Modal */}
      <Dialog
        open={!!selectedMatch}
        onOpenChange={(open) => {
          if (!open) setSelectedMatch(null);
        }}
      >
        {selectedMatch && (
          <DialogContent onClose={() => setSelectedMatch(null)}>
            <MatchScoreCard
              match={selectedMatch.match}
              jobTitle={selectedMatch.jobTitle}
              candidateName={selectedMatch.candidateName}
            />
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
