# Checks and evals with Node built-ins only, on one light CI job

**Date:** 2026-10-21

**Decision:** `scripts/check.mjs` and `scripts/evals.mjs` use Node 24 built-in modules only, with a small JSON Schema validator in `scripts/json-schema.mjs` and the two Agent Plugins schemas copied into `schemas/agent-plugins-1.0.0/`. CI is one job, with no install step, a 3-minute timeout, on `vars.PLUGIN_RUNNER || 'ubuntu-latest'`.

**Why:** no install means no lockfile, no supply chain and about 30 seconds a run. The copied schemas make the offline check work with no network; `--live` compares each copy with its source. The runner variable is the pattern of sa-replit (`docs/guides/operations.md` § CI runners on hermes3): it flips in one command with no PR. The validator throws on a keyword it does not know, so a new schema keyword cannot pass in silence.

**Why deterministic evals:** an LLM judge would cost money and give a different answer each run. The facts that a correct answer needs (the numbers, the call, the permission, the links, the scope) come from the functions, and each one has an oracle outside the server: the staffing numbers come from an Erlang C calculation in the eval itself.
