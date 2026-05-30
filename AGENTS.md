# ATB Formular CDOS — Agent Guide

## Project Overview
Anonymous survey system at [atbbrasov.ro](https://atbbrasov.ro) for Universitatea Transilvania din Brașov. Built with SvelteKit 5, Deno KV backend, deployed on Deno Deploy.

## Architecture
- **Runtime**: Deno (with npm:argon2, npm:@sveltejs/kit, npm:vite)
- **Database**: Deno KV (local `.db/local.db` for dev, cloud KV for prod)
- **Email**: Gmail API via Google service account with domain-wide delegation
- **Auth**: HMAC-SHA256 verification tokens (stateless), Argon2 email hashing

## Key Decisions

### Email is optional
Users can opt out of providing an email. Answers are tagged with `verificationType`:
- `"no-email"` — fully anonymous, no email stored, no duplicate prevention
- `"email-not-verified"` — email provided, link not yet clicked
- `"email-verified"` — email provided and verified
- Future types: `"manually-verified"`, etc.

### Verification system
- Email verification uses a **service account JWT assertion** (RS256 via `crypto.subtle`), not OAuth2 refresh tokens
- No Sent folder leak (service account has no mailbox)
- Verification tokens are HMAC-SHA256, stateless (no KV storage)
- `HASH_SECRET` is shared between Argon2 (email hashing) and HMAC (tokens)

### Database schema (KV prefixes)
- `["answers", formId, answerId]` → `{ answerId, answers: Map, verificationType: string }`
- `["emails", formId, hashed_email]` → `{ answered: true }`
- `["sessions", sessionId]` → `{ email: string|null, answerId, formId, createdAt, lastActivity }`
- `["daily_counts", formId, YYYY-MM-DD]` → `{ count: number }`
- `["_migration", "schema_version"]` → `{ version: number }`

### Security model
- Email is Argon2-hashed with server secret + salt — one-way, cannot be reversed
- Email hash and answers are stored under different KV keys with no join key
- The only link between them is the HMAC verification token (temporary, stateless)
- Email is never passed via URL search params

## Code Conventions
- No comments in code (unless absolutely necessary)
- Romanian UI paths: `/succes`, `/sterge-date`, `/verificare`, `/politica-confidentialitate`
- Dev-only features gated by `import { dev } from "$app/environment"`
- Use `$lib/*` imports for server code
- Tailwind CSS v4 for styling

## Testing
Run with `deno test -A --unstable-kv --env-file .env`. Test files are in `tests/`.

## Common Commands
- `deno task dev` — start dev server
- `deno task check` — type-check
- `deno test -A --unstable-kv --env-file .env` — run tests
