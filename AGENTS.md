# Atender plugin

This repository is the package of the Atender plugin for two directories: OpenAI's (ChatGPT) and
Anthropic's (Claude). It holds the manifests, the server reference, the icons, the skills for
Claude and the listing texts. The server that the plugin calls is in `superagent-dev/sa-replit`
(`server/api/v1/plugin/`); its guide is `docs/guides/assistant-plugin.md` there. Read that guide
before a change here.

Always write in ASD-STE100 Simplified Technical English: short sentences, one instruction per
sentence, active voice, the same word for the same thing.

## Rules that do not change

1. **The package is built and uploaded last, and only with Juan's explicit yes.** `scripts/package-openai.sh`
   builds the ZIP. Nobody uploads it, submits it or publishes it without Juan's word for that
   step. A package describes the functions and the skills, so each later change makes it old.
2. **The manifests equal the live server.** Each change keeps `mcp.json` and `plugin.json` equal to
   `https://v3.atender.com/api/v1/plugin`: the function names, the sign-in type, and the scopes.
   A server with an open function and a sign-in function is `mixed`. `defaultScopes` asks for each
   scope a function needs, and only scopes in the plugin's protected-resource document.
3. **The texts say what the server does.** The README, the long description, the release notes
   and `docs/SUBMISSION.md` name every function and only real functions. A text does not say "no
   sign-in" or "no account" for the whole plugin while a function needs sign-in. A privacy claim
   in the README agrees with section 9 of atender.com/privacy-policy and with the server code.
4. **Exactly 5 positive and 3 negative review cases.** Each positive case names real functions in
   `tools_triggered` and has an eval in `scripts/evals.mjs`. Reviewer credentials go in the
   portal's Review details form, never in `plugin.json`.
5. **The skills are served by the server, not put in the ZIP.** OpenAI copies the skills from the
   server at its scan. The ZIP has no `skills/` folder. Claude reads `skills/` from this
   repository, so `skills/` here and `server/api/v1/plugin/skills.ts` in sa-replit stay equal.
6. **The origin is fixed at the first submission.** The origin is scheme, host and port:
   `https://v3.atender.com`. A new origin is a new plugin with a full new review.
7. **Test in a ChatGPT account with NO other Atender connectors.** An old test connector answers
   in place of the plugin, and the test then proves nothing (`.ai/pitfalls/`).
8. **Every pull request:** run the checks and the evals, put their output in the PR body, run a
   local review of the diff, and then an independent Fable review LAST, on the final head. Merge
   only after that review approves.

## The checks

Node 24 with its built-in modules only. Nothing to install.

| Command                       | What it catches                                                                                                                                                                                                                                                                                                                  |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `node scripts/check.mjs`      | The two manifests differ; `plugin.json` or `mcp.json` fails the Agent Plugins 1.0.0 schema; the auth block is missing or has a wrong type, client mode or scope list; a listing field is over a limit; not 5 + 3 review cases; reviewer credentials in the manifest; a ZIP with `skills/`; a skill with bad front matter.           |
| `node scripts/check.mjs --live` | The above, plus: a vendored schema differs from agent-plugins.org; a review case names a function the server lacks; the auth type does not follow from the server's functions; a scope is not in the protected-resource document or not asked for; a text claims "no sign-in" and does not name the sign-in permission; the README, SUBMISSION.md or a skill names a function that does not exist, or the README misses one; a function has no row in "Reasons for the labels"; a skill differs from the server's. |
| `node scripts/evals.mjs`      | For each positive review case, the live function gives the facts its `expected_behavior` names: the staffing numbers equal an Erlang C calculation, the API calls and permissions, help articles with links, and the sign-in challenge with the scope from `mcp.json`. A case with no eval, or an eval with no case, fails. |

The evals use no LLM. They prove that the functions give the facts a good answer needs. They do
not prove that ChatGPT picks the right function; the recorded demo and the ChatGPT test run do.

The live checks and the evals make about ten calls to production. The plugin has rate limits
(600 a minute per address; `search_atender_help` 3,000 a day in total). Do not run them in a loop.

## CI

`.github/workflows/checks.yaml`: one light job on each pull request, each push to `main`, and
each day at 06:00 UTC. The daily run is the alarm for drift: a deploy of sa-replit that changes a
function, a scope or a skill makes it red with no change here. The runner comes from the
repository variable `PLUGIN_RUNNER`, with `ubuntu-latest` as the fallback (the pattern of
sa-replit's `docs/guides/operations.md` § CI runners on hermes3).

To move CI to hermes3, a person with root on hermes3 registers a self-hosted runner for this repository with its own label. Then run `gh variable set PLUGIN_RUNNER --repo superagent-dev/atender-plugin --body <label>`. Delete the variable to go back to GitHub's runners: a label with no online runner queues the job and never fails.

## Knowledge

`.ai/decisions/` and `.ai/pitfalls/` take ONE new file per entry, `YYYY-MM-DD-short-subject.md`.
A mistake caught in review goes to `pitfalls/` in the same PR; a decision goes to `decisions/`.
Read both before a change of the sign-in, the package or the listing.
