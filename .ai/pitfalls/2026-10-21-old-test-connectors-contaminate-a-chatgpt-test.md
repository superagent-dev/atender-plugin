# Old test connectors contaminate a ChatGPT test run

**Date:** 2026-10-21

**Seen:** in the ChatGPT test of the 8 review cases, negative cases 1 and 2 ("show my open conversations", "close conversation 4821") answered with "Listed active conversations". The plugin did not do that. One of four old test connectors in the same ChatGPT account (made 6 to 9 Oct; one of them pointed at a local server with the full MCP server) answered. After the four were removed, all 8 cases passed.

**Rule:** run the review cases and record the demo in a ChatGPT account where the plugin is the ONLY Atender connector. Before a run, open Settings › Apps and connectors and remove every other Atender entry (with the account owner's OK). A pass or a fail with other connectors present proves nothing about the plugin.
