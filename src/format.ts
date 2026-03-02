import type { ScanResult, Category, Checkpoint } from "./types.js";

const statusIcon: Record<string, string> = {
  pass: "[PASS]",
  partial: "[PARTIAL]",
  fail: "[FAIL]",
  skip: "[SKIP]",
};

export const formatCheckpoint = (cp: Checkpoint): string => {
  const lines = [
    `  ${statusIcon[cp.status] ?? cp.status} ${cp.id} ${cp.name} (${cp.score}/${cp.max_score})`,
  ];
  if (cp.details) lines.push(`    Details: ${cp.details}`);
  if (cp.status !== "pass" && cp.recommendation) lines.push(`    Recommendation: ${cp.recommendation}`);
  return lines.join("\n");
};

export const formatCategory = (cat: Category): string => {
  const pct = cat.max_score > 0 ? Math.round((cat.score / cat.max_score) * 100) : 0;
  const lines = [
    `${cat.label} — ${cat.score}/${cat.max_score} (${pct}%, weight: ${cat.weight}%)`,
    ...cat.checkpoints.map(formatCheckpoint),
  ];
  return lines.join("\n");
};

export const formatScanResult = (scan: ScanResult): string => {
  const lines = [
    `Domain: ${scan.domain}`,
    `Grade: ${scan.letter_grade} (${scan.overall_score}/100)`,
    `Status: ${scan.status}`,
    scan.scan_duration_ms ? `Scan duration: ${scan.scan_duration_ms}ms` : "",
    scan.completed_at ? `Completed: ${scan.completed_at}` : "",
    "",
    ...(scan.categories ?? []).map(formatCategory),
  ];
  return lines.filter(Boolean).join("\n");
};

export const formatScanSummary = (scan: ScanResult): string =>
  `${scan.domain} — Grade: ${scan.letter_grade} (${scan.overall_score}/100)`;
