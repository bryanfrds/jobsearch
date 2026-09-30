import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { jobStatus, savedJobs, type JobStatus, type SavedJob } from "@/db/schema";
import { requireUserId } from "@/lib/auth";
import { RemoveJobForm, UpdateJobForm } from "./job-row-forms";

const STATUS_LABELS: Record<JobStatus, string> = {
  saved: "Saved",
  applied: "Applied",
  interview: "Interview",
  offer: "Offer",
  rejected: "Rejected",
};

export default async function JobsPage({ searchParams }: PageProps<"/jobs">) {
  const userId = await requireUserId();
  const { status } = await searchParams;
  const filter = jobStatus.enumValues.find((s) => s === status);

  const rows = await getDb()
    .select()
    .from(savedJobs)
    .where(eq(savedJobs.userId, userId))
    .orderBy(desc(savedJobs.updatedAt));

  const counts = Object.fromEntries(
    jobStatus.enumValues.map((s) => [s, rows.filter((r) => r.status === s).length]),
  ) as Record<JobStatus, number>;
  const shown = filter ? rows.filter((r) => r.status === filter) : rows;

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">My jobs</h1>
      <div className="flex flex-wrap gap-2 text-sm">
        <FilterLink href="/jobs" active={!filter} label={`All (${rows.length})`} />
        {jobStatus.enumValues.map((s) => (
          <FilterLink
            key={s}
            href={`/jobs?status=${s}`}
            active={filter === s}
            label={`${STATUS_LABELS[s]} (${counts[s]})`}
          />
        ))}
      </div>

      {shown.length === 0 ? (
        <p className="text-sm text-muted">
          {rows.length === 0 ? (
            <>
              Nothing saved yet. <Link href="/search" className="underline">Search for jobs</Link> and press Save.
            </>
          ) : (
            "No jobs with this status."
          )}
        </p>
      ) : (
        <ul className="space-y-3">
          {shown.map((job) => (
            <SavedJobCard key={job.id} job={job} />
          ))}
        </ul>
      )}
    </div>
  );
}

function FilterLink({ href, active, label }: { href: string; active: boolean; label: string }) {
  return (
    <Link
      href={href}
      className={active ? "rounded-md bg-accent px-3 py-1.5 text-accent-foreground" : "btn-ghost"}
    >
      {label}
    </Link>
  );
}

function SavedJobCard({ job }: { job: SavedJob }) {
  const meta = [job.company, job.location, job.salary].filter(Boolean).join(" · ");
  return (
    <li className="rounded-lg border border-border bg-surface p-4">
      <a href={job.url} target="_blank" rel="noopener noreferrer" className="font-medium hover:underline">
        {job.title}
      </a>
      <p className="text-sm text-muted">{meta}</p>
      <UpdateJobForm
        id={job.id}
        status={job.status}
        notes={job.notes}
        statuses={jobStatus.enumValues.map((s) => ({ value: s, label: STATUS_LABELS[s] }))}
      />
      <div className="mt-2 flex items-center justify-between text-xs text-muted">
        <span>
          {job.source && <>via {job.source} · </>}saved {job.createdAt.toLocaleDateString("en-MY")}
        </span>
        <RemoveJobForm id={job.id} />
      </div>
    </li>
  );
}
