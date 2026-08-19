// Stores and reads the local authenticated user session.
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
  localStorage.removeItem(AUTH_TOKEN_KEY);
}
