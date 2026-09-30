'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Sparkles,
  ArrowRight,
  Database,
  Cpu,
  CheckCircle2,
  Layers,
  Search,
  UploadCloud,
  BarChart3,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { MatchScoreCard } from '@/components/matching/MatchScoreCard';
import { MatchExplanation } from '@/types';

export default function HomePage() {
  // Interactive Live Demo State
  const sampleMatches: Record<string, { jobTitle: string; candidateName: string; match: MatchExplanation }> = {
    ai_eng: {
      jobTitle: 'Senior AI Engineer (LLMs & pgvector)',
      candidateName: 'Alex Rivera (Staff ML Engineer)',
      match: {
        overallScore: 89,
        breakdown: {
          skillsMatch: 94,
          semanticMatch: 91,
          experienceMatch: 85,
          educationMatch: 100,
          preferencesMatch: 85,
        },
        weights: { skills: 0.35, semantic: 0.25, experience: 0.20, education: 0.10, preferences: 0.10 },
        matchingSkills: ['Python', 'PyTorch', 'PostgreSQL', 'pgvector', 'Docker', 'FastAPI'],
        missingSkills: ['Kubernetes', 'Apache Kafka'],
        strengths: [
          'Direct production experience deploying LLM retrieval pipelines and vector indexes',
          'Strong background in PostgreSQL database optimization and pgvector indexing',
          '6+ years of engineering experience across machine learning and distributed systems',
        ],
        recommendations: [
          'Highlight hands-on Kafka streaming integration or queue decoupling patterns in portfolio.',
          'Add brief case studies showcasing Kubernetes microservice scaling.',
        ],
        summary: 'Alex Rivera is an exceptional match (89%) for Senior AI Engineer with robust LLM, Python, and pgvector proficiencies.',
      },
    },
    fullstack: {
      jobTitle: 'Lead Full Stack Engineer (Next.js 15)',
      candidateName: 'Sarah Chen (Senior Full Stack Dev)',
      match: {
        overallScore: 87,
        breakdown: {
          skillsMatch: 92,
          semanticMatch: 88,
          experienceMatch: 81,
          educationMatch: 100,
          preferencesMatch: 85,
        },
        weights: { skills: 0.35, semantic: 0.25, experience: 0.20, education: 0.10, preferences: 0.10 },
        matchingSkills: ['Next.js', 'TypeScript', 'React', 'PostgreSQL', 'Tailwind CSS', 'Node.js'],
        missingSkills: ['Kafka', 'AWS', 'Kubernetes'],
        strengths: [
          'Extensive production mastery of modern React 19 and Next.js 15 App Router architecture',
          'Clean database design with Prisma and PostgreSQL relational modeling',
          'Demonstrated leadership building responsive, high-performance web applications',
        ],
        recommendations: [
          'Demonstrate AWS Cloud deployment workflows or container orchestration familiarity.',
          'Consider completing an AWS Solutions Architect or Cloud Practitioner overview.',
        ],
        summary: 'Sarah Chen demonstrates strong technical alignment (87%) with front-end leadership and full-stack execution.',
      },
    },
    devops: {
      jobTitle: 'Cloud Platform & DevOps Engineer',
      candidateName: 'Marcus Vance (DevOps Specialist)',
      match: {
        overallScore: 82,
        breakdown: {
          skillsMatch: 85,
          semanticMatch: 80,
          experienceMatch: 86,
          educationMatch: 80,
          preferencesMatch: 90,
        },
        weights: { skills: 0.35, semantic: 0.25, experience: 0.20, education: 0.10, preferences: 0.10 },
        matchingSkills: ['Docker', 'Kubernetes', 'AWS', 'Terraform', 'CI/CD', 'Linux'],
        missingSkills: ['Golang', 'Prometheus'],
        strengths: [
          'Comprehensive infrastructure-as-code and container orchestration experience',
          'Multi-region AWS cloud configuration and hardened CI/CD pipeline automation',
        ],
        recommendations: [
          'Add Golang automation tooling samples or Kubernetes operator experiments.',
        ],
        summary: 'Marcus Vance possesses a solid 82% fit with well-rounded cloud platform and infrastructure skills.',
      },
    },
  };

  const [selectedDemo, setSelectedDemo] = React.useState<'ai_eng' | 'fullstack' | 'devops'>('fullstack');

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-24 lg:pt-28 lg:pb-32 bg-gradient-to-b from-indigo-50/50 via-white to-slate-50/80 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.15),rgba(255,255,255,0))] dark:bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(99,102,241,0.2),rgba(0,0,0,0))]" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-200/80 dark:bg-indigo-950/60 dark:border-indigo-800 text-xs font-semibold text-indigo-700 dark:text-indigo-300 shadow-sm animate-fade-in">
            <Sparkles className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            <span>Next-Generation AI Recruitment Intelligence</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-slate-900 dark:text-white max-w-4xl mx-auto leading-[1.1]">
            AI Job Matching for{' '}
            <span className="bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 bg-clip-text text-transparent">
              Signal, Not Noise
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Eliminate keyword bingo. Match candidates and tech roles with 5-factor hybrid scoring,
            PostgreSQL <code className="text-indigo-600 dark:text-indigo-400 font-mono font-bold">pgvector</code> embeddings,
            and transparent, explainable recommendations.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <Link href="/dashboard/candidate">
              <Button size="lg" className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/25">
                <UploadCloud className="h-5 w-5" />
                Upload Resume & Match
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/dashboard/recruiter">
              <Button size="lg" variant="outline" className="gap-2">
                Recruiter ATS Suite
              </Button>
            </Link>
            <Link href="/jobs/search">
              <Button size="lg" variant="secondary" className="gap-2">
                <Search className="h-4 w-4" />
                Semantic Search
              </Button>
            </Link>
          </div>

          {/* Quick Demo Access Bar */}
          <div className="pt-8 flex flex-col sm:flex-row items-center justify-center gap-3 text-xs text-slate-500">
            <span className="font-semibold uppercase tracking-wider text-slate-400">Instant Demo Login:</span>
            <div className="flex gap-2">
              <Link href="/dashboard/candidate">
                <Badge variant="outline" className="cursor-pointer hover:bg-indigo-50 dark:hover:bg-indigo-950">
                  Candidate: candidate@jobmatch.ai (pwd: password123)
                </Badge>
              </Link>
              <Link href="/dashboard/recruiter">
                <Badge variant="outline" className="cursor-pointer hover:bg-indigo-50 dark:hover:bg-indigo-950">
                  Recruiter: recruiter@jobmatch.ai (pwd: password123)
                </Badge>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Simulator Section */}
      <section className="py-16 sm:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="text-center max-w-3xl mx-auto mb-10 space-y-3">
          <Badge variant="default" className="bg-indigo-100 text-indigo-800 dark:bg-indigo-900/60 dark:text-indigo-300">
            Interactive Match Engine
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white">
            See the Hybrid Scoring Formula in Action
          </h2>
          <p className="text-slate-600 dark:text-slate-400">
            Real multi-criteria evaluation combining hard skills (35%), semantic embedding vectors (25%),
            experience bounds (20%), education hierarchy (10%), and location/preference compatibility (10%).
          </p>

          {/* Role selector tabs */}
          <div className="inline-flex p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 mt-4">
            <button
              onClick={() => setSelectedDemo('fullstack')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                selectedDemo === 'fullstack'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Full Stack Engineer (87%)
            </button>
            <button
              onClick={() => setSelectedDemo('ai_eng')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                selectedDemo === 'ai_eng'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Senior AI Engineer (89%)
            </button>
            <button
              onClick={() => setSelectedDemo('devops')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                selectedDemo === 'devops'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Cloud Platform (82%)
            </button>
          </div>
        </div>

        {/* Live Match Card */}
        <div className="max-w-4xl mx-auto">
          <MatchScoreCard
            match={sampleMatches[selectedDemo].match}
            jobTitle={sampleMatches[selectedDemo].jobTitle}
            candidateName={sampleMatches[selectedDemo].candidateName}
          />
        </div>
      </section>

      {/* Feature Pillars */}
      <section className="py-20 bg-slate-100/60 dark:bg-slate-900/40 border-y border-slate-200/80 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <h2 className="text-3xl font-black text-slate-900 dark:text-white">
              Engineered for Production Recruitment Tech
            </h2>
            <p className="text-slate-600 dark:text-slate-400">
              Not a superficial prompt wrapper. A full-stack architecture built on modern vector indexing,
              robust statistical matching, and transparent AI reasoning.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6 space-y-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                  <Database className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  PostgreSQL & pgvector
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                  Fast vector similarity queries using 1536-dimensional embeddings with cosine distance
                  (<code className="text-indigo-600 font-mono">&lt;=&gt;</code>) indexes directly alongside relational schemas.
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6 space-y-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-100 dark:bg-violet-950 text-violet-600 dark:text-violet-400">
                  <Layers className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  5-Factor Hybrid Scoring
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                  Balances semantic similarity with required skill coverage, seniority boundaries, education
                  pre-requisites, and compensation expectations.
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6 space-y-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Explainable Intelligence
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                  Every recommendation provides explicit strengths, missing skill gaps, and actionable coaching
                  feedback—ensuring fairness and auditability.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 text-center max-w-4xl mx-auto px-4">
        <div className="p-10 rounded-3xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-xl shadow-indigo-500/20 space-y-6">
          <h2 className="text-3xl sm:text-4xl font-black">
            Ready to Experience Intelligent Job Matching?
          </h2>
          <p className="text-indigo-100 max-w-xl mx-auto">
            Upload your resume to see structured skill extraction and receive instant recommended jobs
            with detailed explainability cards.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <Link href="/dashboard/candidate">
              <Button size="lg" className="bg-white text-indigo-700 hover:bg-indigo-50 font-bold">
                Get Started as Candidate
              </Button>
            </Link>
            <Link href="/dashboard/recruiter">
              <Button size="lg" variant="outline" className="border-white/40 text-white hover:bg-white/10 font-bold">
                Access Recruiter Portal
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
