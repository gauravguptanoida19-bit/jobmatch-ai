import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { generateEmbedding } from '@/lib/embeddings/generator';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const job = await prisma.job.findUnique({
      where: { id },
      include: {
        skills: {
          include: { skill: true },
        },
        recruiterProfile: {
          include: {
            user: { select: { name: true, email: true } },
          },
        },
        _count: {
          select: { applications: true },
        },
      },
    });

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    return NextResponse.json({ job });
  } catch (error) {
    console.info('[Job Detail] Database offline, returning mockStore job.');
    const { id } = await params;
    const { mockStore } = await import('@/lib/db/mock-store');
    const job = mockStore.jobs.find((j) => j.id === id) || mockStore.jobs[0];
    return NextResponse.json({ job });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    const updatedJob = await prisma.job.update({
      where: { id },
      data: {
        title: body.title,
        company: body.company,
        department: body.department,
        location: body.location,
        type: body.type,
        remoteType: body.remoteType,
        minExperience: body.minExperience,
        maxExperience: body.maxExperience,
        educationLevel: body.educationLevel,
        minSalary: body.minSalary,
        maxSalary: body.maxSalary,
        description: body.description,
        requirements: body.requirements,
        benefits: body.benefits,
        status: body.status,
      },
    });

    return NextResponse.json({ job: updatedJob });
  } catch (error) {
    console.error('[Job Update Error]:', error);
    return NextResponse.json({ error: 'Failed to update job' }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.job.delete({
      where: { id },
    });
    return NextResponse.json({ success: true, message: 'Job deleted' });
  } catch (error) {
    console.error('[Job Delete Error]:', error);
    return NextResponse.json({ error: 'Failed to delete job' }, { status: 500 });
  }
}
