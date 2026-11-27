import { createRequire } from "node:module";
import { McpServer } from "@modelcontextprotocol/server";
import type { IsAgentReadyClient } from "./client.js";
import { registerScanTools } from "./tools/scans.js";
import { registerRankingTools } from "./tools/rankings.js";

const require = createRequire(import.meta.url);
const { version } = require("../package.json") as { version: string };

export type Toolset = "scans" | "rankings";

const ALL_TOOLSETS: Toolset[] = ["scans", "rankings"];

export const parseToolsets = (env?: string): Set<Toolset> => {
  if (!env) return new Set(ALL_TOOLSETS);

  const requested = env.split(",").map((s) => s.trim().toLowerCase());
  const valid = new Set<Toolset>();

  for (const name of requested) {
    if (ALL_TOOLSETS.includes(name as Toolset)) {
      valid.add(name as Toolset);
    }
  }

  return valid.size > 0 ? valid : new Set(ALL_TOOLSETS);
};

const INSTRUCTIONS = [
  "Scan public websites for AI agent readiness with the IsAgentReady API.",
  "To check a site, call scan_website with the full URL. A new scan takes 15 to 30 seconds.",
  "Then call get_scan_results with the domain until the status is completed.",
  "Use get_rankings to compare a site with other scanned sites.",
].join("\n");

type ToolRegisterer = (server: McpServer, client: IsAgentReadyClient) => void;

const toolsetRegistry: Record<Toolset, ToolRegisterer[]> = {
  scans: [registerScanTools],
  rankings: [registerRankingTools],
};

export const createServer = (
  client: IsAgentReadyClient,
  toolsets?: Set<Toolset>,
): McpServer => {
  const server = new McpServer(
    {
      name: "isagentready-mcp",
      title: "IsAgentReady",
      version,
      websiteUrl: "https://isagentready.com",
    },
    { instructions: INSTRUCTIONS },
  );

  const enabled = toolsets ?? new Set(ALL_TOOLSETS);
  const registered = new Set<ToolRegisterer>();

  // Iterate the fixed list, not the user input, so tools/list has one stable order.
  for (const toolset of ALL_TOOLSETS.filter((t) => enabled.has(t))) {
    const registerers = toolsetRegistry[toolset];

    for (const register of registerers) {
      if (!registered.has(register)) {
        registered.add(register);
        register(server, client);
      }
    }
  }

  return server;
};
