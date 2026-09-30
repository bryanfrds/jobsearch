# JobSearch

Search Malaysian job listings from JobStreet, LinkedIn, Indeed, Hiredly and company
career pages in one place, save the ones you like, and track where you've applied.
Each person signs in and only sees their own profile and saved jobs.

- **Next.js 16** on Vercel
- **Clerk** for sign-in
- **Postgres** (Neon in production) via Drizzle
- **JSearch** by OpenWeb Ninja for listings (Google for Jobs, `country=my`)

## Setup

1. `npm install`
2. Create `.env.local`:

   ```
   DATABASE_URL=postgres://...
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
   CLERK_SECRET_KEY=sk_test_...
   JSEARCH_API_KEY=...
   # Optional: JSEARCH_MOCK=1 shows sample listings when there's no API key
   ```

3. `npm run db:migrate`
4. `npm run dev`

## Changing the database

Edit `src/db/schema.ts`, then `npm run db:generate` and `npm run db:migrate`.

## Notes

- Search results are cached for an hour per query to stay within the JSearch quota.
- Set Clerk sign-ups to **Restricted** so only invited friends can join; every
  search costs API quota.
