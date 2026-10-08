#!/usr/bin/env node
// Checks that the two manifests agree, that each skill is well formed, and that the listing
// fields are inside the limits of both directories. With --live it also compares the skills
// and the functions with the production server.
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync } from 'node:fs';

const fail = [];
const check = (ok, message) => ok || fail.push(message);
const json = (path) => JSON.parse(readFileSync(path, 'utf8'));

const claude = json('.claude-plugin/plugin.json');
const portable = json('plugin.json');
for (const key of ['name', 'version', 'description', 'license', 'homepage', 'repository']) {
  check(claude[key] === portable[key], `"${key}" differs between the two manifests`);
}
check(/^[a-z0-9](?:[a-z0-9-]{0,62}[a-z0-9])?$/.test(claude.name), 'name: lowercase letters, digits and hyphens, 64 or fewer');

const claudeUrl = json('.mcp.json').mcpServers.atender.url;
const portableUrl = json('mcp.json').mcpServers.atender.url;
check(claudeUrl === portableUrl, 'the server address differs between .mcp.json and mcp.json');
check(claudeUrl.startsWith('https://'), 'the server address must be https');

const ui = portable.extensions['com.openai'].interface;
check(ui.displayName.length <= 30, 'displayName: 30 or fewer');
check(ui.shortDescription.length <= 30, 'shortDescription: 30 or fewer');
check(ui.longDescription.length <= 4000, 'longDescription: 4,000 or fewer');
check(ui.capabilities.length <= 20 && ui.capabilities.every((c) => c.length <= 120), 'capabilities: 20 or fewer, 120 or fewer each');
check(ui.defaultPrompt.length <= 3 && ui.defaultPrompt.every((p) => p.length <= 128), 'defaultPrompt: 3 or fewer, 128 or fewer each');
for (const key of ['composerIcon', 'composerIconDark', 'logo', 'logoDark']) check(existsSync(ui[key]), `${key}: ${ui[key]} is missing`);
const cases = portable.extensions['com.openai'].review.test_cases;
check(cases.positive.length === 5 && cases.negative.length === 3, 'review: exactly 5 positive and 3 negative test cases');

const skills = readdirSync('skills');
check(skills.length >= 1 && skills.length <= 5, 'skills: 1 to 5');
const local = new Map();
for (const dir of skills) {
  const text = readFileSync(`skills/${dir}/SKILL.md`, 'utf8');
  const front = /^---\nname: (.+)\ndescription: (.+)\n---\n/.exec(text);
  check(front, `skills/${dir}/SKILL.md: front matter with name and description`);
  if (front) check(front[1] === dir, `skills/${dir}: the name in the front matter must be the folder name`);
  check(!/\bclaude\b|\bchatgpt\b/i.test(text), `skills/${dir}: name no assistant product in a skill`);
  local.set(dir, `sha256:${createHash('sha256').update(text, 'utf8').digest('hex')}`);
}

const readme = readFileSync('README.md', 'utf8').replace(/```[\s\S]*?```/g, '');
check(readme.split(/\s+/).filter(Boolean).length >= 40, 'README: 40 words or more');
check(/^## Privacy Policy$/m.test(readme), 'README: a "Privacy Policy" section');
check(existsSync('LICENSE'), 'LICENSE is missing');

if (process.argv.includes('--live')) {
  const rpc = async (method, params = {}) => {
    const res = await fetch(claudeUrl, {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'application/json, text/event-stream' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
    });
    return (await res.json()).result;
  };
  const tools = (await rpc('tools/list')).tools;
  const named = new Set(cases.positive.flatMap((c) => c.tools_triggered.split(',').map((t) => t.trim())));
  for (const tool of named) check(tools.some((t) => t.name === tool), `live: the server has no function "${tool}"`);
  for (const tool of tools) {
    check(tool.title, `live: ${tool.name} has no title`);
    check(typeof tool.annotations?.readOnlyHint === 'boolean', `live: ${tool.name} has no read-only label`);
  }
  for (const skill of (await rpc('skills/list')).skills) {
    const name = skill.frontmatter.name;
    check(local.get(name) === skill.resources[0].digest, `live: the skill "${name}" differs between this repository and the server`);
  }
  console.log(`live: ${tools.length} functions, checked against ${claudeUrl}`);
}

if (fail.length) {
  console.error(fail.map((f) => `✗ ${f}`).join('\n'));
  process.exit(1);
}
console.log(`✔ ${claude.name} ${claude.version}: manifests, ${skills.length} skills and listing fields are consistent`);
