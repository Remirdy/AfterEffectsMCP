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
| ChatGPT connectors | Roadmap | remote HTTP/SSE | ChatGPT custom connectors require a remote MCP server URL. |
| OpenAI Responses API MCP tool | Roadmap | remote HTTP/SSE | Requires a public or reachable MCP endpoint. |

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

ChatGPT custom connectors and the OpenAI Responses API MCP tool use **remote MCP
servers** reachable through HTTP/SSE or Streamable HTTP. This repository is
currently a local stdio server because it controls local After Effects and local
project files.

Recommended roadmap for ChatGPT support:

1. Add a remote transport entrypoint, for example `motionpilot-ae-mcp-http`.
2. Bind it to localhost by default.
3. Add authentication before exposing it beyond the local machine.
4. For ChatGPT testing, expose the server through a secure tunnel only when
   needed.
5. Keep write operations gated by explicit tool approval.

Because this tool can open After Effects, write `.aep` files, render videos, and
delete layers, do not expose it publicly without authentication and network
access controls.

## First test prompt

After connecting from any supported local host, run:

```text
Use MotionPilot AE MCP to run check_after_effects_setup and tell me whether
After Effects and aerender were found.
```

