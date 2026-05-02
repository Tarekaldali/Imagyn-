React + Tailwind frontend for Imagyn (converted from static HTML)

Quick start

1. cd web_wrapper/frontend-react
2. npm install
3. copy `.env.example` to `.env` and set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (see notes below)
4. `npm run dev`

Notes
- This app includes a client-side fallback image generator (Canvas) that will be used when your ComfyUI endpoint is not available.
- To enable ComfyUI, set `VITE_COMFYUI_URL` in `.env`.
- Do NOT commit real keys into the repo. Use environment variables or a secrets manager.

Supabase
- To create the required tables, run `ai_platform/database_schema.sql` in the Supabase SQL editor for the new project.
- To get API keys: open your Supabase project → Settings → API. Copy the anon/public key into `VITE_SUPABASE_ANON_KEY`. For server-only operations you will need the `service_role` key — do NOT put that in client-side `.env`.
