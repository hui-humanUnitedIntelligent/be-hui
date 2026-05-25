export function decodeEscapedUnicodeText(value) {
  if (typeof value !== "string" || !value.includes("\\u")) return value;

  return value.replace(/\\u\{([0-9a-fA-F]+)\}|\\u([0-9a-fA-F]{4})/g, (match, braced, fixed) => {
    const codePoint = Number.parseInt(braced || fixed, 16);
    if (!Number.isFinite(codePoint)) return match;
    try {
      return String.fromCodePoint(codePoint);
    } catch (_) {
      return match;
    }
  });
}

export function normalizeDisplayText(value, fallback = "") {
  if (value == null || value === "") return fallback;
  return decodeEscapedUnicodeText(String(value)).trim();
}
