#!/usr/bin/env node
// Checks that the two manifests agree and match the Agent Plugins schemas, that each skill is well
// formed, and that the listing fields are inside the limits of both directories. With --live it
// also compares the skills, the functions, the sign-in and the texts with the production server.
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { validate } from './json-schema.mjs';
import { oauthScopes, rpc } from './mcp.mjs';

process.chdir(fileURLToPath(new URL('..', import.meta.url)));
const fail = [];
const check = (ok, message) => ok || fail.push(message);
const json = (path) => JSON.parse(readFileSync(path, 'utf8'));
const live = process.argv.includes('--live');

const claude = json('.claude-plugin/plugin.json');
const portable = json('plugin.json');
const mcp = json('mcp.json');
for (const key of ['name', 'version', 'description', 'license', 'homepage', 'repository']) {
  check(claude[key] === portable[key], `"${key}" differs between the two manifests`);
}
check(/^[a-z0-9](?:[a-z0-9-]{0,62}[a-z0-9])?$/.test(claude.name), 'name: lowercase letters, digits and hyphens, 64 or fewer');

// The schemas are copies of https://agent-plugins.org/schemas/1.0.0/{plugin,mcp}.schema.json.
// --live compares each copy with its source.
const SCHEMA_DIR = 'schemas/agent-plugins-1.0.0';
const SCHEMA_SOURCE = 'https://agent-plugins.org/schemas/1.0.0';
const schemas = { 'plugin.json': json(`${SCHEMA_DIR}/plugin.schema.json`), 'mcp.json': json(`${SCHEMA_DIR}/mcp.schema.json`) };
for (const e of validate(schemas['plugin.json'], portable)) fail.push(`plugin.json schema: ${e}`);
// OpenAI documents its auth block at mcpServers.<name>.extensions["com.openai"], and the 1.0.0
// schema forbids "extensions" there (.ai/pitfalls/2026-10-21-the-mcp-schema-rejects-openai-auth.md).
// So the schema sees each server without "extensions", and the auth block has its own rules below.
const bare = { ...mcp, mcpServers: Object.fromEntries(Object.entries(mcp.mcpServers).map(([k, { extensions, ...s }]) => [k, s])) };
for (const e of validate(schemas['mcp.json'], bare)) fail.push(`mcp.json schema: ${e}`);

const servers = Object.values(mcp.mcpServers);
check(servers.length === 1, 'mcp.json: exactly one server');
const server = mcp.mcpServers.atender;
const claudeUrl = json('.mcp.json').mcpServers.atender.url;
check(server && claudeUrl === server.url, 'the server address differs between .mcp.json and mcp.json');
check(claudeUrl.startsWith('https://'), 'the server address must be https');

const auth = server?.extensions?.['com.openai']?.auth;
check(auth, 'mcp.json: extensions["com.openai"].auth is missing; declare the sign-in, also when it is "none"');
if (auth) {
  check(['none', 'oauth', 'mixed', 'api_key'].includes(auth.type), `mcp.json auth.type: "${auth.type}" is not none, oauth, mixed or api_key`);
  if (auth.client) check(['provided', 'dcr', 'cimd'].includes(auth.client.mode), `mcp.json auth.client.mode: "${auth.client.mode}" is not provided, dcr or cimd`);
  if ('defaultScopes' in auth) check(Array.isArray(auth.defaultScopes) && auth.defaultScopes.every((s) => typeof s === 'string'), 'mcp.json auth.defaultScopes: a list of scope names');
  if (auth.type === 'none') check(!auth.client && !auth.defaultScopes?.length, 'mcp.json: auth "none" with a client or scopes');
}

const openai = portable.extensions['com.openai'];
const ui = openai.interface;
check(ui.displayName.length <= 30, 'displayName: 30 or fewer');
check(typeof ui.developerName === 'string' && ui.developerName.length > 0 && ui.developerName.length <= 80, 'developerName: required, 80 or fewer');
check(ui.shortDescription.length <= 30, 'shortDescription: 30 or fewer');
check(ui.longDescription.length <= 4000, 'longDescription: 4,000 or fewer');
check(ui.capabilities.length <= 20 && ui.capabilities.every((c) => c.length <= 120), 'capabilities: 20 or fewer, 120 or fewer each');
check(ui.defaultPrompt.length <= 3 && ui.defaultPrompt.every((p) => p.length <= 128), 'defaultPrompt: 3 or fewer, 128 or fewer each');
for (const key of ['composerIcon', 'composerIconDark', 'logo', 'logoDark']) check(existsSync(ui[key]), `${key}: ${ui[key]} is missing`);
const cases = openai.review.test_cases;
check(cases.positive.length === 5 && cases.negative.length === 3, 'review: exactly 5 positive and 3 negative test cases');
check(cases.positive.every((c) => c.description && c.prompt && c.tools_triggered && c.expected_behavior), 'review: each positive case needs description, prompt, tools_triggered and expected_behavior');
check(cases.negative.every((c) => c.description && c.prompt && c.expected_behavior), 'review: each negative case needs description, prompt and expected_behavior');
for (const key of ['test_credentials', 'reviewer_instructions']) check(!JSON.stringify(openai).includes(`"${key}"`), `plugin.json: "${key}" is refused in the ZIP; reviewer access goes in the portal's Review details`);
check(/^parts="[^"]*"$/m.test(readFileSync('scripts/package-openai.sh', 'utf8')) && !/^parts="[^"]*\bskills\b/m.test(readFileSync('scripts/package-openai.sh', 'utf8')), 'package-openai.sh: the default ZIP must not hold skills/; the server serves them');

const skills = readdirSync('skills');
check(skills.length >= 1 && skills.length <= 5, 'skills: 1 to 5');
const local = new Map();
const skillTexts = new Map();
for (const dir of skills) {
  const text = readFileSync(`skills/${dir}/SKILL.md`, 'utf8');
  const front = /^---\nname: (.+)\ndescription: (.+)\n---\n/.exec(text);
  check(front, `skills/${dir}/SKILL.md: front matter with name and description`);
  if (front) check(front[1] === dir, `skills/${dir}: the name in the front matter must be the folder name`);
  check(!/\bclaude\b|\bchatgpt\b/i.test(text), `skills/${dir}: name no assistant product in a skill`);
  local.set(dir, `sha256:${createHash('sha256').update(text, 'utf8').digest('hex')}`);
  skillTexts.set(dir, text);
}

const readmeRaw = readFileSync('README.md', 'utf8');
const readme = readmeRaw.replace(/```[\s\S]*?```/g, '');
check(readme.split(/\s+/).filter(Boolean).length >= 40, 'README: 40 words or more');
check(/^## Privacy Policy$/m.test(readme), 'README: a "Privacy Policy" section');
check(existsSync('LICENSE'), 'LICENSE is missing');
const submission = readFileSync('docs/SUBMISSION.md', 'utf8');

if (live) {
  for (const [key, schema] of Object.entries(schemas)) {
    const name = key.replace('.json', '.schema.json');
    const res = await fetch(`${SCHEMA_SOURCE}/${name}`, { signal: AbortSignal.timeout(30_000) });
    check(res.ok && JSON.stringify(await res.json()) === JSON.stringify(schema), `live: ${SCHEMA_DIR}/${name} differs from ${SCHEMA_SOURCE}/${name}; copy the new one and read what changed`);
  }

  const tools = (await rpc(claudeUrl, 'tools/list')).tools;
  const names = new Set(tools.map((t) => t.name));
  for (const c of cases.positive) {
    for (const tool of c.tools_triggered.split(',').map((t) => t.trim())) check(names.has(tool), `live: review case "${c.description}" names "${tool}", which the server does not have`);
  }
  for (const tool of tools) {
    check(tool.title, `live: ${tool.name} has no title`);
    check(typeof tool.annotations?.readOnlyHint === 'boolean', `live: ${tool.name} has no read-only label`);
  }

  // The sign-in in mcp.json follows from the functions on the server.
  const signIn = tools.filter((t) => oauthScopes(t));
  const open = tools.filter((t) => !oauthScopes(t));
  const expected = signIn.length === 0 ? ['none'] : open.length ? ['mixed'] : ['oauth', 'mixed'];
  check(expected.includes(auth?.type), `live: mcp.json auth.type is "${auth?.type}"; the server has ${signIn.length} sign-in and ${open.length} open functions, so it must be ${expected.join(' or ')}`);
  const needed = [...new Set(signIn.flatMap(oauthScopes))];
  if (signIn.length) {
    const origin = new URL(claudeUrl);
    const prmUrl = `${origin.origin}/.well-known/oauth-protected-resource${origin.pathname}`;
    const res = await fetch(prmUrl, { signal: AbortSignal.timeout(30_000) });
    const isJson = res.ok && res.headers.get('content-type')?.includes('application/json');
    check(isJson, `live: ${prmUrl} answers ${res.status} ${res.headers.get('content-type')}, not a JSON document`);
    const prm = isJson ? await res.json() : {};
    check(prm.resource === claudeUrl, `live: the protected-resource document names "${prm.resource}", not ${claudeUrl}`);
    const supported = new Set(prm.scopes_supported ?? []);
    for (const s of auth?.defaultScopes ?? []) check(supported.has(s), `live: mcp.json defaultScopes has "${s}", which ${prmUrl} does not list in scopes_supported`);
    for (const s of needed) check(supported.has(s), `live: a function needs "${s}", which the protected-resource document does not list`);
    for (const s of needed) check(auth?.defaultScopes?.includes(s), `live: a function needs "${s}", which mcp.json defaultScopes does not ask for`);
  }

  // A text may say that a part needs no sign-in only if it also says what the sign-in asks for.
  if (signIn.length) {
    const claim = /\bno sign-in\b|\bwithout (?:a )?sign-in\b|\bno (?:atender )?account\b|\bno login\b|\bno credentials\b/i;
    const texts = {
      'plugin.json description': portable.description,
      longDescription: ui.longDescription,
      shortDescription: ui.shortDescription,
      capabilities: ui.capabilities.join('\n'),
      release_notes: openai.publication?.release_notes ?? '',
      'README.md': readmeRaw,
      'docs/SUBMISSION.md': submission,
    };
    const words = needed.map((s) => s.split(':')[0].replace(/s$/, ''));
    for (const [where, text] of Object.entries(texts)) {
      const hit = claim.exec(text);
      if (hit) for (const w of words) check(new RegExp(w, 'i').test(text), `live: ${where} says "${hit[0]}" and does not name the sign-in permission (${w}); the server has a sign-in function`);
    }
  }

  // The README lists every function, and no other; the docs name only real functions.
  const listed = (text) => new Set([...text.matchAll(/`([a-z]+(?:_[a-z]+)+)`/g)].map((m) => m[1]));
  const inReadme = listed(readmeRaw);
  for (const n of names) check(inReadme.has(n), `live: README.md does not name the function "${n}"`);
  for (const n of inReadme) check(names.has(n), `live: README.md names "${n}", which the server does not have`);
  for (const n of listed(submission)) check(names.has(n), `live: docs/SUBMISSION.md names "${n}", which the server does not have`);
  for (const [dir, text] of skillTexts) for (const n of listed(text)) check(names.has(n), `live: skills/${dir} names "${n}", which the server does not have`);
  const reasons = submission.split(/^### Reasons for the labels$/m)[1]?.split(/^#{1,3} /m)[0] ?? '';
  for (const n of names) check(new RegExp(`^\\|\\s*\`${n}\``, 'm').test(reasons), `live: docs/SUBMISSION.md "Reasons for the labels" has no row for "${n}"`);

  const served = (await rpc(claudeUrl, 'skills/list')).skills;
  for (const skill of served) {
    const name = skill.frontmatter.name;
    check(local.get(name) === skill.resources[0].digest, `live: the skill "${name}" differs between this repository and the server`);
  }
  check(served.length === local.size, `live: the server has ${served.length} skills, this repository ${local.size}`);
  console.log(`live: ${tools.length} functions (${signIn.length} with sign-in), ${served.length} skills, checked against ${claudeUrl}`);
}

if (fail.length) {
  console.error(fail.map((f) => `✗ ${f}`).join('\n'));
  process.exit(1);
}
console.log(`✔ ${claude.name} ${claude.version}: schemas, manifests, sign-in, ${skills.length} skills and listing fields are consistent`);
