"use client";

import { useActionState } from "react";
import type { Profile } from "@/db/schema";
import { saveProfile, type ProfileState } from "./actions";

const FIELDS = [
  { name: "fullName", label: "Name", placeholder: "Your name" },
  { name: "headline", label: "Headline", placeholder: "e.g. Final-year CS student at UM" },
  { name: "location", label: "Preferred location", placeholder: "e.g. Kuala Lumpur" },
  { name: "desiredRoles", label: "Roles you want", placeholder: "Comma separated, e.g. Frontend Developer, Data Analyst" },
] as const;

export function ProfileForm({ profile }: { profile: Profile | undefined }) {
  const [state, action, pending] = useActionState<ProfileState, FormData>(saveProfile, { status: "idle" });

  return (
    <form action={action} className="space-y-4 rounded-lg border border-border bg-surface p-4">
      {FIELDS.map((f) => (
        <label key={f.name} className="block space-y-1 text-sm">
          <span className="font-medium">{f.label}</span>
          <input name={f.name} defaultValue={profile?.[f.name] ?? ""} placeholder={f.placeholder} className="input" />
        </label>
      ))}
      <label className="block space-y-1 text-sm">
        <span className="font-medium">Skills</span>
        <textarea
          name="skills"
          defaultValue={profile?.skills ?? ""}
          placeholder="e.g. React, SQL, Excel, Bahasa Malaysia"
          rows={3}
          className="input"
        />
      </label>
      <div className="flex items-center gap-3">
        <button className="btn" disabled={pending}>{pending ? "Saving…" : "Save profile"}</button>
        {state.status === "saved" && <span className="text-sm text-accent">Saved</span>}
        {state.status === "error" && <span className="text-sm text-red-600">Couldn&apos;t save. Check the fields.</span>}
      </div>
    </form>
  );
}
