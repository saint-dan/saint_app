# Contractor App - AI System Instructions

## Project Overview
- **Purpose:** A premium Contractor App for managing contractors. The current phase focuses on a robust contractor registration feature, with additional features (scheduling, invoicing, etc.) to be added later.
- **Tech Stack:** Next.js (App Router), TypeScript, React, Tailwind CSS, Supabase (Database/Auth), Vercel (Hosting).

## Architecture & Standards
- **Directory Structure:** Using the `src/` directory. All Next.js pages go inside `src/app/`. Authenticated pages are wrapped in an `(authenticated)` route group to share the `TopNavbar` and server-side protection.
- **Component Composition & RSC:** Leverage React Server Components (RSC) by default for data fetching to eliminate client-side loading spinners. Use `'use client'` strictly for interactive boundary components (e.g., dropdowns, form interactions).
- **Separation of Concerns:** Keep page controllers clean by delegating UI logic to specialized sub-components (e.g., `AdminView`, `ContractorView`, `TopNavbar`).
- **Authentication:** Cookie-based Authentication using Supabase.
- **Database:** Supabase. The initialized clients for server (`server.ts`) and client (`client.ts`) are located in `src/utils/supabase/`.
- **TypeScript:** Configured with modern Next.js settings (`"moduleResolution": "bundler"`). Avoid generating TS files that rely on deprecated `node10` resolution.

## Security
- **No Hardcoded Secrets:** NEVER hardcode Supabase URLs, Anon Keys, or Database Passwords in code or workspace files.
- **Environment Variables:** Always use `process.env.NEXT_PUBLIC_SUPABASE_URL` and `process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY`. Locally, these are in `.env.local`. In production, they are configured in Vercel.

## Local Development
- **Starting the Server:** Open your terminal in the project root and run `npm run dev` (or `pnpm dev` / `yarn dev`).
- **Viewing the App:** Once the development server starts, open your web browser and navigate to http://localhost:3000 to view the app locally.
- **Hot Reloading:** Next.js supports Fast Refresh, meaning the app will automatically update in the browser as you save changes to your files.

## Development Environment Quirks (IMPORTANT)
- **Google Drive Git Locks:** This project is hosted inside a Google Drive synced folder. Google Drive frequently locks `.git` files, causing `Deletion of directory '.git/objects/...' failed` errors. 
  - *Solution:* Pause Google Drive syncing before performing Git commits/pushes, or rely solely on GitHub for version control backup.
- **Large Files / `node_modules`:** `node_modules` and Next.js build outputs (`.next`) must ALWAYS remain in `.gitignore`. Pushing these to GitHub will cause repository rejection due to file size limits.

## Design & UI/UX Guidelines
- **Aesthetics:** Premium feel with clean spacing, gradient backgrounds, and a consistent, high-quality color palette.
- **Typography:** Thoughtful typography for hierarchy and readability.
- **Components & Styling:** Consistent UI components with depth (subtle shadows, rounded-2xl or rounded-3xl corners).
- **Interactions:** Smooth micro-interactions, elegant hover states on buttons/inputs, subtle animations, and intuitive feedback.
- **Experience:** Fully responsive design that ensures an excellent layout and user experience on both mobile and desktop views. Fast performance and optimized loading are essential.

## Database Schema Reference
Currently planned tables (to be expanded):
1. `users`:
   - `id` (uuid, primary key)
   - `first_name` (text)
   - `last_name` (text)
   - `email` (text, unique)
   - `phone` (text)
   - `role_id` (uuid, foreign key to roles.id)
   - `primary_location_id` (uuid, foreign key to locations.id)
   - `status` (text, e.g., 'Pending', 'Active')
   - `created_at` (timestamp)

2. `roles`:
   - `id` (uuid, primary key)
   - `name` (text, unique)
   - `description` (text)
   - `created_at` (timestamp)

3. `locations`:
   - `id` (uuid, primary key)
   - `name` (text)
   - `netsuite_id` (text)
   - `is_active` (boolean, default: true)
   - `created_at` (timestamp)