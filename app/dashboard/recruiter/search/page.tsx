'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Search,
  Users,
  Sparkles,
  MapPin,
  Briefcase,
  GraduationCap,
  Layers,
  ArrowRight,
  Loader2,
  Mail,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Sidebar } from '@/components/layout/Sidebar';
import { SemanticCandidateSearchResult } from '@/lib/search/vector-search';

export default function CandidateSemanticSearchPage() {
  const [query, setQuery] = React.useState('Find candidates with React, Node.js and AI experience');
  const [loading, setLoading] = React.useState(false);
  const [results, setResults] = React.useState<SemanticCandidateSearchResult[]>([]);
  const [searched, setSearched] = React.useState(false);

  const sampleQueries = [
    'Find candidates with React, Node.js and AI experience',
    'Senior Python engineers with PyTorch, pgvector, and LLMs',
    'DevOps engineers proficient in Kubernetes, Terraform, and AWS',
    'Junior or fresher full-stack engineers with TypeScript and Next.js',
  ];

  const handleSearch = async (searchQuery: string = query) => {
    if (!searchQuery.trim()) return;
    try {
      setLoading(true);
      setSearched(true);
      const res = await fetch(`/api/search/candidates?q=${encodeURIComponent(searchQuery)}`);
      if (res.ok) {
        const data = await res.json();
        setResults(data.candidates || []);
      }
    } catch (err) {
      console.error('Candidate search failed:', err);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    // Initial search on mount
    handleSearch(query);
  }, []);

  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      <Sidebar role="RECRUITER" />

      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              Semantic Candidate Intelligence Search
            </h1>
            <Badge variant="default" className="text-xs bg-violet-600">
              pgvector 1536-dim
            </Badge>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Search talent across unstructured resumes, projects, and bios using natural-language AI embeddings.
          </p>
        </div>

        {/* Search Bar */}
        <Card className="shadow-sm border-slate-200 dark:border-slate-800">
          <CardContent className="pt-6 space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="e.g. Find candidates with React, Node.js and AI experience..."
                  className="pl-10 h-11"
                />
              </div>
              <Button
                onClick={() => handleSearch()}
                disabled={loading}
                className="h-11 px-6 bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-500/20"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> Vector Searching...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-1.5" /> Search Talent
                  </>
                )}
              </Button>
            </div>

            {/* Quick Suggestions */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="font-semibold text-slate-400">Try Prompts:</span>
              {sampleQueries.map((sq) => (
                <button
                  key={sq}
                  onClick={() => {
                    setQuery(sq);
                    handleSearch(sq);
                  }}
                  className="px-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors text-left"
                >
                  &quot;{sq}&quot;
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
            <span>{results.length} Candidates Ranked by Semantic Relevance</span>
            <span>Cosine Similarity Metric</span>
          </div>

          {results.length === 0 && !loading && searched && (
            <Card className="p-8 text-center text-slate-500">
              No matching candidates found. Try broadening your query terms.
            </Card>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {results.map((candidate, idx) => {
              const relevancePercent = Math.round(candidate.similarity * 100);
              return (
                <Card
                  key={candidate.id}
                  className="hover:shadow-md transition-shadow border-slate-200 dark:border-slate-800"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white font-bold text-base shadow-sm">
                          {candidate.name.charAt(0)}
                        </div>
                        <div>
                          <CardTitle className="text-base font-bold">
                            {candidate.name}
                          </CardTitle>
                          <p className="text-xs text-slate-500 font-medium">
                            {candidate.headline || 'Software & AI Engineer'}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-lg font-black text-indigo-600 dark:text-indigo-400">
                          {relevancePercent}%
                        </span>
                        <p className="text-[10px] text-slate-400 uppercase font-semibold">
                          Relevance
                        </p>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-3 text-xs">
                    <div className="flex items-center gap-4 text-slate-500">
                      <span className="flex items-center gap-1">
                        <Briefcase className="h-3.5 w-3.5" /> {candidate.yearsOfExperience} Yrs Exp
                      </span>
                      <span className="flex items-center gap-1">
                        <GraduationCap className="h-3.5 w-3.5" /> {candidate.educationLevel || "Bachelor's"}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" /> {candidate.location || 'Remote'}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[11px] font-bold text-slate-400 uppercase">
                        Matched Skills:
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {candidate.skills.slice(0, 6).map((sk) => (
                          <Badge
                            key={sk.name}
                            variant="secondary"
                            className="text-[10px] py-0 px-2 bg-slate-100 dark:bg-slate-800"
                          >
                            {sk.name}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <span className="text-slate-400 flex items-center gap-1 text-[11px]">
                        <Mail className="h-3 w-3" /> {candidate.email}
                      </span>
                      <Link href={`/dashboard/recruiter`}>
                        <Button size="sm" variant="ghost" className="text-indigo-600 text-xs gap-1 p-0 hover:bg-transparent">
                          View in ATS <ArrowRight className="h-3.5 w-3.5" />
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
