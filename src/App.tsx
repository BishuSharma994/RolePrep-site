import { Suspense, lazy, useEffect } from "react";
import { BrowserRouter, Navigate, Outlet, Route, Routes, useLocation } from "react-router-dom";
import AccountAccessPanel from "./components/AccountAccessPanel";
import AppNavbar from "./components/AppNavbar";
import GlobalPaywall from "./components/GlobalPaywall";
import InstallPrompt from "./components/InstallPrompt";
import { getAuthConfig, getAuthSession, getOrCreateLocalUserId, getSessions } from "./services/api";
import { useStore } from "./store";

const LandingPage = lazy(() => import("./pages/LandingPage"));
const InterviewPage = lazy(() => import("./pages/InterviewPage"));
const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const ResumePage = lazy(() => import("./pages/ResumePage"));

function RouteLoader() {
  return (
    <div className="min-h-dvh bg-bg-base noise-overlay">
      <div className="mx-auto flex min-h-dvh max-w-7xl items-center justify-center px-4 py-6 sm:px-6">
        <div className="card-base flex items-center gap-3 rounded-2xl px-5 py-4">
          <div className="h-2.5 w-2.5 rounded-full bg-accent animate-pulse" />
          <p className="text-xs font-mono uppercase tracking-[0.3em] text-text-secondary">Loading RolePrep</p>
        </div>
      </div>
    </div>
  );
}

function AppShell() {
  const authToken = useStore((state) => state.authToken);
  const activeUserId = useStore((state) => state.activeUserId);
  const anonymousModeAllowed = useStore((state) => state.anonymousModeAllowed);
  const setSessions = useStore((state) => state.setSessions);
  const setCurrentSession = useStore((state) => state.setCurrentSession);
  const setAuthSession = useStore((state) => state.setAuthSession);
  const clearAuthSession = useStore((state) => state.clearAuthSession);
  const setAuthConfig = useStore((state) => state.setAuthConfig);

  useEffect(() => {
    let isMounted = true;

    const bootstrap = async () => {
      let resolvedUserId = getOrCreateLocalUserId();
      let allowAnonymousMode = true;

      try {
        const authConfig = await getAuthConfig();
        if (!isMounted) {
          return;
        }

        setAuthConfig(authConfig);
        allowAnonymousMode = authConfig.anonymousModeAllowed;
      } catch {
        if (!isMounted) {
          return;
        }

        setAuthConfig({
          authRequired: false,
          anonymousModeAllowed: true,
          otpLoginEnabled: true,
          accountSyncEnabled: true,
        });
      }

      if (!authToken && !allowAnonymousMode) {
        clearAuthSession(false);
        resolvedUserId = "";
      }

      if (authToken) {
        try {
          const authSession = await getAuthSession();
          if (!isMounted) {
            return;
          }

          setAuthSession({
            authToken,
            email: authSession.email,
            userId: authSession.userId,
            expiresAt: authSession.expiresAt,
          });
          resolvedUserId = authSession.userId;
        } catch {
          if (!isMounted) {
            return;
          }

          clearAuthSession(allowAnonymousMode);
          resolvedUserId = allowAnonymousMode ? (useStore.getState().activeUserId || getOrCreateLocalUserId()) : "";
        }
      }

      if (!resolvedUserId && !authToken) {
        setSessions([]);
        setCurrentSession(null);
        return;
      }

      try {
        const sessions = await getSessions(resolvedUserId);
        if (!isMounted) {
          return;
        }

        setSessions(sessions);
        if (sessions[0]) {
          setCurrentSession(sessions[0]);
        } else {
          setCurrentSession(null);
        }
      } catch {
        // The app can still render before entitlement data is available.
      }
    };

    void bootstrap();

    return () => {
      isMounted = false;
    };
  }, [authToken, clearAuthSession, setAuthConfig, setAuthSession, setCurrentSession, setSessions]);

  useEffect(() => {
    const refreshAccessState = async () => {
      if (!authToken && !anonymousModeAllowed) {
        return;
      }

      if (!authToken && !activeUserId) {
        return;
      }

      try {
        const sessions = await getSessions(activeUserId || undefined);
        setSessions(sessions);
        setCurrentSession(sessions[0] ?? null);
      } catch {
        // Ignore background refresh failures.
      }
    };

    const onWindowFocus = () => {
      void refreshAccessState();
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void refreshAccessState();
      }
    };

    window.addEventListener("focus", onWindowFocus);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      window.removeEventListener("focus", onWindowFocus);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [activeUserId, anonymousModeAllowed, authToken, setCurrentSession, setSessions]);

  return (
    <div className="min-h-dvh bg-bg-base">
      <AppNavbar />
      <AccountAccessPanel />
      <GlobalPaywall />
      <Outlet />
    </div>
  );
}

function ProtectedRoute({ children }: { children: JSX.Element }) {
  const location = useLocation();
  const authToken = useStore((state) => state.authToken);
  const openAccountAccess = useStore((state) => state.openAccountAccess);
  const closePaywall = useStore((state) => state.closePaywall);
  const setPendingStartInterview = useStore((state) => state.setPendingStartInterview);
  const setPendingRoute = useStore((state) => state.setPendingRoute);

  useEffect(() => {
    if (!authToken) {
      closePaywall();
      if (location.pathname === "/interview") {
        setPendingRoute(null);
        setPendingStartInterview(true);
        openAccountAccess(true);
        return;
      }

      setPendingRoute(`${location.pathname}${location.search}${location.hash}`);
      setPendingStartInterview(false);
      openAccountAccess(false);
    }
  }, [authToken, closePaywall, location.hash, location.pathname, location.search, openAccountAccess, setPendingRoute, setPendingStartInterview]);

  if (!authToken) {
    return <Navigate to="/" replace />;
  }

  return children;
}

function App() {
  return (
    <BrowserRouter>
      <InstallPrompt />
      <Suspense fallback={<RouteLoader />}>
        <Routes>
          <Route element={<AppShell />}>
            <Route path="/" element={<LandingPage />} />
            <Route
              path="/interview"
              element={(
                <ProtectedRoute>
                  <InterviewPage />
                </ProtectedRoute>
              )}
            />
            <Route
              path="/dashboard"
              element={(
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              )}
            />
            <Route
              path="/resume"
              element={<ResumePage />}
            />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
