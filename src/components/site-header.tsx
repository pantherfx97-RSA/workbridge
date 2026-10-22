"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function SiteHeader() {
  const [supabase] = useState(() => createClient());
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [signingOut, setSigningOut] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [error, setError] = useState("");
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    let active = true;

    supabase.auth.getSession().then(({ data, error: sessionError }) => {
      if (!active) return;
      setEmail(data.session?.user.email ?? null);
      if (sessionError) setError("Unable to check your account status.");
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      setEmail(session?.user.email ?? null);
      setLoading(false);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- close mobile menu after route changes
    setMenuOpen(false);
    setError("");
  }, [pathname]);

  async function handleSignOut() {
    setSigningOut(true);
    setError("");

    const { error: signOutError } = await supabase.auth.signOut();

    if (signOutError) {
      setError("We couldn't sign you out. Please try again.");
      setSigningOut(false);
      return;
    }

    setEmail(null);
    setSigningOut(false);
    setMenuOpen(false);
    router.push("/");
    router.refresh();
  }

  const linkClass = (href: string) =>
    `rounded-lg px-3 py-2 text-sm font-medium transition ${
      pathname === href
        ? "bg-blue-500/15 text-blue-300"
        : "text-slate-300 hover:bg-white/5 hover:text-white"
    }`;

  return (
    <header className="relative z-50 border-b border-slate-800 bg-[#080d18] text-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <Link href="/" className="flex shrink-0 items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500 font-bold">
            W
          </span>
          <span className="text-xl font-bold">
            Work<span className="text-blue-400">Bridge</span>
          </span>
        </Link>

        <button
          type="button"
          className="rounded-lg border border-slate-700 p-2 text-slate-200 hover:bg-slate-800 sm:hidden"
          aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? "✕" : "☰"}
        </button>

        <div className="hidden items-center gap-2 sm:flex">
          {pathname === "/" && (
            <nav aria-label="Homepage navigation" className="flex items-center gap-1">
              <a href="#how-it-works" className="rounded-lg px-3 py-2 text-sm text-slate-300 hover:text-white">
                How it works
              </a>
              <a href="#features" className="rounded-lg px-3 py-2 text-sm text-slate-300 hover:text-white">
                Features
              </a>
              <Link href="/assessment" className="rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-200 hover:border-blue-400">
                Get started →
              </Link>
            </nav>
          )}
          <nav aria-label="Main navigation" className="flex items-center gap-1">
            <Link href="/assessment" className={linkClass("/assessment")}>
              Assessment
            </Link>
            <Link href="/roadmap" className={linkClass("/roadmap")}>
              Roadmap
            </Link>
            <Link href="/progress" className={linkClass("/progress")}>
              Progress
            </Link>
            <Link href="/portfolio" className={linkClass("/portfolio")}>
              Portfolio
            </Link>
            <Link href="/opportunities" className={linkClass("/opportunities")}>
              Opportunities
            </Link>
          </nav>

          <div className="ml-2 flex items-center gap-2 border-l border-slate-700 pl-3">
            {loading ? (
              <span className="px-3 py-2 text-xs text-slate-400">Checking account…</span>
            ) : email ? (
              <>
                <Link
                  href="/auth"
                  title={email}
                  className="max-w-36 truncate rounded-lg px-3 py-2 text-sm text-slate-300 hover:bg-white/5"
                >
                  My account
                </Link>
                <button
                  type="button"
                  onClick={handleSignOut}
                  disabled={signingOut}
                  className="rounded-lg border border-slate-700 px-3 py-2 text-sm font-semibold text-slate-200 transition hover:border-rose-400/60 hover:text-rose-200 disabled:opacity-60"
                >
                  {signingOut ? "Signing out…" : "Log out"}
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/auth?mode=signin"
                  className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-200 hover:bg-white/5"
                >
                  Sign in
                </Link>
                <Link
                  href="/auth?mode=signup"
                  className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-400"
                >
                  Sign up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {menuOpen && (
        <div className="border-t border-slate-800 px-4 py-4 sm:hidden">
          <nav aria-label="Mobile navigation" className="flex flex-col gap-1">
            <Link href="/assessment" className={linkClass("/assessment")}>Assessment</Link>
            <Link href="/roadmap" className={linkClass("/roadmap")}>Roadmap</Link>
            <Link href="/progress" className={linkClass("/progress")}>Progress</Link>
            <Link href="/portfolio" className={linkClass("/portfolio")}>Portfolio</Link>
            <Link href="/opportunities" className={linkClass("/opportunities")}>Opportunities</Link>
          </nav>

          <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-800 pt-4">
            {!loading && (email ? (
              <>
                <Link href="/auth" className="rounded-lg border border-slate-700 px-4 py-2 text-sm">
                  My account
                </Link>
                <button
                  type="button"
                  onClick={handleSignOut}
                  disabled={signingOut}
                  className="rounded-lg border border-rose-400/40 px-4 py-2 text-sm text-rose-200 disabled:opacity-60"
                >
                  {signingOut ? "Signing out…" : "Log out"}
                </button>
              </>
            ) : (
              <>
                <Link href="/auth?mode=signin" className="rounded-lg border border-slate-700 px-4 py-2 text-sm">
                  Sign in
                </Link>
                <Link href="/auth?mode=signup" className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-semibold">
                  Sign up
                </Link>
              </>
            ))}
          </div>

          {error && <p role="alert" className="mt-3 text-sm text-rose-300">{error}</p>}
        </div>
      )}

      {error && !menuOpen && (
        <p role="alert" className="mx-auto max-w-7xl px-6 pb-3 text-sm text-rose-300">
          {error}
        </p>
      )}
    </header>
  );
}
