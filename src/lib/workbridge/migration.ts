import { createClient } from "@/lib/supabase/client";
import {
  ASSESSMENT_STORAGE_KEY,
  PORTFOLIO_STORAGE_KEY,
  ROADMAP_STORAGE_KEY,
  readWorkBridgeCloudSnapshot,
} from "@/lib/workbridge/sync";

const LEGACY_ROADMAP_KEY = "workbridge-roadmap-completed";

const CAREER_GOALS = [
  "IT Support Technician",
  "Software Developer",
  "Cybersecurity Analyst",
  "Data Analyst",
  "Network Technician",
] as const;

type CareerGoal = (typeof CAREER_GOALS)[number];

type LocalProfile = {
  goal: CareerGoal;
  selectedSkills: string[];
  learnedTechnicalSkills: string[];
  demonstratedTechnicalSkills: string[];
};

type LocalEvidence = {
  id: string;
  title: string;
  description: string;
  skill: string;
  career: CareerGoal;
  url: string;
  createdAt: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? [...new Set(value.filter((item): item is string => typeof item === "string"))]
    : [];
}

function isCareerGoal(value: unknown): value is CareerGoal {
  return typeof value === "string" &&
    CAREER_GOALS.includes(value as CareerGoal);
}

function readLocalProfile(): LocalProfile | null {
  const raw = window.localStorage.getItem(ASSESSMENT_STORAGE_KEY);
  if (!raw) return null;

  const parsed: unknown = JSON.parse(raw);
  if (!isRecord(parsed) || !isCareerGoal(parsed.goal)) return null;

  return {
    goal: parsed.goal,
    selectedSkills: stringArray(parsed.selectedSkills),
    learnedTechnicalSkills: stringArray(parsed.learnedTechnicalSkills),
    demonstratedTechnicalSkills: stringArray(parsed.demonstratedTechnicalSkills),
  };
}

function readLocalRoadmap(): Record<string, string[]> {
  const result: Record<string, string[]> = {};
  const raw = window.localStorage.getItem(ROADMAP_STORAGE_KEY);

  if (raw) {
    const parsed: unknown = JSON.parse(raw);

    if (isRecord(parsed)) {
      for (const goal of CAREER_GOALS) {
        result[goal] = stringArray(parsed[goal]);
      }
    } else if (Array.isArray(parsed)) {
      result["IT Support Technician"] = stringArray(parsed);
    }
  } else {
    const legacy = window.localStorage.getItem(LEGACY_ROADMAP_KEY);
    if (legacy) {
      result["IT Support Technician"] = stringArray(JSON.parse(legacy));
    }
  }

  return result;
}

function readLocalEvidence(): LocalEvidence[] {
  const raw = window.localStorage.getItem(PORTFOLIO_STORAGE_KEY);
  if (!raw) return [];

  const parsed: unknown = JSON.parse(raw);
  if (!Array.isArray(parsed)) return [];

  return parsed.filter((item): item is LocalEvidence =>
    isRecord(item) &&
    typeof item.id === "string" &&
    typeof item.title === "string" &&
    typeof item.description === "string" &&
    typeof item.skill === "string" &&
    isCareerGoal(item.career) &&
    typeof item.url === "string" &&
    typeof item.createdAt === "string"
  );
}

/**
 * Performs a one-time, non-destructive migration from browser storage.
 * Existing cloud profile values are not overwritten.
 * Roadmap completions are merged; portfolio rows are inserted idempotently.
 */
export async function migrateLocalWorkBridgeToCloud(): Promise<{
  profileMigrated: boolean;
  roadmapGoalsMigrated: number;
  portfolioEntriesMigrated: number;
}> {
  if (typeof window === "undefined") {
    throw new Error("Run the WorkBridge migration from the browser.");
  }

  const supabase = createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) throw userError;
  if (!user) throw new Error("Sign in before migrating WorkBridge data.");

  // Parse local data before writing anything. Invalid JSON stops the migration.
  const localProfile = readLocalProfile();
  const localRoadmap = readLocalRoadmap();
  const localEvidence = readLocalEvidence();

  // Read cloud data and check whether a profile row already exists.
  const cloud = await readWorkBridgeCloudSnapshot();
  const { data: existingProfile, error: existingProfileError } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  if (existingProfileError) throw existingProfileError;

  let profileMigrated = false;

  if (!existingProfile && localProfile) {
    const { error } = await supabase.from("profiles").upsert(
      {
        id: user.id,
        career_goal: localProfile.goal,
        selected_skills: localProfile.selectedSkills,
        learned_technical_skills: localProfile.learnedTechnicalSkills,
        demonstrated_technical_skills: localProfile.demonstratedTechnicalSkills,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    );

    if (error) throw error;
    profileMigrated = true;
  }

  let roadmapGoalsMigrated = 0;

  for (const goal of CAREER_GOALS) {
    const localTasks = localRoadmap[goal] ?? [];
    const cloudTasks = cloud.roadmapProgress[goal] ?? [];
    const mergedTasks = [...new Set([...cloudTasks, ...localTasks])];

    if (mergedTasks.length === 0) continue;

    const { error } = await supabase.from("roadmap_progress").upsert(
      {
        user_id: user.id,
        career_goal: goal,
        completed_tasks: mergedTasks,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,career_goal" }
    );

    if (error) throw error;
    roadmapGoalsMigrated += 1;
  }

  let portfolioEntriesMigrated = 0;

  for (const entry of localEvidence) {
    const { data: existingEntry, error: existingEntryError } = await supabase
      .from("portfolio_entries")
      .select("id")
      .eq("user_id", user.id)
      .eq("local_id", entry.id)
      .maybeSingle();

    if (existingEntryError) throw existingEntryError;
    if (existingEntry) continue;

    const { error } = await supabase.from("portfolio_entries").insert({
      user_id: user.id,
      local_id: entry.id,
      title: entry.title,
      description: entry.description,
      skill: entry.skill,
      career_goal: entry.career,
      url: entry.url || null,
      created_at: entry.createdAt,
    });

    if (error) throw error;
    portfolioEntriesMigrated += 1;
  }

  return {
    profileMigrated,
    roadmapGoalsMigrated,
    portfolioEntriesMigrated,
  };
}
