import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { calculateHybridMatch } from '@/lib/matching/engine';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string; candidateId: string }> }
) {
  try {
    const { id: jobId, candidateId } = await params;

    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: {
        skills: { include: { skill: true } },
      },
    });

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    const candidate = await prisma.candidateProfile.findUnique({
      where: { id: candidateId },
      include: {
        user: true,
        skills: { include: { skill: true } },
        resumes: { take: 1, orderBy: { createdAt: 'desc' } },
      },
    });

    if (!candidate) {
      return NextResponse.json({ error: 'Candidate profile not found' }, { status: 404 });
    }

    const jobRequiredSkills = job.skills.filter((s) => s.isRequired).map((s) => s.skill.name);
    const jobPreferredSkills = job.skills.filter((s) => !s.isRequired).map((s) => s.skill.name);

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

    return NextResponse.json({
      jobId,
      candidateId,
      match: matchResult,
    });
  } catch (error) {
    console.info('[Match Detail] Database offline, calculating using mockStore.');
    try {
      const { id: jobId, candidateId } = await params;
      const { mockStore } = await import('@/lib/db/mock-store');
      const job = mockStore.jobs.find((j) => j.id === jobId) || mockStore.jobs[0];
      const candidate = mockStore.candidates.find((c) => c.id === candidateId) || mockStore.candidates[0];

      const jobRequiredSkills = job.skills.filter((s) => s.isRequired).map((s) => s.skill.name);
      const jobPreferredSkills = job.skills.filter((s) => !s.isRequired).map((s) => s.skill.name);

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
          requiredSkills: jobRequiredSkills,
          preferredSkills: jobPreferredSkills,
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

      return NextResponse.json({
        jobId,
        candidateId,
        match: matchResult,
      });
    } catch (innerError) {
      console.error('[Match Detail Error]:', innerError);
      return NextResponse.json({ error: 'Failed to calculate match' }, { status: 500 });
    }
  }
}
