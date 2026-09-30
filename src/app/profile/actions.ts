"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db";
import { profiles } from "@/db/schema";
import { requireUserId } from "@/lib/auth";

const profileInput = z.object({
  fullName: z.string().trim().max(200),
  headline: z.string().trim().max(300),
  location: z.string().trim().max(100),
  desiredRoles: z.string().trim().max(500),
  skills: z.string().trim().max(2000),
});

export type ProfileState = { status: "idle" | "saved" | "error" };

export async function saveProfile(_prev: ProfileState, formData: FormData): Promise<ProfileState> {
  const userId = await requireUserId();
  const parsed = profileInput.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { status: "error" };

  const values = { ...parsed.data, updatedAt: new Date() };
  await getDb()
    .insert(profiles)
    .values({ userId, ...values })
    .onConflictDoUpdate({ target: profiles.userId, set: values });

  revalidatePath("/profile");
  revalidatePath("/search");
  return { status: "saved" };
}
