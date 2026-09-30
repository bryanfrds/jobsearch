"use client";

import { useActionState, useState } from "react";
import type { JobStatus } from "@/db/schema";
import { NOTES_MAX } from "@/lib/limits";
import { removeJob, updateJob, type JobActionState } from "./actions";

const initial: JobActionState = { error: null };

export function UpdateJobForm({
  id,
  status,
  notes,
  statuses,
}: {
  id: number;
  status: JobStatus;
  notes: string;
  statuses: { value: JobStatus; label: string }[];
}) {
  const [state, action, pending] = useActionState(updateJob, initial);
  // Controlled so a rejected submit doesn't reset what the user typed.
  const [currentStatus, setStatus] = useState(status);
  const [currentNotes, setNotes] = useState(notes);

  return (
    <form action={action} className="mt-3 grid gap-2 sm:grid-cols-[auto_1fr_auto]">
      <input type="hidden" name="id" value={id} />
      <select
        name="status"
        value={currentStatus}
        onChange={(e) => setStatus(e.target.value as JobStatus)}
        className="input w-auto"
      >
        {statuses.map((s) => (
          <option key={s.value} value={s.value}>{s.label}</option>
        ))}
      </select>
      <input
        name="notes"
        value={currentNotes}
        onChange={(e) => setNotes(e.target.value)}
        maxLength={NOTES_MAX}
        placeholder="Notes (recruiter, interview date…)"
        className="input"
      />
      <button className="btn-ghost" disabled={pending}>{pending ? "Saving…" : "Update"}</button>
      {state.error && <p className="text-sm text-red-600 sm:col-span-3">{state.error}</p>}
    </form>
  );
}

export function RemoveJobForm({ id }: { id: number }) {
  const [state, action, pending] = useActionState(removeJob, initial);
  return (
    <form action={action} className="flex items-center gap-2">
      {state.error && <span className="text-red-600">{state.error}</span>}
      <input type="hidden" name="id" value={id} />
      <button className="hover:text-foreground hover:underline" disabled={pending}>
        {pending ? "Removing…" : "Remove"}
      </button>
    </form>
  );
}
