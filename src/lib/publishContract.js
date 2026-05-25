// Central publish contract + feed invalidation bus.
// Every publish flow must report the same success shape and refresh the feed only
// after the database insert has succeeded.

export const FEED_REFRESH_EVENT = "hui:feed-refresh";

export function createPublishResult({
  entityType,
  entityId,
  visibility = "public",
  createdAt = null,
  success = true,
}) {
  return {
    success: Boolean(success),
    entityType,
    entityId: entityId != null ? String(entityId) : null,
    visibility: visibility || "public",
    createdAt: createdAt || new Date().toISOString(),
  };
}

export function requestFeedRefresh(result = null) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(FEED_REFRESH_EVENT, {
    detail: {
      result,
      requestedAt: new Date().toISOString(),
    },
  }));
}

export function subscribeFeedRefresh(handler) {
  if (typeof window === "undefined") return () => {};
  const listener = (event) => handler?.(event.detail);
  window.addEventListener(FEED_REFRESH_EVENT, listener);
  return () => window.removeEventListener(FEED_REFRESH_EVENT, listener);
}

export function completePublishSuccess(onPublished, result) {
  if (!result?.success || !result?.entityType || !result?.entityId) {
    throw new Error("Invalid publish result");
  }

  requestFeedRefresh(result);
  onPublished?.(result);
  return result;
}
