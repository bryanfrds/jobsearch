"use client";

import { useState, useTransition } from "react";
import { saveJob, type SaveJobInput, type SaveJobResult } from "@/app/search/actions";

export function SaveJobButton({ job, saved }: { job: SaveJobInput; saved: boolean }) {
  const [isSaved, setIsSaved] = useState(saved);
  const [error, setError] = useState<"retry" | "invalid" | null>(null);
  const [pending, startTransition] = useTransition();

  if (isSaved) {
    return <span className="text-sm text-accent">Saved</span>;
  }
  if (error === "invalid") {
    return <span className="text-sm text-muted">Can&apos;t save this listing</span>;
  }

  return (
    <button
      className="btn-ghost"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const res: SaveJobResult = await saveJob(job).catch(() => ({ ok: false, retryable: true }));
          if (res.ok) setIsSaved(true);
          else setError(res.retryable ? "retry" : "invalid");
        })
      }
    >
      {pending ? "Saving…" : error === "retry" ? "Retry save" : "Save"}
    </button>
  );
}
