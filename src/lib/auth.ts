import "server-only";
import { auth } from "@clerk/nextjs/server";

// The proxy already blocks signed-out visitors; this is the per-query guard
// so no data access ever runs without a user id to scope it to.
export async function requireUserId(): Promise<string> {
  const { userId } = await auth();
  if (!userId) throw new Error("Not signed in");
  return userId;
}
