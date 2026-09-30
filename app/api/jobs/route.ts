import { NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db/prisma';
import { auth } from '@/lib/auth/auth';
import { generateEmbedding } from '@/lib/embeddings/generator';
import { mockStore } from '@/lib/db/mock-store';

const createJobSchema = z.object({
  title: z.string().min(2, 'Job title is required'),
  company: z.string().min(2, 'Company name is required'),
  department: z.string().optional(),
  location: z.string().default('Remote / Hybrid'),
  type: z.enum(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP']).default('FULL_TIME'),
  remoteType: z.enum(['REMOTE', 'HYBRID', 'ONSITE']).default('REMOTE'),
  minExperience: z.number().int().min(0).default(1),
  maxExperience: z.number().int().min(0).default(5),
  educationLevel: z.string().default("Bachelor's"),
  minSalary: z.number().int().min(0).default(90000),
  maxSalary: z.number().int().min(0).default(140000),
  description: z.string().min(20, 'Description must be at least 20 characters'),
  requirements: z.string().optional(),
  benefits: z.string().optional(),
  requiredSkills: z.array(z.string()).default([]),
  preferredSkills: z.array(z.string()).default([]),
});

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search')?.toLowerCase();
  const remoteType = searchParams.get('remoteType');
  const minSalary = searchParams.get('minSalary') ? parseInt(searchParams.get('minSalary')!, 10) : undefined;
  const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!, 10) : 50;

  try {
    const where: any = { status: 'OPEN' };
    if (remoteType) where.remoteType = remoteType;
    if (minSalary) where.maxSalary = { gte: minSalary };
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { company: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const jobs = await prisma.job.findMany({
      where,
      include: {
        skills: { include: { skill: true } },
        recruiterProfile: {
          include: { user: { select: { name: true, email: true } } },
        },
        _count: { select: { applications: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    if (jobs && jobs.length > 0) {
      return NextResponse.json({ jobs });
    }
  } catch (error) {
    console.info('[Jobs GET] Database offline, returning mockStore jobs.');
  }

  // Fallback to mockStore
  let filtered = [...mockStore.jobs];
  if (remoteType) {
    filtered = filtered.filter((j) => j.remoteType === remoteType);
  }
  if (search) {
    filtered = filtered.filter(
      (j) =>
        j.title.toLowerCase().includes(search) ||
        j.company.toLowerCase().includes(search) ||
        j.description.toLowerCase().includes(search)
    );
  }

  return NextResponse.json({ jobs: filtered.slice(0, limit) });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = createJobSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: result.error.errors },
        { status: 400 }
      );
    }

    const data = result.data;

    try {
      const session = await auth();
      let recruiterProfileId = (session?.user as any)?.recruiterProfileId;

      if (!recruiterProfileId) {
        const defaultRecruiter = await prisma.recruiterProfile.findFirst();
        if (defaultRecruiter) {
          recruiterProfileId = defaultRecruiter.id;
        }
      }

      if (recruiterProfileId) {
        const allSkills = [...data.requiredSkills, ...data.preferredSkills].join(', ');
        const embeddingText = `${data.title} at ${data.company}. Location: ${data.location}. Type: ${data.remoteType}. Experience: ${data.minExperience}-${data.maxExperience} years. Required skills: ${allSkills}. Description: ${data.description}.`;
        const embedding = await generateEmbedding(embeddingText);

        const job = await prisma.job.create({
          data: {
            recruiterProfileId,
            title: data.title,
            company: data.company,
            department: data.department,
            location: data.location,
            type: data.type,
            remoteType: data.remoteType,
            minExperience: data.minExperience,
            maxExperience: data.maxExperience,
            educationLevel: data.educationLevel,
            minSalary: data.minSalary,
            maxSalary: data.maxSalary,
            description: data.description,
            requirements: data.requirements,
            benefits: data.benefits,
            status: 'OPEN',
          },
        });

        for (const skillName of data.requiredSkills) {
          const norm = skillName.trim();
          if (!norm) continue;
          const skill = await prisma.skill.upsert({
            where: { name: norm },
            update: {},
            create: { name: norm, category: 'OTHER' },
          });
          await prisma.jobSkill.create({
            data: { jobId: job.id, skillId: skill.id, isRequired: true },
          });
        }

        return NextResponse.json({ success: true, job }, { status: 201 });
      }
    } catch (dbErr) {
      console.info('[Jobs POST] Database offline, adding to mockStore.');
    }

    // In-memory fallback
    const newJob = mockStore.addJob(data);
    return NextResponse.json({ success: true, job: newJob }, { status: 201 });
  } catch (error) {
    console.error('[Jobs POST Error]:', error);
    return NextResponse.json({ error: 'Failed to create job' }, { status: 500 });
  }
}
