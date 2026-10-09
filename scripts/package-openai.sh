#!/bin/sh
# Builds the ZIP file for OpenAI's plugin portal from the committed files of this repository.
set -eu
cd "$(dirname "$0")/.."
node scripts/check.mjs
version=$(node -p "require('./plugin.json').version")
out="dist/atender-plugin-$version.zip"
mkdir -p dist
# OpenAI reads the skills from the server at its scan. A package with a skills/ folder would bring
# the same three names a second time, and OpenAI requires each skill name to be unique in a
# plugin. So the archive has no skills/ folder unless WITH_SKILLS=1.
parts="plugin.json mcp.json assets README.md LICENSE"
[ "${WITH_SKILLS:-0}" = "1" ] && parts="$parts skills"
git archive --format=zip --prefix=atender/ -o "$out" HEAD $parts
echo "$out"
