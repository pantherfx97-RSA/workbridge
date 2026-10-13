"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";

type Evidence = {
  id: string;
  title: string;
  description: string;
  skill: string;
  career: string;
  url: string;
  createdAt: string;
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
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [skill, setSkill] = useState("");
  const [url, setUrl] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    try {
      const profile = localStorage.getItem(
        "workbridge-assessment-profile"
      );

      if (profile) {
        const parsed = JSON.parse(profile);
        if (
          typeof parsed.goal === "string" &&
          skillsByCareer[parsed.goal]
        ) {
          setCareer(parsed.goal);
        }
      }

      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed: unknown = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setItems(parsed);
        }
      }
    } catch {
      setMessage("Saved browser data could not be loaded.");
    }

    setLoaded(true);
  }, []);
  useEffect(() => {
    if (!loaded) return;

    const params = new URLSearchParams(window.location.search);
    const requestedCareer = params.get("career");
    const requestedTitle = params.get("title");
    const requestedSkill = params.get("skill");

    if (requestedCareer && skillsByCareer[requestedCareer]) {
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
  }, [loaded]);

  useEffect(() => {
    if (!loaded) return;

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      setMessage("Could not save. Check your browser storage.");
    }
  }, [items, loaded]);

  const skills = skillsByCareer[career] ?? skillsByCareer["Software Developer"];

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
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

    const entry: Evidence = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
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
    setMessage("Evidence added to your portfolio.");
  }

  function removeEvidence(id: string) {
    if (!window.confirm("Remove this evidence from your portfolio?")) {
      return;
    }
    setItems((previous) => previous.filter((item) => item.id !== id));
    setMessage("Evidence removed.");
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
            Update assessment →
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

        <section>
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-2xl font-bold">Your evidence</h2>
              <p className="mt-1 text-sm text-slate-400">
                Work samples you have added to this browser.
              </p>
            </div>
            <span className="rounded-full border border-slate-700 px-3 py-1 text-sm text-slate-300">
              {items.length} {items.length === 1 ? "item" : "items"}
            </span>
          </div>

          {!loaded ? (
            <p className="text-slate-400">Loading your portfolio…</p>
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
                      Open project link ↗
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
          WorkBridge · Learn it. Practise it. Prove it.
          <p className="mt-2">
            MVP note: evidence is stored in this browser. It is not yet
            uploaded, independently verified or shared with employers.
          </p>
        </footer>
      </div>
    </main>
  );
}
