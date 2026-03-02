import { describe, it, expect, vi, beforeEach } from "vitest";
import type { IsAgentReadyClient } from "../client.js";
import { IsAgentReadyApiError } from "../client.js";
import { registerScanTools } from "./scans.js";
import { registerRankingTools } from "./rankings.js";

type ToolHandler = (input: Record<string, unknown>) => Promise<unknown>;

interface ToolResult {
  content: { type: string; text: string }[];
  isError?: boolean;
  structuredContent?: Record<string, unknown>;
}

const createMockServer = () => {
  const handlers = new Map<string, ToolHandler>();
  return {
    registerTool: vi.fn((name: string, _config: unknown, handler: ToolHandler) => {
      handlers.set(name, handler);
    }),
    getHandler: (name: string): ToolHandler => {
      const handler = handlers.get(name);
      if (!handler) throw new Error(`No handler registered for "${name}"`);
      return handler;
    },
  };
};

const apiError = new IsAgentReadyApiError("API failed", 500, { code: "INTERNAL" });

const createMockClient = (): Record<string, ReturnType<typeof vi.fn>> => ({
  getScanResults: vi.fn(),
  createScan: vi.fn(),
  getRankings: vi.fn(),
});

const getText = (result: ToolResult): string => result.content[0].text;

const completedScan = {
  id: "abc-123",
  domain: "example.com",
  status: "completed",
  overall_score: 72,
  letter_grade: "B",
  scan_duration_ms: 18500,
  completed_at: "2025-01-15T10:30:00Z",
  categories: [
    {
      category: "discovery",
      label: "Discovery",
      score: 15,
      max_score: 20,
      weight: 30,
      checkpoints: [
        {
          id: "1.1",
          name: "robots.txt",
          status: "pass",
          score: 5,
          max_score: 5,
          details: "Found valid robots.txt",
          recommendation: "",
          why: "Tells crawlers what to index",
        },
      ],
    },
  ],
};

const pendingScan = {
  id: "def-456",
  domain: "example.com",
  status: "pending",
  message: "Scan is being processed",
};

const enqueuedScan = {
  id: "ghi-789",
  domain: "example.com",
  status: "pending",
  poll_url: "/api/v1/scan/example.com",
  message: "Scan enqueued",
};

describe("Scan Tools", () => {
  let server: ReturnType<typeof createMockServer>;
  let client: Record<string, ReturnType<typeof vi.fn>>;

  beforeEach(() => {
    server = createMockServer();
    client = createMockClient();
    registerScanTools(server as never, client as unknown as IsAgentReadyClient);
  });

  describe("scan_website", () => {
    it("returns enqueued status for new scan", async () => {
      client.createScan.mockResolvedValue(enqueuedScan);

      const result = (await server.getHandler("scan_website")({
        url: "https://example.com",
      })) as ToolResult;

      expect(result.isError).toBeUndefined();
      expect(getText(result)).toContain("Scan enqueued");
      expect(getText(result)).toContain("example.com");
      expect(result.structuredContent?.type).toBe("enqueued");
    });

    it("returns cached result when cooldown", async () => {
      client.createScan.mockResolvedValue(completedScan);

      const result = (await server.getHandler("scan_website")({
        url: "https://example.com",
      })) as ToolResult;

      expect(result.isError).toBeUndefined();
      expect(getText(result)).toContain("cached");
      expect(getText(result)).toContain("example.com");
      expect(getText(result)).toContain("72/100");
      expect(result.structuredContent?.type).toBe("cached_result");
    });

    it("returns error on API failure", async () => {
      client.createScan.mockRejectedValue(apiError);

      const result = (await server.getHandler("scan_website")({
        url: "https://example.com",
      })) as ToolResult;

      expect(result.isError).toBe(true);
      expect(getText(result)).toContain("API failed");
    });

    it("passes url to client", async () => {
      client.createScan.mockResolvedValue(enqueuedScan);

      await server.getHandler("scan_website")({ url: "https://test.org" });

      expect(client.createScan).toHaveBeenCalledWith("https://test.org");
    });
  });

  describe("get_scan_results", () => {
    it("returns completed scan results", async () => {
      client.getScanResults.mockResolvedValue(completedScan);

      const result = (await server.getHandler("get_scan_results")({
        domain: "example.com",
      })) as ToolResult;

      expect(result.isError).toBeUndefined();
      expect(getText(result)).toContain("example.com");
      expect(getText(result)).toContain("B");
      expect(getText(result)).toContain("72/100");
      expect(getText(result)).toContain("Discovery");
      expect(result.structuredContent?.type).toBe("completed");
    });

    it("returns pending status", async () => {
      client.getScanResults.mockResolvedValue(pendingScan);

      const result = (await server.getHandler("get_scan_results")({
        domain: "example.com",
      })) as ToolResult;

      expect(result.isError).toBeUndefined();
      expect(getText(result)).toContain("pending");
      expect(getText(result)).toContain("Poll again");
      expect(result.structuredContent?.type).toBe("pending");
    });

    it("returns running status", async () => {
      client.getScanResults.mockResolvedValue({
        ...pendingScan,
        status: "running",
        message: "Scanning...",
      });

      const result = (await server.getHandler("get_scan_results")({
        domain: "example.com",
      })) as ToolResult;

      expect(getText(result)).toContain("running");
    });

    it("returns error on API failure", async () => {
      client.getScanResults.mockRejectedValue(apiError);

      const result = (await server.getHandler("get_scan_results")({
        domain: "example.com",
      })) as ToolResult;

      expect(result.isError).toBe(true);
      expect(getText(result)).toContain("API failed");
    });

    it("passes domain to client", async () => {
      client.getScanResults.mockResolvedValue(completedScan);

      await server.getHandler("get_scan_results")({ domain: "test.org" });

      expect(client.getScanResults).toHaveBeenCalledWith("test.org");
    });
  });
});

describe("Ranking Tools", () => {
  let server: ReturnType<typeof createMockServer>;
  let client: Record<string, ReturnType<typeof vi.fn>>;

  beforeEach(() => {
    server = createMockServer();
    client = createMockClient();
    registerRankingTools(server as never, client as unknown as IsAgentReadyClient);
  });

  describe("get_rankings", () => {
    const rankingsResponse = {
      entries: [completedScan],
      total: 42,
      page: 1,
      per_page: 25,
      total_pages: 2,
    };

    it("returns formatted rankings", async () => {
      client.getRankings.mockResolvedValue(rankingsResponse);

      const result = (await server.getHandler("get_rankings")({
        page: 1,
        per_page: 25,
        sort: "score_desc",
      })) as ToolResult;

      expect(result.isError).toBeUndefined();
      expect(getText(result)).toContain("Page 1/2");
      expect(getText(result)).toContain("42 total");
      expect(getText(result)).toContain("example.com");
      expect(result.structuredContent?.type).toBe("rankings");
    });

    it("shows 'No results' for empty response", async () => {
      client.getRankings.mockResolvedValue({
        entries: [],
        total: 0,
        page: 1,
        per_page: 25,
        total_pages: 0,
      });

      const result = (await server.getHandler("get_rankings")({
        page: 1,
        per_page: 25,
        sort: "score_desc",
      })) as ToolResult;

      expect(getText(result)).toContain("No results found");
    });

    it("numbers entries correctly on page 2", async () => {
      client.getRankings.mockResolvedValue({
        ...rankingsResponse,
        page: 2,
      });

      const result = (await server.getHandler("get_rankings")({
        page: 2,
        per_page: 25,
        sort: "score_desc",
      })) as ToolResult;

      expect(getText(result)).toContain("26.");
    });

    it("passes all params to client", async () => {
      client.getRankings.mockResolvedValue(rankingsResponse);

      await server.getHandler("get_rankings")({
        page: 3,
        per_page: 10,
        grade_range: "high",
        search: "test",
        sort: "domain",
      });

      expect(client.getRankings).toHaveBeenCalledWith({
        page: 3,
        per_page: 10,
        grade_range: "high",
        search: "test",
        sort: "domain",
      });
    });

    it("returns error on API failure", async () => {
      client.getRankings.mockRejectedValue(apiError);

      const result = (await server.getHandler("get_rankings")({
        page: 1,
        per_page: 25,
        sort: "score_desc",
      })) as ToolResult;

      expect(result.isError).toBe(true);
      expect(getText(result)).toContain("API failed");
    });
  });
});
