import { Suspense, lazy, useEffect } from "react";
import { BrowserRouter, Outlet, Route, Routes } from "react-router-dom";
import AppNavbar from "./components/AppNavbar";
import GlobalPaywall from "./components/GlobalPaywall";
import InstallPrompt from "./components/InstallPrompt";
import { getOrCreateLocalUserId, getSessions } from "./services/api";
import { useStore } from "./store";

const LandingPage = lazy(() => import("./pages/LandingPage"));
const InterviewPage = lazy(() => import("./pages/InterviewPage"));
const DashboardPage = lazy(() => import("./pages/DashboardPage"));

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
  const setSessions = useStore((state) => state.setSessions);
  const setCurrentSession = useStore((state) => state.setCurrentSession);

  useEffect(() => {
    let isMounted = true;

    const bootstrap = async () => {
      try {
        const sessions = await getSessions(getOrCreateLocalUserId());
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
  }, [setCurrentSession, setSessions]);

  return (
    <div className="min-h-dvh bg-bg-base">
      <AppNavbar />
      <GlobalPaywall />
      <Outlet />
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <InstallPrompt />
      <Suspense fallback={<RouteLoader />}>
        <Routes>
          <Route element={<AppShell />}>
            <Route path="/" element={<LandingPage />} />
            <Route path="/interview" element={<InterviewPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
