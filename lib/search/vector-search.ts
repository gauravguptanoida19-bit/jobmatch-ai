import prisma from '@/lib/db/prisma';
import { generateEmbedding, cosineSimilarity } from '@/lib/embeddings/generator';
import { mockStore } from '@/lib/db/mock-store';

export interface SemanticJobSearchResult {
  id: string;
  title: string;
  company: string;
  location: string;
  remoteType: string;
  type: string;
  minExperience: number;
  maxExperience: number;
  educationLevel: string;
  minSalary: number;
  maxSalary: number;
  description: string;
  similarity: number;
  skills: Array<{ name: string; isRequired: boolean }>;
}

export interface SemanticCandidateSearchResult {
  id: string;
  userId: string;
  name: string;
  email: string;
  headline: string | null;
  location: string | null;
  yearsOfExperience: number;
  educationLevel: string | null;
  remotePreference: string;
  similarity: number;
  skills: Array<{ name: string; level: string; yearsExperience: number }>;
}

export async function searchJobsSemantically(
  query: string,
  limit = 10,
  filter?: { remoteType?: string; minSalary?: number }
): Promise<SemanticJobSearchResult[]> {
  const queryEmbedding = await generateEmbedding(query);
  const vectorStr = `[${queryEmbedding.join(',')}]`;

  try {
    const rawResults = (await (prisma as any).$queryRawUnsafe(
      `
      SELECT 
        j.id, 
        j.title, 
        j.company, 
        j.location, 
        j."remoteType", 
        j.type, 
        j."minExperience", 
        j."maxExperience", 
        j."educationLevel", 
        j."minSalary", 
        j."maxSalary", 
        j.description,
        ROUND((1 - (j.embedding <=> $1::vector))::numeric, 4)::float as similarity
      FROM "Job" j
      WHERE j.status = 'OPEN' AND j.embedding IS NOT NULL
      ORDER BY j.embedding <=> $1::vector ASC
      LIMIT $2;
    `,
      vectorStr,
      limit
    )) as any[];

    if (rawResults && rawResults.length > 0) {
      const jobIds = rawResults.map((r: any) => r.id);
      const skills = await prisma.jobSkill.findMany({
        where: { jobId: { in: jobIds } },
        include: { skill: true },
      });

      return rawResults.map((r: any) => ({
        ...r,
        similarity: Math.max(0, Math.min(1, r.similarity)),
        skills: (skills as any[])
          .filter((s: any) => s.jobId === r.id)
          .map((s: any) => ({ name: s.skill.name, isRequired: s.isRequired })),
      }));
    }
  } catch (err) {
    // Database or pgvector offline, proceed to fallback
  }

  // Try standard Prisma query if pgvector raw fails
  try {
    const jobs = await prisma.job.findMany({
      where: { status: 'OPEN' },
      include: {
        skills: {
          include: { skill: true },
        },
      },
      take: 50,
    });

    if (jobs && jobs.length > 0) {
      const scored = await Promise.all(
        jobs.map(async (job) => {
          const jobText = `${job.title} ${job.company} ${job.description} ${job.skills
            .map((s) => s.skill.name)
            .join(' ')}`;
          const jobEmb = await generateEmbedding(jobText);
          const sim = cosineSimilarity(queryEmbedding, jobEmb);
          return {
            id: job.id,
            title: job.title,
            company: job.company,
            location: job.location,
            remoteType: job.remoteType,
            type: job.type,
            minExperience: job.minExperience,
            maxExperience: job.maxExperience,
            educationLevel: job.educationLevel,
            minSalary: job.minSalary,
            maxSalary: job.maxSalary,
            description: job.description,
            similarity: Number(sim.toFixed(4)),
            skills: job.skills.map((s) => ({
              name: s.skill.name,
              isRequired: s.isRequired,
            })),
          };
        })
      );

      return scored
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, limit);
    }
  } catch (e) {
    // Fall back to mockStore
  }

  // In-memory fallback
  const mockScored = await Promise.all(
    mockStore.jobs.map(async (job) => {
      const sim = cosineSimilarity(queryEmbedding, job.embedding);
      return {
        id: job.id,
        title: job.title,
        company: job.company,
        location: job.location,
        remoteType: job.remoteType,
        type: job.type,
        minExperience: job.minExperience,
        maxExperience: job.maxExperience,
        educationLevel: job.educationLevel,
        minSalary: job.minSalary,
        maxSalary: job.maxSalary,
        description: job.description,
        similarity: Number(sim.toFixed(4)),
        skills: job.skills.map((s) => ({
          name: s.skill.name,
          isRequired: s.isRequired,
        })),
      };
    })
  );

  return mockScored
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit);
}

export async function searchCandidatesSemantically(
  query: string,
  limit = 10
): Promise<SemanticCandidateSearchResult[]> {
  const queryEmbedding = await generateEmbedding(query);
  const vectorStr = `[${queryEmbedding.join(',')}]`;

  try {
    const rawResults = (await (prisma as any).$queryRawUnsafe(
      `
      SELECT 
        cp.id,
        cp."userId",
        u.name,
        u.email,
        cp.headline,
        cp.location,
        cp."yearsOfExperience",
        cp."educationLevel",
        cp."remotePreference",
        ROUND((1 - (r.embedding <=> $1::vector))::numeric, 4)::float as similarity
      FROM "CandidateProfile" cp
      JOIN "User" u ON u.id = cp."userId"
      JOIN "Resume" r ON r."candidateProfileId" = cp.id
      WHERE r.embedding IS NOT NULL
      ORDER BY r.embedding <=> $1::vector ASC
      LIMIT $2;
    `,
      vectorStr,
      limit
    )) as any[];

    if (rawResults && rawResults.length > 0) {
      const candidateIds = rawResults.map((r: any) => r.id);
      const skills = await prisma.candidateSkill.findMany({
        where: { candidateProfileId: { in: candidateIds } },
        include: { skill: true },
      });

      return rawResults.map((r: any) => ({
        ...r,
        similarity: Math.max(0, Math.min(1, r.similarity)),
        skills: (skills as any[])
          .filter((s: any) => s.candidateProfileId === r.id)
          .map((s: any) => ({
            name: s.skill.name,
            level: s.level,
            yearsExperience: s.yearsExperience,
          })),
      }));
    }
  } catch (err) {
    // Database or pgvector offline
  }

  try {
    const candidates = await prisma.candidateProfile.findMany({
      include: {
        user: true,
        skills: { include: { skill: true } },
        resumes: { take: 1, orderBy: { createdAt: 'desc' } },
      },
      take: 50,
    });

    if (candidates && candidates.length > 0) {
      const scored = await Promise.all(
        candidates.map(async (c) => {
          const candidateText = `${c.headline || ''} ${c.bio || ''} ${c.skills
            .map((s) => s.skill.name)
            .join(' ')} ${c.resumes[0]?.rawText || ''}`;
          const candidateEmb = await generateEmbedding(candidateText);
          const sim = cosineSimilarity(queryEmbedding, candidateEmb);

          return {
            id: c.id,
            userId: c.userId,
            name: c.user.name,
            email: c.user.email,
            headline: c.headline,
            location: c.location,
            yearsOfExperience: c.yearsOfExperience,
            educationLevel: c.educationLevel,
            remotePreference: c.remotePreference,
            similarity: Number(sim.toFixed(4)),
            skills: c.skills.map((s) => ({
              name: s.skill.name,
              level: s.level,
              yearsExperience: s.yearsExperience,
            })),
          };
        })
      );

      return scored
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, limit);
    }
  } catch (e) {
    // Fall back to mockStore
  }

  // In-memory fallback
  const mockCandidateScored = await Promise.all(
    mockStore.candidates.map(async (c) => {
      const candidateText = `${c.headline} ${c.bio} ${c.skills.map((s) => s.skill.name).join(' ')}`;
      const candidateEmb = await generateEmbedding(candidateText);
      const sim = cosineSimilarity(queryEmbedding, candidateEmb);

      return {
        id: c.id,
        userId: c.userId,
        name: c.user.name,
        email: c.user.email,
        headline: c.headline,
        location: c.location,
        yearsOfExperience: c.yearsOfExperience,
        educationLevel: c.educationLevel,
        remotePreference: c.remotePreference,
        similarity: Number(sim.toFixed(4)),
        skills: c.skills.map((s) => ({
          name: s.skill.name,
          level: s.level,
          yearsExperience: s.yearsExperience,
        })),
      };
    })
  );

  return mockCandidateScored
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit);
}
