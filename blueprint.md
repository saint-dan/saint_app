# Saint App - AI System Instructions

## Project Overview
- **Purpose:** A premium, company-wide application designed for use by different stakeholders and roles (currently: Admin, Subcontractor, Contracts Manager). The app provides tailored dashboards and functionality depending on the user's role.
- **Tech Stack:** Next.js (App Router), TypeScript, React, Tailwind CSS, Supabase (Database/Auth), Vercel (Hosting).
- **Versioning Logic:** Node.js LTS (>= 18.x) and Next.js 14+. Strict adherence to package versions defined in the lockfile (`package.json`); do not introduce new major dependencies without explicit instruction.

## Current Status & Active Milestones
- **Current Phase:** Admin Workflows & PDF Generation.
- **Recently Completed:** Zapier Email Webhook Integration (Outlook sending), Photo Evidence Uploads (with browser-based compression & fullscreen viewer), Dynamic DB-driven Checklist Response Types, Digital Signature Capture with dynamic signees, Real Dashboard Metrics, View/Resume Inspections List, Custom UI Modals, 1200px Layout Standardization.

## Directory Map
```text
/
├── actions.ts            # Server actions (e.g., auth functions: login, signup, logout)
├── blueprint.md          # AI System Instructions & context
├── package.json          # Project metadata, dependencies, and script shortcuts
└── src/
    ├── app/              # Next.js App Router (pages, layouts, API routes)
    ├── components/       # Reusable UI and functional components
    │   ├── features/     # Feature-specific components 
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

## External Integrations & Email Standards
- **Email Strategy:** All outgoing emails are handled via **Zapier Webhooks** integrated with Microsoft Outlook. Do not implement direct SMTP or Nodemailer logic within Next.js.
- **Webhook Payload Standard:** Standardize Zapier JSON payloads to strictly use: `email` (recipient), `subject`, `htmlBody` (the fully formatted HTML message), and `attachments` (an array of URLs, e.g., `[pdfUrl]`).
- **Global Email Signature:** Always append the `GLOBAL_EMAIL_SIGNATURE` (imported from `src/components/emails/emailConfig.ts`) to the end of your constructed `htmlBody` string.
- **Email Templates:** Store all email templates as React components in `src/components/emails/`. Use `@react-email/components` and convert them to HTML strings using `render()` before passing them into webhook payloads. This ensures templates are easily found and visually consistent.
- **Environment Variables:** Never hardcode webhook URLs in code. Always use environment variables (e.g., `process.env.ZAPIER_WEBHOOK_URL_EMAILS`).

## User Management & Invitation Flow
- **Invite Process:** Admins invite new users from the Users dashboard. The backend uses the Supabase Admin `generateLink({ type: 'invite', ... })` API. This silently provisions the user account and generates a single-use "magic link".
- **Email Delivery:** The magic link (`action_link`) is embedded into a React Email template (`InviteUserEmail.tsx`), compiled to HTML, and sent to the user via the established Zapier Webhook flow.
- **Auth Callback:** When the user clicks the link, they are routed to `src/app/auth/callback/route.ts`. This API route securely exchanges the PKCE code for a session cookie and redirects the user to the application.
- **Forced Password Reset:** Newly invited users are created with a `force_password_reset` boolean flag set to `true` in the database. The authenticated layout (`src/app/(authenticated)/layout.tsx`) checks this flag and automatically forces the user to the `/update-password` page until they establish a secure permanent password.

## Security
- **No Hardcoded Secrets:** NEVER hardcode Supabase URLs, Anon Keys, Database Passwords, or external Webhook URLs (e.g., Zapier) in code or workspace files.
- **Environment Variables:** Always use `process.env.NEXT_PUBLIC_SUPABASE_URL` and `process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY`. For external integrations, use specific variables like `process.env.ZAPIER_WEBHOOK_URL_EMAILS`. Locally, these are in `.env.local`. In production, they are configured in Vercel.

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