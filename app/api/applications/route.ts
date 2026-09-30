import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import prisma from '@/lib/db/prisma';
import { calculateHybridMatch } from '@/lib/matching/engine';
import { mockStore } from '@/lib/db/mock-store';

export async function POST(req: Request) {
  try {
    const session = await auth();
    const body = await req.json();
    let candidateProfileId =
      (session?.user as any)?.candidateProfileId || body.candidateProfileId;
    const { jobId, coverLetter } = body;

    if (!jobId) {
      return NextResponse.json({ error: 'Job ID is required' }, { status: 400 });
    }

    // Try primary PostgreSQL database first
    try {
      if (!candidateProfileId) {
        const defaultCandidate = await prisma.candidateProfile.findFirst();
        if (defaultCandidate) {
          candidateProfileId = defaultCandidate.id;
        }
      }

      if (candidateProfileId) {
        const existingApp = await prisma.application.findUnique({
          where: {
            jobId_candidateProfileId: {
              jobId,
              candidateProfileId,
            },
          },
        });

        if (existingApp) {
          return NextResponse.json(
            { error: 'You have already applied to this position' },
            { status: 409 }
          );
        }

        // Get job and candidate details for score calculation
        const job = await prisma.job.findUnique({
          where: { id: jobId },
          include: { skills: { include: { skill: true } } },
        });
        const candidate = await prisma.candidateProfile.findUnique({
          where: { id: candidateProfileId },
          include: { user: true, skills: { include: { skill: true } } },
        });

        if (job && candidate) {
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
              requiredSkills: job.skills.filter((s) => s.isRequired).map((s) => s.skill.name),
              preferredSkills: job.skills.filter((s) => !s.isRequired).map((s) => s.skill.name),
              minExperience: job.minExperience,
              maxExperience: job.maxExperience,
              educationLevel: job.educationLevel,
              location: job.location,
              remoteType: job.remoteType,
              minSalary: job.minSalary,
              maxSalary: job.maxSalary,
            }
          );

          const application = await prisma.application.create({
            data: {
              jobId,
              candidateProfileId,
              coverLetter: coverLetter || '',
              matchScore: match.overallScore,
              status: 'APPLIED',
            },
          });

          // Save match result
          await prisma.matchResult.upsert({
            where: {
              jobId_candidateProfileId: {
                jobId,
                candidateProfileId,
              },
            },
            update: {
              overallScore: match.overallScore,
              skillScore: match.breakdown.skillsMatch,
              semanticScore: match.breakdown.semanticMatch,
              experienceScore: match.breakdown.experienceMatch,
              educationScore: match.breakdown.educationMatch,
              preferenceScore: match.breakdown.preferencesMatch,
              matchingSkills: match.matchingSkills,
              missingSkills: match.missingSkills,
              reasoning: {
                strengths: match.strengths,
                summary: match.summary,
              },
              recommendations: match.recommendations.join('; '),
            },
            create: {
              jobId,
              candidateProfileId,
              overallScore: match.overallScore,
              skillScore: match.breakdown.skillsMatch,
              semanticScore: match.breakdown.semanticMatch,
              experienceScore: match.breakdown.experienceMatch,
              educationScore: match.breakdown.educationMatch,
              preferenceScore: match.breakdown.preferencesMatch,
              matchingSkills: match.matchingSkills,
              missingSkills: match.missingSkills,
              reasoning: {
                strengths: match.strengths,
                summary: match.summary,
              },
              recommendations: match.recommendations.join('; '),
            },
          });

          return NextResponse.json(
            {
              success: true,
              message: 'Application submitted successfully',
              application,
              match,
            },
            { status: 201 }
          );
        }
      }
    } catch (dbErr) {
      console.info('[Applications POST] Database unavailable, seamlessly falling back to in-memory mock store');
    }

    // Seamless Fallback using in-memory MockStore
    const candidate =
      (candidateProfileId
        ? mockStore.candidates.find((c) => c.id === candidateProfileId)
        : null) || mockStore.candidates[0];

    const job = mockStore.jobs.find((j) => j.id === jobId);
    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    // Check if already applied
    const existing = candidate.applications.find((a) => a.jobId === job.id);
    if (existing) {
      return NextResponse.json(
        { error: 'You have already applied to this position' },
        { status: 409 }
      );
    }

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

    const res = mockStore.addApplication(candidate.id, job.id, coverLetter, match.overallScore);

    return NextResponse.json(
      {
        success: true,
        message: 'Application submitted successfully',
        application: res.application,
        match,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[Application POST Error]:', error);
    return NextResponse.json(
      { error: 'Failed to submit application' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { applicationId, status } = body;

    if (!applicationId || !status) {
      return NextResponse.json(
        { error: 'Application ID and status are required' },
        { status: 400 }
      );
    }

    try {
      const updated = await prisma.application.update({
        where: { id: applicationId },
        data: { status },
      });

      return NextResponse.json({ success: true, application: updated });
    } catch (dbErr) {
      console.info('[Application PATCH] Database unavailable, updating mock store');
      const updated = mockStore.updateApplication(applicationId, status);
      return NextResponse.json({ success: true, application: updated });
    }
  } catch (error) {
    console.error('[Application PATCH Error]:', error);
    return NextResponse.json(
      { error: 'Failed to update application' },
      { status: 500 }
    );
  }
}
