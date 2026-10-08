---
name: answer-atender-questions
description: Answer what Atender can do and how a part of Atender works, from its published help articles, with a link to each article used.
---

Use this skill when a person asks what Atender does, whether Atender supports something, or how to set up or use a part of Atender.

## Steps

1. Call `search_atender_help` with the person's question in plain words. Use the product words the person used.
2. Answer from the passages the tool returns. Keep the answer short and put the steps in order when the article gives steps.
3. After the answer, list each article you used with its title and its link.
4. If the first search returns nothing useful, search one more time with other words for the same thing. Then stop.

## Rules

- State only what the returned passages say. If no article answers the question, say that the help articles do not cover it.
- Do not state prices, plans or contract terms. The help articles do not hold them.
- Do not compare Atender with other products.
- This skill reads published help articles only. It cannot read a person's own workspace, conversations or settings. Say so when a person asks for that.
- For a question about the API or an integration, use the skill `plan-atender-integration`.
