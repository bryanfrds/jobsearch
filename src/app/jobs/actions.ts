"use server";

import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db";
import { jobStatus, savedJobs } from "@/db/schema";
import { requireUserId } from "@/lib/auth";

import { NOTES_MAX } from "@/lib/limits";

const id = z.coerce.number().int().positive().max(2_147_483_647);

export type JobActionState = { error: string | null };

// Every write is scoped to the signed-in user, so one person can't edit
// another's saved job by guessing its id.
function ownJob(userId: string, jobRowId: number) {
  return and(eq(savedJobs.id, jobRowId), eq(savedJobs.userId, userId));
}

export async function updateJob(_prev: JobActionState, formData: FormData): Promise<JobActionState> {
  const userId = await requireUserId();
  const parsed = z
    .object({
      id,
      status: z.enum(jobStatus.enumValues),
      notes: z.string().max(NOTES_MAX, `Notes are too long (max ${NOTES_MAX} characters).`),
    })
    .safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input." };

  try {
    await getDb()
      .update(savedJobs)
      .set({ status: parsed.data.status, notes: parsed.data.notes, updatedAt: new Date() })
      .where(ownJob(userId, parsed.data.id));
  } catch {
    return { error: "Couldn't save. Try again." };
  }
  revalidatePath("/jobs");
  return { error: null };
}

export async function removeJob(_prev: JobActionState, formData: FormData): Promise<JobActionState> {
  const userId = await requireUserId();
  const parsed = id.safeParse(formData.get("id"));
  if (!parsed.success) return { error: "Invalid job." };

  try {
    await getDb().delete(savedJobs).where(ownJob(userId, parsed.data));
  } catch {
    return { error: "Couldn't remove. Try again." };
  }
  revalidatePath("/jobs");
  return { error: null };
}
