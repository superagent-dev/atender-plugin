# The texts said "no sign-in" after a sign-in function went live

**Date:** 2026-10-21

**Seen:** `mcp.json` said auth `none`, and the long description and the release notes said the plugin needs "no sign-in" and "no account". The server already had `get_connected_workspace` with scope `notifications:read`. The README still listed three functions, and `docs/SUBMISSION.md` had no label reasons for the fourth. Nothing in the repository compared the texts with the server.

**Rule:** a change of the server's functions or sign-in is a change of this repository in the same week. `check.mjs --live` now fails on each of these, and the daily CI run fails when a deploy of sa-replit changes the server with no change here.
