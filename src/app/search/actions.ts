"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db";
import { savedJobs } from "@/db/schema";
import { requireUserId } from "@/lib/auth";

const jobInput = z.object({
  id: z.string().min(1).max(200),
  title: z.string().min(1).max(300),
  company: z.string().max(200),
  location: z.string().max(200),
  url: z.url({ protocol: /^https?$/ }).max(8000),
  source: z.string().max(100),
  salary: z.string().max(100),
  postedAt: z.iso.datetime({ offset: true }).nullable(),
});

export type SaveJobInput = z.infer<typeof jobInput>;

export type SaveJobResult = { ok: true } | { ok: false; retryable: boolean };

export async function saveJob(input: SaveJobInput): Promise<SaveJobResult> {
  const userId = await requireUserId();
  const job = jobInput.safeParse(input);
  if (!job.success) return { ok: false, retryable: false };
  const postedAt = job.data.postedAt ? new Date(job.data.postedAt) : null;

  try {
    await getDb()
      .insert(savedJobs)
      .values({
        userId,
        jobId: job.data.id,
        title: job.data.title,
        company: job.data.company,
        location: job.data.location,
        url: job.data.url,
        source: job.data.source,
        salary: job.data.salary,
        postedAt: postedAt && !isNaN(postedAt.getTime()) ? postedAt : null,
      })
      .onConflictDoNothing({ target: [savedJobs.userId, savedJobs.jobId] });
  } catch {
    return { ok: false, retryable: true };
  }

  revalidatePath("/jobs");
  return { ok: true };
}
