# isagentready-mcp

[![npm version](https://img.shields.io/npm/v/isagentready-mcp.svg)](https://www.npmjs.com/package/isagentready-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/node-%3E%3D20-brightgreen.svg)](https://nodejs.org/)
[![CI](https://github.com/bartwaardenburg/isagentready-mcp/actions/workflows/ci.yml/badge.svg)](https://github.com/bartwaardenburg/isagentready-mcp/actions/workflows/ci.yml)
[![Coverage](https://img.shields.io/endpoint?url=https://gist.githubusercontent.com/BartWaardenburg/dc467336d6825cc861b82bee7a38397c/raw/isagentready-mcp-coverage.json)](https://bartwaardenburg.github.io/isagentready-mcp/)
[![MCP](https://img.shields.io/badge/MCP-compatible-purple.svg)](https://modelcontextprotocol.io)

A [Model Context Protocol](https://modelcontextprotocol.io) (MCP) server for the [IsAgentReady](https://isagentready.com) API. Scan any website for AI agent readiness and get detailed reports with scores, letter grades, and actionable recommendations across 5 categories: Discovery, Structured Data, Semantics, Agent Protocols, and Security.

## Add To Your Editor

CLI one-liners — the fastest way to get started. Pick your tool:

### Claude Code

```bash
claude mcp add isagentready-mcp -- npx -y isagentready-mcp
```

### Codex CLI (OpenAI)

```bash
codex mcp add isagentready-mcp -- npx -y isagentready-mcp
```

### Gemini CLI (Google)

```bash
gemini mcp add isagentready-mcp -- npx -y isagentready-mcp
```

### VS Code (Copilot)

Open the Command Palette (`Cmd+Shift+P` / `Ctrl+Shift+P`) > `MCP: Add Server` > select **Command (stdio)**.

Or add to `.vscode/mcp.json` in your project directory:

```json
{
  "servers": {
    "isagentready-mcp": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "isagentready-mcp"]
    }
  }
}
```

### Cursor

Add to `.cursor/mcp.json` in your project directory (or `~/.cursor/mcp.json` for global):

```json
{
  "mcpServers": {
    "isagentready-mcp": {
      "command": "npx",
      "args": ["-y", "isagentready-mcp"]
    }
  }
}
```

## Supported Clients

This MCP server works with any client that supports the Model Context Protocol, including:

| Client | Easiest install |
|---|---|
| [Claude Code](https://docs.anthropic.com/en/docs/claude-code) | One-liner: `claude mcp add` |
| [Codex CLI](https://github.com/openai/codex) (OpenAI) | One-liner: `codex mcp add` |
| [Gemini CLI](https://github.com/google-gemini/gemini-cli) (Google) | One-liner: `gemini mcp add` |
| [VS Code](https://code.visualstudio.com/) (Copilot) | Command Palette: `MCP: Add Server` |
| [Claude Desktop](https://claude.ai/download) | JSON config file |
| [Cursor](https://cursor.com) | JSON config file |
| [Windsurf](https://codeium.com/windsurf) | JSON config file |
| [Cline](https://github.com/cline/cline) | UI settings |
| [Zed](https://zed.dev) | JSON settings file |

<details>
<summary><strong>Claude Desktop, Cowork & other GUI clients (expand)</strong></summary>

### Claude Desktop / Cowork

Cowork runs inside Claude Desktop and uses the same connected MCP servers and permissions. Configure once in Claude Desktop, then the server is available in Cowork.

Add to your Claude Desktop config file:

| Platform | Config file |
|---|---|
| macOS | `~/Library/Application Support/Claude/claude_desktop_config.json` |
| Windows | `%APPDATA%\Claude\claude_desktop_config.json` |

```json
{
  "mcpServers": {
    "isagentready-mcp": {
      "command": "npx",
      "args": ["-y", "isagentready-mcp"]
    }
  }
}
```

### Windsurf / Cline

| Client | Config location |
|---|---|
| Windsurf | `~/.codeium/windsurf/mcp_config.json` |
| Cline | Settings > MCP Servers > Edit |

```json
{
  "mcpServers": {
    "isagentready-mcp": {
      "command": "npx",
      "args": ["-y", "isagentready-mcp"]
    }
  }
}
```

### Zed

Add to your Zed settings (`~/.zed/settings.json` on macOS, `~/.config/zed/settings.json` on Linux):

```json
{
  "context_servers": {
    "isagentready-mcp": {
      "command": "npx",
      "args": ["-y", "isagentready-mcp"]
    }
  }
}
```

### Docker

```bash
docker run -i --rm ghcr.io/bartwaardenburg/isagentready-mcp
```

### Generic MCP Server Config

Use this in any MCP host that supports stdio servers:

- **Command:** `npx`
- **Args:** `["-y", "isagentready-mcp"]`
- **Optional env vars:** `ISAGENTREADY_CACHE_TTL`, `ISAGENTREADY_MAX_RETRIES`, `ISAGENTREADY_TOOLSETS` (see [Configuration](#configuration))

Host key mapping:

| Host | Top-level key | Notes |
|---|---|---|
| VS Code | `servers` | Add `"type": "stdio"` on the server object |
| Claude Desktop / Cursor / Windsurf / Cline | `mcpServers` | Same command/args block |
| Zed | `context_servers` | Same command/args block |
| Codex CLI (TOML) | `mcp_servers` | Uses TOML, shown below |

### Codex CLI (TOML config alternative)

If you prefer editing `~/.codex/config.toml` directly:

```toml
[mcp_servers.isagentready-mcp]
command = "npx"
args = ["-y", "isagentready-mcp"]
```

### Other MCP Clients

For any MCP-compatible client, use this server configuration:

- **Command:** `npx`
- **Args:** `["-y", "isagentready-mcp"]`
- **No environment variables required**

### Claude Ecosystem Notes

Claude currently has multiple MCP-related concepts that are easy to mix up:

- **Local MCP servers (Claude Desktop):** defined in `claude_desktop_config.json` and started on your machine ([docs](https://support.claude.com/en/articles/10949351-getting-started-with-local-mcp-servers-on-claude-desktop)).
- **Cowork:** reuses the MCP servers connected in Claude Desktop ([docs](https://support.claude.com/en/articles/13345190-get-started-with-cowork)).
- **Connectors:** remote MCP integrations managed in Claude ([docs](https://support.claude.com/en/articles/11176164-use-connectors-to-extend-claude-s-capabilities)).
- **Cowork plugins:** Claude-specific workflow packaging (instructions + tools/data integrations) ([docs](https://support.claude.com/en/articles/13837440-use-plugins-in-cowork)). Useful in Claude, but not portable as a generic MCP server config for other agent clients.

Verified against vendor docs on **2026-03-05**.

### Terminology

What is portable across hosts:

- MCP server runtime settings (`command`, `args`, `env`)
- Transport model (`stdio` command server)
- Tool names and tool schemas exposed by this server

What is host/vendor-specific (not portable as-is):

- Host config key names (`servers`, `mcpServers`, `context_servers`, `mcp_servers`)
- Host UX/workflows for adding servers (CLI commands, UI menus, settings paths)
- Anthropic-specific concepts such as [Claude Desktop local MCP servers](https://docs.anthropic.com/en/docs/claude-desktop/mcp), [Claude Connectors via remote MCP](https://docs.anthropic.com/en/docs/agents-and-tools/remote-mcp-servers), and [Claude Code plugins](https://docs.anthropic.com/en/docs/claude-code/plugins) used in Cowork workflows

</details>

## Features

- **3 MCP tools** for scanning, retrieving results, and browsing rankings
- **No API key required** — public API, zero configuration needed
- **Built-in caching** with configurable TTL and automatic invalidation on scans
- **Retry logic** with exponential backoff and `Retry-After` header support
- **Structured content** returned alongside human-readable text
- **Toolset filtering** to expose only the tool categories you need
- **Actionable error messages** with context-aware recovery suggestions
- **Docker support** for containerized deployment
- **97 unit tests** across 7 test files

## Configuration

All configuration is optional via environment variables:

| Variable | Description | Default |
|---|---|---|
| `ISAGENTREADY_CACHE_TTL` | Response cache lifetime in seconds. Set to `0` to disable caching. | `120` |
| `ISAGENTREADY_MAX_RETRIES` | Maximum retry attempts for rate-limited (429) requests with exponential backoff. | `3` |
| `ISAGENTREADY_BASE_URL` | API base URL. | `https://isagentready.com` |
| `ISAGENTREADY_TOOLSETS` | Comma-separated list of tool categories to enable (see [Toolset Filtering](#toolset-filtering)). | All toolsets |

### Example with configuration

```json
{
  "mcpServers": {
    "isagentready-mcp": {
      "command": "npx",
      "args": ["-y", "isagentready-mcp"],
      "env": {
        "ISAGENTREADY_CACHE_TTL": "300",
        "ISAGENTREADY_MAX_RETRIES": "5"
      }
    }
  }
}
```

## Available Tools

### Scans

| Tool | Description |
|---|---|
| `scan_website` | Trigger a new scan of a website for AI agent readiness. Returns cached results if scanned within the last hour. |
| `get_scan_results` | Get the latest scan results for a domain with scores, grades, and recommendations. |

### Rankings

| Tool | Description |
|---|---|
| `get_rankings` | Browse paginated AI readiness rankings with filtering by grade range, search, and sorting. |

## Toolset Filtering

Reduce context window usage by enabling only the tool categories you need. Set the `ISAGENTREADY_TOOLSETS` environment variable to a comma-separated list:

```bash
ISAGENTREADY_TOOLSETS=scans
```

| Toolset | Tools included |
|---|---|
| `scans` | `scan_website`, `get_scan_results` |
| `rankings` | `get_rankings` |

When not set, all toolsets are enabled. Invalid names are ignored; if all names are invalid, all toolsets are enabled as a fallback.

## Security Notes

- **Trust model:** Any prompt or agent allowed to call this MCP server can trigger website scans and retrieve results via the IsAgentReady API.
- **No credentials required:** This server uses a public API, so there are no secrets to protect. However, scan requests reveal which domains you are evaluating.
- **Team config governance:** Keep shared MCP config in version control and require review for changes to command/args/env/toolset filtering.

## Example Usage

Once connected, you can interact with the IsAgentReady API using natural language:

- "Scan example.com for AI agent readiness"
- "Check if the scan results for example.com are ready"
- "Show me the top AI-ready websites"
- "Search the rankings for sites in the high grade range"
- "How does my site compare to others?"

### Scan + fix workflow

Combine with the [isagentready-skills](https://github.com/bartwaardenburg/isagentready-skills) agent skills for a full scan, fix, and re-verify workflow:

```
> Scan example.com for AI agent readiness

Scan enqueued for example.com
Status: pending

> Check the results for example.com

Domain: example.com
Grade: B (72/100)
Status: completed

Discovery — 15/20 (75%, weight: 30%)
  [PASS] 1.1 robots.txt (5/5)
  [FAIL] 1.2 sitemap.xml (0/5)
    Recommendation: Add a sitemap.xml file...

> Fix the failing checkpoints
```

## Community

- Support: [SUPPORT.md](SUPPORT.md)
- Security reporting: [SECURITY.md](SECURITY.md)
- Contributing guidelines: [CONTRIBUTING.md](CONTRIBUTING.md)
- Bug reports and feature requests: [Issues](https://github.com/bartwaardenburg/isagentready-mcp/issues)

## Development

```bash
# Install dependencies
pnpm install

# Run in development mode
pnpm dev

# Build for production
pnpm build

# Run tests
pnpm test

# Type check
pnpm typecheck
```

### Project Structure

```
src/
  index.ts              # Entry point (stdio transport)
  server.ts             # MCP server setup, toolset filtering
  client.ts             # IsAgentReady API HTTP client with caching and retry
  cache.ts              # TTL-based in-memory response cache
  types.ts              # TypeScript interfaces
  format.ts             # Output formatting helpers
  tool-result.ts        # Error formatting with recovery suggestions
  update-checker.ts     # NPM update notifications
  tools/
    scans.ts            # scan_website, get_scan_results
    rankings.ts         # get_rankings
```

## Requirements

- Node.js >= 20

## Related

- [isagentready-skills](https://github.com/bartwaardenburg/isagentready-skills) — Agent skills for fixing AI readiness issues identified by scans
- [IsAgentReady.com](https://isagentready.com) — The web scanner

## License

MIT — see [LICENSE](LICENSE) for details.
