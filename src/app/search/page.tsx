import Link from "next/link";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { profiles, savedJobs } from "@/db/schema";
import { requireUserId } from "@/lib/auth";
import { DATE_POSTED, EMPLOYMENT_TYPES, searchJobs, type Job } from "@/lib/jsearch";
import { SaveJobButton } from "@/components/save-job-button";

const DATE_LABELS: Record<(typeof DATE_POSTED)[number], string> = {
  all: "Any time",
  today: "Today",
  "3days": "Last 3 days",
  week: "Last week",
  month: "Last month",
};

const TYPE_LABELS: Record<(typeof EMPLOYMENT_TYPES)[number], string> = {
  FULLTIME: "Full-time",
  PARTTIME: "Part-time",
  CONTRACTOR: "Contract",
  INTERN: "Internship",
};

function pick<T extends string>(value: unknown, allowed: readonly T[]): T | undefined {
  return typeof value === "string" && (allowed as readonly string[]).includes(value)
    ? (value as T)
    : undefined;
}

function str(value: string | string[] | undefined): string {
  return typeof value === "string" ? value : "";
}

export default async function SearchPage({ searchParams }: PageProps<"/search">) {
  const userId = await requireUserId();
  const sp = await searchParams;
  const q = str(sp.q).slice(0, 200);
  const loc = str(sp.loc).slice(0, 100);
  const date = pick(sp.date, DATE_POSTED) ?? "all";
  const type = pick(sp.type, EMPLOYMENT_TYPES);
  const remote = sp.remote === "1";
  const cursor = str(sp.cursor) || undefined;

  const [profile] = await getDb().select().from(profiles).where(eq(profiles.userId, userId));
  const result = q
    ? await searchJobs({ query: q, location: loc, datePosted: date, employmentType: type, remoteOnly: remote, cursor })
    : null;

  let savedIds = new Set<string>();
  if (result?.ok) {
    const rows = await getDb()
      .select({ jobId: savedJobs.jobId })
      .from(savedJobs)
      .where(eq(savedJobs.userId, userId));
    savedIds = new Set(rows.map((r) => r.jobId));
  }

  const suggestions = (profile?.desiredRoles ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 5);

  const nextHref =
    result?.ok && result.nextCursor
      ? `/search?${new URLSearchParams({ q, loc, date, ...(type ? { type } : {}), ...(remote ? { remote: "1" } : {}), cursor: result.nextCursor })}`
      : null;

  return (
    <div className="space-y-6">
      <form action="/search" className="grid gap-3 rounded-lg border border-border bg-surface p-4 sm:grid-cols-[2fr_1fr_auto]">
        <input name="q" defaultValue={q} placeholder="Job title, skill or company" className="input" required />
        <input
          name="loc"
          defaultValue={loc || profile?.location || ""}
          placeholder="Anywhere in Malaysia"
          className="input"
        />
        <button className="btn">Search</button>
        <div className="flex flex-wrap items-center gap-3 text-sm sm:col-span-3">
          <select name="date" defaultValue={date} className="input w-auto">
            {DATE_POSTED.map((d) => (
              <option key={d} value={d}>{DATE_LABELS[d]}</option>
            ))}
          </select>
          <select name="type" defaultValue={type ?? ""} className="input w-auto">
            <option value="">Any type</option>
            {EMPLOYMENT_TYPES.map((t) => (
              <option key={t} value={t}>{TYPE_LABELS[t]}</option>
            ))}
          </select>
          <label className="flex items-center gap-2">
            <input type="checkbox" name="remote" value="1" defaultChecked={remote} />
            Remote only
          </label>
        </div>
      </form>

      {!q && (
        <div className="text-sm text-muted">
          {suggestions.length > 0 ? (
            <div className="flex flex-wrap items-center gap-2">
              <span>From your profile:</span>
              {suggestions.map((s) => (
                <Link key={s} href={`/search?q=${encodeURIComponent(s)}`} className="btn-ghost">
                  {s}
                </Link>
              ))}
            </div>
          ) : (
            <p>
              Tip: add the roles you want on your <Link href="/profile" className="underline">profile</Link> for
              one-click searches.
            </p>
          )}
        </div>
      )}

      {result && !result.ok && (
        <p className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
          {result.error}
        </p>
      )}

      {result?.ok && (
        <>
          {result.mock && (
            <p className="text-xs text-muted">Showing sample listings (JSEARCH_MOCK is on).</p>
          )}
          {result.jobs.length === 0 ? (
            <p className="text-sm text-muted">No jobs found. Try a broader title or a different location.</p>
          ) : (
            <ul className="space-y-3">
              {result.jobs.map((job) => (
                <JobCard key={job.id} job={job} saved={savedIds.has(job.id)} />
              ))}
            </ul>
          )}
          {nextHref && (
            <div className="text-center">
              <Link href={nextHref} className="btn-ghost">More results</Link>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function JobCard({ job, saved }: { job: Job; saved: boolean }) {
  const meta = [job.location, job.employmentType, job.isRemote ? "Remote" : "", job.salary]
    .filter(Boolean)
    .join(" · ");
  return (
    <li className="rounded-lg border border-border bg-surface p-4">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <a href={job.url} target="_blank" rel="noopener noreferrer" className="font-medium hover:underline">
            {job.title}
          </a>
          <p className="text-sm">{job.company}</p>
          {meta && <p className="mt-1 text-sm text-muted">{meta}</p>}
          {job.snippet && <p className="mt-2 line-clamp-2 text-sm text-muted">{job.snippet}</p>}
          <p className="mt-2 text-xs text-muted">
            {job.source && <>via {job.source}</>}
            {job.postedAt && <> · posted {new Date(job.postedAt).toLocaleDateString("en-MY")}</>}
          </p>
        </div>
        <SaveJobButton
          saved={saved}
          job={{
            id: job.id,
            title: job.title,
            company: job.company,
            location: job.location,
            url: job.url,
            source: job.source,
            salary: job.salary,
            postedAt: job.postedAt,
          }}
        />
      </div>
    </li>
  );
}
