"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getWorkBridgeStorageScope } from "@/lib/workbridge/sync";

type Requirement = {
  name: string;
  assessmentSkill?: string;
  technicalSkillIds?: string[];
  evidenceSkills: string[];
};

type Opportunity = {
  title: string;
  summary: string;
  requirements: Requirement[];
};

type Evidence = {
  id?: string;
  title?: string;
  description?: string;
  skill?: string;
  career?: string;
};

const PROFILE_KEY = "workbridge-assessment-profile";
const PROGRESS_KEY = "workbridge-roadmap-progress-v2";
const EVIDENCE_KEY = "workbridge-evidence-portfolio";

const opportunities: Opportunity[] = [
  {
    title: "IT Support Technician",
    summary: "Help people resolve computer, software and connectivity problems.",
    requirements: [
      { name: "Technical troubleshooting", assessmentSkill: "troubleshooting", evidenceSkills: ["Computer troubleshooting", "Debugging and testing"] },
      { name: "Operating systems", assessmentSkill: "operating-systems", evidenceSkills: ["Operating systems"] },
      { name: "Networking fundamentals", assessmentSkill: "networking", evidenceSkills: ["Networking", "Network troubleshooting", "IP addressing"] },
      { name: "Customer communication", assessmentSkill: "communication", evidenceSkills: ["Customer support", "Communication"] },
      { name: "Safe computing", assessmentSkill: "security", evidenceSkills: ["Cybersecurity", "Security fundamentals"] },
    ],
  },
  {
    title: "Software Developer",
    summary: "Build, test and improve software applications.",
    requirements: [
      { name: "Programming fundamentals", technicalSkillIds: ["programming-fundamentals", "javascript"], evidenceSkills: ["Programming fundamentals"] },
      { name: "Web development", technicalSkillIds: ["web-development"], evidenceSkills: ["Web development"] },
      { name: "Git and version control", technicalSkillIds: ["git-version-control"], evidenceSkills: ["Git and version control"] },
      { name: "Debugging and testing", technicalSkillIds: ["debugging-testing"], evidenceSkills: ["Debugging and testing"] },
      { name: "Application development", technicalSkillIds: ["programming-fundamentals", "javascript"], evidenceSkills: ["Application development"] },
    ],
  },
  {
    title: "Cybersecurity Analyst",
    summary: "Help identify security risks and protect digital systems.",
    requirements: [
      { name: "Security fundamentals", assessmentSkill: "security", evidenceSkills: ["Security fundamentals", "Cybersecurity"] },
      { name: "Threat awareness", evidenceSkills: ["Threat awareness"] },
      { name: "Network security", evidenceSkills: ["Network security"] },
      { name: "Risk assessment", evidenceSkills: ["Risk assessment"] },
      { name: "Security documentation", evidenceSkills: ["Security documentation"] },
    ],
  },
  {
    title: "Data Analyst",
    summary: "Prepare, analyse and communicate insights from data.",
    requirements: [
      { name: "Data cleaning", evidenceSkills: ["Data cleaning"] },
      { name: "Spreadsheets", evidenceSkills: ["Spreadsheets"] },
      { name: "SQL and databases", evidenceSkills: ["SQL and databases"] },
      { name: "Data visualisation", evidenceSkills: ["Data visualisation"] },
      { name: "Analytical problem-solving", evidenceSkills: ["Analytical problem-solving"] },
    ],
  },
  {
    title: "Network Technician",
    summary: "Configure, maintain and troubleshoot network connections.",
    requirements: [
      { name: "Networking fundamentals", assessmentSkill: "networking", evidenceSkills: ["Networking"] },
      { name: "Network configuration", evidenceSkills: ["Network configuration"] },
      { name: "IP addressing", evidenceSkills: ["IP addressing"] },
      { name: "Network troubleshooting", evidenceSkills: ["Network troubleshooting"] },
      { name: "Network documentation", evidenceSkills: ["Network documentation"] },
    ],
  },
];

const recommendationProjects: Record<
  string,
  Record<string, { title: string; skill: string }>
> = {
  "IT Support Technician": {
    "Technical troubleshooting": {
      title: "Create a computer troubleshooting checklist.",
      skill: "Computer troubleshooting",
    },
    "Operating systems": {
      title: "Build a portfolio of three sample IT support tickets.",
      skill: "Operating systems",
    },
    "Networking fundamentals": {
      title: "Write a home-network troubleshooting guide.",
      skill: "Networking",
    },
    "Customer communication": {
      title: "Build a portfolio of three sample IT support tickets.",
      skill: "Customer support",
    },
    "Safe computing": {
      title: "Create a beginner IT support portfolio.",
      skill: "Cybersecurity",
    },
  },
  "Software Developer": {
    "Programming fundamentals": {
      title: "Build a command-line calculator.",
      skill: "Programming fundamentals",
    },
    "Web development": {
      title: "Create a responsive personal profile webpage.",
      skill: "Web development",
    },
    "Git and version control": {
      title: "Build a task tracker with add and complete actions.",
      skill: "Git and version control",
    },
    "Debugging and testing": {
      title: "Build a task tracker with add and complete actions.",
      skill: "Debugging and testing",
    },
    "Application development": {
      title: "Publish a portfolio-ready app and source repository.",
      skill: "Application development",
    },
  },
  "Cybersecurity Analyst": {
    "Security fundamentals": {
      title: "Create a personal cybersecurity safety checklist.",
      skill: "Security fundamentals",
    },
    "Threat awareness": {
      title: "Create a mock phishing investigation report.",
      skill: "Threat awareness",
    },
    "Network security": {
      title: "Draw and explain a simple home network.",
      skill: "Network security",
    },
    "Risk assessment": {
      title: "Create a mock phishing investigation report.",
      skill: "Risk assessment",
    },
    "Security documentation": {
      title: "Publish a defensive security learning portfolio.",
      skill: "Security documentation",
    },
  },
  "Data Analyst": {
    "Data cleaning": {
      title: "Clean a small public or fictional dataset.",
      skill: "Data cleaning",
    },
    "Spreadsheets": {
      title: "Clean a small public or fictional dataset.",
      skill: "Spreadsheets",
    },
    "SQL and databases": {
      title: "Write a short analysis using a sample dataset.",
      skill: "SQL and databases",
    },
    "Data visualisation": {
      title: "Create a one-page data dashboard.",
      skill: "Data visualisation",
    },
    "Analytical problem-solving": {
      title: "Publish a small data analysis case study.",
      skill: "Analytical problem-solving",
    },
  },
  "Network Technician": {
    "Networking fundamentals": {
      title: "Draw a labelled home or small-office network.",
      skill: "Network configuration",
    },
    "Network configuration": {
      title: "Draw a labelled home or small-office network.",
      skill: "Network configuration",
    },
    "IP addressing": {
      title: "Draw a labelled home or small-office network.",
      skill: "IP addressing",
    },
    "Network troubleshooting": {
      title: "Write a step-by-step connectivity troubleshooting guide.",
      skill: "Network troubleshooting",
    },
    "Network documentation": {
      title: "Build a network diagram and troubleshooting portfolio.",
      skill: "Network documentation",
    },
  },
};

type RequirementStatus =
  | "Evidence saved"
  | "Practical work reported"
  | "Learned"
  | "General skill reported"
  | "Not demonstrated yet";

function getStatus(
  requirement: Requirement,
  selectedSkills: string[],
  learnedTechnicalSkills: string[],
  demonstratedTechnicalSkills: string[],
  evidence: Evidence[],
): RequirementStatus {
  const hasEvidence = evidence.some(
    (item) =>
      typeof item.skill === "string" &&
      requirement.evidenceSkills.some(
        (skill) => skill.toLowerCase() === item.skill!.trim().toLowerCase(),
      ),
  );

  if (hasEvidence) return "Evidence saved";

  if (
    requirement.technicalSkillIds?.some((id) =>
      demonstratedTechnicalSkills.includes(id),
    )
  ) {
    return "Practical work reported";
  }

  if (
    requirement.technicalSkillIds?.some((id) =>
      learnedTechnicalSkills.includes(id),
    )
  ) {
    return "Learned";
  }

  if (
    requirement.assessmentSkill &&
    selectedSkills.includes(requirement.assessmentSkill)
  ) {
    return "General skill reported";
  }

  return "Not demonstrated yet";
}

export default function OpportunitiesPage() {
  const [career, setCareer] = useState("IT Support Technician");
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [learnedTechnicalSkills, setLearnedTechnicalSkills] = useState<string[]>([]);
  const [demonstratedTechnicalSkills, setDemonstratedTechnicalSkills] = useState<string[]>([]);
  const [progressByCareer, setProgressByCareer] = useState<Record<string, string[]>>({});
  const [evidence, setEvidence] = useState<Evidence[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function loadLocalData() {
      let storageScope;
      try {
        storageScope = await getWorkBridgeStorageScope();
      } catch {
        if (!cancelled) setLoaded(true);
        return;
      }

      try {
      const profileRaw = localStorage.getItem(storageScope.key(PROFILE_KEY));
      if (profileRaw) {
        const profile: unknown = JSON.parse(profileRaw);

        if (profile && typeof profile === "object") {
          const data = profile as { goal?: unknown; selectedSkills?: unknown; learnedTechnicalSkills?: unknown; demonstratedTechnicalSkills?: unknown };

          if (
            typeof data.goal === "string" &&
            opportunities.some((item) => item.title === data.goal)
          ) {
            setCareer(data.goal);
          }

          if (Array.isArray(data.selectedSkills)) {
            setSelectedSkills(
              data.selectedSkills.filter(
                (item): item is string => typeof item === "string",
              ),
            );
          }

          if (Array.isArray(data.learnedTechnicalSkills)) {
            setLearnedTechnicalSkills(
              data.learnedTechnicalSkills.filter(
                (item): item is string => typeof item === "string",
              ),
            );
          }

          if (Array.isArray(data.demonstratedTechnicalSkills)) {
            setDemonstratedTechnicalSkills(
              data.demonstratedTechnicalSkills.filter(
                (item): item is string => typeof item === "string",
              ),
            );
          }
        }
      }

      const progressRaw = localStorage.getItem(storageScope.key(PROGRESS_KEY));
      if (progressRaw) {
        const parsed: unknown = JSON.parse(progressRaw);

        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
          const validProgress: Record<string, string[]> = {};

          for (const [key, value] of Object.entries(parsed)) {
            if (Array.isArray(value)) {
              validProgress[key] = value.filter(
                (item): item is string => typeof item === "string",
              );
            }
          }

          setProgressByCareer(validProgress);
        }
      }

      const evidenceRaw = localStorage.getItem(storageScope.key(EVIDENCE_KEY));
      if (evidenceRaw) {
        const parsed: unknown = JSON.parse(evidenceRaw);

        if (Array.isArray(parsed)) {
          setEvidence(
            parsed.filter(
              (item): item is Evidence =>
                !!item && typeof item === "object",
            ),
          );
        }
      }
    } catch {
      // Keep the page usable if saved browser data is missing or invalid.
      } finally {
        if (!cancelled) setLoaded(true);
      }
    }
    void loadLocalData();
    return () => {
      cancelled = true;
    };
  }, []);

  const selectedOpportunity =
    opportunities.find((item) => item.title === career) ?? opportunities[0];

  const careerEvidence = evidence.filter((item) => item.career === career);

  const results = selectedOpportunity.requirements.map((requirement) => ({
    requirement,
    status: getStatus(
      requirement,
      selectedSkills,
      learnedTechnicalSkills,
      demonstratedTechnicalSkills,
      careerEvidence,
    ),
  }));

  const careerComparisons = opportunities.map((opportunity) => {
    const careerEvidence = evidence.filter(
      (item) => item.career === opportunity.title,
    );

    const statuses = opportunity.requirements.map((requirement) =>
      getStatus(
        requirement,
        selectedSkills,
        learnedTechnicalSkills,
        demonstratedTechnicalSkills,
        careerEvidence,
      ),
    );

    const nextRequirementIndex = [
      "Practical work reported",
      "Learned",
      "General skill reported",
      "Not demonstrated yet",
    ]
      .map((status) => statuses.findIndex((item) => item === status))
      .find((index) => index !== -1);

    const nextRequirement =
      nextRequirementIndex === undefined
        ? undefined
        : opportunity.requirements[nextRequirementIndex];

    const nextProject = nextRequirement
      ? recommendationProjects[opportunity.title]?.[nextRequirement.name]
      : undefined;

    return {
      opportunity,
      profileSignalsCount: statuses.filter(
        (status) => status !== "Not demonstrated yet",
      ).length,
      evidenceCount: statuses.filter(
        (status) => status === "Evidence saved",
      ).length,
      notDemonstratedCount: statuses.filter(
        (status) => status === "Not demonstrated yet",
      ).length,
      nextRequirement,
      nextProject,
    };
  });
  const evidenceCount = results.filter(
    (item) => item.status === "Evidence saved",
  ).length;

  const practicalWorkCount = results.filter(
    (item) => item.status === "Practical work reported",
  ).length;

  const learnedCount = results.filter(
    (item) => item.status === "Learned",
  ).length;

  const generalSkillCount = results.filter(
    (item) => item.status === "General skill reported",
  ).length;

  const notDemonstratedCount = results.filter(
    (item) => item.status === "Not demonstrated yet",
  ).length;

  const completedTasks = progressByCareer[career]?.length ?? 0;
  const nextAction =
    results.find((item) => item.status === "Practical work reported") ??
    results.find((item) => item.status === "Learned") ??
    results.find((item) => item.status === "General skill reported") ??
    results.find((item) => item.status === "Not demonstrated yet");
  const recommendedProject = nextAction
    ? recommendationProjects[career]?.[nextAction.requirement.name]
    : undefined;

  if (!loaded) {
    return (
      <main className="min-h-screen bg-slate-950 px-5 py-12 text-slate-100">
        <p>Loading your opportunity matches...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 px-5 py-8 text-slate-100 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <nav className="mb-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-300">
          <Link className="font-bold text-white" href="/">WorkBridge</Link>
          <Link className="hover:text-white" href="/assessment">Assessment</Link>
          <Link className="hover:text-white" href="/roadmap">Roadmap</Link>
          <Link className="hover:text-white" href="/portfolio">Evidence Portfolio</Link>
        </nav>

        <header className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-300">
            Skills-to-opportunity match
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-5xl">
            Turn your skills into your next opportunity.
          </h1>
          <p className="mt-4 leading-7 text-slate-300">
            Compare example entry-level role requirements with your self-reported
            skills, completed learning tasks and saved evidence. Find a practical
            next step you can take.
          </p>
        </header>

        <section className="mt-9">
          <h2 className="text-lg font-semibold">Choose a career to explore</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {opportunities.map((item) => (
              <button
                key={item.title}
                type="button"
                onClick={() => setCareer(item.title)}
                aria-pressed={career === item.title}
                className={`rounded-2xl border p-4 text-left transition ${
                  career === item.title
                    ? "border-blue-400 bg-blue-500/10"
                    : "border-slate-700 bg-slate-900 hover:border-slate-500"
                }`}
              >
                <span className="font-semibold">{item.title}</span>
                <span className="mt-2 block text-sm leading-6 text-slate-400">
                  {item.summary}
                </span>
              </button>
            ))}
          </div>
        </section>

        <section className="mt-8">
          <div className="max-w-3xl">
            <h2 className="text-xl font-bold">Compare your career paths</h2>
            <p className="mt-2 leading-6 text-slate-400">
              Compare your current profile signals across these example roles.
              Counts describe your saved information, not verified ability or
              employability.
            </p>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {careerComparisons.map((comparison) => (
              <article
                key={comparison.opportunity.title}
                className={`rounded-2xl border p-5 ${
                  career === comparison.opportunity.title
                    ? "border-blue-400 bg-blue-500/10"
                    : "border-slate-700 bg-slate-900"
                }`}
              >
                <h3 className="font-semibold">
                  {comparison.opportunity.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  {comparison.opportunity.summary}
                </p>

                <dl className="mt-4 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-sm text-slate-400">Profile signals</dt>
                    <dd className="font-semibold tabular-nums">
                      {comparison.profileSignalsCount}/{comparison.opportunity.requirements.length}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-sm text-slate-400">Evidence saved</dt>
                    <dd className="font-semibold tabular-nums">
                      {comparison.evidenceCount}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-sm text-slate-400">Skills to develop</dt>
                    <dd className="font-semibold tabular-nums">
                      {comparison.notDemonstratedCount}
                    </dd>
                  </div>
                </dl>

                {comparison.nextRequirement && comparison.nextProject && (
                  <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/70 p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-blue-300">
                      Suggested next step
                    </p>
                    <p className="mt-2 text-sm font-semibold">
                      {comparison.nextRequirement.name}
                    </p>
                    <p className="mt-1 text-sm leading-6 text-slate-400">
                      {comparison.nextProject.title}
                    </p>
                    <Link
                      href={`/portfolio?career=${encodeURIComponent(comparison.opportunity.title)}&title=${encodeURIComponent(comparison.nextProject.title)}&skill=${encodeURIComponent(comparison.nextProject.skill)}`}
                      className="mt-3 inline-flex text-sm font-semibold text-blue-300 hover:text-blue-200"
                    >
                      Prepare portfolio entry
                    </Link>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => setCareer(comparison.opportunity.title)}
                  aria-pressed={career === comparison.opportunity.title}
                  className="mt-5 w-full rounded-xl border border-slate-700 px-4 py-3 text-sm font-semibold transition hover:border-blue-400 hover:bg-slate-800"
                >
                  {career === comparison.opportunity.title
                    ? "Currently exploring"
                    : "Explore this career"}
                </button>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-8 rounded-2xl border border-slate-700 bg-slate-900 p-5 sm:p-7">
          <p className="text-sm text-blue-300">Selected opportunity profile</p>
          <h2 className="mt-2 text-2xl font-bold">{selectedOpportunity.title}</h2>
          <p className="mt-2 leading-6 text-slate-300">
            {selectedOpportunity.summary}
          </p>

          <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-3">
            <div className="rounded-xl bg-slate-800 p-4">
              <p className="text-sm text-slate-400">Requirements with evidence</p>
              <p className="mt-1 text-2xl font-bold">{evidenceCount}/{results.length}</p>
            </div>
            <div className="rounded-xl bg-slate-800 p-4">
              <p className="text-sm text-slate-400">Practical work reported</p>
              <p className="mt-1 text-2xl font-bold">{practicalWorkCount}</p>
            </div>
            <div className="rounded-xl bg-slate-800 p-4">
              <p className="text-sm text-slate-400">Skills learned</p>
              <p className="mt-1 text-2xl font-bold">{learnedCount}</p>
            </div>
            <div className="rounded-xl bg-slate-800 p-4">
              <p className="text-sm text-slate-400">General skills reported</p>
              <p className="mt-1 text-2xl font-bold">{generalSkillCount}</p>
            </div>
            <div className="rounded-xl bg-slate-800 p-4">
              <p className="text-sm text-slate-400">Not demonstrated yet</p>
              <p className="mt-1 text-2xl font-bold">{notDemonstratedCount}</p>
            </div>
            <div className="rounded-xl bg-slate-800 p-4">
              <p className="text-sm text-slate-400">Learning tasks completed</p>
              <p className="mt-1 text-2xl font-bold">{completedTasks}/12</p>
            </div>
          </div>

          <p className="mt-4 text-sm leading-6 text-slate-400">
            These figures describe your current WorkBridge profile, not your
            employability, a hiring decision or a verified skills assessment.
            Learning progress is shown separately from evidence.
          </p>
        </section>

        <section className="mt-8">
          <h2 className="text-xl font-bold">Requirement-by-requirement comparison</h2>
          <div className="mt-4 space-y-3">
            {results.map(({ requirement, status }) => (
              <article
                key={requirement.name}
                className="rounded-xl border border-slate-700 bg-slate-900 p-4 sm:flex sm:items-center sm:justify-between sm:gap-4"
              >
                <div>
                  <h3 className="font-semibold">{requirement.name}</h3>
                  <p className="mt-1 text-sm text-slate-400">
                    {status === "Evidence saved"
                      ? "A saved portfolio item matches this skill label. It has not been independently verified."
                      : status === "Practical work reported"
                        ? "You reported practical experience with this skill. Add a portfolio item to document the work."
                        : status === "Learned"
                          ? "You marked this skill as learned. Complete a practical exercise and save your work."
                          : status === "General skill reported"
                            ? "You reported a related general skill. Add a relevant practical example."
                            : "Your current profile does not yet show this requirement as learned, reported or supported by saved evidence."}
                  </p>
                </div>
                <span
                  className={`mt-3 inline-flex shrink-0 rounded-full border px-3 py-1 text-xs font-semibold sm:mt-0 ${
                    status === "Evidence saved"
                      ? "border-emerald-700 text-emerald-300"
                      : status === "Practical work reported"
                        ? "border-amber-700 text-amber-300"
                        : status === "Learned"
                          ? "border-blue-700 text-blue-300"
                          : status === "General skill reported"
                            ? "border-violet-700 text-violet-300"
                            : "border-slate-600 text-slate-300"
                  }`}
                >
                  {status}
                </span>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-8 rounded-2xl border border-blue-400/30 bg-blue-500/5 p-5 sm:p-7">
          <p className="text-sm font-semibold uppercase tracking-wider text-blue-300">
            Your recommended next action
          </p>
          {nextAction ? (
            <>
              <h2 className="mt-2 text-xl font-bold">
                {nextAction.status === "Practical work reported"
                  ? `Document your practical work: ${nextAction.requirement.name}`
                  : nextAction.status === "Learned" ||
                      nextAction.status === "General skill reported"
                    ? `Build evidence for ${nextAction.requirement.name}`
                    : `Practise ${nextAction.requirement.name}`}
              </h2>
              {recommendedProject && (
                <div className="mt-4 rounded-xl border border-slate-700 bg-slate-900/70 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-blue-300">
                    Suggested practical project
                  </p>
                  <p className="mt-1 font-semibold text-white">
                    {recommendedProject.title}
                  </p>
                  <p className="mt-1 text-sm text-slate-400">
                    Complete the project honestly, then record what you did and the evidence you can provide.
                  </p>
                </div>
              )}
              <p className="mt-2 leading-6 text-slate-300">
                {nextAction.status === "Practical work reported"
                  ? "Describe a real task you completed, explain your contribution and add supporting work or a relevant link to your portfolio."
                  : nextAction.status === "Learned"
                    ? "Complete a small practical exercise, describe what you learned and save the work you genuinely completed."
                    : nextAction.status === "General skill reported"
                      ? "Choose a practical exercise that relates to this skill, complete it and document the result in your portfolio."
                      : "Use your roadmap to learn this skill, complete a practical exercise and save the work you can genuinely demonstrate."}
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link
                  href="/roadmap"
                  className="rounded-lg bg-blue-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-400"
                >
                  Open my roadmap
                </Link>
                <Link
                  href={`/portfolio?career=${encodeURIComponent(career)}&title=${encodeURIComponent(recommendedProject?.title ?? `Evidence for ${nextAction.requirement.name}`)}&skill=${encodeURIComponent(recommendedProject?.skill ?? nextAction.requirement.evidenceSkills[0])}`}
                  className="rounded-lg border border-slate-600 px-4 py-2.5 text-sm font-semibold hover:bg-slate-800"
                >
                  Prepare portfolio entry
                </Link>
              </div>
            </>
          ) : (
            <>
              <h2 className="mt-2 text-xl font-bold">
                You have saved evidence for every listed requirement.
              </h2>
              {recommendedProject && (
                <div className="mt-4 rounded-xl border border-slate-700 bg-slate-900/70 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-blue-300">
                    Suggested practical project
                  </p>
                  <p className="mt-1 font-semibold text-white">
                    {recommendedProject.title}
                  </p>
                  <p className="mt-1 text-sm text-slate-400">
                    Complete the project honestly, then record what you did and the evidence you can provide.
                  </p>
                </div>
              )}
              <p className="mt-2 leading-6 text-slate-300">
                Review each item for accuracy, make sure the work is yours, and
                keep improving your projects. Saved evidence has not been
                independently verified.
              </p>
              <Link
                href="/portfolio"
                className="mt-5 inline-flex rounded-lg bg-blue-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-400"
              >
                Review my portfolio
              </Link>
            </>
          )}
        </section>

        <section className="mt-8 rounded-xl border border-slate-800 p-5">
          <h2 className="font-semibold">Where these examples come from</h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            These are illustrative role profiles created for WorkBridge, not live
            vacancies or confirmed employer requirements. Real employers may
            require different qualifications, experience, certifications or
            additional skills. Your browser-saved portfolio is not independently
            verified or shared with employers.
          </p>
          <div className="mt-4 flex flex-wrap gap-4 text-sm">
            <Link className="text-blue-300 underline underline-offset-4" href="/assessment">
              Update assessment
            </Link>
            <Link className="text-blue-300 underline underline-offset-4" href="/roadmap">
              Continue learning
            </Link>
            <Link className="text-blue-300 underline underline-offset-4" href="/portfolio">
              View evidence portfolio
            </Link>
          </div>
        </section>

        <footer className="py-8 text-sm text-slate-500">
          WorkBridge - Learn it. Practise it. Prove it.
        </footer>
      </div>
    </main>
  );
}
