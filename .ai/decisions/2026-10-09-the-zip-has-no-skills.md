# The ZIP for OpenAI has no skills folder

**Date:** 2026-10-09

**Decision:** `scripts/package-openai.sh` leaves `skills/` out of the archive (unless `WITH_SKILLS=1`). OpenAI reads the skills from the server (`skills/list`, `resources/read`) at its scan.

**Why:** OpenAI finds a `skills/` folder in a package by itself and requires each skill name to be unique in a plugin. A ZIP with `skills/` brings the three names a second time. The server is the one source for OpenAI; Claude reads `skills/` from this repository.

**Kept true by:** `check.mjs` fails when the default `parts=` line of the package script holds `skills`. `check.mjs --live` fails when a skill here differs from the server's (the `sha256` digest that OpenAI's import also compares).
