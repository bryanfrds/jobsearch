import "server-only";
import { auth } from "@clerk/nextjs/server";

// Call at the top of every page and server action that touches user data.
// Signed-out visitors are redirected to sign in; the returned id scopes
// every query to the current user.
export async function requireUserId(): Promise<string> {
  const { userId } = await auth.protect();
  return userId;
}
