import "server-only";
import { z } from "zod";
import { MOCK_JOBS } from "./jsearch-mock";

// JSearch (OpenWeb Ninja) aggregates Google for Jobs, which in Malaysia covers
// JobStreet, LinkedIn, Indeed, Hiredly and company career pages.
const BASE_URL = "https://api.openwebninja.com/jsearch/search-v2";

// Search results are cached this long per unique query, to stay inside the
// API's monthly request quota when several people search the same thing.
const CACHE_SECONDS = 60 * 60;

export const DATE_POSTED = ["all", "today", "3days", "week", "month"] as const;
export const EMPLOYMENT_TYPES = ["FULLTIME", "PARTTIME", "CONTRACTOR", "INTERN"] as const;

export type SearchParams = {
  query: string;
  location?: string;
  datePosted?: (typeof DATE_POSTED)[number];
  remoteOnly?: boolean;
  employmentType?: (typeof EMPLOYMENT_TYPES)[number];
  cursor?: string;
};

const apiJob = z.object({
  job_id: z.string(),
  job_title: z.string(),
  employer_name: z.string().nullish(),
  employer_logo: z.string().nullish(),
  job_publisher: z.string().nullish(),
  job_employment_type: z.string().nullish(),
  // Listings without a usable link can't be applied to or saved; drop them.
  job_apply_link: z.url({ protocol: /^https?$/ }).max(8000),
  job_description: z.string().nullish(),
  job_is_remote: z.boolean().nullish(),
  job_posted_at_datetime_utc: z.string().nullish(),
  job_location: z.string().nullish(),
  job_city: z.string().nullish(),
  job_state: z.string().nullish(),
  job_min_salary: z.number().nullish(),
  job_max_salary: z.number().nullish(),
  job_salary_period: z.string().nullish(),
});

// search-v2 returns { jobs, cursor }; the older endpoint returned a bare array.
const apiResponse = z.object({
  status: z.string(),
  data: z.union([
    z.object({ jobs: z.array(z.unknown()), cursor: z.string().nullish() }),
    z.array(z.unknown()),
  ]),
});

export type Job = {
  id: string;
  title: string;
  company: string;
  logo: string | null;
  location: string;
  url: string;
  source: string;
  employmentType: string;
  isRemote: boolean;
  postedAt: string | null;
  salary: string;
  snippet: string;
};

export type SearchResult =
  | { ok: true; jobs: Job[]; nextCursor: string | null; mock: boolean }
  | { ok: false; error: string; expired?: boolean };

export async function searchJobs(params: SearchParams): Promise<SearchResult> {
  const apiKey = process.env.JSEARCH_API_KEY;
  if (!apiKey) {
    if (process.env.JSEARCH_MOCK === "1") {
      return { ok: true, jobs: MOCK_JOBS, nextCursor: null, mock: true };
    }
    return { ok: false, error: "Job search isn't set up yet: JSEARCH_API_KEY is missing." };
  }

  const where = params.location?.trim() || "Malaysia";
  const url = new URL(BASE_URL);
  url.searchParams.set("query", `${params.query.trim()} in ${where}`);
  url.searchParams.set("country", "my");
  url.searchParams.set("num_pages", "1");
  url.searchParams.set("date_posted", params.datePosted ?? "all");
  if (params.remoteOnly) url.searchParams.set("work_from_home", "true");
  if (params.employmentType) url.searchParams.set("employment_types", params.employmentType);
  if (params.cursor) url.searchParams.set("cursor", params.cursor);

  let res: Response;
  try {
    res = await fetch(url, {
      headers: { "x-api-key": apiKey },
      next: { revalidate: CACHE_SECONDS },
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    return { ok: false, error: "Couldn't reach the job search service. Try again." };
  }
  if (res.status === 429) {
    return { ok: false, error: "Monthly search limit reached on the job search service." };
  }
  if (res.status === 401 || res.status === 403) {
    return { ok: false, error: "Job search isn't configured correctly (API key rejected)." };
  }
  if (!res.ok) {
    // Page cursors expire; a failed follow-up page is almost always that.
    if (params.cursor) return { ok: false, error: "Those results expired. Search again.", expired: true };
    return { ok: false, error: `Job search failed (HTTP ${res.status}).` };
  }

  const parsed = apiResponse.safeParse(await res.json().catch(() => null));
  if (!parsed.success) {
    return { ok: false, error: "Job search returned an unexpected response." };
  }
  const data = parsed.data.data;
  const rawJobs = Array.isArray(data) ? data : data.jobs;
  const nextCursor = Array.isArray(data) ? null : (data.cursor ?? null);

  // Skip individual malformed listings rather than failing the whole page.
  const jobs = rawJobs.flatMap((raw) => {
    const j = apiJob.safeParse(raw);
    return j.success ? [toJob(j.data)] : [];
  });
  return { ok: true, jobs: dedupe(jobs), nextCursor, mock: false };
}

function toJob(j: z.infer<typeof apiJob>): Job {
  const location =
    j.job_location ?? [j.job_city, j.job_state].filter(Boolean).join(", ");
  return {
    // Lengths match the limits saveJob accepts, so every listing shown can be saved.
    id: j.job_id.slice(0, 200),
    title: j.job_title.slice(0, 300),
    company: (j.employer_name ?? "Unknown company").slice(0, 200),
    logo: j.employer_logo ?? null,
    location: location.slice(0, 200),
    url: j.job_apply_link,
    source: (j.job_publisher ?? "").slice(0, 100),
    employmentType: j.job_employment_type ?? "",
    isRemote: j.job_is_remote === true,
    postedAt: j.job_posted_at_datetime_utc ?? null,
    salary: formatSalary(j.job_min_salary, j.job_max_salary, j.job_salary_period),
    snippet: (j.job_description ?? "").slice(0, 280),
  };
}

// The same role is often listed on several job boards; keep the first copy.
// Same title at the same company in different cities are separate jobs.
export function jobKey(j: { title: string; company: string; location: string }): string {
  return `${j.title}|${j.company}|${j.location}`.toLowerCase();
}

function dedupe(jobs: Job[]): Job[] {
  const seen = new Set<string>();
  return jobs.filter((j) => {
    const key = jobKey(j);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

const PERIOD: Record<string, string> = { YEAR: "/yr", MONTH: "/mo", HOUR: "/hr" };

export function formatSalary(
  min: number | null | undefined,
  max: number | null | undefined,
  period: string | null | undefined,
): string {
  if (min == null && max == null) return "";
  const fmt = (n: number) => `RM${Math.round(n).toLocaleString("en-MY")}`;
  const range = min != null && max != null && min !== max ? `${fmt(min)}–${fmt(max)}` : fmt((min ?? max)!);
  return range + (PERIOD[period ?? ""] ?? "");
}
