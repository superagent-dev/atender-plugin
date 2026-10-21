# Atender

Ask an AI assistant about [Atender](https://www.atender.com), the customer support platform, and plan a support team. Three of its four functions need no Atender account and read no workspace data. The fourth shows a signed-in person which workspace and role the plugin is connected to, with one permission: read notifications.

## What it does

| You ask | The plugin |
| --- | --- |
| What Atender can do, or how a part of it works | Searches Atender's published help articles and answers with a link to each article |
| Which Atender API call an integration needs | Searches the published API reference and returns the call, the permission it needs and a link to its reference |
| How many people a support team needs | Estimates the people on at one moment for your volume, opening hours and response promise, and compares cases |

Example questions:

- How does a handover from the AI to a person work in Atender?
- Which Atender API call creates a conversation from my CRM?
- How many people do I need for 400 chats a day, open 10 hours, 8 minutes each, 2 chats at once per person, 90% answered within 60 seconds?

## What is in this repository

- Three skills in `skills/`: instructions that tell the assistant when and how to use the functions.
- A reference to one remote MCP server that Atender runs: `https://v3.atender.com/api/v1/plugin`. It has three read-only functions: `search_atender_help`, `search_atender_api` and `estimate_support_staffing`.
- The manifests and the icons.

The plugin runs no code on your machine. It has no hooks, no commands and no local server, and it installs no packages. The two files under `scripts/` are for the maintainers of this repository: one checks that the files here are consistent, one builds an archive of them. The plugin does not run them.

## What it sends, and where

The only network destination is the Atender server named above, and only when the assistant calls one of the three functions.

- A help question sends the search words to Atender. Atender stores the words, the time and the matching articles in its search statistics, with no name, account, network address or identifier of you. To find the articles, Atender sends the words to two of its sub-processors, OpenAI and Jina AI.
- An API question sends the search words to Atender. They are not stored.
- A staffing estimate sends your numbers to Atender. They are not stored.

The plugin asks for no credentials and reads no files. Do not put personal or confidential information in a question for the plugin.

## Privacy Policy

[atender.com/privacy-policy](https://www.atender.com/privacy-policy), section "The Atender plugin for AI assistants". Sub-processors: [atender.com/subprocessors](https://www.atender.com/subprocessors).

## Support

[atender.com/contact](https://www.atender.com/contact) or hello@atender.com. Terms: [atender.com/terms](https://www.atender.com/terms).

## License

MIT. See `LICENSE`.
