const AUTH_USER_KEY = "pms-auth-user";
const AUTH_TOKEN_KEY = "pms-auth-token";

export function saveAuthSession({ token, user }) {
  if (user) {
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
  }

  if (token) {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
  }
}

export function getAuthUser() {
  const storedUser = localStorage.getItem(AUTH_USER_KEY);

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

export function getAuthDisplayName() {
  const user = getAuthUser();

  return user?.name || user?.fullName || user?.username || "User";
}

export function isAuthenticated() {
  return Boolean(getAuthUser());
}

export function clearAuthSession() {
  localStorage.removeItem(AUTH_USER_KEY);
  localStorage.removeItem(AUTH_TOKEN_KEY);
}
