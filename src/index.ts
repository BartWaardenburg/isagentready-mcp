#!/usr/bin/env node

import { createRequire } from "node:module";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
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
const server = createServer(client, toolsets);

const main = async (): Promise<void> => {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  // Fire-and-forget — don't block server startup
  void checkForUpdate(name, version);
};

main().catch((error) => {
  console.error("IsAgentReady MCP server failed:", error);
  process.exit(1);
});
