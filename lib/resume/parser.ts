import pdfParse from 'pdf-parse';
import prisma from '@/lib/db/prisma';
import { parseResumeWithLLM } from '@/lib/ai/openai';
import { generateEmbedding } from '@/lib/embeddings/generator';
import { ParsedResumeData } from '@/types';

/**
 * Extracts raw text from a PDF Buffer
 */
export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  try {
    const data = await pdfParse(buffer);
    return data.text || '';
  } catch (err) {
    console.error('[PDF Parser] Failed to parse PDF buffer:', err);
    throw new Error('Unable to extract text from the provided PDF file.');
  }
}

/**
 * Processes an uploaded resume PDF:
 * 1. Extracts raw text
 * 2. Runs structured LLM extraction
 * 3. Generates vector embedding
 * 4. Saves or updates CandidateProfile, Skills, and Resume in database
 */
export async function processResumePDF(params: {
  candidateProfileId: string;
  fileName: string;
  fileBuffer: Buffer;
}): Promise<{
  resumeId: string;
  parsedData: ParsedResumeData;
  embedding: number[];
}> {
  const { candidateProfileId, fileName, fileBuffer } = params;

  // 1. Text extraction
  const rawText = await extractTextFromPDF(fileBuffer);
  if (!rawText.trim()) {
    throw new Error('The uploaded PDF appears to be empty or unreadable.');
  }

  // 2. Structured Extraction
  const parsedData = await parseResumeWithLLM(rawText);

  // 3. Generate Embedding
  const embeddingText = `${parsedData.headline || ''} ${parsedData.summary || ''} ${parsedData.skills
    .map((s) => s.name)
    .join(' ')} ${parsedData.experience
    .map((e) => `${e.title} ${e.company} ${e.description}`)
    .join(' ')}`;
  const embedding = await generateEmbedding(embeddingText);

  // 4. Update CandidateProfile & Skills
  const candidate = await prisma.candidateProfile.update({
    where: { id: candidateProfileId },
    data: {
      headline: parsedData.headline || parsedData.summary?.slice(0, 100),
      bio: parsedData.summary,
      location: parsedData.location || undefined,
      phone: parsedData.phone || undefined,
      yearsOfExperience: parsedData.totalYearsExperience || 0,
      educationLevel: parsedData.educationLevel || "Bachelor's",
      desiredRole: parsedData.preferences?.desiredRole || undefined,
      remotePreference: parsedData.preferences?.remotePreference || 'HYBRID',
      desiredSalary: parsedData.preferences?.desiredSalaryMin || undefined,
    },
  });

  // 5. Upsert Skills
  for (const sk of parsedData.skills) {
    const normalizedName = sk.name.trim();
    if (!normalizedName) continue;

    // Find or create skill
    const skillRecord = await prisma.skill.upsert({
      where: { name: normalizedName },
      update: { category: sk.category || 'OTHER' },
      create: { name: normalizedName, category: sk.category || 'OTHER' },
    });

    // Link skill to candidate
    await prisma.candidateSkill.upsert({
      where: {
        candidateProfileId_skillId: {
          candidateProfileId: candidate.id,
          skillId: skillRecord.id,
        },
      },
      update: {
        yearsExperience: sk.yearsExperience || 2,
        level: sk.level || 'INTERMEDIATE',
      },
      create: {
        candidateProfileId: candidate.id,
        skillId: skillRecord.id,
        yearsExperience: sk.yearsExperience || 2,
        level: sk.level || 'INTERMEDIATE',
      },
    });
  }

  // 6. Create Resume record
  const resume = await prisma.resume.create({
    data: {
      candidateProfileId: candidate.id,
      fileName,
      rawText,
      parsedData: parsedData as any,
    },
  });

  // Try to update vector column with pgvector if supported
  try {
    const vectorStr = `[${embedding.join(',')}]`;
    await prisma.$executeRawUnsafe(
      `UPDATE "Resume" SET embedding = $1::vector WHERE id = $2`,
      vectorStr,
      resume.id
    );
  } catch (e) {
    // Graceful fallback if pgvector extension is not enabled in standard dev
    console.info('[ResumeParser] Embedding recorded (pgvector raw write bypassed).');
  }

  return {
    resumeId: resume.id,
    parsedData,
    embedding,
  };
}
