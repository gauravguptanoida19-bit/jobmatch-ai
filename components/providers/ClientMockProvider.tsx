'use client';

import * as React from 'react';
import { mockStore } from '@/lib/db/mock-store';
import { calculateHybridMatch } from '@/lib/matching/engine';

export function ClientMockProvider({ children }: { children: React.ReactNode }) {
  React.useEffect(() => {
    if (typeof window === 'undefined') return;

    const isGitHubPages =
      window.location.hostname.includes('github.io') ||
      window.location.pathname.includes('/jobmatch-ai');

    if (!isGitHubPages) return;

    const originalFetch = window.fetch;

    window.fetch = async function (input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
      const urlStr =
        typeof input === 'string'
          ? input
          : input instanceof URL
          ? input.toString()
          : (input as Request).url;

      const method = (init?.method || 'GET').toUpperCase();

      // Only intercept /api/ calls on static GitHub Pages
      if (urlStr.includes('/api/')) {
        try {
          const parsedUrl = new URL(urlStr, window.location.origin);
          const pathname = parsedUrl.pathname.replace(/^\/jobmatch-ai/, '');

          // 1. Candidate Profile
          if (pathname === '/api/candidate/profile') {
            return new Response(JSON.stringify({ profile: mockStore.candidates[0] }), {
              status: 200,
              headers: { 'Content-Type': 'application/json' },
            });
          }

          // 2. Candidate Recommendations
          if (pathname === '/api/candidates/recommendations') {
            const candidate = mockStore.candidates[0];
            const appliedJobIds = new Set(candidate.applications.map((a) => a.jobId));
            const recommendations = await Promise.all(
              mockStore.jobs.map(async (job) => {
                const requiredSkills = job.skills.filter((s) => s.isRequired).map((s) => s.skill.name);
                const preferredSkills = job.skills.filter((s) => !s.isRequired).map((s) => s.skill.name);
                const match = await calculateHybridMatch(
                  {
                    name: candidate.user.name,
                    skills: candidate.skills.map((s) => ({
                      name: s.skill.name,
                      level: s.level,
                      yearsExperience: s.yearsExperience,
                    })),
                    yearsOfExperience: candidate.yearsOfExperience,
                    educationLevel: candidate.educationLevel,
                    location: candidate.location,
                    remotePreference: candidate.remotePreference,
                    desiredSalary: candidate.desiredSalary,
                    embedding: candidate.resumes[0]?.embedding,
                  },
                  {
                    title: job.title,
                    requiredSkills,
                    preferredSkills,
                    minExperience: job.minExperience,
                    maxExperience: job.maxExperience,
                    educationLevel: job.educationLevel,
                    location: job.location,
                    remoteType: job.remoteType,
                    minSalary: job.minSalary,
                    maxSalary: job.maxSalary,
                    embedding: job.embedding,
                  }
                );
                return {
                  job: {
                    ...job,
                    hasApplied: appliedJobIds.has(job.id),
                  },
                  match,
                };
              })
            );
            recommendations.sort((a, b) => b.match.overallScore - a.match.overallScore);
            return new Response(
              JSON.stringify({
                candidate: {
                  id: candidate.id,
                  name: candidate.user.name,
                  headline: candidate.headline,
                  yearsOfExperience: candidate.yearsOfExperience,
                  skills: candidate.skills.map((s) => s.skill.name),
                },
                recommendations,
              }),
              { status: 200, headers: { 'Content-Type': 'application/json' } }
            );
          }

          // 3. Recruiter Profile
          if (pathname === '/api/recruiter/profile') {
            return new Response(
              JSON.stringify({
                profile: {
                  id: 'rec-1',
                  companyName: 'Nexus AI Labs',
                  companyWebsite: 'https://nexusailabs.com',
                  companyLogo: null,
                  companyDescription: 'Pioneering frontier foundation models and high-throughput vector search.',
                  location: 'San Francisco, CA',
                  user: {
                    id: 'usr-rec-1',
                    name: 'Sarah Jenkins',
                    email: 'recruiter@jobmatch.ai',
                    avatar: null,
                  },
                  openJobsCount: mockStore.jobs.length,
                  totalApplicantsCount: 16,
                  averageMatchScore: 84,
                },
              }),
              { status: 200, headers: { 'Content-Type': 'application/json' } }
            );
          }

          // 4. Jobs List
          if (pathname === '/api/jobs' && method === 'GET') {
            return new Response(
              JSON.stringify({
                jobs: mockStore.jobs,
                pagination: { total: mockStore.jobs.length, page: 1, limit: 20, pages: 1 },
              }),
              { status: 200, headers: { 'Content-Type': 'application/json' } }
            );
          }

          // 5. Job Details
          if (pathname.startsWith('/api/jobs/') && !pathname.includes('applicants') && method === 'GET') {
            const jobId = pathname.split('/')[3];
            const job = mockStore.jobs.find((j) => j.id === jobId) || mockStore.jobs[0];
            return new Response(JSON.stringify({ job }), {
              status: 200,
              headers: { 'Content-Type': 'application/json' },
            });
          }

          // 6. Job Applicants
          if (pathname.includes('/applicants') && method === 'GET') {
            const jobId = pathname.split('/')[3];
            const job = mockStore.jobs.find((j) => j.id === jobId) || mockStore.jobs[0];
            const applicants = mockStore.candidates.map((c, idx) => ({
              applicationId: `app-mock-${c.id}`,
              status: ['INTERVIEW', 'SCREENING', 'APPLIED'][idx % 3],
              coverLetter: `I am thrilled to apply for ${job.title}. My background aligns with your core requirements.`,
              appliedAt: new Date().toISOString(),
              candidate: {
                id: c.id,
                userId: c.userId,
                name: c.user.name,
                email: c.user.email,
                headline: c.headline,
                location: c.location,
                yearsOfExperience: c.yearsOfExperience,
                educationLevel: c.educationLevel,
                skills: c.skills.map((s) => ({
                  name: s.skill.name,
                  level: s.level,
                  yearsExperience: s.yearsExperience,
                })),
              },
              match: {
                overallScore: 85 - idx * 4,
                breakdown: {
                  skillsMatch: 88 - idx * 3,
                  semanticMatch: 82 - idx * 4,
                  experienceMatch: 90 - idx * 2,
                  educationMatch: 100,
                  preferencesMatch: 95,
                },
                matchingSkills: ['Python', 'TypeScript', 'Docker'],
                missingSkills: ['Kubernetes'],
                strengths: ['Strong overlap in primary technology stack'],
                recommendations: ['Highlight relevant cloud experience'],
                summary: `${c.user.name} is a strong candidate for ${job.title}.`,
              },
            }));
            return new Response(
              JSON.stringify({
                job: {
                  id: job.id,
                  title: job.title,
                  company: job.company,
                  requiredSkills: job.skills.filter((s) => s.isRequired).map((s) => s.skill.name),
                  preferredSkills: job.skills.filter((s) => !s.isRequired).map((s) => s.skill.name),
                },
                applicants,
              }),
              { status: 200, headers: { 'Content-Type': 'application/json' } }
            );
          }

          // 7. Applications Submit (POST)
          if (pathname === '/api/applications' && method === 'POST') {
            let body: any = {};
            if (init?.body) {
              try {
                body = JSON.parse(init.body as string);
              } catch (_) {}
            }
            const res = mockStore.addApplication(body.candidateProfileId, body.jobId, body.coverLetter);
            return new Response(
              JSON.stringify({
                success: true,
                message: 'Application submitted successfully',
                application: res.application,
              }),
              { status: 201, headers: { 'Content-Type': 'application/json' } }
            );
          }

          // 8. Applications Status Update (PATCH)
          if (pathname === '/api/applications' && method === 'PATCH') {
            let body: any = {};
            if (init?.body) {
              try {
                body = JSON.parse(init.body as string);
              } catch (_) {}
            }
            const updated = mockStore.updateApplication(body.applicationId, body.status);
            return new Response(JSON.stringify({ success: true, application: updated }), {
              status: 200,
              headers: { 'Content-Type': 'application/json' },
            });
          }

          // 9. Analytics
          if (pathname === '/api/analytics') {
            return new Response(
              JSON.stringify({
                pipeline: {
                  totalApplications: 24,
                  byStatus: [
                    { status: 'APPLIED', count: 8 },
                    { status: 'SCREENING', count: 7 },
                    { status: 'INTERVIEW', count: 6 },
                    { status: 'OFFER', count: 3 },
                  ],
                },
                scoreDistribution: [
                  { range: '90-100%', count: 6 },
                  { range: '80-89%', count: 10 },
                  { range: '70-79%', count: 5 },
                  { range: '<70%', count: 3 },
                ],
                skillGaps: [
                  { skill: 'Python', demand: 8, supply: 12 },
                  { skill: 'TypeScript', demand: 7, supply: 9 },
                  { skill: 'Kubernetes', demand: 6, supply: 3 },
                  { skill: 'Kafka', demand: 5, supply: 2 },
                  { skill: 'pgvector', demand: 6, supply: 4 },
                ],
              }),
              { status: 200, headers: { 'Content-Type': 'application/json' } }
            );
          }

          // 10. Search candidates & jobs
          if (pathname.includes('/api/search/')) {
            const query = parsedUrl.searchParams.get('q') || '';
            if (pathname.includes('jobs')) {
              const matchedJobs = mockStore.jobs.filter(
                (j) =>
                  !query ||
                  j.title.toLowerCase().includes(query.toLowerCase()) ||
                  j.description.toLowerCase().includes(query.toLowerCase())
              );
              return new Response(JSON.stringify({ results: matchedJobs }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
              });
            }
            const matchedCands = mockStore.candidates.filter(
              (c) =>
                !query ||
                c.headline.toLowerCase().includes(query.toLowerCase()) ||
                c.user.name.toLowerCase().includes(query.toLowerCase())
            );
            return new Response(JSON.stringify({ results: matchedCands }), {
              status: 200,
              headers: { 'Content-Type': 'application/json' },
            });
          }
        } catch (e) {
          console.error('[ClientMockProvider Error]', e);
        }
      }

      return originalFetch(input, init);
    };
  }, []);

  return <>{children}</>;
}
