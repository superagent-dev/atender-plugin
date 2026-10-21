// One JSON-RPC client for the live plugin server, shared by check.mjs --live and evals.mjs.
// The server limits calls per address and per day (sa-replit docs/guides/assistant-plugin.md),
// so every call waits PAUSE_MS after the one before. A 429 waits for Retry-After, and a 5xx
// (a pod restart behind the load balancer) waits 5 seconds; each one gets one more attempt.
const PAUSE_MS = 1000;
let last = 0;

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

export async function rpc(url, method, params = {}) {
  for (let attempt = 0; attempt < 2; attempt++) {
    await wait(Math.max(0, last + PAUSE_MS - Date.now()));
    last = Date.now();
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'application/json, text/event-stream' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
      signal: AbortSignal.timeout(30_000),
    });
    if (res.status === 429 && attempt === 0) {
      await wait(Math.min(60, Number(res.headers.get('retry-after')) || 10) * 1000);
      continue;
    }
    if (res.status >= 500 && attempt === 0) {
      await wait(5000);
      continue;
    }
    const text = await res.text();
    if (!res.ok) throw new Error(`${method}: HTTP ${res.status} from ${url}`);
    // A streamable-http server can answer as an event stream; the result is the last data line.
    const body = res.headers.get('content-type')?.includes('text/event-stream')
      ? text.split('\n').filter((l) => l.startsWith('data:')).pop()?.slice(5)
      : text;
    const message = JSON.parse(body);
    if (message.error) throw new Error(`${method}: ${message.error.message}`);
    return message.result;
  }
  throw new Error(`${method}: no answer after two attempts`);
}

export const callTool = (url, name, args = {}) => rpc(url, 'tools/call', { name, arguments: args });

/** The scopes a tool needs, or null for a tool that needs no sign-in. */
export function oauthScopes(tool) {
  const schemes = tool.securitySchemes ?? tool._meta?.securitySchemes ?? [];
  const oauth = schemes.filter((s) => s.type === 'oauth2');
  return oauth.length ? oauth.flatMap((s) => s.scopes ?? []) : null;
}
