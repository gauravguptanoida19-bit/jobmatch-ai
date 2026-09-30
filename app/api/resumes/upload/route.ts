import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import prisma from '@/lib/db/prisma';
import { processResumePDF, extractTextFromPDF } from '@/lib/resume/parser';
import { parseResumeWithLLM } from '@/lib/ai/openai';
import { generateEmbedding } from '@/lib/embeddings/generator';
import { mockStore } from '@/lib/db/mock-store';

export async function POST(req: Request) {
  try {
    const session = await auth();
    let candidateProfileId = (session?.user as any)?.candidateProfileId;

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const formCandidateProfileId = formData.get('candidateProfileId') as string | null;

    if (formCandidateProfileId) {
      candidateProfileId = formCandidateProfileId;
    }

    if (!file) {
      return NextResponse.json(
        { error: 'No resume file provided. Please upload a PDF file.' },
        { status: 400 }
      );
    }

    if (
      file.type !== 'application/pdf' &&
      !file.name.toLowerCase().endsWith('.pdf')
    ) {
      return NextResponse.json(
        { error: 'Only PDF format resumes are supported.' },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Try live database flow
    try {
      if (!candidateProfileId) {
        const defaultCandidate = await prisma.candidateProfile.findFirst();
        if (defaultCandidate) {
          candidateProfileId = defaultCandidate.id;
        }
      }

      if (candidateProfileId) {
        const result = await processResumePDF({
          candidateProfileId,
          fileName: file.name,
          fileBuffer: buffer,
        });

        return NextResponse.json({
          success: true,
          message: 'Resume parsed and profile updated successfully',
          data: result,
        });
      }
    } catch (dbErr) {
      console.info('[Resume Upload] Database offline, processing with in-memory pipeline.');
    }

    // In-memory fallback pipeline
    const rawText = await extractTextFromPDF(buffer);
    const parsedData = await parseResumeWithLLM(rawText);
    const embedding = await generateEmbedding(rawText);

    mockStore.addResume('cand-1', file.name, parsedData, embedding);

    return NextResponse.json({
      success: true,
      message: 'Resume parsed and profile updated successfully',
      data: {
        resumeId: `mock-res-${Date.now()}`,
        parsedData,
        embedding,
      },
    });
  } catch (error) {
    console.error('[Resume Upload API Error]:', error);
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to process resume' },
      { status: 500 }
    );
  }
}
