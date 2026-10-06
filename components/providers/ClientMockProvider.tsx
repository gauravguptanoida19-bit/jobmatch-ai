'use client';

import * as React from 'react';
import { mockStore } from '@/lib/db/mock-store';
import { calculateHybridMatch } from '@/lib/matching/engine';
import { generateDeterministicEmbedding } from '@/lib/embeddings/generator';
import { ParsedResumeData, ExtractedSkill, SkillCategory, SkillLevel } from '@/types';

// Helper to extract skills and realistic profile data from uploaded resumes in the browser
async function extractClientResume(file: File): Promise<{ parsedData: ParsedResumeData; embedding: number[] }> {
  let rawText = '';
  try {
    const arrayBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    let str = '';
    for (let i = 0; i < bytes.length; i++) {
      const b = bytes[i];
      if ((b >= 32 && b <= 126) || b === 10 || b === 13) {
        str += String.fromCharCode(b);
      } else {
        str += ' ';
      }
    }
    rawText = str;
  } catch (err) {
    rawText = file.name;
  }

  const SKILL_KEYWORDS: Array<{ name: string; category: SkillCategory; level: SkillLevel; years: number }> = [
    { name: 'Python', category: 'LANGUAGE', level: 'ADVANCED', years: 4 },
    { name: 'TypeScript', category: 'LANGUAGE', level: 'ADVANCED', years: 3 },
    { name: 'JavaScript', category: 'LANGUAGE', level: 'EXPERT', years: 5 },
    { name: 'Go', category: 'LANGUAGE', level: 'INTERMEDIATE', years: 2 },
    { name: 'Java', category: 'LANGUAGE', level: 'ADVANCED', years: 4 },
    { name: 'C++', category: 'LANGUAGE', level: 'INTERMEDIATE', years: 3 },
    { name: 'Rust', category: 'LANGUAGE', level: 'INTERMEDIATE', years: 2 },
    { name: 'SQL', category: 'LANGUAGE', level: 'ADVANCED', years: 4 },
    { name: 'HTML', category: 'LANGUAGE', level: 'EXPERT', years: 5 },
    { name: 'CSS', category: 'LANGUAGE', level: 'EXPERT', years: 5 },
    { name: 'React', category: 'FRAMEWORK', level: 'EXPERT', years: 4 },
    { name: 'Next.js', category: 'FRAMEWORK', level: 'ADVANCED', years: 3 },
    { name: 'Node.js', category: 'FRAMEWORK', level: 'ADVANCED', years: 4 },
    { name: 'Express', category: 'FRAMEWORK', level: 'ADVANCED', years: 3 },
    { name: 'FastAPI', category: 'FRAMEWORK', level: 'ADVANCED', years: 3 },
    { name: 'Django', category: 'FRAMEWORK', level: 'INTERMEDIATE', years: 2 },
    { name: 'Tailwind CSS', category: 'FRAMEWORK', level: 'EXPERT', years: 3 },
    { name: 'Vue', category: 'FRAMEWORK', level: 'INTERMEDIATE', years: 2 },
    { name: 'Angular', category: 'FRAMEWORK', level: 'INTERMEDIATE', years: 2 },
    { name: 'PostgreSQL', category: 'DATABASE', level: 'ADVANCED', years: 4 },
    { name: 'pgvector', category: 'DATABASE', level: 'ADVANCED', years: 2 },
    { name: 'MongoDB', category: 'DATABASE', level: 'ADVANCED', years: 3 },
    { name: 'Redis', category: 'DATABASE', level: 'ADVANCED', years: 3 },
    { name: 'MySQL', category: 'DATABASE', level: 'ADVANCED', years: 3 },
    { name: 'Docker', category: 'CLOUD', level: 'ADVANCED', years: 3 },
    { name: 'Kubernetes', category: 'CLOUD', level: 'INTERMEDIATE', years: 2 },
    { name: 'AWS', category: 'CLOUD', level: 'ADVANCED', years: 3 },
    { name: 'GCP', category: 'CLOUD', level: 'INTERMEDIATE', years: 2 },
    { name: 'Terraform', category: 'CLOUD', level: 'INTERMEDIATE', years: 2 },
    { name: 'CI/CD', category: 'CLOUD', level: 'ADVANCED', years: 3 },
    { name: 'Git', category: 'TOOL', level: 'EXPERT', years: 5 },
    { name: 'PyTorch', category: 'AI_ML', level: 'ADVANCED', years: 3 },
    { name: 'TensorFlow', category: 'AI_ML', level: 'INTERMEDIATE', years: 2 },
    { name: 'LLM', category: 'AI_ML', level: 'ADVANCED', years: 2 },
    { name: 'LangChain', category: 'AI_ML', level: 'ADVANCED', years: 2 },
    { name: 'Machine Learning', category: 'AI_ML', level: 'ADVANCED', years: 3 },
    { name: 'Deep Learning', category: 'AI_ML', level: 'ADVANCED', years: 3 },
    { name: 'Kafka', category: 'TOOL', level: 'INTERMEDIATE', years: 2 },
    { name: 'REST API', category: 'TOOL', level: 'EXPERT', years: 5 },
    { name: 'GraphQL', category: 'TOOL', level: 'ADVANCED', years: 3 },
    { name: 'Microservices', category: 'TOOL', level: 'ADVANCED', years: 4 },
  ];

  const extractedSkills: ExtractedSkill[] = [];
  const lowerText = (rawText + ' ' + file.name).toLowerCase();

  for (const item of SKILL_KEYWORDS) {
    const escaped = item.name.toLowerCase().replace('+', '\\+');
    const regex = new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, 'i');
    if (regex.test(lowerText)) {
      extractedSkills.push({
        name: item.name,
        category: item.category,
        level: item.level,
        yearsExperience: item.years,
      });
    }
  }

  // Ensure high-value skills if none or few detected
  if (extractedSkills.length < 4) {
    const defaults = ['TypeScript', 'React', 'Next.js', 'PostgreSQL', 'Docker', 'REST API', 'Python', 'Tailwind CSS'];
    defaults.forEach((defName) => {
      if (!extractedSkills.some((s) => s.name === defName)) {
        const found = SKILL_KEYWORDS.find((k) => k.name === defName);
        if (found) {
          extractedSkills.push({
            name: found.name,
            category: found.category,
            level: found.level,
            yearsExperience: found.years,
          });
        }
      }
    });
  }

  // Extract clean name from filename
  let parsedName = file.name
    .replace(/\.[^/.]+$/, '')
    .replace(/[-_]/g, ' ')
    .replace(/resume|cv|profile|doc|pdf/gi, '')
    .trim();
  if (!parsedName || parsedName.length < 2) {
    parsedName = mockStore.candidates[0]?.user?.name || 'Alex Rivera';
  }

  const expMatch = lowerText.match(/(\d+)\+?\s*years?/);
  const detectedYears = expMatch ? parseInt(expMatch[1], 10) : 4;
  const isMaster = lowerText.includes('master') || lowerText.includes('ms degree') || lowerText.includes('m.s.');

  const parsedData: ParsedResumeData = {
    fullName: parsedName,
    email: mockStore.candidates[0]?.user?.email || 'candidate@jobmatch.ai',
    headline: `${parsedName} — Full Stack & AI Systems Engineer`,
    summary: `Extracted from ${file.name}. Seasoned engineering professional skilled in ${extractedSkills.slice(0, 5).map((s) => s.name).join(', ')}, vector search architectures, and resilient cloud-native application stacks.`,
    totalYearsExperience: detectedYears,
    educationLevel: isMaster ? "Master's" : "Bachelor's",
    skills: extractedSkills,
    experience: [
      {
        title: 'Senior Full Stack & AI Engineer',
        company: 'CloudScale Innovations',
        location: 'San Francisco, CA',
        years: 3,
        description: `Designed and productionized modern web applications and vector retrieval microservices using ${extractedSkills.slice(0, 3).map((s) => s.name).join(', ')}.`,
        skillsUsed: extractedSkills.slice(0, 4).map((s) => s.name),
      },
      {
        title: 'Software Developer',
        company: 'Apex Data Labs',
        location: 'Remote',
        years: 2,
        description: 'Developed scalable REST APIs, relational PostgreSQL data stores, and automated continuous deployment workflows.',
        skillsUsed: extractedSkills.slice(2, 6).map((s) => s.name),
      },
    ],
    education: [
      {
        institution: 'University of Technology',
        degree: isMaster ? 'Master of Science in Computer Science' : 'Bachelor of Science in Computer Science',
        fieldOfStudy: 'Computer Science',
        graduationYear: 2021,
      },
    ],
    projects: [
      {
        name: 'JobMatch AI & Vector Intelligence',
        description: 'High-accuracy job and candidate intelligence platform utilizing vector embeddings and structured skill gap matching.',
        skillsUsed: ['Next.js', 'TypeScript', 'pgvector', 'PostgreSQL'],
      },
    ],
    certifications: [
      {
        name: 'AWS Certified Solutions Architect',
        issuer: 'Amazon Web Services',
        year: 2023,
      },
    ],
    preferences: {
      desiredRole: 'Senior AI / Full Stack Engineer',
      remotePreference: 'REMOTE',
      desiredSalaryMin: 145000,
    },
  };

  const embeddingText = `${parsedData.headline} ${parsedData.summary} ${parsedData.skills.map((s) => s.name).join(' ')}`;
  const embedding = generateDeterministicEmbedding(embeddingText);

  return { parsedData, embedding };
}

export function ClientMockProvider({ children }: { children: React.ReactNode }) {
  React.useEffect(() => {
    if (typeof window === 'undefined') return;

    const isStaticEnv =
      window.location.hostname.includes('github.io') ||
      window.location.pathname.includes('/jobmatch-ai') ||
      process.env.NEXT_PUBLIC_STATIC_EXPORT === 'true';

    if (!isStaticEnv) return;

    const originalFetch = window.fetch;

    window.fetch = async function (input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
      const urlStr =
        typeof input === 'string'
          ? input
          : input instanceof URL
          ? input.toString()
          : (input as Request).url;

      const method = (init?.method || 'GET').toUpperCase();

      // Intercept any /api/ calls on static GitHub Pages
      if (urlStr.includes('/api/')) {
        try {
          const parsedUrl = new URL(urlStr, window.location.origin);
          const pathname = parsedUrl.pathname.replace(/^\/jobmatch-ai/, '');

          // Helper to get active candidate
          const getActiveCandidate = () => {
            return mockStore.candidates[0];
          };

          // 1. Sign Up / Register (POST /api/auth/register)
          if (pathname === '/api/auth/register' && method === 'POST') {
            let body: any = {};
            if (typeof init?.body === 'string') {
              try { body = JSON.parse(init.body); } catch (_) {}
            } else if (init?.body instanceof FormData) {
              body = {
                name: init.body.get('name'),
                email: init.body.get('email'),
                password: init.body.get('password'),
                role: init.body.get('role') || 'CANDIDATE',
                companyName: init.body.get('companyName'),
              };
            }

            const res = mockStore.addUser({
              name: body.name || 'New User',
              email: body.email || 'user@example.com',
              password: body.password || 'password123',
              role: (body.role || 'CANDIDATE').toUpperCase() as any,
              companyName: body.companyName,
            });

            if (res.isExisting) {
              return new Response(
                JSON.stringify({ error: 'An account with this email already exists' }),
                { status: 409, headers: { 'Content-Type': 'application/json' } }
              );
            }

            // Save active session to localStorage
            try {
              localStorage.setItem(
                'jobmatch_session',
                JSON.stringify({
                  id: res.user.id,
                  name: res.user.name,
                  email: res.user.email,
                  role: res.user.role,
                  candidateProfileId: res.user.candidateProfileId,
                  recruiterProfileId: res.user.recruiterProfileId,
                })
              );
            } catch (_) {}

            return new Response(
              JSON.stringify({
                message: 'Account created successfully',
                user: {
                  id: res.user.id,
                  name: res.user.name,
                  email: res.user.email,
                  role: res.user.role,
                  candidateProfileId: res.user.candidateProfileId,
                  recruiterProfileId: res.user.recruiterProfileId,
                },
              }),
              { status: 201, headers: { 'Content-Type': 'application/json' } }
            );
          }

          // 2. NextAuth Session & Auth Endpoints
          if (pathname === '/api/auth/csrf') {
            return new Response(JSON.stringify({ csrfToken: 'mock-csrf-token' }), {
              status: 200,
              headers: { 'Content-Type': 'application/json' },
            });
          }

          if (pathname === '/api/auth/providers') {
            return new Response(
              JSON.stringify({
                credentials: {
                  id: 'credentials',
                  name: 'Credentials',
                  type: 'credentials',
                  signinUrl: '/api/auth/signin/credentials',
                  callbackUrl: '/api/auth/callback/credentials',
                },
              }),
              { status: 200, headers: { 'Content-Type': 'application/json' } }
            );
          }

          if (pathname === '/api/auth/session') {
            let userSession: any = {
              name: 'Alex Rivera',
              email: 'candidate@jobmatch.ai',
              role: 'CANDIDATE',
              candidateProfileId: 'cand-1',
            };
            try {
              const raw = localStorage.getItem('jobmatch_session');
              if (raw) userSession = JSON.parse(raw);
            } catch (_) {}

            return new Response(
              JSON.stringify({
                user: userSession,
                expires: new Date(Date.now() + 86400000).toISOString(),
              }),
              { status: 200, headers: { 'Content-Type': 'application/json' } }
            );
          }

          if (pathname.includes('/api/auth/callback/credentials') || pathname.includes('/api/auth/signin/credentials')) {
            return new Response(
              JSON.stringify({
                url: '/dashboard/candidate',
                status: 200,
                ok: true,
                error: null,
              }),
              { status: 200, headers: { 'Content-Type': 'application/json' } }
            );
          }

          if (pathname === '/api/auth/signout') {
            try { localStorage.removeItem('jobmatch_session'); } catch (_) {}
            return new Response(JSON.stringify({ ok: true, url: '/' }), {
              status: 200,
              headers: { 'Content-Type': 'application/json' },
            });
          }

          // 3. Resume Upload (POST /api/resumes/upload)
          if (pathname === '/api/resumes/upload' && method === 'POST') {
            let file: File | null = null;
            let candidateProfileId: string | null = null;

            if (init?.body instanceof FormData) {
              file = init.body.get('file') as File | null;
              candidateProfileId = init.body.get('candidateProfileId') as string | null;
            }

            if (!file) {
              return new Response(
                JSON.stringify({ error: 'No resume file provided. Please upload a PDF file.' }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
              );
            }

            const { parsedData, embedding } = await extractClientResume(file);
            const targetCandId = candidateProfileId || mockStore.candidates[0]?.id || 'cand-1';
            mockStore.addResume(targetCandId, file.name, parsedData, embedding);

            return new Response(
              JSON.stringify({
                success: true,
                message: 'Resume parsed and profile updated successfully',
                data: {
                  resumeId: `mock-res-${Date.now()}`,
                  parsedData,
                  embedding,
                },
              }),
              { status: 200, headers: { 'Content-Type': 'application/json' } }
            );
          }

          // 4. Candidate Profile (GET & PUT)
          if (pathname === '/api/candidate/profile') {
            if (method === 'PUT') {
              let body: any = {};
              if (typeof init?.body === 'string') {
                try { body = JSON.parse(init.body); } catch (_) {}
              }
              const updated = mockStore.updateCandidate(mockStore.candidates[0]?.id || 'cand-1', body);
              return new Response(JSON.stringify({ profile: updated }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
              });
            }

            return new Response(
              JSON.stringify({ profile: getActiveCandidate() }),
              { status: 200, headers: { 'Content-Type': 'application/json' } }
            );
          }

          // 5. Candidate Recommendations (GET)
          if (pathname === '/api/candidates/recommendations') {
            const candidate = getActiveCandidate();
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

          // 6. Recruiter Profile (GET)
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

          // 7. Jobs List & Create (GET & POST /api/jobs)
          if (pathname === '/api/jobs') {
            if (method === 'POST') {
              let body: any = {};
              if (typeof init?.body === 'string') {
                try { body = JSON.parse(init.body); } catch (_) {}
              }
              const newJob = mockStore.addJob(body);
              return new Response(JSON.stringify({ job: newJob }), {
                status: 201,
                headers: { 'Content-Type': 'application/json' },
              });
            }

            return new Response(
              JSON.stringify({
                jobs: mockStore.jobs,
                pagination: { total: mockStore.jobs.length, page: 1, limit: 20, pages: 1 },
              }),
              { status: 200, headers: { 'Content-Type': 'application/json' } }
            );
          }

          // 8. Single Job Details, Update & Delete (/api/jobs/[id])
          if (pathname.startsWith('/api/jobs/') && !pathname.includes('applicants') && !pathname.includes('match')) {
            const jobId = pathname.split('/')[3];
            if (method === 'DELETE') {
              mockStore.deleteJob(jobId);
              return new Response(JSON.stringify({ success: true }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
              });
            }

            if (method === 'PUT') {
              let body: any = {};
              if (typeof init?.body === 'string') {
                try { body = JSON.parse(init.body); } catch (_) {}
              }
              const updated = mockStore.updateJob(jobId, body);
              return new Response(JSON.stringify({ job: updated }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
              });
            }

            const job = mockStore.jobs.find((j) => j.id === jobId) || mockStore.jobs[0];
            return new Response(JSON.stringify({ job }), {
              status: 200,
              headers: { 'Content-Type': 'application/json' },
            });
          }

          // 9. Job Applicants (/api/jobs/[id]/applicants)
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

          // 10. Job-Candidate Match Explanation (/api/jobs/[id]/match/[candidateId])
          if (pathname.includes('/match/')) {
            const parts = pathname.split('/');
            const jobId = parts[3];
            const candId = parts[5];
            const job = mockStore.jobs.find((j) => j.id === jobId) || mockStore.jobs[0];
            const candidate = mockStore.candidates.find((c) => c.id === candId) || mockStore.candidates[0];
            const matchResult = await calculateHybridMatch(
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
                requiredSkills: job.skills.filter((s) => s.isRequired).map((s) => s.skill.name),
                preferredSkills: job.skills.filter((s) => !s.isRequired).map((s) => s.skill.name),
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
            return new Response(JSON.stringify({ match: matchResult, job, candidate }), {
              status: 200,
              headers: { 'Content-Type': 'application/json' },
            });
          }

          // 11. Applications Submit (POST /api/applications)
          if (pathname === '/api/applications' && method === 'POST') {
            let body: any = {};
            if (init?.body) {
              try { body = JSON.parse(init.body as string); } catch (_) {}
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

          // 12. Applications Status Update (PATCH /api/applications)
          if (pathname === '/api/applications' && method === 'PATCH') {
            let body: any = {};
            if (init?.body) {
              try { body = JSON.parse(init.body as string); } catch (_) {}
            }
            const updated = mockStore.updateApplication(body.applicationId, body.status);
            return new Response(JSON.stringify({ success: true, application: updated }), {
              status: 200,
              headers: { 'Content-Type': 'application/json' },
            });
          }

          // 13. Analytics (/api/analytics)
          if (pathname === '/api/analytics') {
            const totalJobs = mockStore.jobs.length;
            const totalCandidates = mockStore.candidates.length;
            let totalApps = 0;
            mockStore.candidates.forEach((c) => {
              totalApps += c.applications?.length || 0;
            });

            return new Response(
              JSON.stringify({
                metrics: {
                  totalJobs,
                  totalCandidates,
                  totalApplications: totalApps || 24,
                  shortlistedCandidates: Math.round(totalCandidates * 0.4),
                  averageMatchScore: 84,
                },
                pipeline: {
                  totalApplications: totalApps || 24,
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

          // 14. Search Candidates & Jobs (/api/search/)
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
