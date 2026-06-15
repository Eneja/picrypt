# Picrypt

Encrypted one-time-style links that look like innocent photo URLs. Clicking a link shows a procedurally generated cover image. Pasting the full link on Picrypt decrypts the message in your browser — the key never leaves the URL fragment.

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy environment variables:

   ```bash
   cp .env.local.example .env.local
   ```

3. Create a [Supabase](https://supabase.com) project and run the migration in [`supabase/migrations/001_drops.sql`](supabase/migrations/001_drops.sql) via the SQL editor.

4. Set these values in `.env.local`:

   - `NEXT_PUBLIC_APP_URL` — e.g. `http://localhost:3000` locally
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY` (server only — never expose to the client)

5. Start the dev server:

   ```bash
   npm run dev
   ```

## Usage

1. **Create** — enter a message, pick an expiry (1 / 7 / 30 days), and copy the generated link.
2. **Share** — send the link via email, text, or social. Recipients see a photo when they click.
3. **Unlock** — paste the full link (including `#...`) on the home page to read the message.

## Deploy (Vercel)

1. Push this repo to GitHub.
2. Import the project in [Vercel](https://vercel.com).
3. Add the same environment variables in the Vercel project settings.
4. Set `NEXT_PUBLIC_APP_URL` to your production domain.

## Security notes

- The server stores ciphertext only; the AES key lives in the URL fragment (`#...`).
- Link preview bots fetch without the fragment and see only the cover image.
- Do not use URL shorteners — they may strip the fragment.
- Copy the full link, not "copy image address".
