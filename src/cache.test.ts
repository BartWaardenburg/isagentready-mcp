import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { TtlCache } from "./cache.js";

describe("TtlCache", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns undefined for missing key", () => {
    const cache = new TtlCache();
    expect(cache.get("missing")).toBeUndefined();
  });

  it("stores and retrieves a value", () => {
    const cache = new TtlCache();
    cache.set("key", "value");
    expect(cache.get("key")).toBe("value");
  });

  it("expires entries after default TTL", () => {
    const cache = new TtlCache(1000);
    cache.set("key", "value");

    vi.advanceTimersByTime(999);
    expect(cache.get("key")).toBe("value");

    vi.advanceTimersByTime(2);
    expect(cache.get("key")).toBeUndefined();
  });

  it("supports custom TTL per entry", () => {
    const cache = new TtlCache(10_000);
    cache.set("key", "value", 500);

    vi.advanceTimersByTime(501);
    expect(cache.get("key")).toBeUndefined();
  });

  it("invalidates keys matching pattern", () => {
    const cache = new TtlCache();
    cache.set("scan:example.com", "a");
    cache.set("scan:test.com", "b");
    cache.set("rankings:page1", "c");

    cache.invalidate("scan:");
    expect(cache.get("scan:example.com")).toBeUndefined();
    expect(cache.get("scan:test.com")).toBeUndefined();
    expect(cache.get("rankings:page1")).toBe("c");
  });

  it("clears all entries", () => {
    const cache = new TtlCache();
    cache.set("a", 1);
    cache.set("b", 2);
    cache.clear();
    expect(cache.size).toBe(0);
  });

  it("reports size", () => {
    const cache = new TtlCache();
    expect(cache.size).toBe(0);
    cache.set("a", 1);
    expect(cache.size).toBe(1);
    cache.set("b", 2);
    expect(cache.size).toBe(2);
  });
});
