import { useState } from "react";
import {
  ArrowRight,
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

const VALID_USERNAME = "admin";
const VALID_PASSWORD = "admin123";

const Login = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState(VALID_USERNAME);
  const [password, setPassword] = useState(VALID_PASSWORD);
  const [loginStatus, setLoginStatus] = useState("idle");

  const isLoading = loginStatus === "loading";

  const handleSubmit = (event) => {
    event.preventDefault();
    setLoginStatus("loading");

    window.setTimeout(() => {
      const isValid =
        username.trim() === VALID_USERNAME && password === VALID_PASSWORD;

      if (!isValid) {
        setLoginStatus("invalid");
        return;
      }

      localStorage.setItem("pms-auth-user", VALID_USERNAME);
      setLoginStatus("success");

      window.setTimeout(() => {
        navigate("/admin-dashboard");
      }, 900);
    }, 2500);
  };

  return (
    <section className="font-jakarta flex min-h-screen items-center justify-center bg-sibs-primary-3 px-4 py-8 text-sibs-primary-1">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-2xl border border-sibs-tertiary-9 bg-white shadow-sm md:grid-cols-[0.9fr_1.1fr]">
        <aside className="hidden bg-sibs-primary-1 p-10 text-white md:flex md:flex-col md:justify-center">
          <div className="max-w-sm">
            <p className="m-0 text-sm font-semibold uppercase tracking-wide text-sibs-primary-2">
              PMS
            </p>
            <p className="mt-3 mb-0 text-3xl font-bold leading-tight">
              Performance Management System
            </p>
            <p className="mt-5 mb-0 inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-sibs-primary-3">
              by SIBS
            </p>
          </div>
        </aside>

        <div className="flex items-center justify-center p-6 sm:p-10">
          <div className="w-full max-w-md">
            <div className="mb-8 md:hidden">
              <p className="m-0 text-sm font-semibold uppercase tracking-wide text-sibs-primary-2">
                PMS
              </p>
              <p className="m-0 text-sm text-sibs-tertiary-5">
                Performance Management System
              </p>
              <p className="mt-3 mb-0 text-xs font-semibold uppercase tracking-wide text-sibs-primary-1">
                by SIBS
              </p>
            </div>

            <div className="mb-8">
              <p className="m-0 text-2xl font-bold text-sibs-primary-1">
                Welcome back
              </p>
              <p className="mt-2 text-sm text-sibs-tertiary-5">
                Enter your credentials to continue.
              </p>
            </div>

            <form className="space-y-5" onSubmit={handleSubmit}>
              <div>
                <label
                  htmlFor="username"
                  className="mb-2 block text-sm font-semibold text-sibs-primary-1"
                >
                  Username
                </label>
                <div className="relative">
                  <User
                    className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-sibs-primary-1"
                    aria-hidden="true"
                  />
                  <input
                    id="username"
                    name="username"
                    type="text"
                    autoComplete="username"
                    placeholder="Enter username"
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    className="form-input pl-11"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <label
                    htmlFor="password"
                    className="block text-sm font-semibold text-sibs-primary-1"
                  >
                    Password
                  </label>
                  <button
                    type="button"
                    className="rounded-md border-0 bg-transparent px-2 py-1 text-xs font-semibold text-sibs-tertiary-5 hover:bg-sibs-tertiary-4 hover:text-white"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Lock
                    className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-sibs-primary-1"
                    aria-hidden="true"
                  />
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="form-input pl-11 pr-11"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    onClick={() => setShowPassword((value) => !value)}
                    className="absolute right-3 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg border-0 bg-transparent text-sibs-primary-1 hover:bg-sibs-tertiary-4 hover:text-white"
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

              <div className="flex items-center justify-between gap-4">
                <label className="flex min-w-0 items-center gap-2 text-sm text-sibs-tertiary-5">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-sibs-tertiary-8 text-sibs-primary-1"
                  />
                  <span>Remember me</span>
                </label>
              </div>

              <Button
                type="submit"
                size="lg"
                className="h-11 w-full rounded-xl bg-sibs-primary-1 text-white hover:bg-sibs-tertiary-4"
                disabled={isLoading}
              >
                {isLoading ? "Signing in..." : "Sign in"}
                {!isLoading && (
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                )}
              </Button>
            </form>
          </div>
        </div>
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
              Check your username and password, then try again.
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
