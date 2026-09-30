import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider, SignInButton, UserButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "JobSearch",
  description: "Search jobs across Malaysian job sites and track your applications.",
};

const NAV = [
  { href: "/search", label: "Search" },
  { href: "/jobs", label: "My jobs" },
  { href: "/profile", label: "Profile" },
];

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const { userId } = await auth();
  return (
    <ClerkProvider>
      <html
        lang="en"
        className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      >
        <body className="flex min-h-full flex-col font-sans">
          <header className="border-b border-border bg-surface">
            <nav className="mx-auto flex max-w-4xl items-center gap-4 px-4 py-3">
              <Link href="/" className="font-semibold">
                JobSearch
              </Link>
              {userId && (
                <div className="flex gap-3 text-sm text-muted">
                  {NAV.map((n) => (
                    <Link key={n.href} href={n.href} className="hover:text-foreground">
                      {n.label}
                    </Link>
                  ))}
                </div>
              )}
              <div className="ml-auto">
                {userId ? (
                  <UserButton />
                ) : (
                  <SignInButton mode="modal">
                    <button className="btn">Sign in</button>
                  </SignInButton>
                )}
              </div>
            </nav>
          </header>
          <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-6">{children}</main>
        </body>
      </html>
    </ClerkProvider>
  );
}
