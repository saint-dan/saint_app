# Saint App - AI System Instructions

## Project Overview
- **Purpose:** A premium, company-wide application designed for use by different stakeholders and roles (currently: Admin, Subcontractor, Contracts Manager). The app provides tailored dashboards and functionality depending on the user's role.
- **Tech Stack:** Next.js (App Router), TypeScript, React, Tailwind CSS, Supabase (Database/Auth), Vercel (Hosting).
- **Versioning Logic:** Node.js LTS (>= 18.x) and Next.js 14+. Strict adherence to package versions defined in the lockfile (`package.json`); do not introduce new major dependencies without explicit instruction.

## Current Status & Active Milestones
- **Current Phase:** Admin Workflows & PDF Generation.
- **Recently Completed:** Photo Evidence Uploads (with browser-based compression & fullscreen viewer), Dynamic DB-driven Checklist Response Types, Digital Signature Capture with dynamic signees, Real Dashboard Metrics, View/Resume Inspections List, Custom UI Modals, 1200px Layout Standardization.
- **Next Up:** (Update this regularly) Admin workflow to view and verify pending Subcontractors, and generating PDF reports for completed Site Inspections.

## Directory Map
```text
/
├── actions.ts            # Server actions (e.g., auth functions: login, signup, logout)
├── blueprint.md          # AI System Instructions & context
├── package.json          # Project metadata, dependencies, and script shortcuts
└── src/
    ├── app/              # Next.js App Router (pages, layouts, API routes)
    ├── components/       # Reusable UI and functional components
    │   ├── features/     # Feature-specific components (e.g., SubcontractorForm)
    │   └── ui/           # Generic/Atomic UI components (buttons, inputs)
    ├── lib/              # Shared libraries, configurations, and helpers
    ├── types/            # Global TypeScript definitions
    │   └── database.types.ts # Auto-generated Supabase schema ground truth
    └── utils/
        └── supabase/     # Supabase clients (server.ts, client.ts, middleware.ts)
```

## Strict Coding Conventions & Standards
- **Directory Structure:** Using the `src/` directory. All Next.js pages go inside `src/app/`.
- **File-Level Documentation:** Add a standardized file-level comment block (JSDoc style) at the top of every `page.tsx` file detailing the `Route` and `Description`. This prevents AI context confusion and ensures code is placed in the correct file.
- **Component Composition & RSC:** Leverage React Server Components (RSC) by default for data fetching to eliminate client-side loading spinners. Use `'use client'` strictly for interactive boundary components (e.g., dropdowns, form interactions).
- **Separation of Concerns:** Keep page controllers clean by delegating UI logic to specialized sub-components (e.g., `AdminView`, `SubcontractorView`, `DashboardHeader`).
- **Authentication:** Cookie-based Authentication using Supabase.
- **Database:** Supabase. The initialized clients for server (`server.ts`) and client (`client.ts`) are located in `src/utils/supabase/`.
- **TypeScript:** Configured with modern Next.js settings (`"moduleResolution": "bundler"`). Avoid generating TS files that rely on deprecated `node10` resolution. Always import database types from `src/types/database.types.ts` to ensure strict type safety.
- **AI Instructions:** Write DRY (Don't Repeat Yourself) code, strictly type all arguments and return values, use modern ES6+ syntax, and do not make assumptions about missing database tables—ask first. ALWAYS read `src/types/database.types.ts` to understand the current database schema before writing queries or Supabase mutations.

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
- **Layout Constraints:** Standardize page and header constraints using `w-full max-w-[1200px] mx-auto`. This ensures a premium, contained feel on ultra-wide monitors while fluidly filling normal screens.
- **Modals & Alerts:** Do not use native browser `window.confirm` or `alert`. Always implement custom, app-styled React modals with backdrop blurs (`bg-slate-900/40 backdrop-blur-sm`) to maintain a cohesive, high-end aesthetic.
- **Primary Actions:** Standardize primary action and submit buttons to use a blue gradient (`bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white`).
- **Interactions:** Smooth micro-interactions, elegant hover states on buttons/inputs, subtle animations, and intuitive feedback.
- **Experience:** Fully responsive design that ensures an excellent layout and user experience on both mobile and desktop views. Fast performance and optimized loading are essential.

## Database Ground Truth & Schema Reference
**CRITICAL AI INSTRUCTION:** Always refer to `src/types/database.types.ts` as the absolute source of truth for the database schema, tables, and relationships. It is auto-generated directly from the Supabase project.