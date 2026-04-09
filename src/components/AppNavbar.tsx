import { useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { Menu, UserRound, X } from "lucide-react";
import { useStartInterviewAction } from "../hooks/useStartInterviewAction";
import { useStore } from "../store";

function navClassName(isActive: boolean) {
  return `rounded-full px-4 py-2 text-sm transition-all duration-200 ease-in-out ${
    isActive ? "bg-white/10 text-slate-50" : "text-slate-300 hover:bg-white/[0.06] hover:text-slate-50"
  }`;
}

export default function AppNavbar() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const authToken = useStore((state) => state.authToken);
  const currentSession = useStore((state) => state.currentSession);
  const activeUserId = useStore((state) => state.activeUserId);
  const authenticatedEmail = useStore((state) => state.authenticatedEmail);
  const openAccountAccess = useStore((state) => state.openAccountAccess);
  const setPendingRoute = useStore((state) => state.setPendingRoute);
  const startInterview = useStartInterviewAction();
  const profileLabel = authenticatedEmail
    ? authenticatedEmail
    : currentSession?.selectedPlan
      ? `${currentSession.selectedPlan.replace(/_/g, " ")} user`
      : "RolePrep account";

  const handleProtectedNavigation = (path: string) => {
    if (authToken) {
      return;
    }

    setPendingRoute(path);
    setIsOpen(false);
    openAccountAccess(false);
  };

  return (
    <header className="sticky top-0 z-50 border-b border-white/8 bg-[rgba(7,11,20,0.78)] backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-2.5 sm:px-6 sm:py-3">
        <Link to="/" className="group inline-flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-accent/20 bg-accent/10 text-accent shadow-[0_12px_32px_rgba(0,255,136,0.12)] transition-transform duration-200 ease-in-out group-hover:-translate-y-0.5 sm:h-11 sm:w-11">
            RP
          </div>
          <div>
            <p className="font-display text-[1.8rem] leading-none tracking-[0.14em] text-slate-50 sm:text-3xl">RolePrep</p>
            <p className="mt-1 text-[10px] uppercase tracking-[0.22em] text-slate-400 sm:text-xs">AI interview simulator</p>
          </div>
        </Link>

        <div className="hidden items-center gap-2 md:flex">
          <NavLink
            to="/dashboard"
            className={({ isActive }) => navClassName(isActive)}
            onClick={(event) => {
              if (!authToken) {
                event.preventDefault();
                handleProtectedNavigation("/dashboard");
              }
            }}
          >
            Dashboard
          </NavLink>
          <NavLink
            to="/resume"
            className={({ isActive }) => navClassName(isActive)}
          >
            Resume
          </NavLink>
          <button
            type="button"
            onClick={startInterview}
            className="rounded-full bg-[linear-gradient(90deg,#00ff88,#f4b44c)] px-5 py-2.5 text-sm font-medium text-[#07110c] shadow-[0_16px_34px_rgba(0,255,136,0.18)] transition-transform duration-200 ease-in-out hover:scale-[1.02]"
          >
            Start Interview
          </button>
          <button
            type="button"
            onClick={() => openAccountAccess(false)}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-slate-200 transition-all duration-200 ease-in-out hover:border-white/20 hover:bg-white/[0.08]"
            title={activeUserId}
          >
            <UserRound size={16} />
            {authenticatedEmail ? "Account" : "Profile"}
          </button>
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <button
            type="button"
            onClick={startInterview}
            className="rounded-full bg-[linear-gradient(90deg,#00ff88,#f4b44c)] px-4 py-2 text-sm font-medium text-[#07110c] shadow-[0_16px_34px_rgba(0,255,136,0.18)] transition-transform duration-200 ease-in-out hover:scale-[1.02]"
          >
            Start Interview
          </button>
          <button
            type="button"
            onClick={() => setIsOpen((value) => !value)}
            className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-slate-100 transition hover:border-white/20 hover:bg-white/[0.08]"
            aria-label="Toggle navigation"
          >
            {isOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="border-t border-white/8 bg-[rgba(7,11,20,0.92)] px-4 py-4 md:hidden">
          <div className="mx-auto flex max-w-7xl flex-col gap-3">
            <NavLink
              to="/dashboard"
              className={() => navClassName(location.pathname === "/dashboard")}
              onClick={(event) => {
                if (!authToken) {
                  event.preventDefault();
                  handleProtectedNavigation("/dashboard");
                  return;
                }

                setIsOpen(false);
              }}
            >
              Dashboard
            </NavLink>
            <NavLink
              to="/resume"
              className={() => navClassName(location.pathname === "/resume")}
              onClick={() => {
                setIsOpen(false);
              }}
            >
              Resume
            </NavLink>
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-slate-200">
              <div className="flex items-center gap-2">
                <UserRound size={16} />
                <span>Profile</span>
              </div>
              <p className="mt-2 text-sm text-slate-300">{profileLabel}</p>
              <p className="mt-1 break-all text-xs uppercase tracking-[0.18em] text-slate-500">{activeUserId}</p>
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  openAccountAccess(false);
                }}
                className="mt-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-slate-100 transition-all duration-200 ease-in-out hover:border-white/20 hover:bg-white/[0.08]"
              >
                Manage account
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
