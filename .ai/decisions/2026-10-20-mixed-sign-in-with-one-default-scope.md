# Mixed sign-in with one default scope

**Date:** 2026-10-20 (server), 2026-10-21 (package)

**Decision:** `mcp.json` declares `extensions["com.openai"].auth` as `type: "mixed"`, `client.mode: "dcr"`, `defaultScopes: ["notifications:read"]`.

**Why:** the server has three open functions (`noauth`) and one sign-in function, `get_connected_workspace`, with `oauth2` scope `notifications:read`. OpenAI's auth types are `none`, `oauth`, `mixed` and `api_key`; `mixed` is the type for a server with open and sign-in access. Our authorization server registers clients by dynamic client registration, so the mode is `dcr`. One default scope makes the consent page show one permission. The function does not read notifications: the scope is a read scope any member holds, and it only proves that the person approved the connection (sa-replit `.ai/decisions/2026-10-20-mixed-auth-on-the-open-plugin.md`).

**Kept true by:** `check.mjs --live` derives the auth type from the live functions, and compares `defaultScopes` with the scopes the functions need and with `scopes_supported` of `https://v3.atender.com/.well-known/oauth-protected-resource/api/v1/plugin`. `evals.mjs` checks that the sign-in challenge names the same scope.

**When a function needs a wider scope:** sa-replit changes `PLUGIN_SCOPES` first. Then this repository adds the scope to `defaultScopes`, the texts name it, and a new package version goes to review.
