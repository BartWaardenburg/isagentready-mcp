# isagentready-mcp

[![npm version](https://img.shields.io/npm/v/isagentready-mcp)](https://www.npmjs.com/package/isagentready-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/node-%3E%3D20-brightgreen)](https://nodejs.org)
[![CI](https://github.com/bartwaardenburg/isagentready-mcp/actions/workflows/ci.yml/badge.svg)](https://github.com/bartwaardenburg/isagentready-mcp/actions/workflows/ci.yml)

MCP server for scanning websites for AI agent readiness via the [IsAgentReady](https://isagentready.com) API.

Scan any website and get a detailed report with scores, letter grades, and actionable recommendations across 5 categories: Discovery, Structured Data, Semantics, Agent Protocols, and Security.

## Features

- **3 MCP tools** for scanning, retrieving results, and browsing rankings
- **No API key required** — public API
- **Built-in caching** with configurable TTL
- **Retry logic** with exponential backoff and rate limit handling
- **Structured content** returned alongside human-readable text
- **Toolset filtering** to reduce context window usage

## Supported Clients

Works with any MCP-compatible client:

- [Claude Code](https://docs.anthropic.com/en/docs/claude-code)
- [Claude Desktop](https://claude.ai/download)
- [Cursor](https://cursor.sh)
- [Windsurf](https://codeium.com/windsurf)
- [VS Code (GitHub Copilot)](https://code.visualstudio.com)
- [Cline](https://github.com/cline/cline)
- [Zed](https://zed.dev)
- [Codex](https://github.com/openai/codex)

## Installation

### Claude Code

```bash
claude mcp add isagentready-mcp -- npx isagentready-mcp
```

### Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "isagentready": {
      "command": "npx",
      "args": ["-y", "isagentready-mcp"]
    }
  }
}
```

### Cursor

Add to `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "isagentready": {
      "command": "npx",
      "args": ["-y", "isagentready-mcp"]
    }
  }
}
```

### VS Code

Add to `.vscode/mcp.json`:

```json
{
  "servers": {
    "isagentready": {
      "command": "npx",
      "args": ["-y", "isagentready-mcp"]
    }
  }
}
```

### Windsurf

Add to `~/.codeium/windsurf/mcp_config.json`:

```json
{
  "mcpServers": {
    "isagentready": {
      "command": "npx",
      "args": ["-y", "isagentready-mcp"]
    }
  }
}
```

### Docker

```bash
docker run -i ghcr.io/bartwaardenburg/isagentready-mcp
```

## Configuration

All configuration is optional via environment variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `ISAGENTREADY_CACHE_TTL` | Cache TTL in seconds | `120` |
| `ISAGENTREADY_MAX_RETRIES` | Max retry attempts | `3` |
| `ISAGENTREADY_BASE_URL` | API base URL | `https://isagentready.com` |
| `ISAGENTREADY_TOOLSETS` | Comma-separated toolset filter | all |

### Example with configuration

```json
{
  "mcpServers": {
    "isagentready": {
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
|------|-------------|
| `scan_website` | Trigger a new scan of a website for AI agent readiness. Returns cached results if scanned within the last hour. |
| `get_scan_results` | Get the latest scan results for a domain with scores, grades, and recommendations. |

### Rankings

| Tool | Description |
|------|-------------|
| `get_rankings` | Browse paginated AI readiness rankings with filtering by grade range, search, and sorting. |

## Toolset Filtering

Enable only the tools you need to reduce context window usage:

```json
{
  "mcpServers": {
    "isagentready": {
      "command": "npx",
      "args": ["-y", "isagentready-mcp"],
      "env": {
        "ISAGENTREADY_TOOLSETS": "scans"
      }
    }
  }
}
```

Available toolsets: `scans`, `rankings`

## Example Usage

### Scan a website

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
```

### Browse rankings

```
> Show me the top AI-ready websites

AI Readiness Rankings — Page 1/10 (250 total)

1. example.com — Grade: A+ (95/100)
2. another.com — Grade: A (88/100)
```

## Development

```bash
git clone https://github.com/bartwaardenburg/isagentready-mcp.git
cd isagentready-mcp
pnpm install
pnpm test
pnpm build
```

### Project Structure

```
src/
├── index.ts              # Entry point (stdio transport)
├── server.ts             # MCP server & toolset management
├── client.ts             # IsAgentReady API client
├── types.ts              # TypeScript type definitions
├── cache.ts              # TTL-based in-memory cache
├── format.ts             # Output formatting helpers
├── tool-result.ts        # Error handling with recovery suggestions
├── update-checker.ts     # npm update checker
└── tools/
    ├── scans.ts          # scan_website, get_scan_results
    └── rankings.ts       # get_rankings
```

## License

MIT
