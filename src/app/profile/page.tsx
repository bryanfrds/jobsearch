import { eq } from "drizzle-orm";
import { db } from "@/db";
import { profiles } from "@/db/schema";
import { requireUserId } from "@/lib/auth";
import { ProfileForm } from "./profile-form";

export default async function ProfilePage() {
  const userId = await requireUserId();
  const [profile] = await db.select().from(profiles).where(eq(profiles.userId, userId));

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Profile</h1>
      <p className="text-sm text-muted">Only you can see this. Your roles become one-click searches.</p>
      <ProfileForm profile={profile} />
    </div>
  );
}
