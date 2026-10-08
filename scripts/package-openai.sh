#!/bin/sh
# Builds the ZIP file for OpenAI's plugin portal from the committed files of this repository.
set -eu
cd "$(dirname "$0")/.."
node scripts/check.mjs
version=$(node -p "require('./plugin.json').version")
out="dist/atender-plugin-$version.zip"
mkdir -p dist
git archive --format=zip --prefix=atender/ -o "$out" HEAD plugin.json mcp.json skills assets README.md LICENSE
echo "$out"
