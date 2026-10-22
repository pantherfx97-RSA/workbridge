import { createClient } from "@/lib/supabase/client";

export const ASSESSMENT_STORAGE_KEY = "workbridge-assessment-profile";
export const ROADMAP_STORAGE_KEY = "workbridge-roadmap-progress-v2";
export const PORTFOLIO_STORAGE_KEY = "workbridge-evidence-portfolio";
export async function getWorkBridgeStorageScope() {
  const supabase = createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error) {
    throw new Error(`Unable to determine the signed-in account: ${error.message}`);
  }

  const userId = user?.id ?? null;

  return {
    userId,
    key(baseKey: string) {
      return userId ? `${baseKey}:user:${userId}` : baseKey;
    },
  };
}

export type WorkBridgeCloudSnapshot = {
  careerGoal: string | null;
  selectedSkills: string[];
  learnedTechnicalSkills: string[];
  demonstratedTechnicalSkills: string[];
  roadmapProgress: Record<string, string[]>;
  portfolioEntries: Array<{
    id: string;
    localId: string | null;
    title: string;
    description: string;
    skill: string;
    careerGoal: string;
    url: string | null;
    createdAt: string;
  }>;
};

function stringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

/**
 * Reads the signed-in user's cloud data without changing browser or cloud data.
 * Row-level security remains enforced by Supabase.
 */
export async function readWorkBridgeCloudSnapshot(): Promise<WorkBridgeCloudSnapshot> {
  const supabase = createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) throw userError;
  if (!user) throw new Error("Sign in before syncing WorkBridge data.");

  const [profileResult, roadmapResult, portfolioResult] = await Promise.all([
    supabase
      .from("profiles")
      .select(
        "career_goal, selected_skills, learned_technical_skills, demonstrated_technical_skills"
      )
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("roadmap_progress")
      .select("career_goal, completed_tasks")
      .eq("user_id", user.id),
    supabase
      .from("portfolio_entries")
      .select("id, local_id, title, description, skill, career_goal, url, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
  ]);

  if (profileResult.error) throw profileResult.error;
  if (roadmapResult.error) throw roadmapResult.error;
  if (portfolioResult.error) throw portfolioResult.error;

  const roadmapProgress: Record<string, string[]> = {};
  for (const row of roadmapResult.data ?? []) {
    roadmapProgress[row.career_goal] = stringArray(row.completed_tasks);
  }

  return {
    careerGoal: profileResult.data?.career_goal ?? null,
    selectedSkills: stringArray(profileResult.data?.selected_skills),
    learnedTechnicalSkills: stringArray(
      profileResult.data?.learned_technical_skills
    ),
    demonstratedTechnicalSkills: stringArray(
      profileResult.data?.demonstrated_technical_skills
    ),
    roadmapProgress,
    portfolioEntries: (portfolioResult.data ?? []).map((row) => ({
      id: row.id,
      localId: row.local_id,
      title: row.title,
      description: row.description,
      skill: row.skill,
      careerGoal: row.career_goal,
      url: row.url,
      createdAt: row.created_at,
    })),
  };
}

// Saves the current assessment exactly, including intentional removals.
export async function saveWorkBridgeProfile(input: {
  careerGoal: string;
  selectedSkills: string[];
  learnedTechnicalSkills: string[];
  demonstratedTechnicalSkills: string[];
}): Promise<void> {
  const allowedGoals = [
    "IT Support Technician",
    "Software Developer",
    "Cybersecurity Analyst",
    "Data Analyst",
    "Network Technician",
  ];

  if (!allowedGoals.includes(input.careerGoal)) {
    throw new Error("Choose a valid WorkBridge career goal before syncing.");
  }

  const supabase = createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) throw userError;
  if (!user) throw new Error("Sign in before syncing your assessment.");

  const uniqueStrings = (values: string[]) =>
    Array.from(new Set(stringArray(values)));

  const { error: saveError } = await supabase.from("profiles").upsert(
    {
      id: user.id,
      career_goal: input.careerGoal,
      selected_skills: uniqueStrings(input.selectedSkills),
      learned_technical_skills: uniqueStrings(input.learnedTechnicalSkills),
      demonstrated_technical_skills: uniqueStrings(
        input.demonstratedTechnicalSkills
      ),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" }
  );

  if (saveError) throw saveError;
}

export async function saveWorkBridgeRoadmapProgress(input: {
  careerGoal: string;
  completedTasks: string[];
}): Promise<void> {
  const allowedGoals = [
    "IT Support Technician",
    "Software Developer",
    "Cybersecurity Analyst",
    "Data Analyst",
    "Network Technician",
  ];

  if (!allowedGoals.includes(input.careerGoal)) {
    throw new Error("Choose a valid career goal before syncing roadmap progress.");
  }

  const supabase = createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) throw userError;
  if (!user) throw new Error("Sign in before syncing roadmap progress.");

  const completedTasks = Array.from(new Set(stringArray(input.completedTasks)));

  const { error: saveError } = await supabase
    .from("roadmap_progress")
    .upsert(
      {
        user_id: user.id,
        career_goal: input.careerGoal,
        completed_tasks: completedTasks,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,career_goal" }
    );

  if (saveError) throw saveError;
}

export async function saveWorkBridgePortfolioEntry(input: {
  localId: string;
  title: string;
  description: string;
  skill: string;
  careerGoal: string;
  url: string | null;
}): Promise<void> {
  const allowedGoals = [
    "IT Support Technician",
    "Software Developer",
    "Cybersecurity Analyst",
    "Data Analyst",
    "Network Technician",
  ];

  if (!allowedGoals.includes(input.careerGoal)) {
    throw new Error("Choose a valid career goal before syncing portfolio evidence.");
  }

  if (
    !input.localId.trim() ||
    !input.title.trim() ||
    !input.description.trim() ||
    !input.skill.trim()
  ) {
    throw new Error("Portfolio evidence is missing required information.");
  }

  const supabase = createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) throw userError;
  if (!user) throw new Error("Sign in before syncing portfolio evidence.");

  const { error: saveError } = await supabase
    .from("portfolio_entries")
    .upsert(
      {
        user_id: user.id,
        local_id: input.localId,
        title: input.title.trim(),
        description: input.description.trim(),
        skill: input.skill.trim(),
        career_goal: input.careerGoal,
        url: input.url,
      },
      { onConflict: "user_id,local_id" }
    );

  if (saveError) {
    console.error("Supabase portfolio upsert error:", JSON.stringify(saveError, Object.getOwnPropertyNames(saveError)));
    throw new Error(
      [
        `Supabase portfolio save failed (${saveError.code ?? "no code"}).`,
        saveError.message ?? "No message provided.",
        saveError.details ?? "",
        saveError.hint ?? "",
      ].filter(Boolean).join(" ")
    );
  }
}

export async function deleteWorkBridgePortfolioEntry(input: {
  localId: string | null;
  cloudId: string;
}): Promise<void> {
  const supabase = createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) throw userError;
  if (!user) throw new Error("Sign in before deleting cloud portfolio evidence.");

  let query = supabase
    .from("portfolio_entries")
    .delete()
    .eq("user_id", user.id);

  if (input.localId?.trim()) {
    query = query.eq("local_id", input.localId);
  } else if (input.cloudId.trim()) {
    query = query.eq("id", input.cloudId);
  } else {
    throw new Error("A portfolio entry identifier is required.");
  }

  const { error: deleteError } = await query;
  if (deleteError) throw deleteError;
}
