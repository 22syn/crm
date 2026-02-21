---
name: debug-from-ticket
description: Investigate a support or bug ticket by extracting ticket data, fetching Langfuse session/trace info, querying gcloud logs, identifying root cause, and proposing a fix plus PR command. Use when the user asks to investigate, debug, or handle a ticket by number (e.g. "חקור טיקט 442", "debug ticket #123").
---

# Debug from Ticket → Fix → PR

Follow this flow when the user provides a **ticket id** (and optionally ticket body or source) and wants investigation and a fix.

## 1. Extract ticket information

- **Ticket id**: number or key (e.g. 442, TICKET-123, #442).
- **Title / summary**: short description.
- **Body**: full description; look for:
  - `session_id`, `session id`, `trace_id`, `trace id`
  - `user_id`, `user id`, customer id
  - Timestamp, date, "היה אתמול", "at 14:00"
  - Error message, stack trace, screenshot description
  - Service/product name, environment (staging/prod)
- **Labels / project**: if known (e.g. Linear project, Jira component) use to choose which service/repo and which Langfuse project.

If the user only gave a ticket number, ask for the ticket body or fetch it (e.g. Linear/Jira/GitHub API) if the project has credentials configured.

## 2. Choose debug context (skill / service)

- If the ticket or repo has a mapping of "label/project → repo + Langfuse + GCP", use it.
- Otherwise assume a single backend service and one Langfuse project; use env or config for URLs/keys.

## 3. Langfuse – session and trace

- **Input**: `session_id` or `trace_id` from the ticket (or from logs).
- **Credentials**: Prefer env vars, e.g. `LANGFUSE_PUBLIC_KEY`, `LANGFUSE_SECRET_KEY`, and optionally `LANGFUSE_HOST` (default: cloud).
- **Actions**:
  - Fetch trace(s) for the session/trace id via Langfuse API (e.g. GET trace by id, or list traces filtered by session).
  - Extract: model, inputs/outputs, latency, errors, span hierarchy. Correlate with the time from the ticket.
- **Output**: Short summary (e.g. "Trace X failed at step Y with error Z; input was …"). If no session/trace id, skip and rely on logs.

Reference: [Langfuse API](https://langfuse.com/docs/api).

## 4. gcloud – logs

- **Input**: Time range (from ticket or "last 1h" around the timestamp), optional service name / severity.
- **Auth**: User must have `gcloud` installed and be logged in (`gcloud auth application-default login` or similar).
- **Suggested command shape** (adjust project and filter):

```bash
# Replace PROJECT_ID and filter as needed (e.g. severity, resource, timestamp)
gcloud logging read '
  timestamp >= "2025-02-17T00:00:00Z"
  AND timestamp <= "2025-02-17T23:59:59Z"
' \
  --project=PROJECT_ID \
  --limit=100 \
  --format="table(timestamp,severity,textPayload)"
```

- **Filters**: Add by `resource.type`, `severity`, or text in `textPayload`/`jsonPayload` when the ticket gives hints (e.g. error message, user id).
- **Output**: Relevant log lines; link to commit/deploy if logs mention version or commit.

## 5. Root cause and fix

- **Summarize**: "הנה הבעיה: …" / "Root cause: …" – e.g. specific commit, wrong config, bad input, bug in code path X.
- **Propose fix**: Concrete change (file + snippet or config change). Prefer minimal change.
- **Do not open a PR yourself.** Provide the exact command(s) for the user to create a branch, commit, and open PR.

## 6. PR command (user runs after approval)

Give the user a single block they can run (after they applied the fix and are satisfied):

```bash
# Replace TICKET_ID and title/body as needed
git checkout -b fix/TICKET-442
git add -A
git commit -m "fix: short description (TICKET-442)"
gh pr create --title "Fix: short description (TICKET-442)" --body "Fixes TICKET-442. Root cause: …"
```

Or point to a project script, e.g. `./scripts/open-fix-pr.sh 442 "fix: dashboard 500 for session abc"`.

## Env / config (per project)

- **Langfuse**: `LANGFUSE_PUBLIC_KEY`, `LANGFUSE_SECRET_KEY`, `LANGFUSE_HOST` (optional).
- **GCP**: `GCP_PROJECT` or use `gcloud config get-value project`; user must be logged in.
- **Ticket source**: If using Linear/Jira/GitHub API, document the env vars (e.g. `LINEAR_API_KEY`) in a local `reference.md` or in the project README so the agent can fetch ticket body when only the id is given.

## Optional: reference.md

In this skill folder you can add `reference.md` with:
- Langfuse API examples (curl or fetch) for your project.
- Per-service GCP project ids and log filter examples.
- Ticket source API (Linear/Jira/GitHub) and how to map ticket id → session/trace id.

Keep SKILL.md short; move long examples to reference.md.
