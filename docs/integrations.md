# Integrations

MotionPilot AE MCP currently ships as a **local stdio MCP server**. It is best
suited for desktop/editor hosts that can launch a local Node.js process and
access local files plus Adobe After Effects.

## Support matrix

| Host | Status | Transport | Notes |
| --- | --- | --- | --- |
| Claude Desktop | Supported | stdio | Use the Claude Desktop MCP config example. |
| Cursor | Supported | stdio | Use `~/.cursor/mcp.json` or project-level MCP settings. |
| VS Code Copilot Agent mode | Supported | stdio | Use `.vscode/mcp.json`. |
| Codex CLI / IDE | Supported | stdio | Use `~/.codex/config.toml` or `codex mcp add`. |
| ChatGPT connectors | Supported | remote Streamable HTTP | Run `npm run start:http` and point ChatGPT at the `/mcp` URL (via a tunnel). |
| OpenAI Responses API MCP tool | Supported | remote Streamable HTTP | Use the same `/mcp` URL as `server_url`. |

## Claude Desktop

Copy `examples/mcp/claude_desktop_config.json` into your Claude Desktop MCP
configuration and replace the placeholder paths:

```json
{
  "mcpServers": {
    "motionpilot-ae": {
      "command": "node",
      "args": ["/ABSOLUTE/PATH/TO/motionpilot-ae-mcp/dist/index.js"],
      "env": {
        "AE_BINARY": "/Applications/Adobe After Effects 2025/Adobe After Effects 2025.app",
        "AERENDER_BINARY": "/Applications/Adobe After Effects 2025/Adobe After Effects 2025.app/Contents/aerender"
      }
    }
  }
}
```

Restart Claude Desktop and run `check_after_effects_setup` first.

## Cursor

Create or update `~/.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "motionpilot-ae": {
      "command": "node",
      "args": ["/ABSOLUTE/PATH/TO/motionpilot-ae-mcp/dist/index.js"],
      "env": {
        "AE_BINARY": "/Applications/Adobe After Effects 2025/Adobe After Effects 2025.app",
        "AERENDER_BINARY": "/Applications/Adobe After Effects 2025/Adobe After Effects 2025.app/Contents/aerender"
      }
    }
  }
}
```

## VS Code Copilot Agent mode

Create `.vscode/mcp.json` in a workspace:

```json
{
  "servers": {
    "motionpilot-ae": {
      "type": "stdio",
      "command": "node",
      "args": ["/ABSOLUTE/PATH/TO/motionpilot-ae-mcp/dist/index.js"],
      "env": {
        "AE_BINARY": "/Applications/Adobe After Effects 2025/Adobe After Effects 2025.app",
        "AERENDER_BINARY": "/Applications/Adobe After Effects 2025/Adobe After Effects 2025.app/Contents/aerender"
      }
    }
  }
}
```

## Codex

Add a local stdio server to `~/.codex/config.toml`:

```toml
[mcp_servers.motionpilot-ae]
command = "node"
args = ["/ABSOLUTE/PATH/TO/motionpilot-ae-mcp/dist/index.js"]

[mcp_servers.motionpilot-ae.env]
AE_BINARY = "/Applications/Adobe After Effects 2025/Adobe After Effects 2025.app"
AERENDER_BINARY = "/Applications/Adobe After Effects 2025/Adobe After Effects 2025.app/Contents/aerender"
```

## ChatGPT and OpenAI API

ChatGPT custom connectors and the OpenAI Responses API MCP tool connect to a
**remote MCP server** over Streamable HTTP. The server ships an HTTP entrypoint
(`motionpilot-ae-mcp-http` / `dist/http.js`) that exposes the exact same tools as
the stdio server.

> Because this tool can open After Effects, write `.aep` files, render videos and
> delete layers, **never expose it publicly without a bearer token and a
> controlled tunnel.**

### 1. Build and start the HTTP server

```bash
npm install
npm run build

# Localhost only, no auth (good for first local test):
npm run start:http
# -> motionpilot-ae-mcp HTTP transport on http://127.0.0.1:8787/mcp

# Recommended when exposing it: require a bearer token
MOTIONPILOT_HTTP_TOKEN="choose-a-long-secret" \
AE_BINARY="/Applications/Adobe After Effects 2026/Adobe After Effects 2026.app" \
AERENDER_BINARY="/Applications/Adobe After Effects 2026/Adobe After Effects 2026.app/Contents/aerender" \
npm run start:http
```

Environment variables:

| Variable | Default | Purpose |
| --- | --- | --- |
| `PORT` | `8787` | HTTP port. |
| `HOST` | `127.0.0.1` | Bind address. Set `0.0.0.0` only behind a tunnel/proxy. |
| `MOTIONPILOT_HTTP_TOKEN` | _(unset)_ | If set, every request must send `Authorization: Bearer <token>`. |
| `AE_BINARY` / `AERENDER_BINARY` | auto-detect | After Effects paths, same as the stdio server. |

The endpoint is `POST/GET/DELETE http://<host>:<port>/mcp`, plus a `GET /health`
check.

### 2. Expose it with a secure tunnel

ChatGPT needs a public HTTPS URL. Use any tunnel, e.g.:

```bash
cloudflared tunnel --url http://127.0.0.1:8787
# or:  ngrok http 8787
```

Your connector URL is then `https://<tunnel-host>/mcp`.

### 3. Add it in ChatGPT

In ChatGPT: **Settings -> Connectors -> Add custom connector** (requires a plan
with developer mode / custom connectors). Set:

- **MCP server URL:** `https://<tunnel-host>/mcp`
- **Authentication:** if you set `MOTIONPILOT_HTTP_TOKEN`, choose the
  header/bearer option and supply `Bearer <token>`.

Then enable the connector in a chat and ask ChatGPT to call
`check_after_effects_setup`.

### 4. OpenAI Responses API

```jsonc
{
  "model": "gpt-4.1",
  "tools": [
    {
      "type": "mcp",
      "server_label": "motionpilot-ae",
      "server_url": "https://<tunnel-host>/mcp",
      "headers": { "Authorization": "Bearer <token>" }
    }
  ],
  "input": "Run check_after_effects_setup and report what was found."
}
```

A ready-to-edit config snippet lives in
[`examples/mcp/chatgpt_remote.json`](../examples/mcp/chatgpt_remote.json).

## First test prompt

After connecting from any supported local host, run:

```text
Use MotionPilot AE MCP to run check_after_effects_setup and tell me whether
After Effects and aerender were found.
```

