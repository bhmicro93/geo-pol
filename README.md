# Geo/Cyber Intelligence Agent (Vercel-ready)

Minimal Next.js App Router project. Serverless API routes hit free OSINT endpoints and use OpenAI for synthesis.
Exports Word (.docx) and Excel (.xlsx).

## Deploy on Vercel
1. Create a new GitHub repo and push this folder.
2. Import the repo on Vercel.
3. Set Environment Variables:
   - `OPENAI_API_KEY` — from https://platform.openai.com/api-keys
4. Deploy.

## Local Dev
```bash
pnpm i   # or npm i / yarn
pnpm dev # http://localhost:3000
```

## Notes
- Free data: GDELT 2.0, NVD, CISA KEV, OpenAlex.
- No keys required for those free sources.
- Knowledge graph rendered client-side with `vis-network`.
- Report and entity/relations generated via OpenAI (serverless function, secured by env var).
