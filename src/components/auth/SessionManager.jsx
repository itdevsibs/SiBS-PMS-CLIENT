// Keeps an active frontend session renewed before its JWT cookie expires.
import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

import {
  getAuthSessionExpiresAt,
  getAuthUser,
  saveAuthSessionExpiry,
} from "@/lib/auth";
import {
  handleLogout,
  refreshSession,
} from "@/lib/axios/api-template";
import {
  getSessionRefreshDelay,
  isSessionRecentlyActive,
  SESSION_REFRESH_RETRY_MS,
} from "@/lib/session-manager";

const ACTIVITY_EVENTS = [
  "pointerdown",
  "mousemove",
  "keydown",
  "touchstart",
  "scroll",
];

const ACTIVITY_UPDATE_THROTTLE_MS = 1000;

const SessionManager = () => {
  const location = useLocation();
  const refreshTimerRef = useRef(null);
  const lastActivityAtRef = useRef(Date.now());
  const lastActivityUpdateRef = useRef(0);

  useEffect(() => {
    let isDisposed = false;

    const isLoginRoute =
      location.pathname === "/login" ||
      location.pathname === "/";

    const clearRefreshTimer = () => {
      if (refreshTimerRef.current) {
        window.clearTimeout(refreshTimerRef.current);
        refreshTimerRef.current = null;
      }
    };

    const scheduleAtExpiry = () => {
      clearRefreshTimer();

      const expiresAt = getAuthSessionExpiresAt();
      const remainingMs = Number(expiresAt) - Date.now();

      refreshTimerRef.current = window.setTimeout(
        () => {
          if (!isDisposed) {
            void handleLogout(true, "session-expired");
          }
        },
        Math.max(0, Number.isFinite(remainingMs) ? remainingMs : 0),
      );
    };

    const scheduleRefreshRetry = (runRefresh) => {
      clearRefreshTimer();

      refreshTimerRef.current = window.setTimeout(
        runRefresh,
        SESSION_REFRESH_RETRY_MS,
      );
    };

    const runRefresh = async () => {
      if (
        isDisposed ||
        isLoginRoute ||
        !getAuthUser()
      ) {
        return;
      }

      clearRefreshTimer();

      if (!isSessionRecentlyActive(lastActivityAtRef.current)) {
        scheduleAtExpiry();
        return;
      }

      try {
        const data = await refreshSession();

        if (isDisposed) {
          return;
        }

        const savedExpiresAt = saveAuthSessionExpiry({
          expiresAt: data?.expiresAt,
          expiresInMs: data?.expiresInMs,
        });

        if (!data?.success || !savedExpiresAt) {
          scheduleRefreshRetry(runRefresh);
          return;
        }

        scheduleRefresh();
      } catch (error) {
        if (isDisposed) {
          return;
        }

        const status = error?.response?.status;
        const code = error?.response?.data?.code;

        if (
          status === 401 ||
          code === "TOKEN_EXPIRED" ||
          code === "INVALID_TOKEN" ||
          code === "NO_TOKEN"
        ) {
          void handleLogout(true, "session-expired");
          return;
        }

        const expiresAt = getAuthSessionExpiresAt();

        if (Number(expiresAt) <= Date.now()) {
          void handleLogout(true, "session-expired");
          return;
        }

        scheduleRefreshRetry(runRefresh);
      }
    };

    function scheduleRefresh() {
      clearRefreshTimer();

      if (!getAuthUser() || isLoginRoute) {
        return;
      }

      const expiresAt = getAuthSessionExpiresAt();

      if (!expiresAt) {
        refreshTimerRef.current = window.setTimeout(runRefresh, 0);
        return;
      }

      if (Number(expiresAt) <= Date.now()) {
        void handleLogout(true, "session-expired");
        return;
      }

      const delay = getSessionRefreshDelay(expiresAt);

      refreshTimerRef.current = window.setTimeout(runRefresh, delay);
    }

    const markActivity = () => {
      const now = Date.now();

      if (
        now - lastActivityUpdateRef.current <
        ACTIVITY_UPDATE_THROTTLE_MS
      ) {
        return;
      }

      lastActivityUpdateRef.current = now;
      lastActivityAtRef.current = now;

      scheduleRefresh();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        markActivity();
      }
    };

    const handleStorageChange = (event) => {
      if (
        event.key === "pms-session-expires-at" ||
        event.key === "token_expires_at" ||
        event.key === "pms-auth-user"
      ) {
        scheduleRefresh();
      }
    };

    scheduleRefresh();

    ACTIVITY_EVENTS.forEach((eventName) => {
      window.addEventListener(eventName, markActivity, {
        passive: true,
      });
    });

    window.addEventListener("focus", markActivity);
    window.addEventListener("storage", handleStorageChange);
    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange,
    );

    return () => {
      isDisposed = true;
      clearRefreshTimer();

      ACTIVITY_EVENTS.forEach((eventName) => {
        window.removeEventListener(eventName, markActivity);
      });

      window.removeEventListener("focus", markActivity);
      window.removeEventListener("storage", handleStorageChange);
      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange,
      );
    };
  }, [location.pathname]);

  return null;
};

export default SessionManager;
