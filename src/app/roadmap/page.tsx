"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getWorkBridgeStorageScope, readWorkBridgeCloudSnapshot, saveWorkBridgeRoadmapProgress } from "@/lib/workbridge/sync";

type CareerGoal =
  | "IT Support Technician"
  | "Software Developer"
  | "Cybersecurity Analyst"
  | "Data Analyst"
  | "Network Technician";

type Week = {
  title: string;
  description: string;
  tasks: string[];
  project: string;
};

const PROFILE_KEY = "workbridge-assessment-profile";
const PROGRESS_KEY = "workbridge-roadmap-progress-v2";
const LEGACY_KEY = "workbridge-roadmap-completed";

const skillLabels: Record<string, string> = {
  troubleshooting: "Basic technical troubleshooting",
  "operating-systems": "Operating systems and computer setup",
  networking: "Networking fundamentals",
  communication: "Customer service and communication",
  security: "Cybersecurity and safe computing",
};

const validSkillIds = Object.keys(skillLabels);

const careerPaths: Record<CareerGoal, { description: string; weeks: Week[] }> = {
  "IT Support Technician": {
    description: "Build practical computer support, troubleshooting and networking skills.",
    weeks: [
      {
        title: "Week 1  -  Build your foundations",
        description: "Understand computers and operating systems.",
        tasks: [
          "Learn the main components of a computer.",
          "Practise navigating Windows settings and system tools.",
          "Learn basic troubleshooting and document a problem.",
        ],
        project: "Create a computer troubleshooting checklist.",
      },
      {
        title: "Week 2  -  Learn networking",
        description: "Understand how devices connect and communicate.",
        tasks: [
          "Learn IP addresses, routers, DNS and DHCP.",
          "Practise using ping and ipconfig in a safe environment.",
          "Explain the difference between a router and a switch.",
        ],
        project: "Write a home-network troubleshooting guide.",
      },
      {
        title: "Week 3  -  Practise security and support",
        description: "Develop safe computing and customer support skills.",
        tasks: [
          "Learn password security, MFA and phishing awareness.",
          "Practise explaining a technical problem in plain language.",
          "Write sample support tickets with problem and resolution.",
        ],
        project: "Build a portfolio of three sample IT support tickets.",
      },
      {
        title: "Week 4  -  Prove what you can do",
        description: "Turn your learning into evidence.",
        tasks: [
          "Complete a practical troubleshooting exercise.",
          "Document your work, results and lessons learned.",
          "Update your CV with truthful skills and projects.",
        ],
        project: "Create a beginner IT support portfolio.",
      },
    ],
  },
  "Software Developer": {
    description: "Learn programming fundamentals, build a small application and demonstrate your code.",
    weeks: [
      {
        title: "Week 1  -  Start programming",
        description: "Learn how code works and practise problem-solving.",
        tasks: [
          "Learn variables, data types and basic operators.",
          "Practise conditions, loops and simple functions.",
          "Write small programs that accept input and show output.",
        ],
        project: "Build a command-line calculator.",
      },
      {
        title: "Week 2  -  Build web foundations",
        description: "Understand the building blocks of web applications.",
        tasks: [
          "Learn HTML page structure and semantic elements.",
          "Practise CSS layouts and responsive design.",
          "Use JavaScript to respond to user actions.",
        ],
        project: "Create a responsive personal profile webpage.",
      },
      {
        title: "Week 3  -  Work like a developer",
        description: "Practise source control, debugging and testing.",
        tasks: [
          "Learn Git commits and create a repository.",
          "Find and fix errors using browser developer tools.",
          "Write tests or a checklist for important app behaviour.",
        ],
        project: "Build a task tracker with add and complete actions.",
      },
      {
        title: "Week 4  -  Publish your evidence",
        description: "Prepare a project others can review.",
        tasks: [
          "Improve validation and handle common input errors.",
          "Write a README with setup instructions and screenshots.",
          "Review your code and list the next skills to learn.",
        ],
        project: "Publish a portfolio-ready app and source repository.",
      },
    ],
  },
  "Cybersecurity Analyst": {
    description: "Develop safe security fundamentals, practise defensive analysis and document findings.",
    weeks: [
      {
        title: "Week 1  -  Learn security foundations",
        description: "Understand systems, threats and security principles.",
        tasks: [
          "Learn confidentiality, integrity and availability.",
          "Study common threats such as phishing and malware.",
          "Review account security, MFA and least privilege.",
        ],
        project: "Create a personal cybersecurity safety checklist.",
      },
      {
        title: "Week 2  -  Understand networks",
        description: "Learn how systems communicate and where risks arise.",
        tasks: [
          "Study IP addresses, ports and common protocols.",
          "Learn the roles of DNS, routers and firewalls.",
          "Practise interpreting basic network information on your own device.",
        ],
        project: "Draw and explain a simple home network.",
      },
      {
        title: "Week 3  -  Practise defensive analysis",
        description: "Recognise suspicious activity and document evidence.",
        tasks: [
          "Learn what system and security logs record.",
          "Review sample phishing messages and identify warning signs.",
          "Practise writing a clear incident report from a sample scenario.",
        ],
        project: "Create a mock phishing investigation report.",
      },
      {
        title: "Week 4  -  Demonstrate readiness",
        description: "Build evidence of safe, ethical security practice.",
        tasks: [
          "Complete a beginner defensive security lab you are authorised to use.",
          "Document findings, evidence and recommended mitigations.",
          "Review entry-level security roles and their requirements.",
        ],
        project: "Publish a defensive security learning portfolio.",
      },
    ],
  },
  "Data Analyst": {
    description: "Learn data handling, spreadsheet analysis, visualisation and evidence-based reporting.",
    weeks: [
      {
        title: "Week 1  -  Understand data",
        description: "Learn how to organise and check information.",
        tasks: [
          "Learn rows, columns, data types and structured tables.",
          "Practise spotting missing values and duplicates.",
          "Use spreadsheet formulas to calculate basic summaries.",
        ],
        project: "Clean a small public or fictional dataset.",
      },
      {
        title: "Week 2  -  Ask questions with data",
        description: "Practise querying and summarising information.",
        tasks: [
          "Learn basic SQL SELECT and WHERE queries.",
          "Practise sorting, filtering and grouping records.",
          "Calculate totals, averages and counts for a clear question.",
        ],
        project: "Write a short analysis using a sample dataset.",
      },
      {
        title: "Week 3  -  Visualise findings",
        description: "Turn results into understandable charts.",
        tasks: [
          "Choose appropriate charts for different data questions.",
          "Build charts using a spreadsheet tool.",
          "Explain trends and distinguish findings from assumptions.",
        ],
        project: "Create a one-page data dashboard.",
      },
      {
        title: "Week 4  -  Present your analysis",
        description: "Communicate useful, honest conclusions.",
        tasks: [
          "Write a concise summary of the question and method.",
          "Check calculations and cite the dataset source.",
          "List limitations and suggest further analysis.",
        ],
        project: "Publish a small data analysis case study.",
      },
    ],
  },
  "Network Technician": {
    description: "Build networking knowledge, practise diagnostics and document a small network.",
    weeks: [
      {
        title: "Week 1  -  Learn network basics",
        description: "Understand devices, addressing and connectivity.",
        tasks: [
          "Learn the roles of routers, switches and access points.",
          "Study IPv4 addresses and subnet-mask basics.",
          "Explain the purpose of DNS and DHCP.",
        ],
        project: "Draw a labelled home or small-office network.",
      },
      {
        title: "Week 2  -  Practise diagnostics",
        description: "Learn to investigate common connection problems.",
        tasks: [
          "Practise ipconfig and ping on your own device.",
          "Learn what traceroute or tracert can reveal.",
          "Follow a safe checklist for diagnosing connectivity issues.",
        ],
        project: "Write a step-by-step connectivity troubleshooting guide.",
      },
      {
        title: "Week 3  -  Understand network security",
        description: "Learn how networks are protected and maintained.",
        tasks: [
          "Study Wi-Fi encryption and secure router settings.",
          "Learn the purpose of firewalls and network segmentation.",
          "Document a safe network configuration review.",
        ],
        project: "Create a small-network security checklist.",
      },
      {
        title: "Week 4  -  Demonstrate your skills",
        description: "Turn networking practice into evidence.",
        tasks: [
          "Complete an authorised beginner networking lab.",
          "Document a simulated fault and how you diagnosed it.",
          "Review entry-level networking roles and certification options.",
        ],
        project: "Build a network diagram and troubleshooting portfolio.",
      },
    ],
  },
};

export default function RoadmapPage() {
  const [goal, setGoal] = useState<CareerGoal | "">("");
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [progressByGoal, setProgressByGoal] = useState<Record<string, string[]>>({});
  const [loaded, setLoaded] = useState(false);
  const [progressStorageKey, setProgressStorageKey] = useState(PROGRESS_KEY);
  const [storageAvailable, setStorageAvailable] = useState(true);
  const [cloudSyncAvailable, setCloudSyncAvailable] = useState(false);
  const [cloudStatus, setCloudStatus] = useState("Loading saved progress...");

  const weeks = goal ? careerPaths[goal].weeks : [];
  const allTasks = weeks.flatMap((week) => week.tasks);
  const completed = goal ? progressByGoal[goal] ?? [] : [];
  const totalTasks = allTasks.length;
  const progress = Math.round((completed.length / totalTasks) * 100);
  const missingSkills = validSkillIds.filter(
    (skill) => !selectedSkills.includes(skill)
  );

  useEffect(() => {
    async function loadProgress() {
      const nextProgress: Record<string, string[]> = {};
      let storageScope;
      try {
        storageScope = await getWorkBridgeStorageScope();
        setProgressStorageKey(storageScope.key(PROGRESS_KEY));
      } catch {
        setStorageAvailable(false);
        setCloudSyncAvailable(false);
        setCloudStatus("Account storage could not be verified. Reload and sign in again.");
        setProgressByGoal({});
        setLoaded(true);
        return;
      }
      const profileStorageKey = storageScope.key(PROFILE_KEY);
      const progressStorageKeyForLoad = storageScope.key(PROGRESS_KEY);

      try {
        const savedProfile = window.localStorage.getItem(profileStorageKey);

        if (savedProfile) {
          const profile: unknown = JSON.parse(savedProfile);

          if (profile && typeof profile === "object") {
            const data = profile as { goal?: unknown; selectedSkills?: unknown };

            if (
              typeof data.goal === "string" &&
              Object.prototype.hasOwnProperty.call(careerPaths, data.goal)
            ) {
              setGoal(data.goal as CareerGoal);
            }

            if (Array.isArray(data.selectedSkills)) {
              setSelectedSkills(
                data.selectedSkills.filter(
                  (skill): skill is string =>
                    typeof skill === "string" && validSkillIds.includes(skill)
                )
              );
            }
          }
        }
      } catch {
        setStorageAvailable(false);
      }

      try {
        const savedProgress = window.localStorage.getItem(progressStorageKeyForLoad);

        if (savedProgress) {
          const parsed: unknown = JSON.parse(savedProgress);

          if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
            const saved = parsed as Record<string, unknown>;

            (Object.keys(careerPaths) as CareerGoal[]).forEach((career) => {
              const tasks = careerPaths[career].weeks.flatMap((week) => week.tasks);
              const items = saved[career];

              if (Array.isArray(items)) {
                nextProgress[career] = items.filter(
                  (item): item is string =>
                    typeof item === "string" && tasks.includes(item)
                );
              }
            });
          }
        } else if (!storageScope.userId) {
          const legacy = window.localStorage.getItem(LEGACY_KEY);

          if (legacy) {
            const parsedLegacy: unknown = JSON.parse(legacy);
            const oldTasks = careerPaths["IT Support Technician"].weeks.flatMap(
              (week) => week.tasks
            );

            if (Array.isArray(parsedLegacy)) {
              nextProgress["IT Support Technician"] = parsedLegacy.filter(
                (item): item is string =>
                  typeof item === "string" && oldTasks.includes(item)
              );
            }
          }
        }
      } catch {
        setStorageAvailable(false);
      }

      try {
        const cloudSnapshot = await readWorkBridgeCloudSnapshot();

        // Use the account's career goal when this browser has no valid local goal.
        const savedProfile = window.localStorage.getItem(profileStorageKey);
        let hasValidLocalGoal = false;

        if (savedProfile) {
          try {
            const parsed: unknown = JSON.parse(savedProfile);
            if (parsed && typeof parsed === "object") {
              const localGoal = (parsed as { goal?: unknown }).goal;
              hasValidLocalGoal =
                typeof localGoal === "string" &&
                Object.prototype.hasOwnProperty.call(careerPaths, localGoal);
            }
          } catch {
            hasValidLocalGoal = false;
          }
        }

        if (
          !hasValidLocalGoal &&
          typeof cloudSnapshot.careerGoal === "string" &&
          Object.prototype.hasOwnProperty.call(careerPaths, cloudSnapshot.careerGoal)
        ) {
          setGoal(cloudSnapshot.careerGoal as CareerGoal);
        }

        if (!hasValidLocalGoal && cloudSnapshot.selectedSkills.length > 0) {
          setSelectedSkills(
            cloudSnapshot.selectedSkills.filter((skill) => validSkillIds.includes(skill))
          );
        }

        (Object.keys(careerPaths) as CareerGoal[]).forEach((career) => {
          const validTasks = careerPaths[career].weeks.flatMap((week) => week.tasks);
          const cloudTasks = cloudSnapshot.roadmapProgress[career] ?? [];
          const localTasks = nextProgress[career] ?? [];
          const mergedTasks = [...localTasks, ...cloudTasks].filter(
            (task, index, all) =>
              validTasks.includes(task) && all.indexOf(task) === index
          );

          if (mergedTasks.length > 0 || career in cloudSnapshot.roadmapProgress) {
            nextProgress[career] = mergedTasks;
          }
        });

        setCloudSyncAvailable(true);
        setCloudStatus("Cloud progress loaded and merged with this browser.");
      } catch (error) {
        setCloudSyncAvailable(false);

        const hasNoSession =
          error instanceof Error &&
          (
            error.message === "Sign in before syncing WorkBridge data." ||
            error.name === "AuthSessionMissingError" ||
            error.message === "Auth session missing!"
          );

        if (hasNoSession) {
          setCloudStatus("Showing local progress. Sign in to sync across browsers.");
        } else {
          console.error("WorkBridge roadmap cloud sync failed:", error);
          setCloudStatus("Showing local progress. Cloud data could not be loaded; cloud saving is paused.");
        }
      }

      setProgressByGoal(nextProgress);
      setLoaded(true);
    }

    void loadProgress();
  }, []);

  useEffect(() => {
    if (!loaded) return;

    try {
      window.localStorage.setItem(progressStorageKey, JSON.stringify(progressByGoal));

    } catch {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Report a browser-storage write failure.
      setStorageAvailable(false);
    }
  }, [progressByGoal, loaded, progressStorageKey]);

  async function persistCareerProgress(career: CareerGoal, tasks: string[]) {
    if (!cloudSyncAvailable) {
      setCloudStatus("Cloud saving is paused because cloud progress was not loaded successfully.");
      return;
    }

    try {
      await saveWorkBridgeRoadmapProgress({
        careerGoal: career,
        completedTasks: tasks,
      });
      setCloudStatus("Cloud progress saved successfully.");
    } catch {
      setCloudStatus("Progress is saved in this browser, but the cloud save failed.");
    }
  }

  function toggleTask(task: string) {
    if (!goal) return;
    const currentTasks = progressByGoal[goal] ?? [];
    const nextTasks = currentTasks.includes(task)
      ? currentTasks.filter((item) => item !== task)
      : [...currentTasks, task];

    setProgressByGoal((current) => ({
      ...current,
      [goal]: nextTasks,
    }));

    if (loaded) {
      void persistCareerProgress(goal, nextTasks);
    }
  }

  function resetProgress() {
    if (!goal) return;
    const confirmed = window.confirm(
      `Reset completed tasks for ${goal}? Other career progress will be kept.`
    );

    if (confirmed) {
      setProgressByGoal((current) => ({ ...current, [goal]: [] }));

      if (loaded) {
        void persistCareerProgress(goal, []);
      }
    }
  }

  if (loaded && !goal) {
    return (
      <main className="min-h-screen bg-[#080d18] px-5 py-8 text-white sm:px-8">
        <div className="mx-auto max-w-4xl rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <h1 className="text-2xl font-bold">Choose your career goal</h1>
          <p className="mt-3 leading-7 text-slate-300">
            Complete your career assessment before starting a personalised roadmap.
            Your existing saved progress will remain available.
          </p>
          <Link href="/assessment" className="mt-5 inline-block rounded-xl bg-blue-600 px-5 py-3 font-semibold hover:bg-blue-500">
            Complete assessment
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#080d18] px-5 py-8 text-white sm:px-8">
      <div className="mx-auto max-w-4xl">
        <header className="flex items-center justify-between">
          <Link href="/" className="text-xl font-bold">
            Work<span className="text-blue-400">Bridge</span>
          </Link>
          <a href="/assessment" className="text-sm text-slate-400 hover:text-white">
            Back to assessment
          </a>
        </header>

        <section className="mt-12">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-400">
            Your personalised development plan
          </p>
          <h1 className="mt-3 text-3xl font-bold sm:text-5xl">
            Your next 30 days start here.
          </h1>
          <p className="mt-5 max-w-2xl leading-7 text-slate-400">
            {goal ? careerPaths[goal].description : ""} Learn, practise and build evidence
            of what you can do.
          </p>
        </section>

        <section className="mt-8 rounded-2xl border border-slate-700 bg-[#101827] p-6">
          <p className="text-sm text-slate-400">Your selected career path</p>
          <h2 className="mt-2 text-2xl font-bold">{goal}</h2>
          <p className="mt-2 text-sm text-slate-400">
            To change your career path, update your goal in the career assessment.
          </p>

          <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm text-slate-400">Your roadmap progress</p>
              <p className="mt-2 text-3xl font-bold">{progress}%</p>
              <p className="mt-1 text-sm text-slate-400">
                {completed.length} of {totalTasks} learning tasks completed
              </p>
            </div>
            <span className="text-2xl" aria-hidden="true">&#127919;</span>
          </div>

          <div
            className="mt-5 h-2 overflow-hidden rounded-full bg-slate-700"
            role="progressbar"
            aria-label="Roadmap completion"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progress}
          >
            <div
              className="h-full rounded-full bg-blue-400 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>

          <p
            className={`mt-3 text-sm ${
              cloudSyncAvailable
                ? "text-emerald-400"
                : "text-amber-300"
            }`}
            role="status"
            aria-live="polite"
          >
            {cloudStatus}
          </p>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <p aria-live="polite" className="text-xs text-slate-400">
              {!loaded
                ? "Loading your saved progress..."
                : storageAvailable
                  ? "Progress saves automatically on this browser, separately for each career."
                  : "Browser storage is unavailable. Progress may not persist."}
            </p>
            <button
              type="button"
              onClick={resetProgress}
              disabled={!loaded || completed.length === 0}
              className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Reset this roadmap
            </button>
          </div>
        </section>

        <section className="mt-8 rounded-2xl border border-slate-800 bg-[#101827] p-5 sm:p-7">
          <h2 className="text-xl font-bold">Your skill-gap checklist</h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Based on the skill areas you reported in your assessment, consider
            practising these next. These are self-reported gaps, not a formal test.
          </p>
          {missingSkills.length > 0 ? (
            <ul className="mt-4 space-y-3">
              {missingSkills.map((skill) => (
                <li key={skill} className="flex gap-3 text-sm text-slate-200">
                  <span className="text-blue-300">&#8226;</span>
                  <span>{skillLabels[skill]}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-slate-200">
              You selected all five skill areas. Focus on producing practical evidence
              to demonstrate your abilities.
            </p>
          )}
          <a
            href="/assessment"
            className="mt-5 inline-block text-sm font-semibold text-blue-300 hover:text-blue-200"
          >
            Update assessment answers
          </a>
        </section>

        <section className="mt-8 space-y-5">
          {weeks.map((week, index) => (
            <article
              key={week.title}
              className="rounded-2xl border border-slate-800 bg-[#101827] p-5 sm:p-7"
            >
              <p className="text-sm font-semibold text-blue-400">WEEK {index + 1}</p>
              <h2 className="mt-2 text-xl font-bold">{week.title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                {week.description}
              </p>

              <div className="mt-6 space-y-4">
                {week.tasks.map((task) => (
                  <label key={task} className="flex cursor-pointer items-start gap-3">
                    <input
                      type="checkbox"
                      checked={completed.includes(task)}
                      onChange={() => toggleTask(task)}
                      disabled={!loaded}
                      className="mt-1 h-4 w-4 accent-blue-500"
                    />
                    <span
                      className={`text-sm leading-6 ${
                        completed.includes(task)
                          ? "text-slate-500 line-through"
                          : "text-slate-200"
                      }`}
                    >
                      {task}
                    </span>
                  </label>
                ))}
              </div>

              <div className="mt-6 rounded-xl border border-blue-400/20 bg-blue-500/5 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-blue-300">
                  Practical project
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-200">{week.project}</p>
<a
  href={`/portfolio?career=${encodeURIComponent(goal)}&title=${encodeURIComponent(week.project)}&skill=${encodeURIComponent(
    ({
      "Software Developer": ["Programming fundamentals", "Web development", "Git and version control", "Application development"],
      "IT Support Technician": ["Computer troubleshooting", "Networking", "Customer support", "Operating systems"],
      "Cybersecurity Analyst": ["Security fundamentals", "Network security", "Threat awareness", "Security documentation"],
      "Data Analyst": ["Data cleaning", "SQL and databases", "Data visualisation", "Analytical problem-solving"],
      "Network Technician": ["Network configuration", "Network troubleshooting", "Network documentation", "Network troubleshooting"],
    } as Record<string, string[]>)[goal]?.[(goal ? careerPaths[goal].weeks.indexOf(week) : -1)] ?? ""
  )}`}
  className="mt-3 inline-flex text-sm font-semibold text-blue-300 underline underline-offset-4 hover:text-blue-200"
>
  Add project evidence
</a>
              </div>
            </article>
          ))}
        </section>

        <footer className="py-10 text-center text-sm text-slate-500">
          WorkBridge - Learn it. Practise it. Prove it.
        </footer>
      </div>
    </main>
  );
}
