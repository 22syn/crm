# Cursor MCP Setup: Supabase, GitHub, Vercel

This guide connects Cursor to Supabase, GitHub, and Vercel so the AI can manage development end-to-end.

## Quick start (Supabase + Vercel)

The project already has `.cursor/mcp.json` with Supabase and Vercel configured. To finish setup:

1. **Restart Cursor** completely.
2. **Supabase:** When prompted, click to log in via browser and grant access.
3. **Vercel:** Click "Needs login" when it appears and authorize.
4. Test: ask "List tables in the database using MCP" or "Show deployment status".

For GitHub (PRs, issues), see [Step 4](#step-4-github-mcp-pat-required) below.

## Overview

| Service  | MCP Server                | What the AI can do                                           |
|----------|---------------------------|--------------------------------------------------------------|
| Supabase | Supabase MCP (remote)     | Run SQL, list tables, apply migrations, deploy Edge Functions, generate types |
| GitHub   | GitHub MCP (remote)       | Manage PRs, create issues, search code, push branches       |
| Vercel   | Vercel MCP (remote)      | Inspect deployments, fetch logs, manage projects            |
| Git      | Built-in (`user-git`)    | Branch, commit, status (already available)                   |

**Vercel → DB:** Vercel connects to Supabase via environment variables in the Vercel dashboard (already covered). The AI uses Supabase MCP to manage the *database*; Vercel MCP helps inspect *deployments* that talk to that DB.

---

## Step 1: MCP configuration (done)

The project has `.cursor/mcp.json` with Supabase and Vercel. To add GitHub, append this block inside `mcpServers`:

```json
"github": {
  "url": "https://api.githubcopilot.com/mcp/",
  "headers": {
    "Authorization": "Bearer YOUR_GITHUB_PERSONAL_ACCESS_TOKEN"
  }
}
```

### Option: Vercel project-specific URL

If you want the AI to default to your hadaryaCRM project:

```json
"vercel": {
  "url": "https://mcp.vercel.com/YOUR_TEAM_SLUG/hadaryaCRM"
}
```

Find team slug: Vercel Dashboard → Team → Settings → General.

---

## Step 2: Supabase MCP (Auth)

1. Restart Cursor completely.
2. Cursor will prompt you to log in to Supabase (browser OAuth).
3. Grant access to your Supabase organization.
4. Verify: Settings → Tools & MCP → Supabase shows connected.

**Supabase MCP tools:** `execute_sql`, `list_tables`, `apply_migration`, `list_migrations`, `deploy_edge_function`, `get_logs`, `generate_typescript_types`, etc.

---

## Step 3: Vercel MCP (Auth)

1. After adding the config, Cursor shows "Needs login" for Vercel.
2. Click it and authorize with your Vercel account.
3. Verify: Settings → Tools & MCP → Vercel shows connected.

**Vercel MCP tools:** Analyze deployment logs, manage projects, search Vercel docs.

---

## Step 4: GitHub MCP (PAT required)

1. Create a GitHub Personal Access Token:
   - GitHub → Settings → Developer settings → Personal access tokens → Fine-grained (or classic)
   - Scopes: `repo`, `read:org` (and `workflow` if using GitHub Actions)
2. Replace `YOUR_GITHUB_PERSONAL_ACCESS_TOKEN` in `mcp.json` with your token.
3. Restart Cursor.
4. Verify: Settings → Tools & MCP → GitHub shows connected.

**Note:** Never commit the token. Add `.cursor/mcp.json` to `.gitignore` if it contains secrets, or use Cursor's global config at `~/.cursor/mcp.json` for the GitHub entry.

---

## Step 5: Keep secrets out of git

If `.cursor/mcp.json` contains your GitHub PAT:

1. Add to `.gitignore`:
   ```
   .cursor/mcp.json
   ```
2. Or move the GitHub server config to `~/.cursor/mcp.json` (global) and keep only Supabase + Vercel in the project's `.cursor/mcp.json`.

---

## Verification

Ask the AI in Composer:

- **Supabase:** "List all tables in the database using MCP"
- **Vercel:** "Show me the latest deployment status for this project"
- **GitHub:** "List open pull requests in this repo"

---

## Security notes

1. **Manual approval:** Keep "Manually approve tool calls" ON in Cursor so you review SQL, migrations, and deployments before they run.
2. **Supabase:** Consider `?read_only=true` if you only want the AI to query, not modify:
   ```
   "url": "https://mcp.supabase.com/mcp?project_ref=fbtnhhurjwizcrmcisci&read_only=true"
   ```
3. **Production:** Prefer using a Supabase development branch or staging project for MCP; avoid production data.

---

## Quick reference

| Action                  | Ask the AI                                      |
|-------------------------|--------------------------------------------------|
| Add a table             | "Create migration for X table using Supabase MCP"|
| Deploy Edge Function    | "Deploy the send-quote function via MCP"         |
| Check deployment logs   | "Get deployment logs for the latest Vercel build"|
| Create PR               | "Create a PR for branch X with title Y"          |
| Generate DB types       | "Regenerate TypeScript types from Supabase schema"|
