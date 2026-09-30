"use server";

import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db";
import { jobStatus, savedJobs } from "@/db/schema";
import { requireUserId } from "@/lib/auth";

const id = z.coerce.number().int().positive();

// Every write is scoped to the signed-in user, so one person can't edit
// another's saved job by guessing its id.
function ownJob(userId: string, jobRowId: number) {
  return and(eq(savedJobs.id, jobRowId), eq(savedJobs.userId, userId));
}

export async function updateJob(formData: FormData) {
  const userId = await requireUserId();
  const parsed = z
    .object({
      id,
      status: z.enum(jobStatus.enumValues),
      notes: z.string().max(5000),
    })
    .safeParse(Object.fromEntries(formData));
  if (!parsed.success) return;

  await getDb()
    .update(savedJobs)
    .set({ status: parsed.data.status, notes: parsed.data.notes, updatedAt: new Date() })
    .where(ownJob(userId, parsed.data.id));
  revalidatePath("/jobs");
}

export async function removeJob(formData: FormData) {
  const userId = await requireUserId();
  const parsed = id.safeParse(formData.get("id"));
  if (!parsed.success) return;

  await getDb().delete(savedJobs).where(ownJob(userId, parsed.data));
  revalidatePath("/jobs");
}
