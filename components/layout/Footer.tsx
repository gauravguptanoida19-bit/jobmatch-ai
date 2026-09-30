import * as React from 'react';
import Link from 'next/link';
import { Sparkles, Database, Cpu } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-slate-200/80 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-950/60 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-3 md:col-span-2">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white">
                <Sparkles className="h-4 w-4" />
              </div>
              <span className="font-extrabold text-lg tracking-tight text-slate-900 dark:text-white">
                JobMatch<span className="text-indigo-600">AI</span>
              </span>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md leading-relaxed">
              Production-grade AI recruitment platform combining multi-criteria hybrid scoring,
              PostgreSQL with pgvector semantic similarity, automated PDF resume parsing, and
              explainable candidate intelligence.
            </p>
            <div className="flex items-center gap-4 text-xs font-semibold text-slate-500 pt-2">
              <span className="flex items-center gap-1">
                <Database className="h-3.5 w-3.5 text-indigo-500" /> PostgreSQL + pgvector
              </span>
              <span className="flex items-center gap-1">
                <Cpu className="h-3.5 w-3.5 text-violet-500" /> OpenAI Embeddings
              </span>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white mb-3">
              Platform
            </h4>
            <ul className="space-y-2 text-sm text-slate-500 dark:text-slate-400">
              <li>
                <Link href="/jobs" className="hover:text-indigo-600 transition-colors">
                  Browse Positions
                </Link>
              </li>
              <li>
                <Link href="/jobs/search" className="hover:text-indigo-600 transition-colors">
                  Natural Language Search
                </Link>
              </li>
              <li>
                <Link href="/dashboard/candidate" className="hover:text-indigo-600 transition-colors">
                  Candidate Portal
                </Link>
              </li>
              <li>
                <Link href="/dashboard/recruiter" className="hover:text-indigo-600 transition-colors">
                  Recruiter ATS
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white mb-3">
              Tech Stack
            </h4>
            <ul className="space-y-2 text-sm text-slate-500 dark:text-slate-400">
              <li>Next.js 15 App Router</li>
              <li>TypeScript & Tailwind CSS</li>
              <li>Prisma ORM & pgvector</li>
              <li>Docker & Docker Compose</li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-4">
          <p>© {new Date().getFullYear()} JobMatch AI. Engineered for Recruitment Intelligence.</p>
          <p>Production Portfolio Project • AI & Full-Stack Engineering</p>
        </div>
      </div>
    </footer>
  );
}
