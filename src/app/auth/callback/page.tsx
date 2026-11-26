'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';

export default function AuthCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleAuth = async () => {
      if (!supabase) {
        setError('Supabase is not configured on client.');
        return;
      }

      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;

        if (!session?.user) {
          const { data: authListener } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
            if (currentSession?.user) {
              authListener.subscription.unsubscribe();
              await processUser(currentSession.user);
            }
          });
          return;
        }

        await processUser(session.user);
      } catch (err: any) {
        setError(err.message || 'Authentication failed');
      }
    };

    const processUser = async (user: any) => {
      try {
        const res = await fetch('/api/auth/google', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: user.email,
            name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0],
            avatar: user.user_metadata?.avatar_url || user.user_metadata?.picture,
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          if (data.error === 'APPROVAL_PENDING' && data.user?.id) {
            localStorage.setItem('enactus_user_id', data.user.id);
            router.replace('/pending-approval');
            return;
          }
          setError(data.message || data.error || 'Failed to authenticate user');
          return;
        }

        if (data.user?.id) {
          localStorage.setItem('enactus_user_id', data.user.id);
          router.replace('/dashboard');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to process user credentials');
      }
    };

    handleAuth();
  }, [router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F7F9F7] p-4">
      <div className="rounded-2xl border border-[#E3EBE7] bg-white p-8 text-center shadow-sm max-w-sm w-full">
        {error ? (
          <div>
            <div className="text-rose-600 font-bold mb-2 text-sm">Sign-In Error</div>
            <p className="text-xs text-rose-500 mb-4">{error}</p>
            <button
              onClick={() => router.push('/login')}
              className="text-xs font-bold text-[#0D5143] underline hover:text-[#2FC3A5]"
            >
              Back to Login
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-6 w-6 animate-spin text-[#2FC3A5]" />
            <p className="text-xs font-semibold text-[#60736C]">Authenticating with Google...</p>
          </div>
        )}
      </div>
    </div>
  );
}
