# Picrypt

Encrypted one-time-style links that look like innocent photo URLs. Clicking a link shows a procedurally generated cover image. Pasting the full link on Picrypt decrypts the message in your browser — the key never leaves the URL fragment.

Access to the Picrypt app (create and unlock) requires signing in and admin approval. Shared photo links (`/i/...`) remain public.

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy environment variables:

   ```bash
   cp .env.local.example .env.local
   ```

3. Create a [Supabase](https://supabase.com) project and run the migrations via the SQL editor:

   - [`supabase/migrations/001_drops.sql`](supabase/migrations/001_drops.sql)
   - [`supabase/migrations/002_profiles.sql`](supabase/migrations/002_profiles.sql)

4. Enable email auth in Supabase: **Authentication → Providers → Email** (enabled by default).

5. Set these values in `.env.local`:

   - `NEXT_PUBLIC_APP_URL` — e.g. `http://localhost:3000` locally
   - `NEXT_PUBLIC_SUPABASE_URL` — Project URL from Supabase **Settings → API**
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` — **anon** public key from Supabase **Settings → API**
   - `SUPABASE_URL` — same Project URL
   - `SUPABASE_SERVICE_ROLE_KEY` — **service_role** key (server only)
   - `ADMIN_EMAIL` — your email; auto-approved as admin on sign-in (optional)

6. Add your site URL in Supabase **Authentication → URL Configuration**:

   - **Site URL:** `http://localhost:3000` (or your production domain)
   - **Redirect URLs:** `http://localhost:3000/auth/callback` and your production callback URL

7. Start the dev server:

   ```bash
   npm run dev
   ```

8. Sign in with `ADMIN_EMAIL` or manually promote your account in Supabase:

   ```sql
   update profiles
   set status = 'approved', role = 'admin', approved_at = now()
   where email = 'you@example.com';
   ```

## Usage

1. **Sign up** — new accounts start as **pending** until an admin approves them.
2. **Sign in** — approved users can create and unlock links.
3. **Admin portal** — admins open `/admin` to approve, reject, or promote users.
4. **Create** — enter a message, pick an expiry (1 / 7 / 30 days), and copy the generated link.
5. **Share** — send the link via email, text, or social. Recipients see a photo when they click.
6. **Unlock** — sign in and paste the full link (including `#...`) on the home page to read the message.

## Deploy (Vercel)

1. Push this repo to GitHub.
2. Import the project in [Vercel](https://vercel.com).
3. Add all environment variables from `.env.local.example` in the Vercel project settings.
4. Set `NEXT_PUBLIC_APP_URL` to your production domain.
5. Add the production callback URL in Supabase: `https://your-domain.com/auth/callback`.

## Security notes

- The server stores ciphertext only; the AES key lives in the URL fragment (`#...`).
- Link preview bots fetch without the fragment and see only the cover image.
- Do not use URL shorteners — they may strip the fragment.
- Copy the full link, not "copy image address".
- New sign-ups are pending until an admin approves them at `/admin`.
