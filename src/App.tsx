import { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

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

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<RouteLoader />}>
        <Routes>
          <Route path="/" element={<InterviewPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
