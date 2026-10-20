"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function AuthPage() {
  const [supabase] = useState(() => createClient());
  const [mode, setMode] = useState<"signin" | "signup">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState(() => typeof window !== "undefined" && new URLSearchParams(window.location.search).has("error") ? "We couldn't verify your email link. Please try signing in again." : "");

  useEffect(() => {
    let active = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setUserEmail(data.session?.user.email ?? null);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active) setUserEmail(session?.user.email ?? null);
    });


    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    setSubmitting(true);

    try {
      if (mode === "signup") {
        const { data, error: signupError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });

        if (signupError) throw signupError;

        if (data.session) {
          setUserEmail(data.user?.email ?? email.trim());
          setMessage("Your account is ready. You are signed in.");
        } else {
          setMessage(
            "Account request received. Check your email for a confirmation link before signing in."
          );
        }
      } else {
        const { data, error: signinError } =
          await supabase.auth.signInWithPassword({
            email: email.trim(),
            password,
          });

        if (signinError) throw signinError;

        setUserEmail(data.user.email ?? email.trim());
        setMessage("Signed in successfully. Your account is ready to connect.");
      }
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResendConfirmation() {
    const normalizedEmail = email.trim();

    if (!normalizedEmail) {
      setError("Enter your email address first.");
      return;
    }

    setError("");
    setMessage("");
    setSubmitting(true);

    try {
      const { error: resendError } = await supabase.auth.resend({
        type: "signup",
        email: normalizedEmail,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (resendError) throw resendError;

      setMessage(
        "If this account needs confirmation, a fresh email has been requested. Check your inbox and spam folder."
      );
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to request a confirmation email. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSignOut() {
    setError("");
    setMessage("");
    const { error: signoutError } = await supabase.auth.signOut();

    if (signoutError) {
      setError(signoutError.message);
      return;
    }

    setUserEmail(null);
    setMessage("You have signed out. Your saved guest data has not been deleted.");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-12 text-white">
      <div className="w-full max-w-md">
        <Link href="/" className="text-sm font-semibold tracking-wide text-cyan-300 hover:text-cyan-200">
          ← WorkBridge
        </Link>

        <section className="mt-6 rounded-3xl border border-white/10 bg-slate-900/80 p-6 shadow-2xl shadow-cyan-950/20 sm:p-8">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-cyan-300">
            Your next step starts here
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight">
            Your WorkBridge account
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-300">
            Save your career profile and keep your progress available when you
            return on another device.
          </p>

          {loading ? (
            <p className="mt-8 text-sm text-slate-300">Checking your session…</p>
          ) : userEmail ? (
            <div className="mt-8 space-y-5">
              <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4">
                <p className="text-sm text-emerald-200">Signed in as</p>
                <p className="mt-1 break-all font-medium">{userEmail}</p>
              </div>
              <p className="text-sm leading-6 text-slate-300">
                Your account is authenticated. Cloud syncing will be connected
                after the account flow is verified.
              </p>
              <Link
                href="/progress"
                className="block rounded-xl bg-cyan-300 px-4 py-3 text-center font-semibold text-slate-950 hover:bg-cyan-200"
              >
                Continue to progress
              </Link>
              <button
                type="button"
                onClick={handleSignOut}
                className="w-full rounded-xl border border-white/15 px-4 py-3 text-sm font-semibold hover:bg-white/5"
              >
                Sign out
              </button>
            </div>
          ) : (
            <>
              <div className="mt-7 grid grid-cols-2 rounded-xl bg-slate-950 p-1">
                <button
                  type="button"
                  onClick={() => {
                    setMode("signup");
                    setError("");
                    setMessage("");
                  }}
                  className={`rounded-lg px-3 py-2.5 text-sm font-semibold ${
                    mode === "signup"
                      ? "bg-cyan-300 text-slate-950"
                      : "text-slate-300 hover:text-white"
                  }`}
                >
                  Create account
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode("signin");
                    setError("");
                    setMessage("");
                  }}
                  className={`rounded-lg px-3 py-2.5 text-sm font-semibold ${
                    mode === "signin"
                      ? "bg-cyan-300 text-slate-950"
                      : "text-slate-300 hover:text-white"
                  }`}
                >
                  Sign in
                </button>
              </div>

              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                <div>
                  <label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-200">
                    Email address
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    maxLength={254}
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="w-full rounded-xl border border-white/15 bg-slate-950 px-4 py-3 outline-none placeholder:text-slate-500 focus:border-cyan-300 focus:ring-2 focus:ring-cyan-300/20"
                    placeholder="you@example.com"
                  />
                </div>

                <div>
                  <label htmlFor="password" className="mb-2 block text-sm font-medium text-slate-200">
                    Password
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete={mode === "signup" ? "new-password" : "current-password"}
                    required
                    minLength={6}
                    maxLength={128}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="w-full rounded-xl border border-white/15 bg-slate-950 px-4 py-3 outline-none placeholder:text-slate-500 focus:border-cyan-300 focus:ring-2 focus:ring-cyan-300/20"
                    placeholder="At least 6 characters"
                  />
                </div>

                {error && (
                  <p role="alert" className="rounded-xl border border-rose-400/20 bg-rose-400/10 p-3 text-sm text-rose-200">
                    {error}
                  </p>
                )}
                {message && (
                  <p role="status" className="rounded-xl border border-cyan-300/20 bg-cyan-300/10 p-3 text-sm leading-6 text-cyan-100">
                    {message}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded-xl bg-cyan-300 px-4 py-3 font-bold text-slate-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting
                    ? "Please wait…"
                    : mode === "signup"
                      ? "Create my account"
                      : "Sign in securely"}
                </button>
                {mode === "signup" && (
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={handleResendConfirmation}
                    className="w-full rounded-xl border border-cyan-300/40 px-4 py-3 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-300/10 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Resend confirmation email
                  </button>
                )}
              </form>
            </>
          )}

          {error && userEmail && (
            <p role="alert" className="mt-4 rounded-xl border border-rose-400/20 bg-rose-400/10 p-3 text-sm text-rose-200">
              {error}
            </p>
          )}
          {message && userEmail && (
            <p role="status" className="mt-4 rounded-xl border border-cyan-300/20 bg-cyan-300/10 p-3 text-sm text-cyan-100">
              {message}
            </p>
          )}

          <p className="mt-6 text-center text-xs leading-5 text-slate-400">
            You can still explore WorkBridge as a guest. Signing out does not
            delete your existing browser data.
          </p>
        </section>
      </div>
    </main>
  );
}
