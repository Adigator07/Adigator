/** Deduplicate message lists while preserving order (for warnings/suggestions). */
export function uniqueMessages(messages, limit = messages.length) {
  const seen = new Set();
  const result = [];
  for (const message of messages) {
    const text = String(message || "").trim();
    if (!text || seen.has(text)) continue;
    seen.add(text);
    result.push(text);
    if (result.length >= limit) break;
  }
  return result;
}
