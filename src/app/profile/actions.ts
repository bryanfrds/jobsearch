"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db";
import { profiles } from "@/db/schema";
import { requireUserId } from "@/lib/auth";
import { PROFILE_MAX } from "@/lib/limits";

const LABELS = {
  fullName: "Name",
  headline: "Headline",
  location: "Preferred location",
  desiredRoles: "Roles you want",
  skills: "Skills",
} as const;

const field = (k: keyof typeof PROFILE_MAX) =>
  z.string().trim().max(PROFILE_MAX[k], `${LABELS[k]} is too long (max ${PROFILE_MAX[k]} characters).`);

const profileInput = z.object({
  fullName: field("fullName"),
  headline: field("headline"),
  location: field("location"),
  desiredRoles: field("desiredRoles"),
  skills: field("skills"),
});

export type ProfileValues = z.infer<typeof profileInput>;

// `values` echoes what was submitted so the form can keep it after an error.
export type ProfileState = {
  status: "idle" | "saved" | "error";
  message?: string;
  values?: Partial<Record<keyof ProfileValues, string>>;
};

export async function saveProfile(_prev: ProfileState, formData: FormData): Promise<ProfileState> {
  const userId = await requireUserId();
  const submitted = Object.fromEntries(
    Object.keys(LABELS).map((k) => [k, String(formData.get(k) ?? "")]),
  );
  const parsed = profileInput.safeParse(submitted);
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message, values: submitted };
  }

  const values = { ...parsed.data, updatedAt: new Date() };
  try {
    await getDb()
      .insert(profiles)
      .values({ userId, ...values })
      .onConflictDoUpdate({ target: profiles.userId, set: values });
  } catch {
    return { status: "error", message: "Couldn't save right now. Try again.", values: submitted };
  }

  revalidatePath("/profile");
  revalidatePath("/search");
  return { status: "saved", values: parsed.data };
}
