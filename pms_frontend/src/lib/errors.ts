/**
 * Parses a DRF validation error response into a readable message.
 * DRF returns errors as { field_name: ["message", ...], ... } for
 * field-specific problems, or { non_field_errors: [...] } / a plain
 * string for everything else (including non-JSON responses like a
 * Django 500 HTML error page, which axios still hands us as `data`).
 *
 * Used by every registration wizard so "what exactly is wrong" is
 * always visible, instead of one generic fallback sentence.
 */

function humanizeFieldName(field: string): string {
  if (field === "non_field_errors" || field === "detail") return "";
  return field
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function parseApiError(err: any, fallback = "Could not save. Please check the form and try again."): string {
  const detail = err?.response?.data;

  if (!detail) return fallback;

  // Non-JSON body (e.g. a Django 500 HTML error page) -- axios still
  // gives us this as a string; don't dump raw HTML into the UI.
  if (typeof detail === "string") {
    return detail.trim().startsWith("<") ? "A server error occurred. Please try again or contact support." : detail;
  }

  if (typeof detail !== "object") return fallback;

  const lines: string[] = [];
  for (const [field, messages] of Object.entries(detail)) {
    const label = humanizeFieldName(field);
    const messageList = Array.isArray(messages) ? messages : [messages];
    for (const msg of messageList) {
      lines.push(label ? `${label}: ${msg}` : String(msg));
    }
  }

  return lines.length > 0 ? lines.join("\n") : fallback;
}