# Atender

Ask an AI assistant about [Atender](https://www.atender.com), the customer support platform, and plan a support team. Three of its four functions need no Atender account and read no workspace data. The fourth shows a signed-in person which workspace and role the plugin is connected to, with one permission: read notifications.

## What it does

| You ask | The plugin |
| --- | --- |
| What Atender can do, or how a part of it works | Searches Atender's published help articles and answers with a link to each article |
| Which Atender API call an integration needs | Searches the published API reference and returns the call, the permission it needs and a link to its reference |
| How many people a support team needs | Estimates the people on at one moment for your volume, opening hours and response promise, and compares cases |
| Which Atender workspace you are connected to (after you sign in) | Returns the name of the workspace and your role there, and nothing else from the workspace |

Example questions:

- How does a handover from the AI to a person work in Atender?
- Which Atender API call creates a conversation from my CRM?
- How many people do I need for 400 chats a day, open 10 hours, 8 minutes each, 2 chats at once per person, 90% answered within 60 seconds?

## What is in this repository

- Three skills in `skills/`: instructions that tell the assistant when and how to use the functions.
- A reference to one remote MCP server that Atender runs: `https://v3.atender.com/api/v1/plugin`. It has four read-only functions: `search_atender_help`, `search_atender_api` and `estimate_support_staffing` need no sign-in; `get_connected_workspace` needs a sign-in to Atender with one permission, read notifications.
- The manifests and the icons.

The plugin runs no code on your machine. It has no hooks, no commands and no local server, and it installs no packages. The files under `scripts/` are for the maintainers of this repository: they check that the files here agree with each other and with the live server, and build an archive of them. The plugin does not run them.

## What it sends, and where

The only network destination is the Atender server named above, and only when the assistant calls one of the four functions.

- A help question sends the search words to Atender. Atender stores the words, the time and the matching articles in its search statistics, with no name, account, network address or identifier of you. To find the articles, Atender sends the words to two of its sub-processors, OpenAI and Jina AI.
- An API question sends the search words to Atender. They are not stored.
- A staffing estimate sends your numbers to Atender. They are not stored.
- The workspace function sends the sign-in token that the assistant got when you signed in to Atender. Atender reads your workspace name and role from it and returns them. The sign-in asks for one permission, read notifications; the function does not read notifications.

The plugin itself stores no password and reads no files. Do not put personal or confidential information in a question for the plugin.

## Privacy Policy

[atender.com/privacy-policy](https://www.atender.com/privacy-policy), section "The Atender plugin for AI assistants". Sub-processors: [atender.com/subprocessors](https://www.atender.com/subprocessors).

## Support

[atender.com/contact](https://www.atender.com/contact) or hello@atender.com. Terms: [atender.com/terms](https://www.atender.com/terms).

## Maintainers

Read `AGENTS.md` first. CI runs `scripts/check.mjs`, `scripts/check.mjs --live` and `scripts/evals.mjs` on each pull request and each day. To move CI to hermes3, a person with root on hermes3 registers a self-hosted runner for this repository with its own label. Then run `gh variable set PLUGIN_RUNNER --repo superagent-dev/atender-plugin --body <label>`. Delete the variable to go back to GitHub's runners: a label with no online runner queues the job and never fails.

## License

MIT. See `LICENSE`.
