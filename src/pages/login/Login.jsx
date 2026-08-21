import { useState } from "react";
import {
  Activity,
  CheckCircle2,
  Eye,
  EyeOff,
  Lock,
  User,
  XCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import AppModal from "@/components/ui/app-modal";
import { Button } from "@/components/ui/button";
import LoadingModal from "@/components/ui/loading-modal";
import { clearAuthSession, saveAuthSession } from "@/lib/auth";
import { getLogin } from "@/lib/axios/getLogin";

const MIN_LOGIN_LOADING_MS = 900;
const SUCCESS_REDIRECT_DELAY_MS = 900;

function waitForMinimumLoading(startedAt) {
  const elapsed = Date.now() - startedAt;
  const remaining = Math.max(
    0,
    MIN_LOGIN_LOADING_MS - elapsed,
  );

  return new Promise((resolve) => {
    window.setTimeout(resolve, remaining);
  });
}

function getResponseUser(result) {
  return (
    result?.user ||
    result?.data?.user ||
    result?.data ||
    null
  );
}

function getResponseExpiry(result) {
  return (
    result?.expiresAt ||
    result?.data?.expiresAt ||
    result?.accessTokenExpiresAt ||
    result?.data?.accessTokenExpiresAt ||
    null
  );
}

function getResponseExpiresInMs(result) {
  return (
    result?.expiresInMs ||
    result?.data?.expiresInMs ||
    null
  );
}

/* ================================
   ROLE RESOLUTION

   HRIS ADMIN ACCESS MAPPING

   7  = Admin
   6  = BOD
   5  = OM
   8  = TL
   9  = WFM
   10 = SOM

   Anything else = Employee

   *Client will be added soon*
================================ */
function getUserRole(user) {
  if (user?.resolvedRole) {
    return String(user.resolvedRole)
      .trim()
      .toLowerCase();
  }

  if (user?.resolved_role) {
    return String(user.resolved_role)
      .trim()
      .toLowerCase();
  }

  const assignedAccounts = Array.isArray(
    user?.assignedAccounts,
  )
    ? user.assignedAccounts
    : [];

  const firstAssignedAccount =
    assignedAccounts[0] || null;

  const rawRole =
    user?.access ??
    user?.accessValue ??
    user?.access_value ??
    user?.adminAccess ??
    user?.admin_access ??
    user?.role ??
    user?.userRole ??
    user?.user_role ??
    firstAssignedAccount?.access ??
    firstAssignedAccount?.accessValue ??
    firstAssignedAccount?.access_value ??
    firstAssignedAccount?.adminAccess ??
    firstAssignedAccount?.admin_access ??
    "";

  const numericAccess = Number(rawRole);

  if (
    !Number.isNaN(numericAccess) &&
    numericAccess > 0
  ) {
    switch (numericAccess) {
      case 7:
        return "admin";

      case 6:
        return "bod";

      case 5:
        return "om";

      case 8:
        return "tl";

      case 9:
        return "wfm";

      case 10:
        return "som";

      default:
        return "employee";
    }
  }

  const normalizedRole = String(rawRole)
    .trim()
    .toLowerCase();

  const allowedRoles = [
    "admin",
    "bod",
    "om",
    "tl",
    "wfm",
    "som",
  ];

  if (
    allowedRoles.includes(
      normalizedRole,
    )
  ) {
    return normalizedRole;
  }

  return "employee";
}

/* ================================
   ROLE LABEL
================================ */
function getRoleLabel(role) {
  switch (role) {
    case "admin":
      return "Administrator";

    case "bod":
      return "Board of Directors";

    case "om":
      return "Operations Manager";

    case "tl":
      return "Team Leader";

    case "wfm":
      return "Workforce Management";

    case "som":
      return "Senior Operations Manager";

    case "employee":
      return "Employee";

    default:
      return "Employee";
  }
}

/* ================================
   DASHBOARD NORMALIZATION
================================ */
function normalizeDashboardPath(path) {
  const normalizedPath = String(
    path || "",
  ).trim();

  const dashboardMappings = {
    /*
      Old Admin paths
    */
    "/admin/dashboard":
      "/dashboard/superadmin",

    "/dashboard/admin":
      "/dashboard/superadmin",

    /*
      Old Employee paths
    */
    "/employee/dashboard":
      "/dashboard/agent",

    "/dashboard/employee":
      "/dashboard/agent",

    /*
      WFM legacy path compatibility
    */
    "/wfm/dashboard":
      "/dashboard/wfm",

    /*
      SOM legacy path compatibility
    */
    "/som/dashboard":
      "/dashboard/som",
  };

  return (
    dashboardMappings[normalizedPath] ||
    normalizedPath
  );
}

/* ================================
   DASHBOARD RESOLUTION
================================ */
function getDashboardPath(
  user,
  result = {},
) {
  /*
    Prefer the route returned
    by the backend users.js.
  */
  const serverPath =
    result?.redirectTo ||
    result?.user?.redirectTo ||
    result?.data?.redirectTo ||
    result?.data?.user?.redirectTo ||
    result?.user?.dashboard ||
    result?.data?.dashboard ||
    result?.data?.user?.dashboard ||
    user?.redirectTo ||
    user?.dashboard ||
    "";

  if (serverPath) {
    return normalizeDashboardPath(
      serverPath,
    );
  }

  /*
    Fallback if the backend does not
    return redirectTo/dashboard.
  */
  const role = getUserRole(user);

  switch (role) {
    case "admin":
      return "/dashboard/superadmin";

    case "bod":
      return "/dashboard/bod";

    case "om":
      return "/dashboard/om";

    case "tl":
      return "/dashboard/tl";

    case "wfm":
      return "/dashboard/wfm";

    case "som":
      return "/dashboard/som";

    default:
      return "/dashboard/agent";
  }
}

/* ================================
   SAVE USER SESSION
================================ */
function saveAuthenticatedUser(
  user,
  expiresAt,
  expiresInMs,
) {
  sessionStorage.setItem(
    "sibsAuthenticatedUser",
    JSON.stringify(user),
  );

  let finalExpiresAt = expiresAt;

  if (!finalExpiresAt && expiresInMs) {
    const numericExpiresIn =
      Number(expiresInMs);

    if (
      Number.isFinite(
        numericExpiresIn,
      ) &&
      numericExpiresIn > 0
    ) {
      finalExpiresAt =
        Date.now() +
        numericExpiresIn;
    }
  }

  if (finalExpiresAt) {
    sessionStorage.setItem(
      "accessTokenExpiresAt",
      String(finalExpiresAt),
    );

    localStorage.setItem(
      "token_expires_at",
      String(finalExpiresAt),
    );
  } else {
    sessionStorage.removeItem(
      "accessTokenExpiresAt",
    );

    localStorage.removeItem(
      "token_expires_at",
    );
  }
}

/* ================================
   CLEAR AUTH STORAGE
================================ */
function clearAuthenticationStorage() {
  clearAuthSession();
}

/* ================================
   LOGIN FAILURE MESSAGES
================================ */
function getLoginFailureMessage(
  result = {},
) {
  switch (result?.code) {
    case "USER_NOT_FOUND_OR_INACTIVE":
      return "The SIBS ID was not found or the account is inactive.";

    case "PASSWORD_MISMATCH":
      return "The password you entered is incorrect.";

    case "MISSING_CREDENTIALS":
      return "Please enter your SIBS ID and password.";

    case "LOGIN_SERVER_ERROR":
      return "The login server encountered an error. Check the backend terminal.";

    case "LOGIN_REQUEST_FAILED":
      return (
        result?.message ||
        "Unable to connect to the login server."
      );

    default:
      return (
        result?.message ||
        "Invalid SIBS ID or password."
      );
  }
}

/* ================================
   LOGIN COMPONENT
================================ */
const Login = () => {
  const navigate = useNavigate();

  const [
    showPassword,
    setShowPassword,
  ] = useState(false);

  const [
    sibsId,
    setSibsId,
  ] = useState("");

  const [
    password,
    setPassword,
  ] = useState("");

  const [
    loginStatus,
    setLoginStatus,
  ] = useState("idle");

  const [
    loginMessage,
    setLoginMessage,
  ] = useState("");

  const [
    authenticatedRoleLabel,
    setAuthenticatedRoleLabel,
  ] = useState("");

  const isLoading =
    loginStatus === "loading";

  const resetInvalidLogin = () => {
    setLoginMessage("");
    setLoginStatus("idle");
  };

  /* ================================
     LOGIN SUBMIT
  ================================ */
  const handleSubmit = async (
    event,
  ) => {
    event.preventDefault();

    if (isLoading) {
      return;
    }

    const finalSibsId =
      sibsId.trim();

    const finalPassword =
      password;

    if (
      !finalSibsId ||
      !finalPassword
    ) {
      setPassword("");

      setLoginMessage(
        "Please enter your SIBS ID and password.",
      );

      setLoginStatus(
        "invalid",
      );

      return;
    }

    setLoginMessage("");
    setLoginStatus("loading");

    const loadingStartedAt =
      Date.now();

    try {
      /*
        Expected backend endpoint:

        POST /api/users/login
      */
      const result =
        await getLogin(
          finalSibsId,
          finalPassword,
        );

      await waitForMinimumLoading(
        loadingStartedAt,
      );

      if (!result?.success) {
        clearAuthenticationStorage();

        setPassword("");

        setLoginMessage(
          getLoginFailureMessage(
            result,
          ),
        );

        setLoginStatus(
          "invalid",
        );

        return;
      }

      const responseUser =
        getResponseUser(
          result,
        );

      if (!responseUser) {
        console.error(
          "Login succeeded but no user was returned:",
          result,
        );

        clearAuthenticationStorage();

        setPassword("");

        setLoginMessage(
          "Login succeeded, but the server did not return user details.",
        );

        setLoginStatus(
          "invalid",
        );

        return;
      }

      /*
        Expected HRIS admin_access:

        7  = Admin
        6  = BOD
        5  = OM
        8  = TL
        9  = WFM
        10 = SOM

        otherwise = Employee
      */
      const resolvedRole =
        getUserRole(
          responseUser,
        );

      /*
        Backend redirectTo/dashboard
        takes priority.
      */
      const dashboardPath =
        getDashboardPath(
          responseUser,
          result,
        );

      const authUser = {
        ...responseUser,

        resolvedRole,

        role:
          resolvedRole,

        roleLabel:
          responseUser?.roleLabel ||
          getRoleLabel(
            resolvedRole,
          ),

        dashboardPath,

        dashboard:
          responseUser?.dashboard ||
          dashboardPath,

        redirectTo:
          responseUser?.redirectTo ||
          dashboardPath,
      };

      const expiresAt =
        getResponseExpiry(
          result,
        );

      const expiresInMs =
        getResponseExpiresInMs(
          result,
        );

      saveAuthenticatedUser(
        authUser,
        expiresAt,
        expiresInMs,
      );

      saveAuthSession({
        user:
          authUser,

        expiresAt,

        expiresInMs,
      });

      setAuthenticatedRoleLabel(
        authUser.roleLabel,
      );

      setLoginStatus(
        "success",
      );

      window.setTimeout(() => {
        navigate(
          dashboardPath,
          {
            replace: true,

            state: {
              authenticatedUser:
                authUser,
            },
          },
        );
      }, SUCCESS_REDIRECT_DELAY_MS);
    } catch (error) {
      await waitForMinimumLoading(
        loadingStartedAt,
      );

      console.error(
        "Login error:",
        error?.response?.data ||
          error?.message ||
          error,
      );

      clearAuthenticationStorage();

      setPassword("");

      setLoginMessage(
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          error?.message ||
          "Unable to sign in. Please check your SIBS ID and password.",
      );

      setLoginStatus(
        "invalid",
      );
    }
  };

  return (
    <section className="font-jakarta relative flex min-h-screen items-center justify-center overflow-x-hidden overflow-y-auto bg-[#1e4d7b] px-4 py-6 text-white sm:px-6 lg:px-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_22%_18%,rgba(240,90,40,0.24),transparent_28%),radial-gradient(circle_at_80%_82%,rgba(255,212,0,0.12),transparent_28%),linear-gradient(135deg,#1e4d7b_0%,#3b5f7f_48%,#714d52_100%)]" />

      <div className="relative flex w-full max-w-[480px] flex-col items-center gap-3">
        <div className="w-full rounded-[22px] border border-white/25 bg-white/12 p-5 shadow-2xl shadow-sibs-primary-1/20 backdrop-blur-md sm:p-7 lg:p-8">
          <div className="mb-6 flex items-center justify-center gap-3 sm:mb-8">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#f05a28] text-white sm:h-12 sm:w-12">
              <Activity
                className="h-6 w-6 sm:h-7 sm:w-7"
                aria-hidden="true"
              />
            </div>

            <div className="min-w-0 leading-none">
              <p className="m-0 text-2xl font-bold tracking-normal text-white sm:text-3xl">
                SiBS{" "}
                <span className="text-[#ff7a30]">
                  PMS
                </span>
              </p>

              <p className="mt-1 whitespace-nowrap text-[9px] font-semibold uppercase tracking-[0.16em] text-[#dbe8f3] sm:text-[10px]">
                Performance Management System
              </p>
            </div>
          </div>

          <form
            className="space-y-4 sm:space-y-5"
            onSubmit={
              handleSubmit
            }
          >
            <div>
              <label
                htmlFor="sibsId"
                className="mb-2 block text-sm font-semibold text-[#edf5fb]"
              >
                SIBS ID
              </label>

              <div className="relative">
                <User
                  className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#dbe8f3]"
                  aria-hidden="true"
                />

                <input
                  id="sibsId"
                  name="sibsId"
                  type="text"
                  autoComplete="username"
                  value={
                    sibsId
                  }
                  onChange={(
                    event,
                  ) => {
                    setSibsId(
                      event.target
                        .value,
                    );

                    if (
                      loginStatus ===
                      "invalid"
                    ) {
                      resetInvalidLogin();
                    }
                  }}
                  className="h-11 w-full rounded-lg border border-white/30 bg-white/15 px-4 pl-11 text-sm text-white outline-none transition placeholder:text-white/45 focus:border-[#ff7a30] focus:bg-white/20 focus:shadow-[0_0_0_4px_rgba(240,90,40,0.16)] disabled:cursor-not-allowed disabled:opacity-60 sm:h-12"
                  disabled={
                    isLoading
                  }
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-semibold text-[#edf5fb]"
              >
                Password
              </label>

              <div className="relative">
                <Lock
                  className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#dbe8f3]"
                  aria-hidden="true"
                />

                <input
                  id="password"
                  name="password"
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  autoComplete="current-password"
                  value={
                    password
                  }
                  onChange={(
                    event,
                  ) => {
                    setPassword(
                      event.target
                        .value,
                    );

                    if (
                      loginStatus ===
                      "invalid"
                    ) {
                      resetInvalidLogin();
                    }
                  }}
                  className="h-11 w-full rounded-lg border border-white/30 bg-white/15 px-4 pl-11 pr-11 text-sm text-white outline-none transition placeholder:text-white/45 focus:border-[#ff7a30] focus:bg-white/20 focus:shadow-[0_0_0_4px_rgba(240,90,40,0.16)] disabled:cursor-not-allowed disabled:opacity-60 sm:h-12"
                  disabled={
                    isLoading
                  }
                />

                <button
                  type="button"
                  aria-label={
                    showPassword
                      ? "Hide password"
                      : "Show password"
                  }
                  onClick={() =>
                    setShowPassword(
                      (value) =>
                        !value,
                    )
                  }
                  className="absolute right-3 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg border-0 bg-transparent text-[#dbe8f3] transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={
                    isLoading
                  }
                >
                  {showPassword ? (
                    <EyeOff
                      className="h-4 w-4"
                      aria-hidden="true"
                    />
                  ) : (
                    <Eye
                      className="h-4 w-4"
                      aria-hidden="true"
                    />
                  )}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              size="lg"
              className="mt-5 h-11 w-full rounded-lg bg-[#f05a28] text-base font-bold text-white shadow-sm hover:bg-[#ff7a30] sm:mt-6 sm:h-12"
              disabled={
                isLoading
              }
            >
              {isLoading
                ? "Signing in..."
                : "Login"}
            </Button>
          </form>
        </div>
      </div>

      <AppModal
        isOpen={
          loginStatus ===
            "success" ||
          loginStatus ===
            "invalid"
        }
        textAlign="center"
      >
        {loginStatus ===
          "success" && (
          <>
            <CheckCircle2
              className="mx-auto h-11 w-11 text-sibs-success"
              aria-hidden="true"
            />

            <p className="mb-1 mt-4 text-base font-bold text-sibs-primary-1">
              Login successful
            </p>

            <p className="m-0 text-sm text-sibs-tertiary-5">
              Redirecting to{" "}
              {authenticatedRoleLabel
                ? `${authenticatedRoleLabel} dashboard`
                : "your dashboard"}
              .
            </p>
          </>
        )}

        {loginStatus ===
          "invalid" && (
          <>
            <XCircle
              className="mx-auto h-11 w-11 text-sibs-danger"
              aria-hidden="true"
            />

            <p className="mb-1 mt-4 text-base font-bold text-sibs-primary-1">
              Invalid login
            </p>

            <p className="m-0 text-sm text-sibs-tertiary-5">
              {loginMessage ||
                "Check your SIBS ID and password, then try again."}
            </p>

            <Button
              type="button"
              size="lg"
              onClick={
                resetInvalidLogin
              }
              className="mt-5 h-10 w-full rounded-xl bg-sibs-primary-1 text-white hover:bg-sibs-tertiary-4"
            >
              Try again
            </Button>
          </>
        )}
      </AppModal>

      <LoadingModal
        isOpen={
          loginStatus ===
          "loading"
        }
        title="Signing in"
        message="Please wait while we verify your account."
      />
    </section>
  );
};

export default Login;