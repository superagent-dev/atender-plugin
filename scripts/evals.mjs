#!/usr/bin/env node
// Deterministic evals: for each positive review case in plugin.json, call the live functions the
// case names and compare the answer with an oracle. Each oracle is also found in the case's
// expected_behavior, so a reviewer at OpenAI and this script expect the same result. No LLM runs
// here: these evals prove the functions give the facts a correct answer needs, not that ChatGPT
// picks them. About six calls; the server has rate limits.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { callTool } from './mcp.mjs';

process.chdir(fileURLToPath(new URL('..', import.meta.url)));
const portable = JSON.parse(readFileSync('plugin.json', 'utf8'));
const url = JSON.parse(readFileSync('mcp.json', 'utf8')).mcpServers.atender.url;
const auth = JSON.parse(readFileSync('mcp.json', 'utf8')).mcpServers.atender.extensions?.['com.openai']?.auth;
const cases = portable.extensions['com.openai'].review.test_cases.positive;

// Erlang C, the textbook formula for the chance that a contact waits, written here apart from the
// server's code. With the defaults the skill states (30% time away, busiest hour 1.5 times the
// average) it gives the smallest team that keeps the promise.
function erlangC(servers, load) {
  let sum = 0;
  let term = 1;
  for (let k = 0; k < servers; k++) {
    if (k > 0) term *= load / k;
    sum += term;
  }
  const top = ((term * load) / servers) * (servers / (servers - load));
  return top / (sum + top);
}
function staffingOracle({ conversationsPerDay, openHoursPerDay, handlingMinutes, concurrentConversations, targetSeconds, serviceLevelPercent }) {
  const load = ((conversationsPerDay / openHoursPerDay) * 1.5 * handlingMinutes) / 60;
  for (let people = 1; people < 1000; people++) {
    const slots = people * concurrentConversations;
    if (slots <= load) continue;
    const answered = 100 * (1 - erlangC(slots, load) * Math.exp((-(slots - load) * targetSeconds) / (handlingMinutes * 60)));
    if (answered >= serviceLevelPercent) return { peopleOnConversations: people, answeredInTargetPercent: Math.round(answered * 10) / 10, peopleAtOneMoment: Math.ceil(people / 0.7) };
  }
}

const has = (text, parts) => parts.filter((p) => !text.includes(p)).map((p) => `expected_behavior does not say "${p}"`);
const text = (result) => (result.content ?? []).map((c) => c.text ?? '').join('\n');
const apiHas = (result, method, path, permission) =>
  result.structuredContent?.results?.some((r) => r.method === method && r.path === path && r.permissions?.includes(permission) && /^https:\/\//.test(r.referenceUrl ?? ''))
    ? []
    : [`search_atender_api gave no ${method} ${path} with ${permission} and a reference link; it gave ${(result.structuredContent?.results ?? []).map((r) => `${r.method} ${r.path}`).join(', ')}`];
const helpLinks = (result, word) => {
  const hits = result.structuredContent?.results ?? [];
  const errors = [];
  if (!hits.some((h) => /^https:\/\//.test(h.url ?? '') && h.title)) errors.push('search_atender_help gave no article with a title and an https link');
  if (!hits.some((h) => new RegExp(word, 'i').test(`${h.title} ${h.passage}`))) errors.push(`search_atender_help gave no article about "${word}"`);
  return errors;
};

const EVALS = {
  async search_atender_help(c) {
    const r = await callTool(url, 'search_atender_help', { query: 'How does a handover from the AI to a person work?', limit: 3 });
    return [...helpLinks(r, 'handover'), ...has(c.expected_behavior, ['handover', 'links'])];
  },
  async search_atender_api(c) {
    const r = await callTool(url, 'search_atender_api', { query: 'create a conversation from my CRM' });
    return [...apiHas(r, 'POST', '/api/v1/conversations/inbound', 'conversations:write'), ...has(c.expected_behavior, ['POST /api/v1/conversations/inbound', 'conversations:write'])];
  },
  async estimate_support_staffing(c) {
    const input = { label: 'chat', conversationsPerDay: 400, openHoursPerDay: 10, handlingMinutes: 8, concurrentConversations: 2, targetSeconds: 60, serviceLevelPercent: 90 };
    const prompt = has(c.prompt, ['400 chats a day', '10 hours', '8 minutes', '2 chats at once', '90%', '60 seconds']).map((e) => e.replace('expected_behavior', 'prompt'));
    const oracle = staffingOracle(input);
    const r = await callTool(url, 'estimate_support_staffing', { scenarios: [input] });
    const got = r.structuredContent?.scenarios?.[0] ?? {};
    const errors = Object.entries(oracle).filter(([k, v]) => got[k] !== v).map(([k, v]) => `estimate_support_staffing ${k}: server ${got[k]}, Erlang C ${v}`);
    return [...prompt, ...errors, ...has(c.expected_behavior, [`${oracle.peopleAtOneMoment} people`, `about ${oracle.peopleOnConversations}`, `about ${oracle.answeredInTargetPercent}%`])];
  },
  async get_connected_workspace() {
    // Without a token the server must ask for a sign-in with the scope that mcp.json asks for.
    const r = await callTool(url, 'get_connected_workspace');
    const challenge = (r._meta?.['mcp/www_authenticate'] ?? []).join(' ');
    const errors = [];
    if (r.isError !== true) errors.push('get_connected_workspace with no token did not answer an error');
    for (const scope of auth?.defaultScopes ?? []) if (!challenge.includes(`scope="${scope}"`)) errors.push(`the sign-in challenge does not name scope="${scope}": ${challenge || 'no challenge'}`);
    if (!auth?.defaultScopes?.length) errors.push('mcp.json asks for no scope, so the challenge cannot be compared');
    const origin = new URL(url);
    if (!challenge.includes(`resource_metadata="${origin.origin}/.well-known/oauth-protected-resource${origin.pathname}"`)) errors.push('the sign-in challenge does not name the plugin protected-resource document');
    if (/workspaceName|role/.test(JSON.stringify(r.structuredContent ?? {}))) errors.push('get_connected_workspace returned workspace data with no token');
    return errors;
  },
  async 'search_atender_api, search_atender_help'(c) {
    const api = await callTool(url, 'search_atender_api', { query: 'list tags' });
    const help = await callTool(url, 'search_atender_help', { query: 'How do tags work?', limit: 3 });
    return [...apiHas(api, 'GET', '/api/v1/tags', 'tags:read'), ...helpLinks(help, 'tag'), ...has(c.expected_behavior, ['GET /api/v1/tags', 'tags:read', 'article links'])];
  },
};

// Optional: the review account of the OpenAI portal can still sign in. A full OAuth sign-in needs
// the browser consent page, so this check does the password sign-in that page relies on, with the
// public settings the web app itself ships. It prints no credential and no token.
async function reviewAccountSignIn() {
  const email = process.env.REVIEW_LOGIN_EMAIL;
  const password = process.env.REVIEW_LOGIN_PASSWORD;
  if (!email || !password) {
    console.log('- review account sign-in skipped: REVIEW_LOGIN_EMAIL and REVIEW_LOGIN_PASSWORD are not set');
    return [];
  }
  const page = await (await fetch(new URL(url).origin, { signal: AbortSignal.timeout(30_000) })).text();
  const setting = (name) => new RegExp(`"${name}":"([^"]+)"`).exec(page)?.[1];
  const SUPABASE_URL = setting('SUPABASE_URL');
  const SUPABASE_ANON_KEY = setting('SUPABASE_ANON_KEY');
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return ['the web app page gives no public sign-in settings'];
  const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', apikey: SUPABASE_ANON_KEY },
    body: JSON.stringify({ email, password }),
    signal: AbortSignal.timeout(30_000),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || !body.access_token) return [`the review account cannot sign in: HTTP ${res.status}`];
  const out = await fetch(`${SUPABASE_URL}/auth/v1/logout?scope=local`, {
    method: 'POST',
    headers: { apikey: SUPABASE_ANON_KEY, authorization: `Bearer ${body.access_token}` },
    signal: AbortSignal.timeout(30_000),
  });
  return out.ok ? [] : [`the review account sign-out failed: HTTP ${out.status}`];
}

let failed = 0;
const signInErrors = await reviewAccountSignIn().catch((e) => [`review account sign-in failed: ${e.message}`]);
if (signInErrors.length) failed++;
if (process.env.REVIEW_LOGIN_EMAIL && process.env.REVIEW_LOGIN_PASSWORD) console.log(`${signInErrors.length ? '✗' : '✔'} the review account signs in${signInErrors.map((e) => `\n    ${e}`).join('')}`);
for (const c of cases) {
  const run = EVALS[c.tools_triggered];
  const errors = run ? await run(c).catch((e) => [`call failed: ${e.message}`]) : [`no eval for tools_triggered "${c.tools_triggered}"; add one to scripts/evals.mjs`];
  if (errors.length) failed++;
  console.log(`${errors.length ? '✗' : '✔'} ${c.description}${errors.map((e) => `\n    ${e}`).join('')}`);
}
const unused = Object.keys(EVALS).filter((k) => !cases.some((c) => c.tools_triggered === k));
for (const k of unused) console.log(`✗ the eval "${k}" matches no review case; remove it or correct tools_triggered`);
if (failed || unused.length) process.exit(1);
console.log(`✔ ${cases.length} review cases answered as expected by ${url}`);
