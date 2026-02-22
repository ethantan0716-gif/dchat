# DChat

Personal chat app (web-first) built with Next.js, Prisma/Postgres, Auth.js (Google), and Pusher realtime.

## Quick start

1. Install Node.js 20+.
2. Install dependencies: `npm install`
3. Copy env template: `copy .env.example .env`
4. Fill env values in `.env`.
5. Generate Prisma client: `npm run prisma:generate`
6. Run migration: `npm run prisma:migrate -- --name init`
7. Start app: `npm run dev`
