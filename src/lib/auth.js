// Stores and reads frontend authentication metadata.
// The JWT itself stays in the backend-issued HttpOnly cookie.
const AUTH_USER_KEY = "pms-auth-user";
const AUTH_EXPIRES_AT_KEY = "pms-session-expires-at";

// Legacy keys are kept in sync temporarily so existing pages do not break.
const LEGACY_LOCAL_TOKEN_KEY = "pms-auth-token";
const LEGACY_LOCAL_EXPIRY_KEY = "token_expires_at";
const LEGACY_SESSION_USER_KEY = "sibsAuthenticatedUser";
const LEGACY_SESSION_EXPIRY_KEY = "accessTokenExpiresAt";

function resolveExpiresAt(expiresAt, expiresInMs) {
  const numericExpiresAt = Number(expiresAt);

  if (Number.isFinite(numericExpiresAt) && numericExpiresAt > 0) {
    return numericExpiresAt;
  }

  const numericExpiresInMs = Number(expiresInMs);

  if (Number.isFinite(numericExpiresInMs) && numericExpiresInMs > 0) {
    return Date.now() + numericExpiresInMs;
  }

  return null;
}

export function saveAuthSession({ user, expiresAt, expiresInMs } = {}) {
  if (user) {
    const serializedUser = JSON.stringify(user);

    localStorage.setItem(AUTH_USER_KEY, serializedUser);
    sessionStorage.setItem(LEGACY_SESSION_USER_KEY, serializedUser);
  }

  return saveAuthSessionExpiry({ expiresAt, expiresInMs });
}

export function saveAuthSessionExpiry({ expiresAt, expiresInMs } = {}) {
  const finalExpiresAt = resolveExpiresAt(expiresAt, expiresInMs);

  if (!finalExpiresAt) {
    return null;
  }

  localStorage.setItem(AUTH_EXPIRES_AT_KEY, String(finalExpiresAt));
  localStorage.setItem(LEGACY_LOCAL_EXPIRY_KEY, String(finalExpiresAt));
  sessionStorage.setItem(LEGACY_SESSION_EXPIRY_KEY, String(finalExpiresAt));

  return finalExpiresAt;
}

export function getAuthSessionExpiresAt() {
  const storedValue =
    localStorage.getItem(AUTH_EXPIRES_AT_KEY) ||
    localStorage.getItem(LEGACY_LOCAL_EXPIRY_KEY) ||
    sessionStorage.getItem(LEGACY_SESSION_EXPIRY_KEY);

  const numericValue = Number(storedValue);

  if (!Number.isFinite(numericValue) || numericValue <= 0) {
    return null;
  }

  return numericValue;
}

export function getAuthUser() {
  const storedUser =
    localStorage.getItem(AUTH_USER_KEY) ||
    sessionStorage.getItem(LEGACY_SESSION_USER_KEY);

  if (!storedUser) {
    return null;
  }

  try {
    return JSON.parse(storedUser);
  } catch {
    return {
      username: storedUser,
    };
  }
}

export function getAuthDisplayName(user = getAuthUser()) {
  if (!user) {
    return "User";
  }

  const fullNameFromParts = [
    user.firstName || user.gy_emp_fname,
    user.middleName || user.gy_emp_mname,
    user.lastName || user.gy_emp_lname,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();

  return (
    user.fullName ||
    user.name ||
    user.gy_emp_fullname ||
    fullNameFromParts ||
    user.username ||
    user.sibs_id ||
    user.email ||
    "User"
  );
}

export function isAuthenticated() {
  return Boolean(getAuthUser());
}

export function clearAuthSession() {
  localStorage.removeItem(AUTH_USER_KEY);
  localStorage.removeItem(AUTH_EXPIRES_AT_KEY);
  localStorage.removeItem(LEGACY_LOCAL_TOKEN_KEY);
  localStorage.removeItem(LEGACY_LOCAL_EXPIRY_KEY);

  sessionStorage.removeItem(LEGACY_SESSION_USER_KEY);
  sessionStorage.removeItem(LEGACY_SESSION_EXPIRY_KEY);
}
