#!/usr/bin/env bash
# Posts one message to Slack, for the daily check alarm.
# Reads SLACK_BOT_TOKEN and SLACK_CHANNEL from the environment, never from an argument, so a token
# cannot reach a process listing.
#
#   scripts/slack-post.sh "the message"
set -euo pipefail

text="${1:?usage: slack-post.sh <text>}"
: "${SLACK_BOT_TOKEN:?SLACK_BOT_TOKEN is not set - cannot post}"
: "${SLACK_CHANNEL:?SLACK_CHANNEL is not set - cannot post}"

# The token goes to curl through a private config file, never as an argument.
umask 077
auth=$(mktemp)
trap 'rm -f "$auth"' EXIT
printf 'header = "Authorization: Bearer %s"\n' "$SLACK_BOT_TOKEN" >"$auth"

# Sends nothing. It asks Slack who the token belongs to, so a rotated token shows at once and
# `not_in_channel` names the bot to invite.
who=$(curl -sS -X POST https://slack.com/api/auth.test \
  --config "$auth" \
  -H 'Content-Type: application/x-www-form-urlencoded')
if [ "$(echo "$who" | jq -r '.ok')" != "true" ]; then
  echo "::error::Slack token is invalid: $(echo "$who" | jq -r '.error')"
  exit 1
fi
echo "::notice::Posting as $(echo "$who" | jq -r '.user'). Invite that bot if the channel rejects it."

resp=$(jq -n --arg c "$SLACK_CHANNEL" --arg t "$text" \
  '{channel:$c, text:$t, unfurl_links:false}' |
  curl -sS -X POST https://slack.com/api/chat.postMessage \
    --config "$auth" \
    -H 'Content-Type: application/json; charset=utf-8' \
    --data @-)
if [ "$(echo "$resp" | jq -r '.ok')" != "true" ]; then
  echo "::error::Slack rejected the post: $(echo "$resp" | jq -r '.error') - see the notice above for which bot to invite"
  exit 1
fi
