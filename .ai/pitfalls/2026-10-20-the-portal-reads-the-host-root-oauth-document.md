# The OpenAI portal reads the host-root OAuth document

**Date:** 2026-10-20

**Seen:** the manifest said auth `none`, and the server answered `initialize` with no token. The portal still showed Authentication "OAuth / Authorization required", and **Connect** went to "sign in to your MCP server". The cause: `/.well-known/oauth-authorization-server` on `v3.atender.com` is the OAuth metadata of the whole host, for the general MCP sign-in. At that time `/.well-known/oauth-protected-resource/api/v1/plugin` answered the app page as HTML with status 200.

**Rule:** the portal looks at the OAuth documents of the host, not only at the path of the server. Before an upload, read both documents with curl: the plugin's protected-resource document must answer JSON with `resource` equal to the server address and only the plugin's scopes. `check.mjs --live` fails when it answers something other than JSON, or names another resource.
