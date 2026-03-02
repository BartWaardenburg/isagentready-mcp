import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import * as z from "zod/v4";
import type { IsAgentReadyClient } from "../client.js";
import type { ScanResult } from "../types.js";
import { formatScanResult } from "../format.js";
import { toTextResult, toErrorResult } from "../tool-result.js";

export const registerScanTools = (server: McpServer, client: IsAgentReadyClient): void => {
  server.registerTool(
    "scan_website",
    {
      title: "Scan Website for AI Agent Readiness",
      description:
        "Trigger a new scan of a website for AI agent readiness. The scan runs asynchronously and typically takes 15-30 seconds. If a recent scan exists (within 1 hour), returns cached results. Use get_scan_results to poll for completed results.",
      annotations: { readOnlyHint: false, openWorldHint: true },
      inputSchema: z.object({
        url: z
          .string()
          .min(1)
          .describe("The full URL to scan (must be http:// or https://)"),
      }),
    },
    async ({ url }) => {
      try {
        const result = await client.createScan(url);

        if (result.status === "completed") {
          const scan = result as ScanResult;
          return toTextResult(
            `Recent scan found (cached):\n\n${formatScanResult(scan)}`,
            { type: "cached_result", ...scan },
          );
        }

        return toTextResult(
          [
            `Scan enqueued for ${result.domain}`,
            `Status: ${result.status}`,
            `ID: ${result.id}`,
            "message" in result ? `Message: ${result.message}` : "",
            "",
            `Poll with get_scan_results for domain "${result.domain}" to check when results are ready.`,
          ]
            .filter(Boolean)
            .join("\n"),
          { type: "enqueued", id: result.id, domain: result.domain, status: result.status },
        );
      } catch (error) {
        return toErrorResult(error);
      }
    },
  );

  server.registerTool(
    "get_scan_results",
    {
      title: "Get Scan Results",
      description:
        "Get the latest scan results for a domain, including overall score, letter grade, per-category breakdowns, and individual checkpoint results with actionable recommendations. Returns a pending status if the scan is still in progress.",
      annotations: { readOnlyHint: true, openWorldHint: true },
      inputSchema: z.object({
        domain: z
          .string()
          .min(1)
          .describe("The domain to get scan results for (e.g., example.com)"),
      }),
    },
    async ({ domain }) => {
      try {
        const result = await client.getScanResults(domain);

        if (result.status === "pending" || result.status === "running") {
          return toTextResult(
            [
              `Scan for ${result.domain} is ${result.status}.`,
              "message" in result ? (result as { message: string }).message : "",
              "",
              "Poll again in a few seconds to check for completion.",
            ]
              .filter(Boolean)
              .join("\n"),
            { type: "pending", id: result.id, domain: result.domain, status: result.status },
          );
        }

        const scan = result as ScanResult;
        return toTextResult(formatScanResult(scan), { type: "completed", ...scan });
      } catch (error) {
        return toErrorResult(error);
      }
    },
  );
};
