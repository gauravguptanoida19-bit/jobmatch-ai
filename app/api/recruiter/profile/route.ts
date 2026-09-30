import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import prisma from '@/lib/db/prisma';
import { mockStore } from '@/lib/db/mock-store';

export async function GET() {
  try {
    const session = await auth();
    let recruiterProfileId = (session?.user as any)?.recruiterProfileId;

    if (!recruiterProfileId) {
      const defaultRecruiter = await prisma.recruiterProfile.findFirst({
        include: {
          user: true,
          jobs: {
            include: {
              skills: { include: { skill: true } },
              _count: { select: { applications: true } },
            },
            orderBy: { createdAt: 'desc' },
          },
        },
      });

      if (!defaultRecruiter) {
        return getMockRecruiterResponse();
      }

      return NextResponse.json({ recruiter: defaultRecruiter });
    }

    const recruiter = await prisma.recruiterProfile.findUnique({
      where: { id: recruiterProfileId },
      include: {
        user: true,
        jobs: {
          include: {
            skills: { include: { skill: true } },
            _count: { select: { applications: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!recruiter) {
      return getMockRecruiterResponse();
    }

    return NextResponse.json({ recruiter });
  } catch (error) {
    console.info('[Recruiter Profile] Database offline, returning mock recruiter profile.');
    return getMockRecruiterResponse();
  }
}

function getMockRecruiterResponse() {
  return NextResponse.json({
    recruiter: {
      id: 'recruiter-mock-1',
      userId: 'user-rec-1',
      user: {
        id: 'user-rec-1',
        name: 'Elena Rostova',
        email: 'recruiter@jobmatch.ai',
        role: 'RECRUITER',
      },
      companyName: 'Apex Talent Intelligence',
      companyWebsite: 'https://apextalent.example.com',
      department: 'Technical Talent Acquisition',
      jobs: mockStore.jobs,
    },
  });
}
