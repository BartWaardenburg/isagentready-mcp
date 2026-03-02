import { describe, it, expect } from "vitest";
import { toTextResult, toErrorResult } from "./tool-result.js";
import { IsAgentReadyApiError } from "./client.js";

describe("toTextResult", () => {
  it("creates text content", () => {
    const result = toTextResult("hello");
    expect(result.content).toEqual([{ type: "text", text: "hello" }]);
  });

  it("includes structured content when provided", () => {
    const result = toTextResult("hello", { key: "value" });
    expect(result.structuredContent).toEqual({ key: "value" });
  });

  it("omits structured content when not provided", () => {
    const result = toTextResult("hello");
    expect(result.structuredContent).toBeUndefined();
  });
});

describe("toErrorResult", () => {
  it("formats API error with status and details", () => {
    const error = new IsAgentReadyApiError("Not found", 404, { error: "No scan found" });
    const result = toErrorResult(error);

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("Not found");
    expect(result.content[0].text).toContain("404");
    expect(result.content[0].text).toContain("Recovery:");
  });

  it("includes recovery suggestion for 429", () => {
    const error = new IsAgentReadyApiError("Rate limited", 429);
    const result = toErrorResult(error);

    expect(result.content[0].text).toContain("Rate limit");
  });

  it("includes recovery suggestion for 422", () => {
    const error = new IsAgentReadyApiError("Invalid URL", 422);
    const result = toErrorResult(error);

    expect(result.content[0].text).toContain("http://");
  });

  it("includes recovery suggestion for 500", () => {
    const error = new IsAgentReadyApiError("Server error", 500);
    const result = toErrorResult(error);

    expect(result.content[0].text).toContain("temporary");
  });

  it("includes recovery suggestion for 400", () => {
    const error = new IsAgentReadyApiError("Bad request", 400);
    const result = toErrorResult(error);

    expect(result.content[0].text).toContain("required parameter");
  });

  it("includes context-sensitive 400 suggestion for URL errors", () => {
    const error = new IsAgentReadyApiError("Bad request", 400, { error: "Invalid URL" });
    const result = toErrorResult(error);

    expect(result.content[0].text).toContain("http://");
  });

  it("includes recovery suggestion for 409", () => {
    const error = new IsAgentReadyApiError("Conflict", 409);
    const result = toErrorResult(error);

    expect(result.content[0].text).toContain("already in progress");
  });

  it("handles generic Error", () => {
    const result = toErrorResult(new Error("Network failed"));

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toBe("Network failed");
  });

  it("handles string errors", () => {
    const result = toErrorResult("something broke");

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toBe("something broke");
  });
});
