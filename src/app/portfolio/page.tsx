"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { readWorkBridgeCloudSnapshot, saveWorkBridgePortfolioEntry, deleteWorkBridgePortfolioEntry } from "@/lib/workbridge/sync";

type Evidence = {
  id: string;
  title: string;
  description: string;
  skill: string;
  career: string;
  url: string;
  createdAt: string;
  localId?: string | null;
  cloudId?: string;
};

const STORAGE_KEY = "workbridge-evidence-portfolio";

const skillsByCareer: Record<string, string[]> = {
  "Software Developer": [
    "Programming fundamentals",
    "Web development",
    "Git and version control",
    "Debugging and testing",
    "Application development",
  ],
  "IT Support Technician": [
    "Computer troubleshooting",
    "Operating systems",
    "Networking",
    "Cybersecurity",
    "Customer support",
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
    "Network configuration",
    "IP addressing",
    "Network troubleshooting",
    "Routers and switches",
    "Network documentation",
  ],
};

export default function PortfolioPage() {
  const [career, setCareer] = useState("Software Developer");
  const [items, setItems] = useState<Evidence[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [cloudLoaded, setCloudLoaded] = useState(false);
  const [cloudAvailable, setCloudAvailable] = useState(false);
  const [cloudStatus, setCloudStatus] = useState("Loading your portfolio...");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [skill, setSkill] = useState("");
  const [url, setUrl] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadPortfolio() {
      let localItems: Evidence[] = [];

      try {
        const profile = localStorage.getItem("workbridge-assessment-profile");
        if (profile) {
          const parsed = JSON.parse(profile);
          if (typeof parsed.goal === "string" && skillsByCareer[parsed.goal]) {
            setCareer(parsed.goal);
          }
        }

        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed: unknown = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            localItems = parsed.filter(
              (item): item is Evidence =>
                typeof item === "object" &&
                item !== null &&
                typeof item.id === "string" &&
                typeof item.title === "string" &&
                typeof item.description === "string" &&
                typeof item.skill === "string" &&
                typeof item.career === "string"
            );
          }
        }
      } catch {
        if (!cancelled) setMessage("Some saved browser data could not be loaded.");
      }

      if (cancelled) return;
      setItems(localItems);
      setLoaded(true);

      try {
        const snapshot = await readWorkBridgeCloudSnapshot();
        if (cancelled) return;

        const cloudItems: Evidence[] = snapshot.portfolioEntries.map((entry) => ({
          id: entry.localId ?? entry.id,
          localId: entry.localId,
          cloudId: entry.id,
          title: entry.title,
          description: entry.description,
          skill: entry.skill,
          career: entry.careerGoal,
          url: entry.url ?? "",
          createdAt: entry.createdAt,
        }));

        const merged = new Map<string, Evidence>();
        for (const entry of localItems) merged.set(entry.id, entry);
        for (const entry of cloudItems) {
          const existing = merged.get(entry.id);
          merged.set(entry.id, existing ? { ...existing, ...entry } : entry);
        }

        setItems(
          Array.from(merged.values()).sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )
        );
        setCloudAvailable(true);
        setCloudStatus("Cloud portfolio loaded and merged with this browser.");
      } catch {
        if (!cancelled) {
          setCloudAvailable(false);
          setCloudStatus(
            "Cloud portfolio unavailable. Your browser evidence remains available."
          );
        }
      } finally {
        if (!cancelled) setCloudLoaded(true);
      }
    }

    void loadPortfolio();
    return () => {
      cancelled = true;
    };
  }, []);
  useEffect(() => {
    if (!loaded || !cloudLoaded) return;

    const params = new URLSearchParams(window.location.search);
    const requestedCareer = params.get("career");
    const requestedTitle = params.get("title");
    const requestedSkill = params.get("skill");

    if (requestedCareer && skillsByCareer[requestedCareer]) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Apply the requested career from the URL after hydration.
      setCareer(requestedCareer);

      if (
        requestedSkill &&
        skillsByCareer[requestedCareer].includes(requestedSkill)
      ) {
        setSkill(requestedSkill);
      }
    }

    if (requestedTitle) {
      setTitle(requestedTitle.slice(0, 100));
    }
  }, [loaded, cloudLoaded]);

  useEffect(() => {
    if (!loaded || !cloudLoaded) return;

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Report a browser-storage write failure.
setMessage("Could not save. Check your browser storage.");
    }
  }, [items, loaded, cloudLoaded]);

  const skills = skillsByCareer[career] ?? skillsByCareer["Software Developer"];
  const careerEvidence = items.filter((item) => item.career === career);
  const coveredSkills = skills.filter((item) =>
    careerEvidence.some((entry) => entry.skill === item)
  );
  const missingSkills = skills.filter((item) => !coveredSkills.includes(item));
  const coveragePercent = skills.length
    ? Math.round((coveredSkills.length / skills.length) * 100)
    : 0;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    const cleanTitle = title.trim();
    const cleanDescription = description.trim();
    const cleanUrl = url.trim();

    if (!cleanTitle || !cleanDescription || !skill) {
      setMessage("Complete the title, description and skill fields.");
      return;
    }

    if (cleanUrl) {
      try {
        const parsedUrl = new URL(cleanUrl);
        if (!["http:", "https:"].includes(parsedUrl.protocol)) {
          throw new Error("Invalid protocol");
        }
      } catch {
        setMessage("Enter a valid project link beginning with https://.");
        return;
      }
    }

    const entryId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const entry: Evidence = {
      id: entryId,
      localId: entryId,
      title: cleanTitle,
      description: cleanDescription,
      skill,
      career,
      url: cleanUrl,
      createdAt: new Date().toISOString(),
    };

    setItems((previous) => [entry, ...previous]);
    setTitle("");
    setDescription("");
    setSkill("");
    setUrl("");

    if (!cloudAvailable) {
      setMessage("Evidence added to this browser. Cloud sync is currently unavailable.");
      return;
    }

    try {
      await saveWorkBridgePortfolioEntry({
        localId: entryId,
        title: cleanTitle,
        description: cleanDescription,
        skill,
        careerGoal: career,
        url: cleanUrl || null,
      });
      setMessage("Evidence saved to this browser and your account.");
    } catch (error) {
      console.error("WorkBridge portfolio cloud save failed:", error);
      setCloudStatus("Cloud save is temporarily unavailable. Your browser evidence remains saved.");
      setMessage("Evidence was saved in this browser, but cloud sync could not be confirmed. Please try again later.");
    }
  }
  async function removeEvidence(id: string) {
    if (!window.confirm("Remove this evidence from your portfolio?")) {
      return;
    }

    const entry = items.find((item) => item.id === id);
    if (!entry) return;

    const mayExistInCloud = Boolean(entry.cloudId || entry.localId);

    if (mayExistInCloud && !cloudAvailable) {
      setMessage("Cloud access is unavailable. Restore cloud access before deleting this entry, to avoid it reappearing.");
      return;
    }

    if (mayExistInCloud) {
      try {
        await deleteWorkBridgePortfolioEntry({
          localId: entry.localId ?? null,
          cloudId: entry.cloudId ?? "",
        });
      } catch {
        setMessage("Could not delete this evidence from your account. It has been kept in your portfolio.");
        return;
      }
    }

    setItems((previous) => previous.filter((item) => item.id !== id));
    setMessage(
      mayExistInCloud
        ? "Evidence removed from this browser and your account."
        : "Evidence removed from this browser."
    );
  }
  const dateLabel = (value: string) => {
    const date = new Date(value);
    return Number.isNaN(date.getTime())
      ? "Date unavailable"
      : date.toLocaleDateString();
  };

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100 sm:px-6">
      <div className="mx-auto max-w-5xl">
        <header className="mb-10 flex flex-wrap items-center justify-between gap-4">
          <Link href="/" className="text-xl font-bold tracking-tight text-white">
            WorkBridge
          </Link>
          <nav className="flex flex-wrap gap-4 text-sm text-slate-300">
            <Link href="/assessment" className="hover:text-white">
              Assessment
            </Link>
            <Link href="/roadmap" className="hover:text-white">
              Roadmap
            </Link>
          </nav>
        </header>

        <section className="mb-8">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-blue-400">
            Learn it. Practise it. Prove it.
          </p>
          <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">
            Your Evidence Portfolio
          </h1>
          <p className="mt-4 max-w-2xl leading-7 text-slate-300">
            Collect projects, practical exercises and work samples that
            demonstrate your skills. Build evidence you can discuss with
            employers.
          </p>
        </section>

        <section className="mb-8 rounded-2xl border border-slate-800 bg-slate-900 p-5 sm:p-7">
          <p className="text-sm text-slate-400">Your selected career</p>
          <h2 className="mt-1 text-xl font-semibold">{career}</h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Your career comes from your assessment. Each submission records
            the career and skill you selected at the time.
          </p>
          <Link
            href="/assessment"
            className="mt-3 inline-block text-sm font-medium text-blue-400 hover:text-blue-300"
          >
            Update assessment &rarr;
          </Link>
        </section>

        <section className="mb-12 rounded-2xl border border-slate-800 bg-slate-900 p-5 sm:p-7">
          <h2 className="text-xl font-semibold">Add evidence</h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Add a project you built, a troubleshooting exercise, or another
            piece of work. Describe what you did honestly.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            <div>
              <label htmlFor="evidence-title" className="mb-2 block text-sm font-medium">
                Project or evidence title
              </label>
              <input
                id="evidence-title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                maxLength={100}
                required
                placeholder="e.g. My first task tracker"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label htmlFor="evidence-skill" className="mb-2 block text-sm font-medium">
                Skill demonstrated
              </label>
              <select
                id="evidence-skill"
                value={skill}
                onChange={(event) => setSkill(event.target.value)}
                required
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-blue-500"
              >
                <option value="">Choose a skill</option>
                {skills.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="evidence-description" className="mb-2 block text-sm font-medium">
                What did you do, and what did you learn?
              </label>
              <textarea
                id="evidence-description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                maxLength={2000}
                required
                rows={5}
                placeholder="Explain the problem, the steps you took, the tools you used and the result."
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label htmlFor="evidence-url" className="mb-2 block text-sm font-medium">
                Project link <span className="text-slate-500">(optional)</span>
              </label>
              <input
                id="evidence-url"
                type="url"
                value={url}
                onChange={(event) => setUrl(event.target.value)}
                maxLength={500}
                placeholder="https://github.com/yourname/project"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-blue-500"
              />
              <p className="mt-2 text-xs text-slate-500">
                Only share links you are comfortable making public.
              </p>
            </div>

            <button
              type="submit"
              className="w-full rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-500 sm:w-auto"
            >
              Add to my portfolio
            </button>

            {message && (
              <p role="status" aria-live="polite" className="text-sm text-blue-300">
                {message}
              </p>
            )}
          </form>
        </section>

        <section className="mb-10 rounded-2xl border border-slate-800 bg-slate-900 p-5 sm:p-7">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-blue-400">
                Portfolio progress
              </p>
              <h2 className="mt-2 text-xl font-bold">Your evidence at a glance</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
                Track which skills have supporting entries for your selected career.
                This measures documentation, not independently verified ability.
              </p>
            </div>
            <span className="rounded-full border border-slate-700 px-3 py-1 text-sm text-slate-300">
              {coveragePercent}% documented
            </span>
          </div>

          <div
            className="mt-5 h-3 overflow-hidden rounded-full bg-slate-800"
            role="progressbar"
            aria-label="Career skill evidence coverage"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={coveragePercent}
          >
            <div
              className="h-full rounded-full bg-blue-500 transition-all"
              style={{ width: `${coveragePercent}%` }}
            />
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
              <p className="text-sm text-slate-400">Evidence entries</p>
              <p className="mt-2 text-3xl font-bold text-white">{careerEvidence.length}</p>
              <p className="mt-1 text-xs text-slate-500">For {career}</p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
              <p className="text-sm text-slate-400">Skills covered</p>
              <p className="mt-2 text-3xl font-bold text-white">
                {coveredSkills.length}<span className="text-lg text-slate-500">/{skills.length}</span>
              </p>
              <p className="mt-1 text-xs text-slate-500">Skills with a matching entry</p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
              <p className="text-sm text-slate-400">Skills to document</p>
              <p className="mt-2 text-3xl font-bold text-white">{missingSkills.length}</p>
              <p className="mt-1 text-xs text-slate-500">Potential next steps</p>
            </div>
          </div>

          <div className="mt-6">
            <h3 className="font-semibold">Career skill checklist</h3>
            <ul className="mt-3 grid gap-2 sm:grid-cols-2">
              {skills.map((item) => {
                const covered = coveredSkills.includes(item);
                return (
                  <li
                    key={item}
                    className="flex items-start gap-3 rounded-lg border border-slate-800 p-3"
                  >
                    <span
                      aria-hidden="true"
                      className={covered ? "text-emerald-400" : "text-slate-500"}
                    >
                      {covered ? "âœ“" : "â—‹"}
                    </span>
                    <span className="min-w-0 flex-1 text-sm text-slate-200">{item}</span>
                    <span className={covered ? "text-xs text-emerald-300" : "text-xs text-slate-500"}>
                      {covered ? "Entry added" : "Not documented"}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>

          {missingSkills.length > 0 && (
            <div className="mt-5 rounded-xl border border-blue-900/70 bg-blue-950/30 p-4">
              <h3 className="font-semibold text-blue-200">Your next opportunity to practise</h3>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Consider creating a practical exercise for{" "}
                <span className="font-medium text-white">{missingSkills[0]}</span>.
                Add an entry when you have completed the work and can describe what you did.
              </p>
              <a
                href="#evidence-title"
                className="mt-3 inline-block text-sm font-semibold text-blue-300 hover:text-blue-200"
              >
                Add evidence for a skill
              </a>
            </div>
          )}
        </section>

        <section>
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-2xl font-bold">Your evidence</h2>
              <p className="mt-2 text-sm text-slate-400" role="status">{cloudStatus}</p>
              <p className="mt-1 text-sm text-slate-400">
                Work samples saved in this browser and, when available, your account.
              </p>
            </div>
            <span className="rounded-full border border-slate-700 px-3 py-1 text-sm text-slate-300">
              {items.length} {items.length === 1 ? "item" : "items"}
            </span>
          </div>

          {!loaded ? (
            <p className="text-slate-400">Loading your portfolio...</p>
          ) : items.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-700 p-8 text-center">
              <h3 className="font-semibold">Your portfolio starts here</h3>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                Add your first project or practical exercise using the form above.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {items.map((item) => (
                <article
                  key={item.id}
                  className="rounded-2xl border border-slate-800 bg-slate-900 p-5"
                >
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-blue-950 px-3 py-1 text-xs text-blue-300">
                      {item.skill}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold">{item.title}</h3>
                  <p className="mt-2 text-sm text-slate-400">{item.career}</p>
                  <p className="mt-4 whitespace-pre-wrap break-words text-sm leading-6 text-slate-300">
                    {item.description}
                  </p>
                  {item.url && (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-4 inline-block break-all text-sm text-blue-400 hover:text-blue-300"
                    >
                      Open project link &rarr;
                    </a>
                  )}
                  <div className="mt-5 flex items-center justify-between gap-3 border-t border-slate-800 pt-4">
                    <span className="text-xs text-slate-500">
                      Added {dateLabel(item.createdAt)}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeEvidence(item.id)}
                      className="text-sm text-red-300 hover:text-red-200"
                    >
                      Remove
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <footer className="mt-14 border-t border-slate-800 py-6 text-sm text-slate-500">
          WorkBridge | Learn it. Practise it. Prove it.
          <p className="mt-2">
            Cloud sync is available when your account is connected. Evidence is not independently verified or shared with employers.
          </p>
        </footer>
      </div>
    </main>
  );
}
