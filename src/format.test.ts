import { describe, it, expect } from "vitest";
import { formatCheckpoint, formatCategory, formatScanResult, formatScanSummary } from "./format.js";
import type { Checkpoint, Category, ScanResult } from "./types.js";

const checkpoint = (overrides: Partial<Checkpoint> = {}): Checkpoint => ({
  id: "1.1",
  name: "robots.txt",
  status: "pass",
  score: 5,
  max_score: 5,
  details: "Found valid robots.txt",
  recommendation: "",
  why: "Tells crawlers what to index",
  ...overrides,
});

const category = (overrides: Partial<Category> = {}): Category => ({
  category: "discovery",
  label: "Discovery",
  score: 15,
  max_score: 20,
  weight: 30,
  checkpoints: [checkpoint()],
  ...overrides,
});

const scanResult = (overrides: Partial<ScanResult> = {}): ScanResult => ({
  id: "abc-123",
  domain: "example.com",
  status: "completed",
  overall_score: 72,
  letter_grade: "B",
  scan_duration_ms: 18500,
  completed_at: "2025-01-15T10:30:00Z",
  categories: [category()],
  ...overrides,
});

describe("formatCheckpoint", () => {
  it("formats a passing checkpoint", () => {
    const result = formatCheckpoint(checkpoint());
    expect(result).toContain("[PASS]");
    expect(result).toContain("1.1");
    expect(result).toContain("robots.txt");
    expect(result).toContain("5/5");
  });

  it("includes details", () => {
    const result = formatCheckpoint(checkpoint({ details: "Found it" }));
    expect(result).toContain("Details: Found it");
  });

  it("includes recommendation for failing checkpoints", () => {
    const result = formatCheckpoint(
      checkpoint({ status: "fail", recommendation: "Add robots.txt" }),
    );
    expect(result).toContain("[FAIL]");
    expect(result).toContain("Recommendation: Add robots.txt");
  });

  it("does not include recommendation for passing checkpoints", () => {
    const result = formatCheckpoint(
      checkpoint({ status: "pass", recommendation: "Already good" }),
    );
    expect(result).not.toContain("Recommendation:");
  });

  it("formats partial and skip statuses", () => {
    expect(formatCheckpoint(checkpoint({ status: "partial" }))).toContain("[PARTIAL]");
    expect(formatCheckpoint(checkpoint({ status: "skip" }))).toContain("[SKIP]");
  });
});

describe("formatCategory", () => {
  it("formats category with score and weight", () => {
    const result = formatCategory(category());
    expect(result).toContain("Discovery");
    expect(result).toContain("15/20");
    expect(result).toContain("75%");
    expect(result).toContain("weight: 30%");
  });

  it("formats checkpoints within category", () => {
    const result = formatCategory(category());
    expect(result).toContain("[PASS]");
    expect(result).toContain("robots.txt");
  });

  it("handles zero max_score", () => {
    const result = formatCategory(category({ score: 0, max_score: 0 }));
    expect(result).toContain("0%");
  });
});

describe("formatScanResult", () => {
  it("formats full scan result", () => {
    const result = formatScanResult(scanResult());
    expect(result).toContain("Domain: example.com");
    expect(result).toContain("Grade: B (72/100)");
    expect(result).toContain("Status: completed");
    expect(result).toContain("18500ms");
    expect(result).toContain("Discovery");
  });

  it("formats A+ grade", () => {
    const result = formatScanResult(scanResult({ letter_grade: "A+", overall_score: 95 }));
    expect(result).toContain("Grade: A+ (95/100)");
  });

  it("handles missing categories", () => {
    const result = formatScanResult(scanResult({ categories: [] }));
    expect(result).toContain("Domain: example.com");
  });
});

describe("formatScanSummary", () => {
  it("formats one-line summary", () => {
    const result = formatScanSummary(scanResult());
    expect(result).toBe("example.com — Grade: B (72/100)");
  });
});
