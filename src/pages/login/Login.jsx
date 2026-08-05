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
import { saveAuthSession } from "@/lib/auth";
import { loginUser } from "@/lib/axios/login";
import { authenticateMockUser } from "@/lib/mock-users";

const MIN_LOGIN_LOADING_MS = 900;

function waitForMinimumLoading(startedAt) {
  const elapsed = Date.now() - startedAt;
  const remaining = Math.max(0, MIN_LOGIN_LOADING_MS - elapsed);

  return new Promise((resolve) => {
    window.setTimeout(resolve, remaining);
  });
}

const Login = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginStatus, setLoginStatus] = useState("idle");
  const [loginMessage, setLoginMessage] = useState("");

  const isLoading = loginStatus === "loading";

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoginMessage("");
    setLoginStatus("loading");
    const loadingStartedAt = Date.now();

    try {
      const staticUser = authenticateMockUser({
        username: username.trim(),
        password,
      });

      if (staticUser && staticUser.role !== "agent") {
        await waitForMinimumLoading(loadingStartedAt);

        saveAuthSession({
          user: staticUser,
        });
        setLoginStatus("success");

        window.setTimeout(() => {
          navigate(staticUser.dashboardPath);
        }, 900);

        return;
      }

      const data = await loginUser({
        username: username.trim(),
        password,
      });
      const user = data?.user;

      await waitForMinimumLoading(loadingStartedAt);

      if (!data?.success || !user) {
        setLoginMessage("Invalid username or password.");
        setLoginStatus("invalid");
        return;
      }

      const authUser = {
        ...user,
        dashboardPath: user.dashboardPath || `/dashboard/${user.role}`,
        roleLabel: user.roleLabel || "Agent",
      };

      saveAuthSession({
        token: data.token,
        user: authUser,
      });
      setLoginStatus("success");

      window.setTimeout(() => {
        navigate(authUser.dashboardPath);
      }, 900);
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.message ||
        "Check your username and password, then try again.";

      await waitForMinimumLoading(loadingStartedAt);

      setLoginMessage(message);
      setLoginStatus("invalid");
    }
  };

  return (
    <section className="font-jakarta flex min-h-screen items-center justify-center overflow-x-hidden overflow-y-auto bg-[#1e4d7b] px-4 py-6 text-white sm:px-6 lg:px-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_22%_18%,rgba(240,90,40,0.24),transparent_28%),radial-gradient(circle_at_80%_82%,rgba(255,212,0,0.12),transparent_28%),linear-gradient(135deg,#1e4d7b_0%,#3b5f7f_48%,#714d52_100%)]" />

      <div className="relative flex w-full max-w-[480px] flex-col items-center gap-3">
        <div className="w-full rounded-[22px] border border-white/25 bg-white/12 p-5 shadow-2xl shadow-sibs-primary-1/20 backdrop-blur-md sm:p-7 lg:p-8">
          <div className="mb-6 flex items-center justify-center gap-3 sm:mb-8">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#f05a28] text-white sm:h-12 sm:w-12">
              <Activity className="h-6 w-6 sm:h-7 sm:w-7" aria-hidden="true" />
            </div>
            <div className="min-w-0 leading-none">
              <p className="m-0 text-2xl font-bold tracking-normal text-white sm:text-3xl">
                SiBS <span className="text-[#ff7a30]">PMS</span>
              </p>
              <p className="mt-1 whitespace-nowrap text-[9px] font-semibold uppercase tracking-[0.16em] text-[#dbe8f3] sm:text-[10px]">
                Performance Management System
              </p>
            </div>
          </div>

          <form className="space-y-4 sm:space-y-5" onSubmit={handleSubmit}>
            <div>
              <label
                htmlFor="username"
                className="mb-2 block text-sm font-semibold text-[#edf5fb]"
              >
                Username
              </label>
              <div className="relative">
                <User
                  className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#dbe8f3]"
                  aria-hidden="true"
                />
                <input
                  id="username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  className="h-11 w-full rounded-lg border border-white/30 bg-white/15 px-4 pl-11 text-sm text-white outline-none transition placeholder:text-white/45 focus:border-[#ff7a30] focus:bg-white/20 focus:shadow-[0_0_0_4px_rgba(240,90,40,0.16)] disabled:cursor-not-allowed disabled:opacity-60 sm:h-12"
                  disabled={isLoading}
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
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="h-11 w-full rounded-lg border border-white/30 bg-white/15 px-4 pl-11 pr-11 text-sm text-white outline-none transition placeholder:text-white/45 focus:border-[#ff7a30] focus:bg-white/20 focus:shadow-[0_0_0_4px_rgba(240,90,40,0.16)] disabled:cursor-not-allowed disabled:opacity-60 sm:h-12"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  onClick={() => setShowPassword((value) => !value)}
                  className="absolute right-3 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg border-0 bg-transparent text-[#dbe8f3] transition hover:bg-white/10 hover:text-white"
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <Eye className="h-4 w-4" aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              size="lg"
              className="mt-5 h-11 w-full rounded-lg bg-[#f05a28] text-base font-bold text-white shadow-sm hover:bg-[#ff7a30] sm:mt-6 sm:h-12"
              disabled={isLoading}
            >
              {isLoading ? "Signing in..." : "Login"}
            </Button>
          </form>
        </div>

        <aside className="w-full max-w-[390px] rounded-xl border border-white/20 bg-white/10 p-3 text-[10px] leading-4 text-[#dbe8f3] shadow-lg shadow-sibs-primary-1/10 backdrop-blur-md sm:text-[11px]">
          <p className="m-0 text-[11px] font-bold uppercase tracking-[0.16em] text-white sm:text-xs">
            Test users
          </p>
          <div className="mt-2 grid grid-cols-1 gap-x-3 gap-y-1 sm:grid-cols-2">
            <p className="m-0 break-words">
              <span className="font-bold text-white">Work Force Management</span> = wfm/wfm123
            </p>
            <p className="m-0 break-words">
              <span className="font-bold text-white">Super Admin</span> = superadmin/superadmin123
            </p>
            <p className="m-0 break-words">
              <span className="font-bold text-white">Agents</span> = employee code/database password
            </p>
            <p className="m-0 break-words">
              <span className="font-bold text-white">Operations Management</span> = om/om123
            </p>
            <p className="m-0 break-words">
              <span className="font-bold text-white">Team Leader</span> = tl/tl123
            </p>
            <p className="m-0 break-words">
              <span className="font-bold text-white">Client</span> = client/client123
            </p>
            <p className="m-0 break-words">
              <span className="font-bold text-white">Board of Directors</span> = bod/bod123
            </p>
          </div>
        </aside>
      </div>

      <AppModal
        isOpen={loginStatus === "success" || loginStatus === "invalid"}
        textAlign="center"
      >
        {loginStatus === "success" && (
          <>
            <CheckCircle2
              className="mx-auto h-11 w-11 text-sibs-success"
              aria-hidden="true"
            />
            <p className="mt-4 mb-1 text-base font-bold text-sibs-primary-1">
              Login successful
            </p>
            <p className="m-0 text-sm text-sibs-tertiary-5">
              Redirecting to admin dashboard.
            </p>
          </>
        )}

        {loginStatus === "invalid" && (
          <>
            <XCircle
              className="mx-auto h-11 w-11 text-sibs-danger"
              aria-hidden="true"
            />
            <p className="mt-4 mb-1 text-base font-bold text-sibs-primary-1">
              Invalid login
            </p>
            <p className="m-0 text-sm text-sibs-tertiary-5">
              {loginMessage || "Check your username and password, then try again."}
            </p>
            <Button
              type="button"
              size="lg"
              onClick={() => setLoginStatus("idle")}
              className="mt-5 h-10 w-full rounded-xl bg-sibs-primary-1 text-white hover:bg-sibs-tertiary-4"
            >
              Try again
            </Button>
          </>
        )}
      </AppModal>

      <LoadingModal
        isOpen={loginStatus === "loading"}
        title="Signing in"
        message="Please wait while we verify your account."
      />
    </section>
  );
};

export default Login;
