import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { discordLoginUrl } from '@/lib/api';
import { clearAuthToken } from '@/lib/auth';

export type UnauthorizedReason = 'not_in_guild' | 'auth_failed';

interface ReasonCopy {
  title: string;
  body: string;
  hints: string[];
}

const REASON_COPY: Record<UnauthorizedReason, ReasonCopy> = {
  not_in_guild: {
    title: 'You’re not in the Marketing server',
    body: 'Your Discord sign-in worked, but that account isn’t a member of the UTM MSA Marketing Discord server — membership is required to use the Command Centre.',
    hints: [
      'Join the UTM MSA Marketing Discord server, then sign in again.',
      'Signed in with the wrong Discord account? Log out of Discord and try again.',
      'If you believe this is a mistake, contact a Marketing admin.',
    ],
  },
  auth_failed: {
    title: 'Sign-in didn’t go through',
    body: 'Discord didn’t complete the sign-in. This can happen if the authorization was cancelled or timed out.',
    hints: ['Try signing in again.', 'If it keeps failing, contact a Marketing admin.'],
  },
};

const DEFAULT_COPY: ReasonCopy = {
  title: 'Access denied',
  body: 'You don’t have permission to access the Marketing Command Centre.',
  hints: ['If you believe this is a mistake, contact a Marketing admin.'],
};

export function UnauthorizedPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const reason = searchParams.get('reason') as UnauthorizedReason | null;
  const copy = (reason && REASON_COPY[reason]) || DEFAULT_COPY;

  // Whoever landed here is not authorized — make sure no stale token lingers.
  useEffect(() => {
    clearAuthToken();
  }, []);

  return (
    <div className="flex min-h-screen w-full flex-1 items-center justify-center bg-gradient-to-br from-[#002855] via-[#003163] to-[#003d7a] p-6 text-white">
      <div className="w-full max-w-md rounded-xl border border-white/15 bg-white/5 p-8 text-center shadow-[var(--shadow-soft)] backdrop-blur-sm">
        <img
          src="/msa_logo_white.png"
          alt="UTM MSA"
          className="mx-auto mb-5 h-14 w-14 object-contain opacity-90"
        />

        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-amber-300/40 bg-amber-400/10">
          <svg
            width="26"
            height="26"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-amber-300"
            aria-hidden
          >
            <rect x="4" y="10.5" width="16" height="9.5" rx="2" />
            <path d="M8 10.5V7a4 4 0 0 1 8 0v3.5" />
            <circle cx="12" cy="15.25" r="1.25" fill="currentColor" stroke="none" />
          </svg>
        </div>

        <h1 className="mt-4 text-xl font-semibold tracking-tight">{copy.title}</h1>
        <p className="mt-3 text-sm leading-relaxed text-white/80">{copy.body}</p>

        <ul className="mt-5 space-y-2 rounded-lg border border-white/10 bg-white/5 p-4 text-left">
          {copy.hints.map((hint) => (
            <li key={hint} className="flex gap-2 text-xs leading-relaxed text-white/70">
              <span className="text-amber-300" aria-hidden>
                •
              </span>
              {hint}
            </li>
          ))}
        </ul>

        <Button
          onClick={() => {
            window.location.href = discordLoginUrl();
          }}
          size="lg"
          className="mt-6 h-11 w-full bg-[#5865F2] text-base text-white hover:bg-[#4752c4]"
        >
          Try again with Discord
        </Button>
        <Button
          onClick={() => navigate('/', { replace: true })}
          variant="ghost"
          className="mt-2 w-full text-sm text-white/70 hover:bg-white/10 hover:text-white"
        >
          Back to sign in
        </Button>

        <div className="mt-6 border-t border-white/10 pt-4">
          <p className="text-sm text-white/80" dir="rtl" lang="ar">
            إِنَّ مَعَ الْعُسْرِ يُسْرًا
          </p>
          <p className="mt-1 text-xs text-white/50">— Ash-Sharh 94:6</p>
        </div>
      </div>
    </div>
  );
}
