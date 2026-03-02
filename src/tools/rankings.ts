import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import * as z from "zod/v4";
import type { IsAgentReadyClient } from "../client.js";
import { formatScanSummary } from "../format.js";
import { toTextResult, toErrorResult } from "../tool-result.js";

export const registerRankingTools = (server: McpServer, client: IsAgentReadyClient): void => {
  server.registerTool(
    "get_rankings",
    {
      title: "Get AI Readiness Rankings",
      description:
        "Get a paginated, sorted list of website AI readiness scores. Supports filtering by grade range (high/mid/low), search by domain name, and sorting by score, domain, or newest.",
      annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: true },
      inputSchema: z.object({
        page: z.number().int().min(1).default(1).describe("Page number (default: 1)"),
        per_page: z
          .number()
          .int()
          .min(1)
          .max(100)
          .default(25)
          .describe("Results per page (1-100, default: 25)"),
        grade_range: z
          .enum(["high", "mid", "low"])
          .optional()
          .describe("Filter by grade range: high (A/A+), mid (B/C), low (D/F)"),
        search: z.string().optional().describe("Search by domain name"),
        sort: z
          .enum(["score_desc", "score_asc", "domain", "newest"])
          .default("score_desc")
          .describe("Sort order (default: score_desc)"),
      }),
    },
    async ({ page, per_page, grade_range, search, sort }) => {
      try {
        const result = await client.getRankings({ page, per_page, grade_range, search, sort });

        const lines = [
          `AI Readiness Rankings — Page ${result.page}/${result.total_pages} (${result.total} total)`,
          "",
          ...result.entries.map(
            (entry, i) =>
              `${(result.page - 1) * result.per_page + i + 1}. ${formatScanSummary(entry)}`,
          ),
        ];

        if (result.entries.length === 0) {
          lines.push("No results found.");
        }

        return toTextResult(lines.join("\n"), {
          type: "rankings",
          page: result.page,
          per_page: result.per_page,
          total: result.total,
          total_pages: result.total_pages,
          entries: result.entries,
        });
      } catch (error) {
        return toErrorResult(error);
      }
    },
  );
};
