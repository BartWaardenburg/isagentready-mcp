export interface Checkpoint {
  id: string;
  name: string;
  status: "pass" | "partial" | "fail" | "skip";
  score: number;
  max_score: number;
  details: string;
  recommendation: string;
  why: string;
  code_example?: string;
}

export interface Category {
  category: "discovery" | "structured_data" | "semantics" | "agent_protocols" | "security";
  label: string;
  score: number;
  max_score: number;
  weight: number;
  checkpoints: Checkpoint[];
}

export interface ScanResult {
  id: string;
  domain: string;
  status: "completed" | "failed";
  overall_score: number;
  letter_grade: "F" | "D" | "C" | "B" | "A" | "A+";
  scan_duration_ms: number;
  completed_at: string;
  categories: Category[];
}

export interface ScanPending {
  id: string;
  domain: string;
  status: "pending" | "running";
  message: string;
}

export interface ScanEnqueued {
  id: string;
  domain: string;
  status: "pending" | "running";
  poll_url: string;
  message: string;
}

export interface RankingsResponse {
  entries: ScanResult[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}
