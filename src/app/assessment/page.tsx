"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { readWorkBridgeCloudSnapshot, saveWorkBridgeProfile } from "@/lib/workbridge/sync";

const skills = [
  { id: "troubleshooting", label: "Basic technical troubleshooting" },
  { id: "operating-systems", label: "Operating systems and computer setup" },
  { id: "networking", label: "Networking fundamentals" },
  { id: "communication", label: "Customer service and communication" },
  { id: "security", label: "Cybersecurity and safe computing" },
];

const technicalSkillsByCareer: Record<string, { id: string; label: string }[]> = {
  "IT Support Technician": [
    { id: "hardware-support", label: "Computer hardware and peripherals" },
    { id: "os-support", label: "Installing and configuring operating systems" },
    { id: "it-troubleshooting", label: "Diagnosing technical problems" },
    { id: "it-networking", label: "Basic network troubleshooting" },
    { id: "customer-support", label: "IT customer support and documentation" },
  ],
  "Software Developer": [
    { id: "programming-fundamentals", label: "Programming fundamentals" },
    { id: "web-development", label: "HTML, CSS and web development" },
    { id: "javascript", label: "JavaScript or another programming language" },
    { id: "git-version-control", label: "Git and version control" },
    { id: "debugging-testing", label: "Debugging and software testing" },
  ],
  "Cybersecurity Analyst": [
    { id: "security-fundamentals", label: "Cybersecurity fundamentals" },
    { id: "threat-awareness", label: "Recognising common cyber threats" },
    { id: "network-security", label: "Network security fundamentals" },
    { id: "risk-assessment", label: "Basic security risk assessment" },
    { id: "security-documentation", label: "Recording and reporting security issues" },
  ],
  "Data Analyst": [
    { id: "spreadsheets", label: "Spreadsheets and formulas" },
    { id: "data-cleaning", label: "Cleaning and organising data" },
    { id: "sql-databases", label: "SQL and database fundamentals" },
    { id: "data-visualisation", label: "Charts and data visualisation" },
    { id: "data-analysis", label: "Analysing data to find patterns" },
  ],
  "Network Technician": [
    { id: "ip-addressing", label: "IP addressing and subnet fundamentals" },
    { id: "network-configuration", label: "Configuring network devices" },
    { id: "network-troubleshooting", label: "Diagnosing network connectivity issues" },
    { id: "routers-switches", label: "Routers and switches" },
    { id: "network-documentation", label: "Network diagrams and documentation" },
  ],
};

export default function AssessmentPage() {
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [careerGoal, setCareerGoal] = useState("IT Support Technician");
  const [learnedTechnicalSkills, setLearnedTechnicalSkills] = useState<string[]>([]);
  const [demonstratedTechnicalSkills, setDemonstratedTechnicalSkills] = useState<string[]>([]);
  const [syncStatus, setSyncStatus] = useState<string>("");

  useEffect(() => {
    let cancelled = false;

    async function loadAssessment() {
      let hasValidLocalProfile = false;

      try {
        const raw = window.localStorage.getItem("workbridge-assessment-profile");

        if (raw) {
          const saved: unknown = JSON.parse(raw);

          if (saved && typeof saved === "object") {
            const profile = saved as {
              goal?: unknown;
              selectedSkills?: unknown;
              learnedTechnicalSkills?: unknown;
              demonstratedTechnicalSkills?: unknown;
            };

            if (
              typeof profile.goal === "string" &&
              Object.prototype.hasOwnProperty.call(technicalSkillsByCareer, profile.goal)
            ) {
              hasValidLocalProfile = true;
              if (cancelled) return;

              setCareerGoal(profile.goal);

              if (Array.isArray(profile.selectedSkills)) {
                setSelectedSkills(profile.selectedSkills.filter((v): v is string =>
                  typeof v === "string" && skills.some((skill) => skill.id === v)
                ));
              }

              const validTechnicalIds = new Set(
                technicalSkillsByCareer[profile.goal].map((skill) => skill.id)
              );

              if (Array.isArray(profile.learnedTechnicalSkills)) {
                setLearnedTechnicalSkills(profile.learnedTechnicalSkills.filter(
                  (v): v is string => typeof v === "string" && validTechnicalIds.has(v)
                ));
              }

              if (Array.isArray(profile.demonstratedTechnicalSkills)) {
                setDemonstratedTechnicalSkills(profile.demonstratedTechnicalSkills.filter(
                  (v): v is string => typeof v === "string" && validTechnicalIds.has(v)
                ));
              }
            }
          }
        }
      } catch {
        console.warn("Could not load the saved assessment profile from this browser.");
      }

      try {
        const cloud = await readWorkBridgeCloudSnapshot();
        if (cancelled) return;

        if (!hasValidLocalProfile) {
          const cloudGoal =
            typeof cloud.careerGoal === "string" &&
            Object.prototype.hasOwnProperty.call(technicalSkillsByCareer, cloud.careerGoal)
              ? cloud.careerGoal
              : null;

          if (cloudGoal) {
            setCareerGoal(cloudGoal);

            const validTechnicalIds = new Set(
              technicalSkillsByCareer[cloudGoal].map((skill) => skill.id)
            );

            setSelectedSkills(cloud.selectedSkills.filter((id) =>
              skills.some((skill) => skill.id === id)
            ));

            setLearnedTechnicalSkills(cloud.learnedTechnicalSkills.filter((id) =>
              validTechnicalIds.has(id)
            ));

            setDemonstratedTechnicalSkills(cloud.demonstratedTechnicalSkills.filter((id) =>
              validTechnicalIds.has(id)
            ));

            setSyncStatus("Cloud assessment loaded for this browser.");
          } else {
            setSyncStatus("No saved cloud assessment was found. You can complete the assessment below.");
          }
        }
      } catch {
        if (!cancelled) {
          setSyncStatus("Cloud assessment could not be loaded. Your browser's saved data was kept.");
        }
      }
    }

    void loadAssessment();

    return () => {
      cancelled = true;
    };
  }, []);

  const careerSkills = technicalSkillsByCareer[careerGoal] ?? [];

  const [result, setResult] = useState<{
    name: string;
    goal: string;
    coverage: number;
    missing: string[];
  } | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") || "").trim();
    const goal = String(form.get("goal") || "IT Support Technician");

    let localSaved = false;

    try {
      window.localStorage.setItem(
        "workbridge-assessment-profile",
        JSON.stringify({
          goal,
          selectedSkills,
          learnedTechnicalSkills,
          demonstratedTechnicalSkills,
        })
      );
      localSaved = true;
    } catch {
      console.warn("Could not save the assessment profile in this browser.");
    }

    const coverage = Math.round(
      (selectedSkills.length / skills.length) * 100
    );

    setResult({
      name,
      goal,
      coverage,
      missing: skills
        .filter((skill) => !selectedSkills.includes(skill.id))
        .map((skill) => skill.label),
    });

    setSyncStatus("Saving assessment to your account…");
    window.scrollTo({ top: 0, behavior: "smooth" });

    try {
      await saveWorkBridgeProfile({
        careerGoal: goal,
        selectedSkills,
        learnedTechnicalSkills,
        demonstratedTechnicalSkills,
      });
      setSyncStatus("Assessment synced to your account.");
    } catch {
      setSyncStatus(
        localSaved
          ? "Assessment saved in this browser. Cloud sync is unavailable or you need to sign in."
          : "Cloud sync failed, and this browser could not save the assessment."
      );
    }
  }

  function toggleSkill(id: string) {
    setSelectedSkills((current) =>
      current.includes(id)
        ? current.filter((skill) => skill !== id)
        : [...current, id]
    );
    setResult(null);
  }

  return (
    <main className="min-h-screen bg-[#080d18] px-5 py-8 text-white sm:px-8">
      <div className="mx-auto max-w-3xl">
        <header className="mb-10 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold">
            Work<span className="text-blue-400">Bridge</span>
          </Link>
          <Link href="/" className="text-sm text-slate-400 hover:text-white">
            ← Back home
          </Link>
        </header>

        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-400">
            Career readiness • Step 1
          </p>
          <h1 className="mt-3 text-3xl font-bold sm:text-4xl">
            Turn your potential into a plan.
          </h1>
          <p className="mt-4 leading-7 text-slate-400">
            Tell us where you are today. We will help you identify the skills
            you already have and the next steps towards your career goal.
          </p>
        </div>

        {syncStatus && (
          <p
            role="status"
            aria-live="polite"
            className="mb-4 rounded-xl border border-slate-700 bg-slate-900/70 px-4 py-3 text-sm text-slate-300"
          >
            {syncStatus}
          </p>
        )}

        {result && (
          <section
            aria-live="polite"
            className="mb-8 rounded-2xl border border-blue-400/30 bg-blue-500/10 p-6"
          >
            <p className="text-sm font-semibold text-blue-300">
              YOUR SKILL COVERAGE SNAPSHOT
            </p>
            <h2 className="mt-2 text-2xl font-bold">
              {result.name ? `Well done, ${result.name}.` : "Your results are ready."}
            </h2>
            <p className="mt-2 text-slate-300">
              Career goal: {result.goal}
            </p>

            <div className="mt-6 flex items-end justify-between gap-4">
              <div>
                <p className="text-sm text-slate-400">
                  Skills you currently report having
                </p>
                <p className="mt-1 text-4xl font-bold text-blue-300">
                  {result.coverage}%
                </p>
              </div>
              <p className="text-sm text-slate-400">
                {skills.length - result.missing.length} of {skills.length} skill areas
              </p>
            </div>

            <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-700">
              <div
                className="h-full rounded-full bg-blue-400 transition-all"
                style={{ width: `${result.coverage}%` }}
              />
            </div>

            <h3 className="mt-7 font-semibold">Suggested next steps</h3>
            {result.missing.length > 0 ? (
              <ul className="mt-3 space-y-3">
                {result.missing.map((skill) => (
                  <li key={skill} className="flex gap-3 text-sm text-slate-300">
                    <span className="text-blue-300">→</span>
                    <span>Learn and practise {skill.toLowerCase()}.</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm leading-6 text-slate-300">
                You selected all five skill areas. Next, gather evidence such
                as practical projects, certificates or completed assessments
                to demonstrate your abilities.
              </p>
            )}

            <p className="mt-5 border-t border-slate-700 pt-4 text-xs leading-5 text-slate-400">
              This percentage measures self-reported skill coverage only. It
              is not a validated employability score or a guarantee of
              job-readiness. WorkBridge should verify skills through evidence
              and practical assessments.
            </p>

            <button
              type="button"
              onClick={() => setResult(null)}
              className="mt-5 rounded-xl border border-slate-600 px-4 py-3 text-sm font-semibold hover:bg-slate-800"
            >
              Review my answers
            </button>
          </section>
        )}

        <form
          onSubmit={handleSubmit}
          className="space-y-8 rounded-2xl border border-slate-800 bg-[#101827] p-5 sm:p-8"
        >
          <section>
            <h2 className="text-lg font-semibold">About you</h2>
            <p className="mt-1 text-sm text-slate-400">
              Start with a few details about your career journey.
            </p>

            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <label className="block text-sm text-slate-300">
                Your name
                <input
                  name="name"
                  required
                  maxLength={80}
                  placeholder="Enter your name"
                  className="mt-2 w-full rounded-xl border border-slate-700 bg-[#080d18] px-4 py-3 text-white outline-none focus:border-blue-400"
                />
              </label>

              <label className="block text-sm text-slate-300">
                Town or city
                <input
                  name="location"
                  required
                  maxLength={100}
                  placeholder="e.g. Mbombela"
                  className="mt-2 w-full rounded-xl border border-slate-700 bg-[#080d18] px-4 py-3 text-white outline-none focus:border-blue-400"
                />
              </label>

              <label className="block text-sm text-slate-300">
                Highest education completed
                <select
                  name="education"
                  required
                  defaultValue=""
                  className="mt-2 w-full rounded-xl border border-slate-700 bg-[#080d18] px-4 py-3 text-white outline-none focus:border-blue-400"
                >
                  <option value="" disabled>Select education</option>
                  <option>Below Matric</option>
                  <option>Matric</option>
                  <option>Certificate</option>
                  <option>Higher Certificate</option>
                  <option>Diploma</option>
                  <option>Degree or higher</option>
                </select>
              </label>

              <label className="block text-sm text-slate-300">
                Work experience
                <select
                  name="experience"
                  required
                  defaultValue=""
                  className="mt-2 w-full rounded-xl border border-slate-700 bg-[#080d18] px-4 py-3 text-white outline-none focus:border-blue-400"
                >
                  <option value="" disabled>Select experience</option>
                  <option>No formal work experience</option>
                  <option>Informal work or volunteering</option>
                  <option>Less than 1 year</option>
                  <option>1–3 years</option>
                  <option>More than 3 years</option>
                </select>
              </label>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold">Your career goal</h2>
            <label className="mt-4 block text-sm text-slate-300">
              Which career are you working towards?
              <select
                name="goal"
                required
                value={careerGoal}
                onChange={(event) => {
                  const nextGoal = event.target.value;
                  setCareerGoal(nextGoal);
                  setLearnedTechnicalSkills([]);
                  setDemonstratedTechnicalSkills([]);
                  setResult(null);
                }}
                className="mt-2 w-full rounded-xl border border-slate-700 bg-[#080d18] px-4 py-3 text-white outline-none focus:border-blue-400"
              >
                <option>IT Support Technician</option>
                <option>Software Developer</option>
                <option>Cybersecurity Analyst</option>
                <option>Data Analyst</option>
                <option>Network Technician</option>
              </select>
            </label>
          </section>

          <section>
            <h2 className="text-lg font-semibold">Your current skills</h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Select the areas where you already have some knowledge or
              experience. Be honest; you can develop the others.
            </p>

            <div className="mt-4 space-y-3">
              {skills.map((skill) => (
                <label
                  key={skill.id}
                  className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-700 p-4 transition hover:border-blue-400/60"
                >
                  <input
                    type="checkbox"
                    checked={selectedSkills.includes(skill.id)}
                    onChange={() => toggleSkill(skill.id)}
                    className="mt-1 h-4 w-4 accent-blue-500"
                  />
                  <span className="text-sm leading-6 text-slate-200">
                    {skill.label}
                  </span>
                </label>
              ))}
            </div>
            <p className="mt-3 text-sm text-slate-400">
              {selectedSkills.length} of {skills.length} general skill areas selected
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold">Technical skills for your career</h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              These skills change with your career goal. Select only what honestly describes your current experience.
            </p>

            <div className="mt-5 space-y-5">
              <div>
                <h3 className="font-semibold text-blue-300">I have learned these skills</h3>
                <p className="mt-1 text-xs leading-5 text-slate-400">
                  You have studied or practised the basics. This is self-reported, not independently verified.
                </p>
                <div className="mt-3 space-y-2">
                  {careerSkills.map((skill) => (
                    <label key={skill.id} className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-700 p-3 hover:border-blue-400/60">
                      <input
                        type="checkbox"
                        checked={learnedTechnicalSkills.includes(skill.id)}
                        onChange={() => {
                          setLearnedTechnicalSkills((current) =>
                            current.includes(skill.id)
                              ? current.filter((id) => id !== skill.id)
                              : [...current, skill.id]
                          );
                          setResult(null);
                        }}
                        className="mt-1 h-4 w-4 accent-blue-500"
                      />
                      <span className="text-sm leading-6 text-slate-200">{skill.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-emerald-300">I have demonstrated these in practical work</h3>
                <p className="mt-1 text-xs leading-5 text-slate-400">
                  Select these only if you have actually completed a relevant exercise, project or task. You can add supporting details to your portfolio.
                </p>
                <div className="mt-3 space-y-2">
                  {careerSkills.map((skill) => (
                    <label key={skill.id} className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-700 p-3 hover:border-emerald-400/60">
                      <input
                        type="checkbox"
                        checked={demonstratedTechnicalSkills.includes(skill.id)}
                        onChange={() => {
                          setDemonstratedTechnicalSkills((current) =>
                            current.includes(skill.id)
                              ? current.filter((id) => id !== skill.id)
                              : [...current, skill.id]
                          );
                          setResult(null);
                        }}
                        className="mt-1 h-4 w-4 accent-emerald-500"
                      />
                      <span className="text-sm leading-6 text-slate-200">{skill.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <p className="mt-3 text-sm leading-6 text-slate-400">
              Learned: {learnedTechnicalSkills.length} · Practically demonstrated (self-reported): {demonstratedTechnicalSkills.length}
            </p>
          </section>

          <button
            type="submit"
            className="w-full rounded-xl bg-blue-500 px-5 py-4 font-semibold transition hover:bg-blue-400"
          >
            Calculate my skill coverage →
          </button>
          <p className="text-center text-xs leading-5 text-slate-500">
            Your career goal and selected skills sync to your signed-in WorkBridge account. Your name, town/city, education and work experience are not currently saved to the cloud.
          </p>
        </form>

        <footer className="py-8 text-center text-xs text-slate-500">
          WorkBridge · Turn what you can do into your next opportunity.
        </footer>
      </div>
    </main>
  );
}
