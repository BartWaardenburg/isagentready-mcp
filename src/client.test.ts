import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { IsAgentReadyClient, IsAgentReadyApiError } from "./client.js";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

const jsonResponse = (data: unknown, status = 200): Response =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });

const completedScan = {
  id: "abc-123",
  domain: "example.com",
  status: "completed",
  overall_score: 72,
  letter_grade: "B",
  scan_duration_ms: 18500,
  completed_at: "2025-01-15T10:30:00Z",
  categories: [],
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

describe("IsAgentReadyClient", () => {
  let client: IsAgentReadyClient;

  afterEach(() => {
    vi.restoreAllMocks();
  });

  beforeEach(() => {
    mockFetch.mockReset();
    client = new IsAgentReadyClient("https://api.test.com", { maxRetries: 0 });
  });

  describe("request building", () => {
    it("sends Content-Type header", async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse(completedScan));

      await client.getScanResults("example.com");

      const [, init] = mockFetch.mock.calls[0];
      const headers = init.headers as Headers;
      expect(headers.get("Content-Type")).toBe("application/json");
    });

    it("encodes domain in URL path", async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse(completedScan));

      await client.getScanResults("ex ample.com");

      const [url] = mockFetch.mock.calls[0];
      expect(url).toContain("ex%20ample.com");
    });

    it("strips trailing slash from baseUrl", async () => {
      const c = new IsAgentReadyClient("https://api.test.com/", { maxRetries: 0 });
      mockFetch.mockResolvedValueOnce(jsonResponse(completedScan));

      await c.getScanResults("example.com");

      const [url] = mockFetch.mock.calls[0];
      expect(url).toContain("api.test.com/api/v1");
      expect(url).not.toContain(".com//api");
    });
  });

  describe("getScanResults", () => {
    it("returns completed scan results", async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse(completedScan));

      const result = await client.getScanResults("example.com");

      expect(result).toEqual(completedScan);
      const [url] = mockFetch.mock.calls[0];
      expect(url).toContain("/api/v1/scan/example.com");
    });

    it("returns pending scan", async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse(pendingScan));

      const result = await client.getScanResults("example.com");

      expect(result.status).toBe("pending");
    });

    it("caches results", async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse(completedScan));

      await client.getScanResults("example.com");
      const result = await client.getScanResults("example.com");

      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(result).toEqual(completedScan);
    });

    it("throws on 404", async () => {
      mockFetch.mockResolvedValueOnce(
        jsonResponse({ error: "No scan found" }, 404),
      );

      await expect(client.getScanResults("unknown.com")).rejects.toThrow(IsAgentReadyApiError);
    });
  });

  describe("createScan", () => {
    it("sends POST with url in body", async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse(enqueuedScan, 202));

      await client.createScan("https://example.com");

      const [url, init] = mockFetch.mock.calls[0];
      expect(url).toContain("/api/v1/scan");
      expect(init.method).toBe("POST");
      expect(JSON.parse(init.body as string)).toEqual({ url: "https://example.com" });
    });

    it("returns enqueued scan", async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse(enqueuedScan, 202));

      const result = await client.createScan("https://example.com");

      expect(result.status).toBe("pending");
      expect(result.domain).toBe("example.com");
    });

    it("returns cached result when cooldown", async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse(completedScan));

      const result = await client.createScan("https://example.com");

      expect(result.status).toBe("completed");
    });

    it("invalidates scan and rankings cache", async () => {
      // Prime cache
      mockFetch.mockResolvedValueOnce(jsonResponse(completedScan));
      await client.getScanResults("example.com");

      // createScan should invalidate
      mockFetch.mockResolvedValueOnce(jsonResponse(enqueuedScan, 202));
      await client.createScan("https://example.com");

      // Next getScanResults should fetch again
      mockFetch.mockResolvedValueOnce(jsonResponse(completedScan));
      await client.getScanResults("example.com");

      expect(mockFetch).toHaveBeenCalledTimes(3);
    });

    it("throws on 422 invalid URL", async () => {
      mockFetch.mockResolvedValueOnce(
        jsonResponse({ error: "Invalid URL" }, 422),
      );

      await expect(client.createScan("not-a-url")).rejects.toThrow(IsAgentReadyApiError);
    });
  });

  describe("getRankings", () => {
    const rankingsResponse = {
      entries: [completedScan],
      total: 1,
      page: 1,
      per_page: 25,
      total_pages: 1,
    };

    it("fetches rankings with default params", async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse(rankingsResponse));

      const result = await client.getRankings();

      expect(result.entries).toHaveLength(1);
      const [url] = mockFetch.mock.calls[0];
      expect(url).toContain("/api/v1/rankings");
    });

    it("builds query params correctly", async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse(rankingsResponse));

      await client.getRankings({
        page: 2,
        per_page: 10,
        grade_range: "high",
        search: "example",
        sort: "score_asc",
      });

      const [url] = mockFetch.mock.calls[0];
      expect(url).toContain("page=2");
      expect(url).toContain("per_page=10");
      expect(url).toContain("grade_range=high");
      expect(url).toContain("search=example");
      expect(url).toContain("sort=score_asc");
    });

    it("caches rankings", async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse(rankingsResponse));

      await client.getRankings({ page: 1 });
      await client.getRankings({ page: 1 });

      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it("uses different cache keys for different params", async () => {
      mockFetch
        .mockResolvedValueOnce(jsonResponse(rankingsResponse))
        .mockResolvedValueOnce(jsonResponse({ ...rankingsResponse, page: 2 }));

      await client.getRankings({ page: 1 });
      await client.getRankings({ page: 2 });

      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });

  describe("error handling", () => {
    it("wraps HTTP errors in IsAgentReadyApiError", async () => {
      mockFetch.mockResolvedValueOnce(
        jsonResponse({ error: "Server error" }, 500),
      );

      try {
        await client.getScanResults("example.com");
        expect.unreachable("should throw");
      } catch (error) {
        expect(error).toBeInstanceOf(IsAgentReadyApiError);
        const apiError = error as IsAgentReadyApiError;
        expect(apiError.status).toBe(500);
        expect(apiError.message).toBe("Server error");
      }
    });

    it("handles non-JSON error responses", async () => {
      mockFetch.mockResolvedValueOnce(
        new Response("Internal Server Error", { status: 500 }),
      );

      try {
        await client.getScanResults("example.com");
        expect.unreachable("should throw");
      } catch (error) {
        expect(error).toBeInstanceOf(IsAgentReadyApiError);
        expect((error as IsAgentReadyApiError).status).toBe(500);
      }
    });
  });

  describe("retry logic", () => {
    it("retries on 429 with Retry-After header", async () => {
      const retryClient = new IsAgentReadyClient("https://api.test.com", { maxRetries: 1 });

      mockFetch
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ error: "Rate limited" }), {
            status: 429,
            headers: { "retry-after": "0", "content-type": "application/json" },
          }),
        )
        .mockResolvedValueOnce(jsonResponse(completedScan));

      const result = await retryClient.getScanResults("example.com");

      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(result).toEqual(completedScan);
    });

    it("throws after exhausting retries on 429", async () => {
      const retryClient = new IsAgentReadyClient("https://api.test.com", { maxRetries: 1 });

      mockFetch
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ error: "Rate limited" }), {
            status: 429,
            headers: { "retry-after": "0", "content-type": "application/json" },
          }),
        )
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ error: "Rate limited" }), {
            status: 429,
            headers: { "retry-after": "0", "content-type": "application/json" },
          }),
        );

      await expect(retryClient.getScanResults("example.com")).rejects.toThrow(IsAgentReadyApiError);
    });
  });
});
