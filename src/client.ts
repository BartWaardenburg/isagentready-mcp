import { TtlCache } from "./cache.js";
import type { ScanResult, ScanPending, ScanEnqueued, RankingsResponse } from "./types.js";

export class IsAgentReadyApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "IsAgentReadyApiError";
  }
}

interface ClientOptions {
  maxRetries?: number;
  cacheTtlMs?: number;
}

export class IsAgentReadyClient {
  private readonly baseUrl: string;
  private readonly cache: TtlCache;
  private readonly maxRetries: number;

  constructor(baseUrl = "https://isagentready.com", options: ClientOptions = {}) {
    this.baseUrl = baseUrl.replace(/\/$/, "");
    this.cache = new TtlCache(options.cacheTtlMs ?? 120_000);
    this.maxRetries = options.maxRetries ?? 3;
  }

  private async request<T>(
    method: "GET" | "POST",
    path: string,
    body?: Record<string, unknown>,
    cacheKey?: string,
  ): Promise<T> {
    if (cacheKey) {
      const cached = this.cache.get<T>(cacheKey);
      if (cached !== undefined) return cached;
    }

    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        const url = `${this.baseUrl}${path}`;
        const headers = new Headers({ "Content-Type": "application/json" });

        const init: RequestInit = { method, headers };
        if (body) {
          init.body = JSON.stringify(body);
        }

        const response = await fetch(url, init);

        if (response.status === 429 && attempt < this.maxRetries) {
          const retryAfter = response.headers.get("retry-after");
          const delayMs = retryAfter ? parseInt(retryAfter, 10) * 1000 : Math.pow(2, attempt) * 1000;
          await new Promise((resolve) => setTimeout(resolve, delayMs));
          continue;
        }

        if (!response.ok) {
          const errorBody = await response.json().catch(() => null);
          throw new IsAgentReadyApiError(
            (errorBody as { error?: string } | null)?.error ?? `HTTP ${response.status}`,
            response.status,
            errorBody,
          );
        }

        const data = (await response.json()) as T;

        if (cacheKey) {
          this.cache.set(cacheKey, data);
        }

        return data;
      } catch (error) {
        if (error instanceof IsAgentReadyApiError && error.status !== 429) {
          throw error;
        }
        lastError = error instanceof Error ? error : new Error(String(error));
        if (attempt < this.maxRetries && !(error instanceof IsAgentReadyApiError)) {
          await new Promise((resolve) => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        }
      }
    }

    throw lastError ?? new Error("Request failed after retries");
  }

  async getScanResults(domain: string): Promise<ScanResult | ScanPending> {
    const encoded = encodeURIComponent(domain);
    return this.request<ScanResult | ScanPending>(
      "GET",
      `/api/v1/scan/${encoded}`,
      undefined,
      `scan:${domain}`,
    );
  }

  async createScan(url: string): Promise<ScanEnqueued | ScanResult> {
    this.cache.invalidate("scan:");
    this.cache.invalidate("rankings:");
    return this.request<ScanEnqueued | ScanResult>("POST", "/api/v1/scan", { url });
  }

  async getRankings(params: {
    page?: number;
    per_page?: number;
    grade_range?: "high" | "mid" | "low";
    search?: string;
    sort?: "score_desc" | "score_asc" | "domain" | "newest";
  } = {}): Promise<RankingsResponse> {
    const searchParams = new URLSearchParams();
    if (params.page !== undefined) searchParams.set("page", String(params.page));
    if (params.per_page !== undefined) searchParams.set("per_page", String(params.per_page));
    if (params.grade_range) searchParams.set("grade_range", params.grade_range);
    if (params.search) searchParams.set("search", params.search);
    if (params.sort) searchParams.set("sort", params.sort);

    const query = searchParams.toString();
    const path = `/api/v1/rankings${query ? `?${query}` : ""}`;
    const cacheKey = `rankings:${query}`;

    return this.request<RankingsResponse>("GET", path, undefined, cacheKey);
  }
}
