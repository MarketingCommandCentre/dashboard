import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

export function LoginScreen() {
  const { login } = useAuth();

  return (
    <div className="flex min-h-screen w-full flex-1 items-center justify-center bg-gradient-to-br from-[#002855] via-[#003163] to-[#003d7a] p-6 text-white">
      <div className="w-full max-w-md rounded-xl border border-white/15 bg-white/5 p-8 text-center shadow-[var(--shadow-soft)] backdrop-blur-sm">
        <img
          src="/msa_logo_white.png"
          alt="UTM MSA"
          className="mx-auto mb-5 h-20 w-20 object-contain"
        />
        <h1 className="text-xl font-semibold tracking-tight">UTM MSA Marketing Command Centre</h1>
        <p className="mt-2 text-lg" dir="rtl" lang="ar">
          بِسْمِ ٱللَّٰهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
        </p>

        <p className="mt-6 text-2xl font-semibold">السلام عليكم! 👋</p>
        <p className="mt-2 text-sm text-white/80">
          Please sign in with your Discord account to access the Marketing Command Centre.
        </p>
        <p className="mt-2 text-xs text-white/60">
          ✓ You must be a member of the Marketing Command Centre.
        </p>

        <Button
          onClick={login}
          size="lg"
          className="mt-6 h-11 w-full bg-[#5865F2] text-base text-white hover:bg-[#4752c4]"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z" />
          </svg>
          Sign in with Discord
        </Button>

        <div className="mt-6 border-t border-white/10 pt-4">
          <p className="text-sm text-white/80" dir="rtl" lang="ar">
            وَقُلِ ٱعْمَلُوا۟ فَسَيَرَى ٱللَّهُ عَمَلَكُمْ
          </p>
          <p className="mt-1 text-xs text-white/50">— At-Tawbah 9:105</p>
        </div>
      </div>
    </div>
  );
}
