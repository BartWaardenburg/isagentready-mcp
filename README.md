# isagentready-mcp

MCP server for scanning websites for AI agent readiness via the [IsAgentReady](https://isagentready.com) API.

Scan any website and get a detailed report with scores, letter grades, and actionable recommendations across 5 categories: Discovery, Structured Data, Semantics, Agent Protocols, and Security.

## Features

- **3 MCP tools** for scanning, retrieving results, and browsing rankings
- **No API key required** — public API
- **Built-in caching** with configurable TTL
- **Retry logic** with exponential backoff and rate limit handling
- **Structured content** returned alongside human-readable text

## Installation

### Claude Code

```bash
claude mcp add isagentready-mcp -- npx isagentready-mcp
```

### Claude Desktop / Cursor / Windsurf

Add to your MCP config:

```json
{
  "mcpServers": {
    "isagentready": {
      "command": "npx",
      "args": ["isagentready-mcp"]
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

## Available Tools

### Scans

| Tool | Description |
|------|-------------|
| `scan_website` | Trigger a new scan of a website for AI agent readiness. Returns cached results if scanned within the last hour. |
| `get_scan_results` | Get the latest scan results for a domain with scores, grades, and recommendations. |

### Rankings

| Tool | Description |
|------|-------------|
| `get_rankings` | Browse paginated AI readiness rankings with filtering and sorting. |

## Toolset Filtering

Enable only the tools you need:

```json
{
  "mcpServers": {
    "isagentready": {
      "command": "npx",
      "args": ["isagentready-mcp"],
      "env": {
        "ISAGENTREADY_TOOLSETS": "scans"
      }
    }
  }
}
```

Available toolsets: `scans`, `rankings`

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
