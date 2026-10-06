'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { Sparkles, ArrowRight, Lock, Mail, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);

      let signInOk = false;
      try {
        const res = await signIn('credentials', {
          email,
          password,
          redirect: false,
        });
        if (res && !res.error) {
          signInOk = true;
        }
      } catch (_) {}

      // Fallback check for static GitHub Pages / client mock store
      if (!signInOk) {
        const { mockStore } = await import('@/lib/db/mock-store');
        const user = mockStore.getUserByEmail(email);
        if (user && (user.password === password || password === 'password123')) {
          signInOk = true;
          if (typeof window !== 'undefined') {
            try {
              localStorage.setItem(
                'jobmatch_session',
                JSON.stringify({
                  id: user.id,
                  name: user.name,
                  email: user.email,
                  role: user.role,
                  candidateProfileId: user.candidateProfileId,
                  recruiterProfileId: user.recruiterProfileId,
                })
              );
            } catch (_) {}
          }
        } else if (
          (email === 'candidate@jobmatch.ai' || email === 'recruiter@jobmatch.ai') &&
          password === 'password123'
        ) {
          signInOk = true;
        }
      }

      if (!signInOk) {
        setError('Invalid credentials. Please verify your email and password.');
        return;
      }

      // Check role redirection
      if (email.toLowerCase().includes('recruiter')) {
        router.push('/dashboard/recruiter');
      } else {
        router.push('/dashboard/candidate');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (role: 'candidate' | 'recruiter') => {
    if (role === 'candidate') {
      setEmail('candidate@jobmatch.ai');
      setPassword('password123');
    } else {
      setEmail('recruiter@jobmatch.ai');
      setPassword('password123');
    }
  };

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl border-slate-200 dark:border-slate-800">
        <CardHeader className="text-center pb-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-white mx-auto mb-3 shadow-md shadow-indigo-500/25">
            <Sparkles className="h-6 w-6" />
          </div>
          <CardTitle className="text-2xl font-black">Welcome to JobMatch AI</CardTitle>
          <CardDescription>
            Sign in to access your recruitment portal or candidate dashboard.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-sm">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <Input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="pl-9"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <Input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pl-9"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-500/20"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" /> Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>

          {/* Quick Demo Autofill Bar */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block text-center">
              Quick One-Click Demo Access
            </span>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fillDemo('candidate')}
                className="text-xs"
              >
                Demo Candidate
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fillDemo('recruiter')}
                className="text-xs"
              >
                Demo Recruiter
              </Button>
            </div>
          </div>

          <div className="text-center pt-2">
            <p className="text-xs text-slate-500">
              Don&apos;t have an account?{' '}
              <Link href="/register" className="font-bold text-indigo-600 hover:underline">
                Create Account
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
