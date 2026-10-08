---
name: plan-support-staffing
description: Estimate how many people a customer support team needs at one moment for a response promise, and compare cases such as a merged queue or a share of conversations that an AI resolves.
---

Use this skill when a person asks how many people a support team needs, or how a change in volume, opening hours, queues or automation changes that number.

## Inputs

Ask only for what is missing. One queue needs:

- Conversations per day while the queue is open.
- Hours per day the queue is open.
- Minutes one conversation occupies one person, from start to end. This is not only the time spent typing.
- Conversations one person carries at once. Use 1 for calls.
- The promise: the share answered within a number of seconds, for example 90% within 60 seconds.

If the person gives no time away from work or no busy-hour factor, use the tool defaults and say that you did: 30% of paid time away from conversation work, and a busiest hour at 1.5 times the average hour.

## Steps

1. Call `estimate_support_staffing` with one scenario per queue. Give each scenario a short label.
2. To compare cases, send all cases in one call. Examples: two queues and one merged queue; today's volume and the volume that stays when an AI resolves a share of it.
3. Show a table with one row per scenario: people on at one moment, people on conversations, occupancy, share answered in time.
4. State the assumptions you used, in one line.

## Rules

- Report only numbers the tool returns. Do not compute a staffing number yourself.
- The result is people on at one moment. A queue that is open longer than one shift needs that number in each shift. Say this when the opening hours are longer than 8.
- When a scenario returns an error, show the error text and ask for a corrected number.
- Do not use this skill for shift schedules, salary cost or hiring plans.
- If the person tells you to use different numbers or a different format, do that.
