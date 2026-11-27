#!/usr/bin/env node

import { createRequire } from "node:module";
import { serveStdio } from "@modelcontextprotocol/server/stdio";
import { IsAgentReadyClient } from "./client.js";
import { createServer, parseToolsets } from "./server.js";
import { checkForUpdate } from "./update-checker.js";

const require = createRequire(import.meta.url);
const { name, version } = require("../package.json") as { name: string; version: string };

const cacheTtl = process.env.ISAGENTREADY_CACHE_TTL !== undefined
  ? parseInt(process.env.ISAGENTREADY_CACHE_TTL, 10) * 1000
  : undefined;
const maxRetries = process.env.ISAGENTREADY_MAX_RETRIES !== undefined
  ? parseInt(process.env.ISAGENTREADY_MAX_RETRIES, 10)
  : 3;
const baseUrl = process.env.ISAGENTREADY_BASE_URL ?? "https://isagentready.com";

const client = new IsAgentReadyClient(baseUrl, { maxRetries, cacheTtlMs: cacheTtl });
const toolsets = parseToolsets(process.env.ISAGENTREADY_TOOLSETS);

// serveStdio serves 2026-07-28 clients and clients that open with the 2025 handshake.
serveStdio(() => createServer(client, toolsets), {
  onerror: (error) => console.error("IsAgentReady MCP server error:", error),
});

// Do not wait for the update check: the server must start at once.
void checkForUpdate(name, version);
