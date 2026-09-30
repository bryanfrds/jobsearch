import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { SignInButton } from "@clerk/nextjs";

export default async function Home() {
  const { userId } = await auth();
  if (userId) redirect("/search");

  return (
    <section className="mx-auto max-w-xl py-16 text-center">
      <h1 className="text-3xl font-semibold tracking-tight">Every Malaysian job listing, one search.</h1>
      <p className="mt-4 text-muted">
        Search JobStreet, LinkedIn, Indeed, Hiredly and company career pages at once. Save the
        jobs you like and track where you&apos;ve applied.
      </p>
      <div className="mt-8">
        <SignInButton mode="modal">
          <button className="btn">Sign in to start</button>
        </SignInButton>
      </div>
    </section>
  );
}
