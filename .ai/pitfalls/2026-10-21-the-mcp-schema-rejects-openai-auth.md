# The Agent Plugins MCP schema rejects OpenAI's auth block

**Date:** 2026-10-21

**Seen:** `https://agent-plugins.org/schemas/1.0.0/mcp.schema.json` gives each `streamable-http` server `additionalProperties: false` with only `type`, `url` and `headers`. OpenAI's plugin guide puts the sign-in at `mcpServers.<name>.extensions["com.openai"].auth`. So a correct `mcp.json` fails the schema as published.

**Rule:** `check.mjs` validates each server without its `extensions` key, and checks the auth block with its own rules (type, client mode, scope list). Do not move the auth block to make the schema pass: OpenAI reads it only at that place. When agent-plugins.org publishes a schema that allows `extensions`, `check.mjs --live` fails on the drift; then copy the new schema and remove the strip.
