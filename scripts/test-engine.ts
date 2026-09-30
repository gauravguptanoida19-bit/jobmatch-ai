import {
  calculateSkillScore,
  calculateExperienceScore,
  calculateEducationScore,
  calculatePreferenceScore,
  calculateHybridMatch,
  DEFAULT_WEIGHTS,
} from '../lib/matching/engine';
import {
  generateDeterministicEmbedding,
  cosineSimilarity,
} from '../lib/embeddings/generator';
import { parseResumeLocally } from '../lib/ai/openai';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    process.exit(1);
  } else {
    console.log(`✓ PASSED: ${message}`);
  }
}

async function runTests() {
  console.log('=== Running JobMatch AI Engine Unit & Math Tests ===\n');

  // Test 1: Embedding Generator Dimensions & Unit Norm
  console.log('[Test 1] Vector Embedding Synthesizer');
  const emb1 = generateDeterministicEmbedding('Senior Python Engineer with PyTorch and pgvector');
  const emb2 = generateDeterministicEmbedding('Python, PyTorch machine learning developer');
  const emb3 = generateDeterministicEmbedding('Art history and watercolor landscape painting');

  assert(emb1.length === 1536, 'Vector dimension is exactly 1536');
  assert(emb2.length === 1536, 'Vector dimension is exactly 1536 for second input');

  // Calculate L2 norm of emb1
  const norm1 = Math.sqrt(emb1.reduce((sum, v) => sum + v * v, 0));
  assert(Math.abs(norm1 - 1.0) < 0.01, 'Generated vector has unit L2 norm (~1.0)');

  // Semantic similarity check: Related tech queries should have higher cosine similarity than unrelated queries
  const simRelated = cosineSimilarity(emb1, emb2);
  const simUnrelated = cosineSimilarity(emb1, emb3);
  console.log(`  Similarity (Python/PyTorch vs ML Dev): ${(simRelated * 100).toFixed(1)}%`);
  console.log(`  Similarity (Python/PyTorch vs Watercolor): ${(simUnrelated * 100).toFixed(1)}%`);
  assert(
    simRelated > simUnrelated,
    'Related technical embeddings have higher cosine similarity than unrelated embeddings'
  );

  // Test 2: Skill Scoring Logic
  console.log('\n[Test 2] Skill Scoring & Weight Calculations');
  const candidateSkills = [
    { name: 'Python', level: 'EXPERT', yearsExperience: 5 },
    { name: 'PostgreSQL', level: 'ADVANCED', yearsExperience: 4 },
    { name: 'TypeScript', level: 'INTERMEDIATE', yearsExperience: 2 },
  ];

  const skillResultFull = calculateSkillScore(candidateSkills, ['Python', 'PostgreSQL'], ['TypeScript']);
  assert(skillResultFull.score >= 90, 'Full required skill coverage yields >= 90% score');
  assert(skillResultFull.missingSkills.length === 0, 'No missing skills when all are matched');

  const skillResultPartial = calculateSkillScore(candidateSkills, ['Python', 'Kubernetes', 'Kafka'], []);
  assert(skillResultPartial.score < 60, 'Missing 2 of 3 required skills reflects significant penalty');
  assert(skillResultPartial.missingSkills.includes('Kubernetes'), 'Correctly identifies missing Kubernetes');

  // Test 3: Experience Scoring Logic
  console.log('\n[Test 3] Experience Bounds Scoring');
  assert(calculateExperienceScore(5, 3, 7) === 100, 'Experience within bounds gives 100%');
  assert(calculateExperienceScore(1, 4, 7) < 50, 'Underqualified experience penalizes score');
  assert(calculateExperienceScore(12, 3, 6) >= 75, 'Overqualified candidate retains reasonable score');

  // Test 4: Education Hierarchy Scoring
  console.log('\n[Test 4] Education Hierarchy Scoring');
  assert(calculateEducationScore("Master's", "Bachelor's") === 100, "Master's satisfies Bachelor's (100%)");
  assert(calculateEducationScore("Bachelor's", "Bachelor's") === 100, "Bachelor's satisfies Bachelor's (100%)");
  assert(calculateEducationScore("Associate's", "Master's") <= 60, "Associate's penalized when Master's required");

  // Test 5: Hybrid Match Multi-Criteria Overall Formula
  console.log('\n[Test 5] Hybrid Multi-Criteria Matching Engine');
  const match = await calculateHybridMatch(
    {
      name: 'Test Candidate',
      skills: [
        { name: 'Python', level: 'EXPERT', yearsExperience: 5 },
        { name: 'PostgreSQL', level: 'ADVANCED', yearsExperience: 4 },
        { name: 'Docker', level: 'INTERMEDIATE', yearsExperience: 3 },
      ],
      yearsOfExperience: 5,
      educationLevel: "Bachelor's",
      remotePreference: 'REMOTE',
      desiredSalary: 140000,
      embedding: emb1,
    },
    {
      title: 'Python Backend Engineer',
      requiredSkills: ['Python', 'PostgreSQL'],
      preferredSkills: ['Docker', 'Kafka'],
      minExperience: 3,
      maxExperience: 7,
      educationLevel: "Bachelor's",
      location: 'Remote',
      remoteType: 'REMOTE',
      minSalary: 130000,
      maxSalary: 160000,
      embedding: emb2,
    }
  );

  console.log(`  Overall Fit: ${match.overallScore}%`);
  console.log(`  Skills: ${match.breakdown.skillsMatch}% (Weight: 35%)`);
  console.log(`  Semantic: ${match.breakdown.semanticMatch}% (Weight: 25%)`);
  console.log(`  Experience: ${match.breakdown.experienceMatch}% (Weight: 20%)`);
  console.log(`  Education: ${match.breakdown.educationMatch}% (Weight: 10%)`);
  console.log(`  Preferences: ${match.breakdown.preferencesMatch}% (Weight: 10%)`);

  assert(match.overallScore >= 80, 'Strong matching candidate achieves overall score >= 80%');
  assert(match.matchingSkills.includes('Python'), 'Matching skills include Python');
  assert(match.missingSkills.includes('Kafka'), 'Missing skills include Kafka');
  assert(match.strengths.length > 0, 'Generates explainable strengths');
  assert(match.recommendations.length > 0, 'Generates actionable recommendations');

  // Test 6: Heuristic Resume Local Parser
  console.log('\n[Test 6] Heuristic Resume Parsing Pipeline');
  const sampleResumeText = `
    Jane Doe
    jane.doe@example.com | (555) 234-5678 | San Francisco, CA
    Senior Software Engineer with 6 years of experience.
    Education: Master's in Computer Science from Stanford University.
    Skills: Python, TypeScript, React, PostgreSQL, Docker, PyTorch.
    Experience: Built scalable microservices and vector indexing algorithms.
  `;

  const parsed = parseResumeLocally(sampleResumeText);
  assert(parsed.fullName.length > 0, 'Parsed full name exists');
  assert(parsed.email === 'jane.doe@example.com', 'Parsed correct email');
  assert(parsed.totalYearsExperience === 6, 'Parsed 6 years experience');
  assert(parsed.educationLevel === "Master's", "Parsed Master's degree");
  assert(parsed.skills.some((s) => s.name === 'Python'), 'Detected Python skill');
  assert(parsed.skills.some((s) => s.name === 'PostgreSQL'), 'Detected PostgreSQL skill');

  console.log('\n🎉 ALL 6 TEST SUITES PASSED FLAWLESSLY!');
}

runTests().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});
