"use client";

import { useState, useTransition } from "react";
import { saveJob, type SaveJobInput } from "@/app/search/actions";

export function SaveJobButton({ job, saved }: { job: SaveJobInput; saved: boolean }) {
  const [isSaved, setIsSaved] = useState(saved);
  const [failed, setFailed] = useState(false);
  const [pending, startTransition] = useTransition();

  if (isSaved) {
    return <span className="text-sm text-accent">Saved</span>;
  }

  return (
    <button
      className="btn-ghost"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const res = await saveJob(job).catch(() => ({ ok: false }));
          setFailed(!res.ok);
          if (res.ok) setIsSaved(true);
        })
      }
    >
      {pending ? "Saving…" : failed ? "Retry save" : "Save"}
    </button>
  );
}
