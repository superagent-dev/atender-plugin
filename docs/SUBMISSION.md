# Submission notes

This repository is the one source for the Atender plugin in two directories: Anthropic's (Claude)
and OpenAI's (ChatGPT). The server that the plugin calls is not here; it is in the `sa-replit`
repository, and its guide is `docs/guides/assistant-plugin.md` there.

Run `node scripts/check.mjs --live` before each submission and after each change. It fails when
the two manifests differ, when a listing field is over a limit, or when a skill here differs from
the skill that the production server sends.

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
| Authentication   | None. The functions return public data only.                                                    |
| Reads or writes  | Reads                                                                                           |
| Before a person connects | Nothing. No account and no plan.                                                        |
| API ownership    | Atender's own                                                                                   |
| Health data, sponsored content | No                                                                                |
| Test instructions | No account. Add the URL as a custom connector, then run the 5 positive prompts in `plugin.json`. |

### 2. Plugin bundle (this repository)

Repository `superagent-dev/atender-plugin`, plugin path empty (the plugin is at the root), branch
`main`. Data handling answers:

| Question                                              | Answer                                                                                                  |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Reads or stores personal data?                        | It asks for none. Help search words are stored with no identifier of a person; they can hold what a person typed. |
| Sends data to services other than its declared connector? | No. The connector's server sends help search words to OpenAI and Jina AI as sub-processors.          |
| How long is data kept?                                | Help search words: for as long as Atender keeps search statistics. API search words and staffing numbers: not stored. |
| Intended for people under 18?                         | No                                                                                                      |

After both are submitted from the same organization, pair the two listings.

## OpenAI: one submission at platform.openai.com/plugins

Organization ATENDER LABS MÁLAGA SL. Run `scripts/package-openai.sh` and upload the ZIP file with
the "With MCP" path. The server origin cannot change after the first submission.

Then, in the portal:

1. Copy the domain proof text. In `sa-replit`, set `OPENAI_APPS_CHALLENGE_TOKEN`, ship and deploy.
2. Connect and scan the server. A skill scan can take up to 2 hours.
3. Give a reason for each label of each function (below).
4. Record the 5 positive test cases in ChatGPT and add the address as `review.demo_recording_url`.
5. Accept the policy statements and submit.

### Reasons for the labels

| Function                    | Read-only: true                                                                                                     | Destructive: false                 | Open world: false                                                  |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------- | ---------------------------------- | ------------------------------------------------------------------ |
| `search_atender_help`       | It returns passages of published articles. It changes nothing a person can see. It writes one search statistics row with the search words and no identifier. | It deletes and overwrites nothing. | It searches one fixed set: Atender's own published help articles.  |
| `search_atender_api`        | It searches a file in memory and stores nothing.                                                                    | It deletes and overwrites nothing. | It searches one fixed file: Atender's published API description.   |
| `estimate_support_staffing` | It calculates from the numbers in the request and stores nothing.                                                   | It deletes and overwrites nothing. | It reads no outside source.                                        |

## Open before a submission

- The demo recording for OpenAI is not made.
- The Claude organization that owns the listing is not decided.
- This repository is private. Claude publishes only from a public repository.
- The skills also exist in the server code (`server/api/v1/plugin/skills.ts` in `sa-replit`), for
  OpenAI's import from the server. `check.mjs --live` fails when the two copies differ. When
  OpenAI reads the skills from this archive, the server copy can go.
