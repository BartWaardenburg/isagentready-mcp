import { IsAgentReadyApiError } from "./client.js";

export const toTextResult = (
  text: string,
  structuredContent?: Record<string, unknown>,
) => ({
  content: [{ type: "text" as const, text }],
  ...(structuredContent ? { structuredContent } : {}),
});

const getRecoverySuggestion = (status: number, message: string, details: unknown): string | null => {
  if (status === 429) {
    return "Rate limit exceeded. Wait a moment and retry. If scanning, note that recently scanned domains have a 1-hour cooldown.";
  }

  if (status === 404) {
    return "No scan found for this domain. Use scan_website to trigger a new scan first.";
  }

  if (status === 400) {
    const detailStr = typeof details === "string" ? details : JSON.stringify(details ?? "");
    const lower = detailStr.toLowerCase();
    if (lower.includes("url")) {
      return "Invalid or missing URL. Ensure the URL starts with http:// or https://.";
    }
    return "Missing required parameter. Ensure the URL or domain is provided.";
  }

  if (status === 409) {
    return "Conflict — a scan for this domain is already in progress. Wait for it to complete, then use get_scan_results to retrieve the results.";
  }

  if (status === 422) {
    return "Invalid URL. The URL must start with http:// or https:// and be a valid website address.";
  }

  if (status >= 500) {
    return "IsAgentReady API server error. This is a temporary issue. Wait a moment and retry.";
  }

  return null;
};

export const toErrorResult = (error: unknown) => {
  if (error instanceof IsAgentReadyApiError) {
    const suggestion = getRecoverySuggestion(error.status, error.message, error.details);

    return {
      content: [
        {
          type: "text" as const,
          text: [
            `IsAgentReady API error: ${error.message}`,
            `Status: ${error.status}`,
            error.details ? `Details: ${JSON.stringify(error.details, null, 2)}` : "",
            suggestion ? `\nRecovery: ${suggestion}` : "",
          ]
            .filter(Boolean)
            .join("\n"),
        },
      ],
      isError: true,
    };
  }

  return {
    content: [
      {
        type: "text" as const,
        text: error instanceof Error ? error.message : String(error),
      },
    ],
    isError: true,
  };
};
