'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Search,
  Sparkles,
  MapPin,
  DollarSign,
  Clock,
  ArrowRight,
  Briefcase,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { formatSalary } from '@/lib/utils';
import { SemanticJobSearchResult } from '@/lib/search/vector-search';

export default function SemanticJobSearchPage() {
  const [query, setQuery] = React.useState('Find backend jobs using Python and PostgreSQL');
  const [loading, setLoading] = React.useState(false);
  const [results, setResults] = React.useState<SemanticJobSearchResult[]>([]);
  const [searched, setSearched] = React.useState(false);

  const sampleQueries = [
    'Find backend jobs using Python and PostgreSQL',
    'Find AI engineering roles suitable for a fresher',
    'Show jobs requiring Next.js and vector databases',
    'High paying remote roles with React, TypeScript and AWS',
  ];

  const handleSearch = async (searchQuery: string = query) => {
    if (!searchQuery.trim()) return;
    try {
      setLoading(true);
      setSearched(true);
      const res = await fetch(`/api/search/jobs?q=${encodeURIComponent(searchQuery)}`);
      if (res.ok) {
        const data = await res.json();
        setResults(data.results || []);
      }
    } catch (err) {
      console.error('Semantic job search failed:', err);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    handleSearch(query);
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-3xl font-black text-slate-900 dark:text-white">
            Natural-Language Job Search
          </h1>
          <Badge variant="default" className="text-xs bg-indigo-600">
            pgvector Semantic Retrieval
          </Badge>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Search jobs by expressing intent, tech stack combinations, and preferences in natural language.
        </p>
      </div>

      {/* Search Input Box */}
      <Card className="shadow-sm border-slate-200 dark:border-slate-800">
        <CardContent className="pt-6 space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="e.g. Find backend jobs using Python and PostgreSQL..."
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
                  <Sparkles className="h-4 w-4 mr-1.5" /> Semantic Query
                </>
              )}
            </Button>
          </div>

          {/* Quick Suggestions */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="font-semibold text-slate-400">Example Intent Queries:</span>
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

      {/* Results Header */}
      <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
        <span>{results.length} Roles Retrieved via Cosine Vector Distance</span>
        <span>Ranked by Semantic Relevance</span>
      </div>

      {results.length === 0 && !loading && searched && (
        <Card className="p-8 text-center text-slate-500">
          No matching jobs found. Try querying different technologies or role keywords.
        </Card>
      )}

      {/* Job Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {results.map((job) => {
          const similarityScore = Math.round(job.similarity * 100);
          return (
            <Card
              key={job.id}
              className="flex flex-col justify-between hover:shadow-md transition-all border-slate-200 dark:border-slate-800 group"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <Badge variant="outline" className="text-[10px] uppercase font-bold text-indigo-600 mb-1.5">
                      {job.remoteType}
                    </Badge>
                    <CardTitle className="text-base font-bold text-slate-900 dark:text-white line-clamp-1 group-hover:text-indigo-600 transition-colors">
                      {job.title}
                    </CardTitle>
                    <p className="text-xs text-slate-500 font-medium">{job.company}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-black text-indigo-600 dark:text-indigo-400">
                      {similarityScore}%
                    </span>
                    <p className="text-[10px] text-slate-400 uppercase font-semibold">Similarity</p>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-3.5 text-xs">
                <div className="flex items-center gap-3 text-slate-500">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" /> {job.location}
                  </span>
                  <span className="flex items-center gap-1">
                    <DollarSign className="h-3.5 w-3.5" />
                    {formatSalary(job.minSalary)} - {formatSalary(job.maxSalary)}
                  </span>
                </div>

                <p className="text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                  {job.description}
                </p>

                <div className="space-y-1">
                  <div className="flex flex-wrap gap-1">
                    {job.skills?.slice(0, 4).map((sk) => (
                      <Badge
                        key={sk.name}
                        variant={sk.isRequired ? 'default' : 'secondary'}
                        className="text-[10px] py-0 px-1.5"
                      >
                        {sk.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>

              <div className="p-4 pt-0 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between mt-2">
                <span className="text-[11px] text-slate-400">
                  {job.minExperience}-{job.maxExperience} yrs exp
                </span>
                <Link href={`/jobs/${job.id}`}>
                  <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-xs gap-1">
                    View Role <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
