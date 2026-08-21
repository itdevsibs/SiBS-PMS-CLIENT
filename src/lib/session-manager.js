export const SESSION_REFRESH_BUFFER_MS = 5 * 60 * 1000;
export const SESSION_ACTIVITY_WINDOW_MS = 15 * 60 * 1000;
export const SESSION_REFRESH_RETRY_MS = 30 * 100000;

export function getSessionRefreshDelay(expiresAt, now = Date.now()) {
  const numericExpiresAt = Number(expiresAt);

  if (!Number.isFinite(numericExpiresAt) || numericExpiresAt <= 0) {
    return 0;
  }

  const remainingMs = numericExpiresAt - now;

  if (remainingMs <= 0) {
    return 0;
  }

  return Math.max(0, remainingMs - SESSION_REFRESH_BUFFER_MS);
}

export function isSessionRecentlyActive(
  lastActivityAt,
  now = Date.now(),
) {
  const numericLastActivityAt = Number(lastActivityAt);

  if (!Number.isFinite(numericLastActivityAt) || numericLastActivityAt <= 0) {
    return false;
  }

  return now - numericLastActivityAt <= SESSION_ACTIVITY_WINDOW_MS;
}
