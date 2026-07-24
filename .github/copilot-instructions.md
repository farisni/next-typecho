# Next Typecho workspace instructions

## Setup checklist

- [x] Clarify project requirements
- [x] Scaffold the Next.js project
- [x] Customize the application architecture
- [x] Install required dependencies
- [x] Initialize and seed the SQLite database
- [x] Run lint and diagnostics
- [x] Create and run the development task
- [x] Verify documentation and application routes

## Engineering conventions

- Use Next.js App Router, TypeScript strict mode, Tailwind CSS, Drizzle Schema, and Node.js built-in SQLite.
- Default to Server Components. Add `"use client"` only for browser interaction such as live Markdown preview.
- Keep database reads in `src/lib/repositories`; use Server Actions for mutations.
- Validate every server-side mutation with Zod.
- Keep Markdown source in the database and render it through the shared sanitized component.
- Keep file storage behind the `ImageStorage` interface so local storage can later be replaced by object storage.
- Store opaque authentication tokens in cookies and only their SHA-256 hashes in SQLite; authorize every admin mutation in its Server Action.
- Preserve the first-run installer state machine and write `installation_state` last in the same transaction as the first administrator and defaults.
- Add concise Chinese comments for non-obvious Next.js data-flow concepts.
- Use pnpm and preserve `pnpm-lock.yaml`; do not copy dependencies from other projects.
- Do not create Git commits unless explicitly requested.
- Preserve the layered `/admin` protection: optimistic Proxy check, database verification in the admin layout, and authorization inside every Server Action.
- Keep runtime migrations idempotent because Server Component layouts and pages may render in parallel before an installation redirect completes.
- Keep executable themes in the typed built-in registry; persist only the active slug, validated configuration, and custom CSS in SQLite.
- Theme preview cookies must affect only an authenticated administrator session; never let preview state change the public active theme.
- Keep built-in React/TypeScript theme sources read-only in the web editor. Online edits are limited to validated `custom.css`, not executable application code.
- Bind profile and writing-preference reads and mutations to the administrator in the current verified session; never accept a user ID from profile forms.
