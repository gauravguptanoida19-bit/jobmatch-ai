import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import prisma from '@/lib/db/prisma';
import { calculateHybridMatch } from '@/lib/matching/engine';
import { mockStore } from '@/lib/db/mock-store';

export async function GET(req: Request) {
  try {
    const session = await auth();
    const { searchParams } = new URL(req.url);
    let candidateProfileId =
      (session?.user as any)?.candidateProfileId ||
      searchParams.get('candidateProfileId');

    if (!candidateProfileId) {
      const firstCandidate = await prisma.candidateProfile.findFirst();
      if (firstCandidate) {
        candidateProfileId = firstCandidate.id;
      } else {
        return getMockRecommendationsResponse();
      }
    }

    const candidate = await prisma.candidateProfile.findUnique({
      where: { id: candidateProfileId },
      include: {
        user: true,
        skills: { include: { skill: true } },
        resumes: { take: 1, orderBy: { createdAt: 'desc' } },
        applications: { select: { jobId: true, status: true } },
      },
    });

    if (!candidate) {
      return getMockRecommendationsResponse();
    }

    const appliedJobIds = new Set(candidate.applications.map((a) => a.jobId));

    const jobs = await prisma.job.findMany({
      where: { status: 'OPEN' },
      include: {
        skills: { include: { skill: true } },
      },
      take: 20,
    });

    if (!jobs || jobs.length === 0) {
      return getMockRecommendationsResponse();
    }

    const recommendations = await Promise.all(
      jobs.map(async (job) => {
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
            educationLevel: candidate.educationLevel || "Bachelor's",
            location: candidate.location || undefined,
            remotePreference: candidate.remotePreference,
            desiredSalary: candidate.desiredSalary || undefined,
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
          }
        );

        return {
          job: {
            id: job.id,
            title: job.title,
            company: job.company,
            location: job.location,
            remoteType: job.remoteType,
            type: job.type,
            minSalary: job.minSalary,
            maxSalary: job.maxSalary,
            minExperience: job.minExperience,
            maxExperience: job.maxExperience,
            skills: job.skills.map((s) => ({
              name: s.skill.name,
              isRequired: s.isRequired,
            })),
            hasApplied: appliedJobIds.has(job.id),
          },
          match,
        };
      })
    );

    recommendations.sort((a, b) => b.match.overallScore - a.match.overallScore);

    return NextResponse.json({
      candidate: {
        id: candidate.id,
        name: candidate.user.name,
        headline: candidate.headline,
        yearsOfExperience: candidate.yearsOfExperience,
        skills: candidate.skills.map((s) => s.skill.name),
      },
      recommendations,
    });
  } catch (error) {
    console.info('[Recommendations] Database offline, using in-memory recommendations fallback.');
    return getMockRecommendationsResponse();
  }
}

async function getMockRecommendationsResponse() {
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
          id: job.id,
          title: job.title,
          company: job.company,
          location: job.location,
          remoteType: job.remoteType,
          type: job.type,
          minSalary: job.minSalary,
          maxSalary: job.maxSalary,
          minExperience: job.minExperience,
          maxExperience: job.maxExperience,
          skills: job.skills.map((s) => ({
            name: s.skill.name,
            isRequired: s.isRequired,
          })),
          hasApplied: appliedJobIds.has(job.id),
        },
        match,
      };
    })
  );

  recommendations.sort((a, b) => b.match.overallScore - a.match.overallScore);

  return NextResponse.json({
    candidate: {
      id: candidate.id,
      name: candidate.user.name,
      headline: candidate.headline,
      yearsOfExperience: candidate.yearsOfExperience,
      skills: candidate.skills.map((s) => s.skill.name),
    },
    recommendations,
  });
}
