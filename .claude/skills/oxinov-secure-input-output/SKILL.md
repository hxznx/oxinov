---
name: oxinov-secure-input-output
description: Handle untrusted input and output safely in Oxinov - input validation at every boundary, output encoding, SQL and NoSQL injection, cross-site scripting (XSS), server-side request forgery (SSRF), path traversal, unsafe file uploads, open redirects, secure error handling, and sensitive data exposure. Use when code accepts input, renders user content, builds queries, fetches URLs, stores files, or returns errors.
---

# Secure input and output

Standard: [secure development standard](../../../docs/09-security/secure-development-standard.md). Related skills: oxinov-validation, oxinov-access-control.

## Input validation

- Validate at every boundary: HTTP (DTOs with `class-validator` behind the global `ValidationPipe`), configuration (startup), provider responses, files, and events.
- Allow-list: types, lengths (`@MaxLength`), ranges (`@Min`/`@Max`), enums, UUIDs (`ParseUUIDPipe`), formats. Reject; do not "clean up" and continue.
- The web form's checks are for the person's convenience; the API is the authority.

## Output encoding and XSS

- React escapes text by default. Never use `dangerouslySetInnerHTML` with user content; the existing uses are a fixed theme script and JSON-LD built from site data.
- User Markdown goes through `LessonMarkdown` (`react-markdown` without raw HTML, unsafe link protocols dropped). Do not add `rehype-raw` or similar.
- Links from users: only `http` and `https` (`safeSubmissionUrl`); external links get `rel="noopener noreferrer"`.
- Serve uploaded files from S3 with `Content-Disposition: attachment` (except the controlled PDF preview) and never accept HTML, SVG, or scripts.
- Gap: the web apps have no Content Security Policy yet; adding one is welcome and must be tested with sign-in and media playback.

## SQL and NoSQL injection

- Use Prisma queries, or tagged-template raw SQL (`$queryRaw\`...${value}\``) where parameters are bound.
- Never `$queryRawUnsafe`, `$executeRawUnsafe`, or string-built SQL; never interpolate identifiers or sort columns from input (map them from an allow-list).
- Oxinov uses no NoSQL database. If one is ever added, accept only typed values, reject objects where a string is expected (operator injection such as `{"$gt": ""}`), and use its query builder.

## SSRF

- The server fetches only configured hosts (identity, payment providers, S3). Never fetch a URL a user supplied.
- If a feature truly needs it (for example a link preview), it needs an ADR: allow-listed schemes and hosts, DNS resolution checked against private, loopback, and metadata ranges (`169.254.169.254`), no redirects, a timeout, and a size limit. Instance metadata is already blocked for most pods by network policy.

## Path traversal

- Never build file system paths from input. Storage keys are `tenants/<tenantId>/<kind>/<server UUID>/<safeFileName>`; `safeFileName` (`media/media-rules.ts`) keeps only letters, digits, `.`, `_`, and `-`, trims leading and trailing dots, and limits the length, so `../` and separators cannot survive.
- Never let a client choose an object key, bucket, or prefix.

## File uploads

1. Check the declared type against an allow-list and the size limit before issuing a presigned upload URL (`media-rules.ts`, `submission-files.ts`).
2. Presigned URLs are short-lived and bound to the key, type, and length.
3. After upload, check the stored size and the first bytes (magic numbers) against the declared type; delete on mismatch.
4. Store in the private bucket under the tenant prefix; serve through short-lived presigned URLs as attachments.
5. Gap: malware scanning before public sign-up is on the security roadmap (#3).

## Open redirects

Redirect only to same-site relative paths (`safeReturnTo`) or to configured provider URLs.

## Secure error handling

- Throw `Errors.*` with a stable code; `HttpExceptionFilter` returns `{ error: { code, message, requestId } }`.
- Stack traces, SQL, and internal messages go to server logs only (logged for 5xx).
- Missing and forbidden objects in other tenants both return 404.
- Validation errors list field problems, never internal values.

## Sensitive data exposure

- Return only the fields the caller needs, through output DTOs; never return a Prisma row directly when it has internal columns.
- Never return other users' emails, tokens, answers before grading, or provider secrets.
- Keep personal data out of URLs (they end up in logs and referrers).

## Tests to add

XSS payloads render as text; `javascript:` links are dropped; extra and malformed fields return 400; `../` in file names stays inside the tenant prefix; a disguised file is rejected; errors contain no stack or SQL.
