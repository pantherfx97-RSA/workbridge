"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { migrateLocalWorkBridgeToCloud } from "@/lib/workbridge/migration";
import { getWorkBridgeStorageScope, readWorkBridgeCloudSnapshot } from "@/lib/workbridge/sync";

type Career =
  | "IT Support Technician"
  | "Software Developer"
  | "Cybersecurity Analyst"
  | "Data Analyst"
  | "Network Technician";

type Profile = {
  goal: Career;
  selectedSkills: string[];
  learnedTechnicalSkills: string[];
  demonstratedTechnicalSkills: string[];
};

type Evidence = {
  id: string;
  title: string;
  description: string;
  skill: string;
  career: string;
  url: string;
  createdAt: string;
};

const PROFILE_KEY = "workbridge-assessment-profile";
const PROGRESS_KEY = "workbridge-roadmap-progress-v2";
const EVIDENCE_KEY = "workbridge-evidence-portfolio";
const TOTAL_ROADMAP_TASKS = 12;

const careers: Career[] = [
  "IT Support Technician",
  "Software Developer",
  "Cybersecurity Analyst",
  "Data Analyst",
  "Network Technician",
];

const foundationSkills: Record<string, string> = {
  troubleshooting: "Basic technical troubleshooting",
  "operating-systems": "Operating systems and computer setup",
  networking: "Networking fundamentals",
  communication: "Customer service and communication",
  security: "Cybersecurity and safe computing",
};

const technicalSkills: Record<Career, string[]> = {
  "IT Support Technician": [
    "Computer hardware and peripherals",
    "Installing and configuring operating systems",
    "Diagnosing technical problems",
    "Basic network troubleshooting",
    "IT customer support and documentation",
  ],
  "Software Developer": [
    "Programming fundamentals",
    "HTML, CSS and web development",
    "JavaScript or another programming language",
    "Git and version control",
    "Debugging and software testing",
  ],
  "Cybersecurity Analyst": [
    "Cybersecurity fundamentals",
    "Recognising common cyber threats",
    "Network security fundamentals",
    "Basic security risk assessment",
    "Recording and reporting security issues",
  ],
  "Data Analyst": [
    "Spreadsheets and formulas",
    "Cleaning and organising data",
    "SQL and database fundamentals",
    "Charts and data visualisation",
    "Analysing data to find patterns",
  ],
  "Network Technician": [
    "IP addressing and subnet fundamentals",
    "Configuring network devices",
    "Diagnosing network connectivity issues",
    "Routers and switches",
    "Network diagrams and documentation",
  ],
};

const portfolioSkills: Record<Career, string[]> = {
  "IT Support Technician": [
    "Computer troubleshooting",
    "Operating systems",
    "Networking",
    "Cybersecurity",
    "Customer support",
  ],
  "Software Developer": [
    "Programming fundamentals",
    "Web development",
    "Git and version control",
    "Debugging and testing",
    "Application development",
  ],
  "Cybersecurity Analyst": [
    "Security fundamentals",
    "Threat awareness",
    "Network security",
    "Risk assessment",
    "Security documentation",
  ],
  "Data Analyst": [
    "Data cleaning",
    "Spreadsheets",
    "SQL and databases",
    "Data visualisation",
    "Analytical problem-solving",
  ],
  "Network Technician": [
    "IP addressing",
    "Network configuration",
    "Network troubleshooting",
    "Routers and switches",
    "Network documentation",
  ],
};

function readStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function safePercent(completed: number, total: number): number {
  return total > 0
    ? Math.min(100, Math.round((completed / total) * 100))
    : 0;
}

function ProgressBar({ value }: { value: number }) {
  return (
    <div
      className="mt-3 h-2 overflow-hidden rounded-full bg-slate-800"
      role="progressbar"
      aria-label="Progress"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={value}
    >
      <div
        className="h-full rounded-full bg-cyan-400 transition-all"
        style={{ width: `${value}%` }}
      />
    </div>
  );
}

export default function ProgressPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [completedTasks, setCompletedTasks] = useState<string[]>([]);
  const [evidence, setEvidence] = useState<Evidence[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [cloudStatus, setCloudStatus] = useState("");
  const [storageError, setStorageError] = useState(false);
  const [migrationBusy, setMigrationBusy] = useState(false);
  const [migrationStatus, setMigrationStatus] = useState("");
  const [migrationError, setMigrationError] = useState(false);

  async function handleMigration() {
    if (migrationBusy) return;

    const confirmed = window.confirm(
      "Copy this browser's saved WorkBridge profile, roadmap progress and portfolio entries to your signed-in cloud account? Existing cloud profile data will not be overwritten. Roadmap completions will be merged. Local browser data will not be deleted."
    );

    if (!confirmed) return;

    setMigrationBusy(true);
    setMigrationError(false);
    setMigrationStatus("Migrating local WorkBridge data...");

    try {
      const result = await migrateLocalWorkBridgeToCloud();

      setMigrationStatus(
        `Migration finished. Profile: ${
          result.profileMigrated
            ? "new profile copied"
            : "unchanged (no local profile or a cloud profile already exists)"
        }. Roadmap goals processed: ${result.roadmapGoalsMigrated}. Portfolio entries added: ${result.portfolioEntriesMigrated}. Local browser data remains unchanged.`
      );
    } catch (error) {
      setMigrationError(true);
      setMigrationStatus(
        error instanceof Error
          ? `Migration stopped: ${error.message} Some earlier writes may already have succeeded. Check cloud data before retrying.`
          : "Migration stopped because of an unknown error. Some earlier writes may already have succeeded. Check cloud data before retrying."
      );
    } finally {
      setMigrationBusy(false);
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function loadProgress() {
      let localProfile: Profile | null = null;
      const localProgress: Record<string, string[]> = {};
      let localEvidence: Evidence[] = [];
      let storageScope;
      try {
        storageScope = await getWorkBridgeStorageScope();
      } catch {
        if (!cancelled) {
          setStorageError(true);
          setLoaded(true);
        }
        return;
      }
      const profileStorageKey = storageScope.key(PROFILE_KEY);
      const progressStorageKey = storageScope.key(PROGRESS_KEY);
      const evidenceStorageKey = storageScope.key(EVIDENCE_KEY);

      try {
        const rawProfile = window.localStorage.getItem(profileStorageKey);

        if (rawProfile) {
          const parsed: unknown = JSON.parse(rawProfile);

          if (parsed && typeof parsed === "object") {
            const saved = parsed as Record<string, unknown>;

            if (
              typeof saved.goal === "string" &&
              careers.includes(saved.goal as Career)
            ) {
              localProfile = {
                goal: saved.goal as Career,
                selectedSkills: readStringArray(saved.selectedSkills),
                learnedTechnicalSkills: readStringArray(saved.learnedTechnicalSkills),
                demonstratedTechnicalSkills: readStringArray(saved.demonstratedTechnicalSkills),
              };
            }
          }
        }
      } catch {
        if (!cancelled) setStorageError(true);
      }

      try {
        const rawProgress = window.localStorage.getItem(progressStorageKey);

        if (rawProgress) {
          const parsed: unknown = JSON.parse(rawProgress);

          if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
            const saved = parsed as Record<string, unknown>;

            for (const career of careers) {
              localProgress[career] = readStringArray(saved[career]);
            }
          } else if (Array.isArray(parsed)) {
            localProgress["IT Support Technician"] = readStringArray(parsed);
          }
        } else if (!storageScope.userId) {
          const legacy = window.localStorage.getItem("workbridge-roadmap-completed");

          if (legacy) {
            localProgress["IT Support Technician"] = readStringArray(JSON.parse(legacy));
          }
        }
      } catch {
        if (!cancelled) setStorageError(true);
      }

      try {
        const rawEvidence = window.localStorage.getItem(evidenceStorageKey);

        if (rawEvidence) {
          const parsed: unknown = JSON.parse(rawEvidence);

          if (Array.isArray(parsed)) {
            localEvidence = parsed.filter(
              (item): item is Evidence =>
                item !== null &&
                typeof item === "object" &&
                typeof item.id === "string" &&
                typeof item.title === "string" &&
                typeof item.description === "string" &&
                typeof item.skill === "string" &&
                typeof item.career === "string"
            );
          }
        }
      } catch {
        if (!cancelled) setStorageError(true);
      }

      let resolvedProfile = localProfile;
      let resolvedEvidence = localEvidence;
      const resolvedProgress = { ...localProgress };

      try {
        const snapshot = await readWorkBridgeCloudSnapshot();
        if (cancelled) return;

        const cloudProfile: Profile | null =
          snapshot.careerGoal &&
          careers.includes(snapshot.careerGoal as Career)
            ? {
                goal: snapshot.careerGoal as Career,
                selectedSkills: snapshot.selectedSkills,
                learnedTechnicalSkills: snapshot.learnedTechnicalSkills,
                demonstratedTechnicalSkills: snapshot.demonstratedTechnicalSkills,
              }
            : null;

        // Preserve this browser's profile when present; use the cloud profile
        // when this browser has no saved assessment.
        resolvedProfile = localProfile ?? cloudProfile;

        for (const career of careers) {
          const localTasks = resolvedProgress[career] ?? [];
          const cloudTasks = snapshot.roadmapProgress[career] ?? [];

          resolvedProgress[career] = [...new Set([...localTasks, ...cloudTasks])];
        }

        const mergedEvidence = new Map<string, Evidence>();

        for (const entry of localEvidence) {
          mergedEvidence.set(entry.id, entry);
        }

        for (const entry of snapshot.portfolioEntries) {
          const id = entry.localId ?? entry.id;
          const cloudEntry: Evidence = {
            id,
            title: entry.title,
            description: entry.description,
            skill: entry.skill,
            career: entry.careerGoal,
            url: entry.url ?? "",
            createdAt: entry.createdAt,
          };

          const existing = mergedEvidence.get(id);
          mergedEvidence.set(id, existing ? { ...existing, ...cloudEntry } : cloudEntry);
        }

        resolvedEvidence = Array.from(mergedEvidence.values());
        if (!cancelled) {
          setCloudStatus("Cloud progress loaded and merged with this browser.");
        }
      } catch (error) {
        if (!cancelled) {
          if (
            error instanceof Error &&
            (
              error.message === "Sign in before syncing WorkBridge data." ||
              error.name === "AuthSessionMissingError" ||
              error.message === "Auth session missing!"
            )
          ) {
            setCloudStatus("Showing local progress. Sign in to sync across browsers.");
          } else {
            console.error("WorkBridge cloud progress failed to load:", error);
            setCloudStatus("Showing local progress. Cloud sync could not be loaded. Check your connection and try again.");
          }
        }
      }

      if (cancelled) return;

      setProfile(resolvedProfile);
      setEvidence(resolvedEvidence);

      const activeGoal = resolvedProfile?.goal;
      setCompletedTasks(activeGoal ? resolvedProgress[activeGoal] ?? [] : []);
      setLoaded(true);
    }

    const timer = window.setTimeout(() => {
      void loadProgress();
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, []);

  if (!loaded) {
    return (
      <main className="min-h-screen bg-slate-950 px-6 py-16 text-slate-100">
        <div className="mx-auto max-w-5xl">
          <p className="text-slate-400">Loading your progress...</p>
        </div>
      </main>
    );
  }

  const goal = profile?.goal ?? null;
  const careerEvidence = goal
    ? evidence.filter((item) => item.career === goal)
    : [];
  const skillList = goal ? portfolioSkills[goal] : [];
  const coveredSkills = skillList.filter((skill) =>
    careerEvidence.some((item) => item.skill === skill)
  );
  const completedCount = goal
    ? Math.min(
        TOTAL_ROADMAP_TASKS,
        new Set(completedTasks).size
      )
    : 0;
  const roadmapPercent = safePercent(
    completedCount,
    TOTAL_ROADMAP_TASKS
  );
  const assessmentPercent = profile
    ? safePercent(profile.selectedSkills.length, 5)
    : 0;
  const evidencePercent = safePercent(
    coveredSkills.length,
    skillList.length
  );

  const nextAction = !profile
    ? {
        title: "Start with your assessment",
        description:
          "Choose a career direction and record your current skills to personalise your learning plan.",
        href: "/assessment",
        label: "Start assessment",
      }
    : completedCount < TOTAL_ROADMAP_TASKS
      ? {
          title: "Continue your learning roadmap",
          description:
            "Work through the next unfinished task in your personalised career plan.",
          href: "/roadmap",
          label: "Open roadmap",
        }
      : coveredSkills.length < skillList.length
        ? {
            title: "Document a practical project",
            description:
              "Add an example, project or learning exercise to your portfolio for a skill you have not documented yet.",
            href: "/portfolio",
            label: "Add portfolio evidence",
          }
        : {
            title: "Explore relevant opportunities",
            description:
              "Review career opportunities and identify requirements you can work towards next.",
            href: "/opportunities",
            label: "Explore opportunities",
          };

  return (
    <main className="min-h-screen bg-slate-950 px-5 py-10 text-slate-100 sm:px-8 sm:py-14">
      <div className="mx-auto max-w-6xl">


        <section className="mb-10">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-cyan-300">
            Your learning journey
          </p>
          <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">
            Your progress, in one place.
          </h1>
          <p className="mt-4 max-w-2xl leading-7 text-slate-400">
            Track your learning tasks, assessment and saved portfolio evidence
            as you work towards your career goals.
          </p>
          {cloudStatus && (
            <p role="status" aria-live="polite" className="mt-3 text-sm text-slate-400">
              {cloudStatus}
            </p>
          )}
          {goal ? (
            <div className="mt-6 inline-flex rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-sm text-cyan-200">
              Career goal: {goal}
            </div>
          ) : (
            <div className="mt-6 inline-flex rounded-full border border-amber-400/30 bg-amber-400/10 px-4 py-2 text-sm text-amber-200">
              Assessment not completed yet
            </div>
          )}
        </section>

        <section className="mb-8 rounded-3xl border border-cyan-400/20 bg-slate-900 p-6 sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.15em] text-cyan-300">
            Cloud backup
          </p>
          <h2 className="mt-3 text-xl font-semibold text-white">
            Migrate local progress to cloud
          </h2>
          <p className="mt-3 max-w-3xl leading-7 text-slate-400">
            Copy saved assessment details, roadmap completions and portfolio entries
            from this browser to your signed-in WorkBridge account. Existing cloud
            profile data is preserved, roadmap completions are merged, duplicate
            portfolio entries are skipped, and your local browser data is not deleted.
            You must be signed in to your WorkBridge account before migrating local progress.
          </p>
          <button
            type="button"
            onClick={handleMigration}
            disabled={migrationBusy}
            className="mt-5 inline-flex rounded-xl bg-cyan-400 px-5 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {migrationBusy ? "Migrating..." : "Migrate local progress to cloud"}
          </button>
          {migrationStatus && (
            <p
              role="status"
              aria-live="polite"
              className={`mt-4 rounded-xl border px-4 py-3 text-sm ${
                migrationError
                  ? "border-rose-400/30 bg-rose-400/10 text-rose-200"
                  : "border-slate-700 bg-slate-950/70 text-slate-300"
              }`}
            >
              {migrationStatus}
            </p>
          )}
        </section>
        {storageError && (
          <div
            role="status"
            className="mb-6 rounded-2xl border border-amber-400/30 bg-amber-400/10 p-4 text-sm text-amber-100"
          >
            Some saved information could not be read. Your browser storage may
            contain invalid or unavailable data.
          </div>
        )}

        {!profile && (
          <section className="mb-8 rounded-3xl border border-cyan-400/20 bg-slate-900 p-6 sm:p-8">
            <h2 className="text-xl font-semibold">Let{"\u2019"}s personalise your plan</h2>
            <p className="mt-3 max-w-2xl leading-7 text-slate-400">
              Complete the assessment first. WorkBridge can then show the
              learning and portfolio progress associated with your selected
              career.
            </p>
            <Link
              href="/assessment"
              className="mt-6 inline-flex rounded-xl bg-cyan-400 px-5 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300"
            >
              Start assessment {"\u2192"}
            </Link>
          </section>
        )}

        <section className="grid gap-5 md:grid-cols-3">
          <article className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
            <p className="text-sm text-slate-400">Assessment skills selected</p>
            <div className="mt-3 flex items-end gap-2">
              <span className="text-4xl font-bold">
                {profile ? profile.selectedSkills.length : 0}
              </span>
              <span className="mb-1 text-sm text-slate-500">of 5</span>
            </div>
            <ProgressBar value={assessmentPercent} />
            <p className="mt-3 text-sm text-slate-400">
              {profile
                ? `${assessmentPercent}% of foundation skills selected`
                : "Complete your assessment to get started"}
            </p>
            <Link
              href="/assessment"
              className="mt-5 inline-block text-sm font-semibold text-cyan-300 hover:text-cyan-200"
            >
              {profile ? "Review assessment \u2192" : "Start assessment \u2192"}
            </Link>
          </article>

          <article className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
            <p className="text-sm text-slate-400">Roadmap tasks completed</p>
            <div className="mt-3 flex items-end gap-2">
              <span className="text-4xl font-bold">{completedCount}</span>
              <span className="mb-1 text-sm text-slate-500">
                of {TOTAL_ROADMAP_TASKS}
              </span>
            </div>
            <ProgressBar value={roadmapPercent} />
            <p className="mt-3 text-sm text-slate-400">
              {roadmapPercent}% of the planned tasks marked complete
            </p>
            <Link
              href="/roadmap"
              className="mt-5 inline-block text-sm font-semibold text-cyan-300 hover:text-cyan-200"
            >
              Continue roadmap {"\u2192"}
            </Link>
          </article>

          <article className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
            <p className="text-sm text-slate-400">Portfolio skills documented</p>
            <div className="mt-3 flex items-end gap-2">
              <span className="text-4xl font-bold">{coveredSkills.length}</span>
              <span className="mb-1 text-sm text-slate-500">
                of {skillList.length || 5}
              </span>
            </div>
            <ProgressBar value={evidencePercent} />
            <p className="mt-3 text-sm text-slate-400">
              {careerEvidence.length} saved{" "}
              {careerEvidence.length === 1 ? "entry" : "entries"} for this career
            </p>
            <Link
              href="/portfolio"
              className="mt-5 inline-block text-sm font-semibold text-cyan-300 hover:text-cyan-200"
            >
              View portfolio {"\u2192"}
            </Link>
          </article>
        </section>

        {profile && (
          <section className="mt-8 grid gap-5 lg:grid-cols-2">
            <article className="rounded-3xl border border-slate-800 bg-slate-900 p-6 sm:p-8">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold">Your skill snapshot</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    Skills recorded in your assessment. These are self-reported
                    learning signals, not independent verification.
                  </p>
                </div>
                <Link
                  href="/assessment"
                  className="text-sm font-semibold text-cyan-300 hover:text-cyan-200"
                >
                  Update {"\u2192"}
                </Link>
              </div>

              <div className="mt-6 space-y-4">
                {Object.entries(foundationSkills).map(([id, label]) => {
                  const selected = profile.selectedSkills.includes(id);

                  return (
                    <div
                      key={id}
                      className="flex items-center justify-between gap-4"
                    >
                      <span className="text-sm text-slate-300">{label}</span>
                      <span
                        className={`shrink-0 rounded-full px-3 py-1 text-xs ${
                          selected
                            ? "bg-cyan-400/10 text-cyan-200"
                            : "bg-slate-800 text-slate-400"
                        }`}
                      >
                        {selected ? "Selected" : "Not selected"}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl bg-slate-800/70 p-4">
                  <p className="text-sm text-slate-400">Career skills marked learned</p>
                  <p className="mt-2 text-2xl font-semibold">
                    {profile.learnedTechnicalSkills.length} /{" "}
                    {technicalSkills[profile.goal].length}
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-800/70 p-4">
                  <p className="text-sm text-slate-400">
                    Career skills marked demonstrated
                  </p>
                  <p className="mt-2 text-2xl font-semibold">
                    {profile.demonstratedTechnicalSkills.length} /{" "}
                    {technicalSkills[profile.goal].length}
                  </p>
                </div>
              </div>
            </article>

            <article className="rounded-3xl border border-slate-800 bg-slate-900 p-6 sm:p-8">
              <h2 className="text-xl font-semibold">Portfolio coverage</h2>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                Skills with at least one matching saved portfolio entry for{" "}
                {profile.goal}. Saved evidence is not automatically verified.
              </p>

              <div className="mt-6 space-y-4">
                {skillList.map((skill) => {
                  const documented = coveredSkills.includes(skill);

                  return (
                    <div
                      key={skill}
                      className="flex items-center justify-between gap-4"
                    >
                      <span className="text-sm text-slate-300">{skill}</span>
                      <span
                        className={`shrink-0 rounded-full px-3 py-1 text-xs ${
                          documented
                            ? "bg-emerald-400/10 text-emerald-200"
                            : "bg-slate-800 text-slate-400"
                        }`}
                      >
                        {documented ? "Documented" : "To document"}
                      </span>
                    </div>
                  );
                })}
              </div>

              <p className="mt-6 text-sm leading-6 text-slate-500">
                Tip: include what you did, the tools you used, what you learned
                and a project link when available.
              </p>
            </article>
          </section>
        )}

        <section className="mt-8 rounded-3xl border border-slate-800 bg-slate-900 p-6 sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.15em] text-cyan-300">
            Career preparation checklist
          </p>
          <h2 className="mt-3 text-2xl font-bold">Build your evidence, step by step</h2>
          <p className="mt-3 max-w-2xl leading-7 text-slate-400">
            Track the preparation steps you have completed. This is a progress guide, not a guarantee of employment or a formal job-readiness assessment.
          </p>

          {(() => {
            const checks = [
              {
                label: "Choose a career goal and save your assessment",
                detail: "Choose your career goal and record your foundation skills.",
                done: Boolean(profile),
                href: "/assessment",
                action: "Review assessment",
              },
              {
                label: "Work through your learning roadmap",
                detail: `${completedCount} of ${TOTAL_ROADMAP_TASKS} learning tasks completed.`,
                done: completedCount >= TOTAL_ROADMAP_TASKS,
                href: "/roadmap",
                action: "Continue roadmap",
              },
              {
                label: "Document practical portfolio evidence",
                detail: `${coveredSkills.length} of ${skillList.length} career skills have matching evidence.`,
                done: skillList.length > 0 && coveredSkills.length >= skillList.length,
                href: "/portfolio",
                action: "Build portfolio",
              },
              {
                label: "Record learned and demonstrated career skills",
                detail: profile
                  ? `${profile.learnedTechnicalSkills.length} learned and ${profile.demonstratedTechnicalSkills.length} demonstrated skills recorded.`
                  : "Complete your assessment to record your current skills.",
                done: Boolean(
                  profile &&
                  profile.learnedTechnicalSkills.length > 0 &&
                  profile.demonstratedTechnicalSkills.length > 0
                ),
                href: "/assessment",
                action: "Update skills",
              },
            ];
            const doneCount = checks.filter((item) => item.done).length;
            const readiness = Math.round((doneCount / checks.length) * 100);

            return (
              <>
                <div className="mt-6 flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <p className="text-sm text-slate-400">Preparation progress</p>
                    <p className="mt-1 text-3xl font-bold">{readiness}%</p>
                  </div>
                  <p className="text-sm text-slate-400">
                    {doneCount} of {checks.length} milestones complete
                  </p>
                </div>
                <div
                  className="mt-4 h-2 overflow-hidden rounded-full bg-slate-800"
                  role="progressbar"
                  aria-label="Career preparation checklist progress"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={readiness}
                >
                  <div
                    className="h-full rounded-full bg-cyan-400 transition-all"
                    style={{ width: `${readiness}%` }}
                  />
                </div>
                <div className="mt-6 space-y-3">
                  {checks.map((item) => (
                    <div
                      key={item.label}
                      className="flex flex-col gap-3 rounded-2xl border border-slate-800 p-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex items-start gap-3">
                        <span
                          aria-hidden="true"
                          className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-sm ${
                            item.done
                              ? "bg-emerald-400/15 text-emerald-300"
                              : "bg-slate-800 text-slate-400"
                          }`}
                        >
                          {item.done ? "\u2713" : "\u2022"}
                        </span>
                        <div>
                          <p className="font-medium text-slate-100">{item.label}</p>
                          <p className="mt-1 text-sm leading-6 text-slate-400">
                            {item.detail}
                          </p>
                          <p className={`mt-1 text-xs ${item.done ? "text-emerald-300" : "text-amber-200"}`}>
                            {item.done ? "Completed" : "In progress"}
                          </p>
                        </div>
                      </div>
                      <Link
                        href={item.href}
                        className="shrink-0 text-sm font-semibold text-cyan-300 hover:text-cyan-200"
                      >
                        {item.action} {"\u2192"}
                      </Link>
                    </div>
                  ))}
                </div>
              </>
            );
          })()}
        </section>
        <section className="mt-8 rounded-3xl border border-cyan-400/20 bg-gradient-to-br from-cyan-400/10 to-slate-900 p-6 sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.15em] text-cyan-300">
            Recommended next step
          </p>
          <h2 className="mt-3 text-2xl font-bold">{nextAction.title}</h2>
          <p className="mt-3 max-w-2xl leading-7 text-slate-300">
            {nextAction.description}
          </p>
          <Link
            href={nextAction.href}
            className="mt-6 inline-flex rounded-xl bg-cyan-400 px-5 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300"
          >
            {nextAction.label} {"\u2192"}
          </Link>
        </section>

        <footer className="mt-12 border-t border-slate-800 pt-6 text-sm text-slate-500">
          WorkBridge | Learn it. Practise it. Prove it.
        </footer>
      </div>
    </main>
  );
}
