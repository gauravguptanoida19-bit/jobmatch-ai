import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import prisma from '@/lib/db/prisma';

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['CANDIDATE', 'RECRUITER']).default('CANDIDATE'),
  companyName: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = registerSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: result.error.errors },
        { status: 400 }
      );
    }

    const { name, email, password, role, companyName } = result.data;
    const normalizedEmail = email.toLowerCase().trim();

    try {
      const existingUser = await prisma.user.findUnique({
        where: { email: normalizedEmail },
      });

      if (existingUser) {
        return NextResponse.json(
          { error: 'An account with this email already exists' },
          { status: 409 }
        );
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const user = await prisma.user.create({
        data: {
          name,
          email: normalizedEmail,
          password: hashedPassword,
          role,
          ...(role === 'CANDIDATE'
            ? {
                candidateProfile: {
                  create: {
                    headline: `${name} — Software Professional`,
                    bio: 'Open to exciting opportunities in technology and engineering.',
                    educationLevel: "Bachelor's",
                  },
                },
              }
            : {
                recruiterProfile: {
                  create: {
                    companyName: companyName || 'Tech Recruiting Co.',
                  },
                },
              }),
        },
        include: {
          candidateProfile: true,
          recruiterProfile: true,
        },
      });

      return NextResponse.json(
        {
          message: 'Account created successfully',
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
          },
        },
        { status: 201 }
      );
    } catch (dbErr) {
      console.info('[Register] Database unavailable, registering account in memory');
      const { mockStore } = await import('@/lib/db/mock-store');
      const res = mockStore.addUser({
        name,
        email: normalizedEmail,
        password,
        role,
        companyName,
      });

      if (res.isExisting) {
        return NextResponse.json(
          { error: 'An account with this email already exists' },
          { status: 409 }
        );
      }

      return NextResponse.json(
        {
          message: 'Account created successfully',
          user: {
            id: res.user.id,
            name: res.user.name,
            email: res.user.email,
            role: res.user.role,
          },
        },
        { status: 201 }
      );
    }
  } catch (error) {
    console.error('[Register API Error]:', error);
    return NextResponse.json(
      { error: 'Failed to create account. Please try again.' },
      { status: 500 }
    );
  }
}
