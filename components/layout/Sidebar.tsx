'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  User,
  FileText,
  Briefcase,
  Search,
  BarChart3,
  PlusCircle,
  Sparkles,
  Users,
  Compass,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface SidebarProps {
  role: 'CANDIDATE' | 'RECRUITER';
}

export function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();

  const candidateLinks = [
    { name: 'Dashboard & Profile', href: '/dashboard/candidate', icon: User },
    { name: 'Recommended Jobs', href: '/dashboard/candidate#recommended', icon: Sparkles },
    { name: 'Semantic Job Search', href: '/jobs/search', icon: Search },
    { name: 'Browse All Roles', href: '/jobs', icon: Briefcase },
  ];

  const recruiterLinks = [
    { name: 'Active Job Postings', href: '/dashboard/recruiter', icon: Briefcase },
    { name: 'Talent Search (AI)', href: '/dashboard/recruiter/search', icon: Users },
    { name: 'Pipeline Analytics', href: '/dashboard/recruiter/analytics', icon: BarChart3 },
    { name: 'Post a New Job', href: '/dashboard/recruiter#post-job', icon: PlusCircle },
  ];

  const links = role === 'CANDIDATE' ? candidateLinks : recruiterLinks;

  return (
    <aside className="w-64 shrink-0 hidden lg:block border-r border-slate-200/80 bg-slate-50/50 p-5 dark:border-slate-800 dark:bg-slate-950/40 min-h-[calc(100vh-4rem)]">
      <div className="space-y-6">
        <div>
          <div className="flex items-center justify-between mb-3 px-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Workspace
            </span>
            <Badge
              variant={role === 'RECRUITER' ? 'default' : 'secondary'}
              className="text-[10px] uppercase font-bold"
            >
              {role === 'RECRUITER' ? 'Recruiter Hub' : 'Candidate'}
            </Badge>
          </div>
          <nav className="space-y-1">
            {links.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                    isActive
                      ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-200/60 dark:border-slate-800 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-900/60'
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{link.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Info Card */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-50 to-violet-50 dark:from-slate-900 dark:to-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50 text-xs text-indigo-950 dark:text-indigo-200 space-y-2">
          <div className="flex items-center gap-1.5 font-bold text-indigo-700 dark:text-indigo-400">
            <Sparkles className="h-4 w-4" />
            <span>Hybrid Match Engine</span>
          </div>
          <p className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-400">
            Powered by 5-criteria weighted evaluation and pgvector 1536-dim embeddings.
          </p>
        </div>
      </div>
    </aside>
  );
}
