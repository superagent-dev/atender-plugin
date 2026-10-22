# Submission notes

This repository is the one source for the Atender plugin in two directories: Anthropic's (Claude)
and OpenAI's (ChatGPT). The server that the plugin calls is not here; it is in the `sa-replit`
repository, and its guide is `docs/guides/assistant-plugin.md` there.

Run `node scripts/check.mjs --live` and `node scripts/evals.mjs` before each submission and after
each change; CI runs both on each pull request and each day. `AGENTS.md` lists what each one
catches.

## What each directory reads

| File                         | Claude                         | OpenAI                                   |
| ---------------------------- | ------------------------------ | ---------------------------------------- |
| `.claude-plugin/plugin.json` | The manifest                   | Not used when the root manifest exists   |
| `.mcp.json`                  | The server reference           | Not used                                 |
| `plugin.json`                | Not used                       | The manifest, with listing and test cases |
| `mcp.json`                   | Not used                       | The server reference                     |
| `skills/`                    | The skills                     | The skills                               |
| `README.md`, `LICENSE`       | The listing text; both required | In the archive                           |
| `assets/`                    | The icon for the portal upload | The logo and the composer icon           |

A change of `name`, `version` or `description` goes in both manifests. Raise `version` in both
with each release.

## Claude: two submissions at claude.ai/directory/manage

Submit from the Claude organization that owns the listing for good: the owner cannot change later.
On a Team or Enterprise plan an Owner submits. The GitHub account connected to that organization
needs push access to this repository. The repository can be private for validation and
submission, and must be public before the listing goes live.

### 1. MCP connector (the server)

| Field            | Value                                                                                           |
| ---------------- | ----------------------------------------------------------------------------------------------- |
| URL              | `https://v3.atender.com/api/v1/plugin`                                                          |
| Server name      | Atender                                                                                         |
| One line         | Answers about the Atender support platform and its API, and staffing estimates for support teams. |
| Description      | The long description in `plugin.json` (`extensions.com.openai.interface.longDescription`)       |
| Categories       | Customer support; business operations; developer tools (choose from the portal's list)          |
| Documentation    | `https://www.atender.com/docs`                                                                  |
| Privacy policy   | `https://www.atender.com/privacy-policy`                                                        |
| Support contact  | `hello@atender.com`, `https://www.atender.com/contact`                                          |
| Icon             | `assets/logo.png`                                                                               |
| Slug             | `atender` (permanent after publication)                                                         |
| Authentication   | Mixed: OAuth with dynamic client registration for one function (`get_connected_workspace`, scope `notifications:read`); the other three need none. |
| Reads or writes  | Reads                                                                                           |
| Before a person connects | Nothing for the three open functions. An Atender account (Owner or Team Lead) for the sign-in function. |
| API ownership    | Atender's own                                                                                   |
| Health data, sponsored content | No                                                                                |
| Test instructions | Run the 5 positive prompts in `plugin.json`. The sign-in case uses the review account entered in the portal's Review details form. |

### 2. Plugin bundle (this repository)

Repository `superagent-dev/atender-plugin`, plugin path empty (the plugin is at the root), branch
`main`. Data handling answers:

| Question                                              | Answer                                                                                                  |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Reads or stores personal data?                        | It asks for none. Help search words: not stored. The server keeps only telemetry for each search (hour, outcome, result count, top 5 article ids, top score, whether ranking ran, latency), with no query text, hash, embedding, passage, address or id of a person. |
| Sends data to services other than its declared connector? | No. The connector's server sends help search words to OpenAI and Jina AI as sub-processors.          |
| How long is data kept?                                | Help search words, API search words and staffing numbers: not stored. Search telemetry holds no text and no id of a person. |
| Intended for people under 18?                         | No                                                                                                      |

After both are submitted from the same organization, pair the two listings.

## OpenAI: one submission at platform.openai.com/plugins

Organization ATENDER LABS MÁLAGA SL. Run `scripts/package-openai.sh` and upload the ZIP file with
the "With MCP" path. The server origin cannot change after the first submission.

Then, in the portal:

1. Copy the domain proof text. In `sa-replit`, set `OPENAI_APPS_CHALLENGE_TOKEN`, ship and deploy.
2. Connect and scan the server. A skill scan can take up to 2 hours.
3. Give a reason for each label of each function (below).
4. The demo of the test cases is `review.demo_recording_url`, a public Drive link. A new recording goes up as a new version of the same Drive file, so the address does not change. Check every frame for ChatGPT plan banners first.
5. Accept the policy statements and submit.

### Reasons for the labels

| Function                    | Read-only: true                                                                                                     | Destructive: false                 | Open world: false                                                  |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------- | ---------------------------------- | ------------------------------------------------------------------ |
| `search_atender_help`       | It returns passages of published articles. It changes nothing a person can see. It writes one telemetry row with no search words and no id of a person. | It deletes and overwrites nothing. | It searches one fixed set: Atender's own published help articles.  |
| `search_atender_api`        | It searches a file in memory and stores nothing.                                                                    | It deletes and overwrites nothing. | It searches one fixed file: Atender's published API description.   |
| `estimate_support_staffing` | It calculates from the numbers in the request and stores nothing.                                                   | It deletes and overwrites nothing. | It reads no outside source.                                        |
| `get_connected_workspace`   | It reads the signed-in person's workspace name and role and stores nothing.                                         | It deletes and overwrites nothing. | It reads one fixed source: the person's own Atender workspace.     |

## Status posts

Each package event (uploaded, submitted, approved, rejected, live) is posted to #v3-deployments
(`C0AN59B2HJ4`) in the fixed form of the `deploy-after-build` skill in `sa-replit`, with the title
`Plugin <version> · <state>`, for example `Plugin 0.1.0 · submitted`.

The server keeps its function names and scopes in `server/api/v1/plugin/contract.json` in
`sa-replit`, and a test there holds them. This repository does not copy that file.

## Status

| Directory | Version | State | Date | Package |
|---|---|---|---|---|
| OpenAI (ChatGPT) | 1.0.0 | In review | 2026-10-22 | `12b2caa`, organization ATENDER LABS MÁLAGA SL |
| Anthropic (Claude) | — | Not submitted | — | — |

Each change of state is posted to #v3-deployments (`Plugin <version> · <state>`).

## Open before a submission

- The Claude organization that owns the listing is not decided.
- This repository is private. Claude publishes only from a public repository.
- For OpenAI the skills come from ONE source: the server, at the portal's scan. The archive has
  no `skills/` folder, because OpenAI finds a `skills/` folder in a package by itself and requires
  each skill name to be unique in a plugin. Claude reads the skills from this repository. So the
  skills exist in two places (`skills/` here, `server/api/v1/plugin/skills.ts` in `sa-replit`), and
  `check.mjs --live` fails when they differ.
- Not tested: OpenAI's scan with these skills. No ChatGPT test has used a package; developer mode
  has none.
