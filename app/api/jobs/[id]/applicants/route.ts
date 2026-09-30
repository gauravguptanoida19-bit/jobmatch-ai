import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { calculateHybridMatch } from '@/lib/matching/engine';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: jobId } = await params;

    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: {
        skills: { include: { skill: true } },
      },
    });

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    const applications = await prisma.application.findMany({
      where: { jobId },
      include: {
        candidateProfile: {
          include: {
            user: { select: { id: true, name: true, email: true, avatar: true } },
            skills: { include: { skill: true } },
            resumes: { take: 1, orderBy: { createdAt: 'desc' } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const jobRequiredSkills = job.skills.filter((s) => s.isRequired).map((s) => s.skill.name);
    const jobPreferredSkills = job.skills.filter((s) => !s.isRequired).map((s) => s.skill.name);

    // Compute or fetch match details for each applicant
    const rankedApplicants = await Promise.all(
      applications.map(async (app) => {
        const candidate = app.candidateProfile;

        // Check if we already have a saved match result
        const existingMatch = await prisma.matchResult.findUnique({
          where: {
            jobId_candidateProfileId: {
              jobId,
              candidateProfileId: candidate.id,
            },
          },
        });

        if (existingMatch) {
          return {
            applicationId: app.id,
            status: app.status,
            coverLetter: app.coverLetter,
            appliedAt: app.createdAt,
            candidate: {
              id: candidate.id,
              userId: candidate.userId,
              name: candidate.user.name,
              email: candidate.user.email,
              avatar: candidate.user.avatar,
              headline: candidate.headline,
              location: candidate.location,
              yearsOfExperience: candidate.yearsOfExperience,
              educationLevel: candidate.educationLevel,
              skills: candidate.skills.map((s) => ({
                name: s.skill.name,
                level: s.level,
                yearsExperience: s.yearsExperience,
              })),
            },
            match: {
              overallScore: existingMatch.overallScore,
              breakdown: {
                skillsMatch: existingMatch.skillScore,
                semanticMatch: existingMatch.semanticScore,
                experienceMatch: existingMatch.experienceScore,
                educationMatch: existingMatch.educationScore,
                preferencesMatch: existingMatch.preferenceScore,
              },
              matchingSkills: (existingMatch.matchingSkills as string[]) || [],
              missingSkills: (existingMatch.missingSkills as string[]) || [],
              strengths: ((existingMatch.reasoning as any)?.strengths as string[]) || [],
              recommendations: existingMatch.recommendations
                ? [existingMatch.recommendations]
                : [],
              summary: (existingMatch.reasoning as any)?.summary || '',
            },
          };
        }

        // Compute on the fly if not already saved
        const matchResult = await calculateHybridMatch(
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
            requiredSkills: jobRequiredSkills,
            preferredSkills: jobPreferredSkills,
            minExperience: job.minExperience,
            maxExperience: job.maxExperience,
            educationLevel: job.educationLevel,
            location: job.location,
            remoteType: job.remoteType,
            minSalary: job.minSalary,
            maxSalary: job.maxSalary,
          }
        );

        // Save computed match to database
        await prisma.matchResult.upsert({
          where: {
            jobId_candidateProfileId: {
              jobId,
              candidateProfileId: candidate.id,
            },
          },
          update: {
            overallScore: matchResult.overallScore,
            skillScore: matchResult.breakdown.skillsMatch,
            semanticScore: matchResult.breakdown.semanticMatch,
            experienceScore: matchResult.breakdown.experienceMatch,
            educationScore: matchResult.breakdown.educationMatch,
            preferenceScore: matchResult.breakdown.preferencesMatch,
            matchingSkills: matchResult.matchingSkills,
            missingSkills: matchResult.missingSkills,
            reasoning: {
              strengths: matchResult.strengths,
              summary: matchResult.summary,
            },
            recommendations: matchResult.recommendations.join('; '),
          },
          create: {
            jobId,
            candidateProfileId: candidate.id,
            overallScore: matchResult.overallScore,
            skillScore: matchResult.breakdown.skillsMatch,
            semanticScore: matchResult.breakdown.semanticMatch,
            experienceScore: matchResult.breakdown.experienceMatch,
            educationScore: matchResult.breakdown.educationMatch,
            preferenceScore: matchResult.breakdown.preferencesMatch,
            matchingSkills: matchResult.matchingSkills,
            missingSkills: matchResult.missingSkills,
            reasoning: {
              strengths: matchResult.strengths,
              summary: matchResult.summary,
            },
            recommendations: matchResult.recommendations.join('; '),
          },
        });

        // Also update application matchScore
        await prisma.application.update({
          where: { id: app.id },
          data: { matchScore: matchResult.overallScore },
        });

        return {
          applicationId: app.id,
          status: app.status,
          coverLetter: app.coverLetter,
          appliedAt: app.createdAt,
          candidate: {
            id: candidate.id,
            userId: candidate.userId,
            name: candidate.user.name,
            email: candidate.user.email,
            avatar: candidate.user.avatar,
            headline: candidate.headline,
            location: candidate.location,
            yearsOfExperience: candidate.yearsOfExperience,
            educationLevel: candidate.educationLevel,
            skills: candidate.skills.map((s) => ({
              name: s.skill.name,
              level: s.level,
              yearsExperience: s.yearsExperience,
            })),
          },
          match: matchResult,
        };
      })
    );

    // Sort by overallScore descending
    rankedApplicants.sort((a, b) => b.match.overallScore - a.match.overallScore);

    return NextResponse.json({
      job: {
        id: job.id,
        title: job.title,
        company: job.company,
        requiredSkills: jobRequiredSkills,
        preferredSkills: jobPreferredSkills,
      },
      applicants: rankedApplicants,
    });
  } catch (error) {
    console.info('[Job Applicants] Database offline, returning mockStore applicants.');
    const { id: jobId } = await params;
    const { mockStore } = await import('@/lib/db/mock-store');
    const job = mockStore.jobs.find((j) => j.id === jobId) || mockStore.jobs[0];

    const requiredSkills = job.skills.filter((s) => s.isRequired).map((s) => s.skill.name);
    const preferredSkills = job.skills.filter((s) => !s.isRequired).map((s) => s.skill.name);

    const statuses = ['INTERVIEW', 'SCREENING', 'APPLIED', 'OFFER'];

    const ranked = await Promise.all(
      mockStore.candidates.map(async (candidate, idx) => {
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
          applicationId: `app-mock-${candidate.id}`,
          status: statuses[idx % statuses.length],
          coverLetter: `I am thrilled to apply for ${job.title} at ${job.company}. My background aligns with your core requirements.`,
          appliedAt: new Date().toISOString(),
          candidate: {
            id: candidate.id,
            userId: candidate.userId,
            name: candidate.user.name,
            email: candidate.user.email,
            headline: candidate.headline,
            location: candidate.location,
            yearsOfExperience: candidate.yearsOfExperience,
            educationLevel: candidate.educationLevel,
            skills: candidate.skills.map((s) => ({
              name: s.skill.name,
              level: s.level,
              yearsExperience: s.yearsExperience,
            })),
          },
          match,
        };
      })
    );

    ranked.sort((a, b) => b.match.overallScore - a.match.overallScore);

    return NextResponse.json({
      job: {
        id: job.id,
        title: job.title,
        company: job.company,
        requiredSkills,
        preferredSkills,
      },
      applicants: ranked,
    });
  }
}
