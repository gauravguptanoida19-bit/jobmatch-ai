import OpenAI from 'openai';

const DIMENSIONS = 1536;

let openaiClient: OpenAI | null = null;

function getOpenAIClient(): OpenAI | null {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey || apiKey === '' || apiKey.includes('placeholder')) {
    return null;
  }
  if (!openaiClient) {
    openaiClient = new OpenAI({ apiKey });
  }
  return openaiClient;
}

/**
 * Deterministic fallback vector generator producing 1536-dimensional unit vectors.
 * Uses word tokenization and hashing so semantic overlap yields higher cosine similarity.
 */
export function generateDeterministicEmbedding(text: string): number[] {
  const vec = new Float64Array(DIMENSIONS);
  const normalized = text.toLowerCase().replace(/[^a-z0-9\s+#.-]/g, ' ');
  const tokens = normalized.split(/\s+/).filter(Boolean);

  if (tokens.length === 0) {
    // Return unit vector along first dimension
    const res = new Array(DIMENSIONS).fill(0);
    res[0] = 1.0;
    return res;
  }

  // Common tech synonyms/stems map to cluster vectors
  const techClusters: Record<string, number> = {
    python: 12,
    django: 12,
    fastapi: 12,
    flask: 12,
    pytorch: 44,
    tensorflow: 44,
    machine: 44,
    learning: 44,
    ai: 44,
    llm: 44,
    nlp: 44,
    javascript: 88,
    typescript: 88,
    react: 88,
    nextjs: 88,
    vue: 88,
    angular: 88,
    node: 88,
    nodejs: 88,
    postgres: 120,
    postgresql: 120,
    sql: 120,
    pgvector: 120,
    database: 120,
    prisma: 120,
    docker: 160,
    kubernetes: 160,
    k8s: 160,
    aws: 160,
    cloud: 160,
    devops: 160,
    ci: 160,
    cd: 160,
  };

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    // Hash token into dimensions
    let hash = 0;
    for (let c = 0; c < token.length; c++) {
      hash = (hash << 5) - hash + token.charCodeAt(c);
      hash |= 0;
    }

    const idx = Math.abs(hash) % DIMENSIONS;
    vec[idx] += 1.0;

    // Check cluster affinity to boost semantic closeness
    if (techClusters[token] !== undefined) {
      const clusterBase = techClusters[token];
      for (let offset = 0; offset < 10; offset++) {
        vec[(clusterBase + offset * 11) % DIMENSIONS] += 1.5;
      }
    }
  }

  // Calculate L2 norm
  let sumSq = 0;
  for (let i = 0; i < DIMENSIONS; i++) {
    sumSq += vec[i] * vec[i];
  }

  const norm = Math.sqrt(sumSq) || 1.0;
  const result: number[] = new Array(DIMENSIONS);
  for (let i = 0; i < DIMENSIONS; i++) {
    result[i] = Number((vec[i] / norm).toFixed(6));
  }

  return result;
}

/**
 * Calculates cosine similarity between two 1D vectors.
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (!a || !b || a.length !== b.length || a.length === 0) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  if (denominator === 0) return 0;

  const sim = dotProduct / denominator;
  // Clamp between 0 and 1
  return Math.max(0, Math.min(1, sim));
}

/**
 * Generates an embedding for the provided text.
 * Attempts OpenAI API if configured; otherwise gracefully falls back to deterministic vector generation.
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const cleanText = text.trim();
  if (!cleanText) {
    return generateDeterministicEmbedding('general technical profile');
  }

  const openai = getOpenAIClient();
  if (openai) {
    try {
      const response = await openai.embeddings.create({
        model: process.env.EMBEDDING_MODEL || 'text-embedding-3-small',
        input: cleanText.slice(0, 8000), // OpenAI max input tokens buffer
      });

      if (response.data && response.data[0]?.embedding) {
        return response.data[0].embedding;
      }
    } catch (err) {
      console.warn(
        '[Embeddings] OpenAI API call failed or quota exceeded, using high-fidelity fallback generator:',
        (err as Error).message
      );
    }
  }

  return generateDeterministicEmbedding(cleanText);
}
