Supabase setup for Imagyn frontend

1) Create a new Supabase project (or use existing) — you already provided project id: qimnoborlqjpdnnapqmu
   - URL: https://qimnoborlqjpdnnapqmu.supabase.co

2) Obtain API keys (do NOT share service_role in public):
   - Go to https://app.supabase.com and sign in to your account.
   - Select your project (qimnoborlqjpdnnapqmu).
   - Settings → API.
   - Copy the `anon` (public) key and paste into `web_wrapper/frontend-react/.env` as `VITE_SUPABASE_ANON_KEY`.
   - Do NOT put the `service_role` key into client-side `.env`. The `service_role` key grants full database access and must be kept secret on a server.

3) Create the database tables
   - Open the SQL editor in the Supabase dashboard for the project.
   - Run the SQL in `ai_platform/database_schema.sql` (this repository includes the schema file).
   - Confirm tables `users`, `plans`, `jobs`, `images`, `transactions` exist.

4) Storage bucket
   - In Supabase Dashboard → Storage, create a bucket named `images` (or change `VITE_SUPABASE_STORAGE_BUCKET` in `.env`).
   - Configure the bucket's public/file policies as you need. The frontend code uses the anon key to upload images; for that to work you must allow uploads from authenticated users or anonymous uploads depending on your security choices.

5) Keys & Security
   - If you've accidentally committed keys (I noticed `ai_platform/backend/.env` in this repo includes Supabase keys), rotate them now: open project Settings → API → Generate new keys.
   - Keep `service_role` only on a server (e.g., a small Node/Express endpoint or Supabase Function). Do not put it into the React client.

6) Client configuration
   - Create `web_wrapper/frontend-react/.env` from `.env.example` and fill `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, and optionally `VITE_SUPABASE_STORAGE_BUCKET`.

7) Optional: Server-side metadata writes
   - If you want the app to insert rows into `images` with `user_id` set and RLS policies enforced, either:
     - Use Supabase Auth in the frontend (let users sign in) so the anon key can insert rows owned by the user, or
     - Create a small server endpoint (Node/Express or Supabase Edge Function) that uses the `service_role` key to perform privileged inserts. I can scaffold that if you want.

If you want, paste the `anon` key into `.env` locally and I will finish wiring uploads and metadata. I will not accept or use any email/password credentials.
