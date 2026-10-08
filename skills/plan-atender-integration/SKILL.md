---
name: plan-atender-integration
description: Find the Atender public API calls for an integration, and lay out the calls in order with the permission each one needs and a link to its reference.
---

Use this skill when a person asks whether Atender has an API for something, or how to connect another system to Atender.

## Steps

1. Call `search_atender_api` with the goal in plain words, for example "create a conversation from a CRM" or "list tags".
2. If the goal needs more than one call, search for each part.
3. Present the calls in the order a program runs them. For each call give the method and path, what it does, the permission it needs, and the link to its reference.
4. Name what the person must have before the first call: a workspace with API access on, and an API key with the permissions listed.

## Rules

- Name only calls the tool returns. Do not invent a path, a parameter or a permission.
- If no call matches, say that the public API has no call for it.
- Do not write or run a request against a live workspace. This skill plans; it does not act.
- For a question about a product feature and not the API, use the skill `answer-atender-questions`.
