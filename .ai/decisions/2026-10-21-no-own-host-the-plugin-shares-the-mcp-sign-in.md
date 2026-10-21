# No own host: the plugin shares the MCP sign-in

**Date:** 2026-10-21. Owner: Juan. Server change: sa-replit PR #6022.

**Decision:** the plugin stays on `https://v3.atender.com/api/v1/plugin`. It gets no own host name (such as `plugin.atender.com`). It accepts a live token of the general MCP sign-in that holds the function's scopes.

**Why:** OpenAI's **Connect** opened the normal consent page, and the token that came back named no plugin audience. The plugin refused it only because of our own audience rule. The roadmap adds about 22 sign-in functions that the general MCP server already has, with the same sign-in and the same permissions. A second host needs DNS at another provider, a certificate, an ingress rule, host-aware OAuth documents and a new domain proof at OpenAI, and the origin is fixed at the first submission. A second permission set was not wanted.

**Result on 21 Oct:** after the deploy, Connect in the portal showed ONE scope (Read notifications), and the portal showed Authentication "Authorized" with no findings.
