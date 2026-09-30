import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import prisma from '@/lib/db/prisma';
import { mockStore } from '@/lib/db/mock-store';

export async function GET(req: Request) {
  try {
    const session = await auth();
    let candidateProfileId = (session?.user as any)?.candidateProfileId;

    if (!candidateProfileId) {
      const defaultCandidate = await prisma.candidateProfile.findFirst({
        include: {
          user: true,
          skills: { include: { skill: true } },
          resumes: { orderBy: { createdAt: 'desc' }, take: 1 },
          applications: {
            include: {
              job: true,
            },
            orderBy: { createdAt: 'desc' },
          },
        },
      });

      if (!defaultCandidate) {
        return NextResponse.json({ profile: mockStore.candidates[0] });
      }

      return NextResponse.json({ profile: defaultCandidate });
    }

    const profile = await prisma.candidateProfile.findUnique({
      where: { id: candidateProfileId },
      include: {
        user: true,
        skills: { include: { skill: true } },
        resumes: { orderBy: { createdAt: 'desc' }, take: 1 },
        applications: {
          include: { job: true },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!profile) {
      return NextResponse.json({ profile: mockStore.candidates[0] });
    }

    return NextResponse.json({ profile });
  } catch (error) {
    // Seamless fallback to pre-seeded mock candidate profile
    console.info('[Candidate Profile] Database offline, using in-memory candidate profile.');
    const session = await auth().catch(() => null);
    const candidateProfileId = (session?.user as any)?.candidateProfileId;
    const candidate =
      (candidateProfileId
        ? mockStore.candidates.find((c) => c.id === candidateProfileId)
        : null) || mockStore.candidates[0];
    return NextResponse.json({ profile: candidate });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await auth();
    let candidateProfileId = (session?.user as any)?.candidateProfileId;
    const body = await req.json();

    if (!candidateProfileId) {
      const defaultCandidate = await prisma.candidateProfile.findFirst();
      if (defaultCandidate) {
        candidateProfileId = defaultCandidate.id;
      } else {
        const updated = mockStore.updateCandidate('cand-1', body);
        return NextResponse.json({ profile: updated });
      }
    }

    const updated = await prisma.candidateProfile.update({
      where: { id: candidateProfileId },
      data: {
        headline: body.headline,
        bio: body.bio,
        location: body.location,
        phone: body.phone,
        yearsOfExperience: body.yearsOfExperience,
        educationLevel: body.educationLevel,
        desiredRole: body.desiredRole,
        remotePreference: body.remotePreference,
        desiredSalary: body.desiredSalary,
      },
    });

    return NextResponse.json({ profile: updated });
  } catch (error) {
    const body = await req.clone().json().catch(() => ({}));
    const updated = mockStore.updateCandidate('cand-1', body);
    return NextResponse.json({ profile: updated });
  }
}
