import { useMemo, useState } from "react";
import { KeyRound, Link2, LogOut, Mail, ShieldCheck } from "lucide-react";
import {
  createAccountLinkCode,
  getSessions,
  linkAccount,
  logout,
  requestOtp,
  verifyOtp,
} from "../services/api";
import { useStore } from "../store";

function formatTime(seconds: number) {
  if (!seconds) {
    return "Expires soon";
  }

  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${minutes}:${String(remainder).padStart(2, "0")}`;
}

function expiryLabel(expiresAt: number) {
  if (!expiresAt) {
    return "";
  }

  const timestamp = expiresAt > 10_000_000_000 ? expiresAt : expiresAt * 1000;
  const diffSeconds = Math.max(0, Math.round((timestamp - Date.now()) / 1000));
  return formatTime(diffSeconds);
}

function maskUserId(userId: string) {
  if (userId.length <= 12) {
    return userId;
  }

  return `${userId.slice(0, 6)}...${userId.slice(-4)}`;
}

function errorText(error: unknown) {
  if (
    error &&
    typeof error === "object" &&
    "response" in error &&
    error.response &&
    typeof error.response === "object" &&
    "data" in error.response
  ) {
    const data = error.response.data as { detail?: string | { reason?: string; message?: string } };
    if (typeof data?.detail === "string") {
      return data.detail;
    }
    if (data?.detail && typeof data.detail === "object") {
      return String(data.detail.message ?? data.detail.reason ?? "Request failed.");
    }
  }

  return error instanceof Error ? error.message : "Something went wrong.";
}

export default function AccountAccessPanel() {
  const activeUserId = useStore((state) => state.activeUserId);
  const authToken = useStore((state) => state.authToken);
  const authenticatedEmail = useStore((state) => state.authenticatedEmail);
  const authenticatedUserId = useStore((state) => state.authenticatedUserId);
  const authExpiry = useStore((state) => state.authExpiry);
  const setAuthSession = useStore((state) => state.setAuthSession);
  const clearAuthSession = useStore((state) => state.clearAuthSession);
  const setActiveUserId = useStore((state) => state.setActiveUserId);
  const setSessions = useStore((state) => state.setSessions);
  const setCurrentSession = useStore((state) => state.setCurrentSession);
  const [isExpanded, setIsExpanded] = useState(false);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [syncCodeInput, setSyncCodeInput] = useState("");
  const [generatedCode, setGeneratedCode] = useState("");
  const [generatedCodeExpiry, setGeneratedCodeExpiry] = useState(0);
  const [otpExpirySeconds, setOtpExpirySeconds] = useState(0);
  const [debugOtp, setDebugOtp] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [generatingCode, setGeneratingCode] = useState(false);
  const [linkingCode, setLinkingCode] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const authModeLabel = authToken ? "Authenticated" : "Anonymous";
  const syncCodeCountdown = useMemo(() => expiryLabel(generatedCodeExpiry), [generatedCodeExpiry]);
  const authExpiryCountdown = useMemo(() => expiryLabel(authExpiry), [authExpiry]);

  const refreshSessionsForUser = async (nextUserId: string) => {
    const sessions = await getSessions(nextUserId);
    setSessions(sessions);
    setCurrentSession(sessions[0] ?? null);
  };

  const handleSendOtp = async () => {
    if (!email.trim()) {
      setError("Enter your email before requesting a code.");
      return;
    }

    setSendingOtp(true);
    setError("");
    setNotice("");

    try {
      const response = await requestOtp(email.trim());
      setOtpExpirySeconds(response.expiresInSeconds);
      setDebugOtp(response.debugOtp);
      setNotice(`Code sent to ${response.email}.`);
    } catch (requestError) {
      setError(errorText(requestError));
    } finally {
      setSendingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!email.trim() || !otp.trim()) {
      setError("Enter both email and OTP.");
      return;
    }

    setVerifyingOtp(true);
    setError("");
    setNotice("");

    try {
      const response = await verifyOtp(email.trim(), otp.trim(), activeUserId || null);
      setAuthSession({
        authToken: response.authToken,
        email: response.email,
        userId: response.userId,
        expiresAt: response.expiresAt,
      });
      setActiveUserId(response.userId);
      await refreshSessionsForUser(response.userId);
      setOtp("");
      setGeneratedCode("");
      setGeneratedCodeExpiry(0);
      setNotice(`Signed in as ${response.email}.`);
    } catch (verifyError) {
      setError(errorText(verifyError));
    } finally {
      setVerifyingOtp(false);
    }
  };

  const handleGenerateSyncCode = async () => {
    setGeneratingCode(true);
    setError("");
    setNotice("");

    try {
      const response = await createAccountLinkCode(activeUserId);
      setGeneratedCode(response.code);
      setGeneratedCodeExpiry(response.expiresAt);
      setNotice("Sync code ready. Use it on another device to link accounts.");
    } catch (syncError) {
      setError(errorText(syncError));
    } finally {
      setGeneratingCode(false);
    }
  };

  const handleLinkDevice = async () => {
    if (!syncCodeInput.trim()) {
      setError("Enter the sync code from your other device.");
      return;
    }

    setLinkingCode(true);
    setError("");
    setNotice("");

    try {
      const response = await linkAccount(activeUserId, syncCodeInput.trim());
      if (authenticatedUserId && authenticatedUserId !== response.userId) {
        clearAuthSession();
      }
      setActiveUserId(response.userId);
      await refreshSessionsForUser(response.userId);
      setSyncCodeInput("");
      setNotice("This device is now linked to your account.");
    } catch (linkError) {
      setError(errorText(linkError));
    } finally {
      setLinkingCode(false);
    }
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    setError("");
    setNotice("");

    try {
      if (authToken) {
        await logout();
      }
    } catch {
      // Even if backend logout fails, clear the local session.
    } finally {
      clearAuthSession();
      await refreshSessionsForUser(useStore.getState().activeUserId);
      setLoggingOut(false);
      setNotice("Signed out. Anonymous mode is still available on this device.");
    }
  };

  return (
    <section className="border-b border-white/8 bg-[rgba(7,11,20,0.72)] backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6">
        <div className="flex flex-col gap-3 rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm uppercase tracking-[0.2em] text-accent">Account access</p>
                <span className={`rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] ${authToken ? "border-accent/30 bg-accent/10 text-accent" : "border-white/10 bg-white/[0.04] text-slate-400"}`}>
                  {authModeLabel}
                </span>
              </div>
              <p className="mt-2 text-sm text-slate-300">
                {authenticatedEmail ? `Signed in as ${authenticatedEmail}` : "Use email OTP or sync codes to keep one account across devices."}
              </p>
              <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-500">
                Current account id: {maskUserId(activeUserId)}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {authToken && (
                <button
                  type="button"
                  onClick={() => void handleLogout()}
                  disabled={loggingOut}
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-slate-100 transition-all duration-200 ease-in-out hover:border-white/20 hover:bg-white/[0.08] disabled:opacity-60"
                >
                  <LogOut size={16} />
                  {loggingOut ? "Signing out..." : "Logout"}
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsExpanded((value) => !value)}
                className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-slate-100 transition-all duration-200 ease-in-out hover:border-white/20 hover:bg-white/[0.08]"
              >
                {isExpanded ? "Hide account tools" : "Manage account"}
              </button>
            </div>
          </div>

          {authToken && authExpiryCountdown && (
            <div className="rounded-[18px] border border-accent/20 bg-accent/10 px-3 py-2 text-sm text-emerald-200">
              Session active for about {authExpiryCountdown}.
            </div>
          )}

          {isExpanded && (
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-[22px] border border-white/10 bg-[linear-gradient(180deg,rgba(18,24,38,0.9),rgba(8,11,20,0.88))] p-4">
                <div className="flex items-center gap-2">
                  <Mail size={16} className="text-accent" />
                  <p className="text-sm uppercase tracking-[0.18em] text-slate-300">Email OTP login</p>
                </div>
                <div className="mt-4 space-y-3">
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="name@example.com"
                    className="w-full rounded-[18px] border border-white/10 bg-[#0f1420] px-4 py-3 text-sm text-slate-100 outline-none transition-all duration-200 ease-in-out placeholder:text-slate-500 focus:border-accent/30 focus:bg-[#121826]"
                  />
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <button
                      type="button"
                      onClick={() => void handleSendOtp()}
                      disabled={sendingOtp}
                      className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-slate-100 transition-all duration-200 ease-in-out hover:border-white/20 hover:bg-white/[0.08] disabled:opacity-60"
                    >
                      <KeyRound size={16} />
                      {sendingOtp ? "Sending..." : "Send code"}
                    </button>
                    {otpExpirySeconds > 0 && <span className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-slate-400">Expires in {formatTime(otpExpirySeconds)}</span>}
                  </div>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={otp}
                    onChange={(event) => setOtp(event.target.value)}
                    placeholder="Enter OTP"
                    className="w-full rounded-[18px] border border-white/10 bg-[#0f1420] px-4 py-3 text-sm tracking-[0.2em] text-slate-100 outline-none transition-all duration-200 ease-in-out placeholder:text-slate-500 focus:border-accent/30 focus:bg-[#121826]"
                  />
                  <button
                    type="button"
                    onClick={() => void handleVerifyOtp()}
                    disabled={verifyingOtp}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[linear-gradient(90deg,#00ff88,#f4b44c)] px-4 py-3 text-sm font-medium text-[#07110c] transition-transform duration-200 ease-in-out hover:scale-[1.01] disabled:opacity-60"
                  >
                    <ShieldCheck size={16} />
                    {verifyingOtp ? "Verifying..." : "Verify code"}
                  </button>
                  {debugOtp && <p className="text-xs text-amber-200">Debug OTP: {debugOtp}</p>}
                </div>
              </div>

              <div className="rounded-[22px] border border-white/10 bg-[linear-gradient(180deg,rgba(18,24,38,0.9),rgba(8,11,20,0.88))] p-4">
                <div className="flex items-center gap-2">
                  <Link2 size={16} className="text-accent" />
                  <p className="text-sm uppercase tracking-[0.18em] text-slate-300">Device sync</p>
                </div>
                <div className="mt-4 space-y-3">
                  <button
                    type="button"
                    onClick={() => void handleGenerateSyncCode()}
                    disabled={generatingCode}
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-slate-100 transition-all duration-200 ease-in-out hover:border-white/20 hover:bg-white/[0.08] disabled:opacity-60"
                  >
                    {generatingCode ? "Generating..." : "Generate sync code"}
                  </button>
                  {generatedCode && (
                    <div className="rounded-[18px] border border-accent/20 bg-accent/10 px-4 py-3">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-300">Share this code</p>
                      <p className="mt-2 font-mono text-2xl tracking-[0.3em] text-accent">{generatedCode}</p>
                      {syncCodeCountdown && <p className="mt-2 text-xs text-slate-400">Expires in about {syncCodeCountdown}</p>}
                    </div>
                  )}
                  <input
                    type="text"
                    value={syncCodeInput}
                    onChange={(event) => setSyncCodeInput(event.target.value.toUpperCase())}
                    placeholder="Enter sync code"
                    className="w-full rounded-[18px] border border-white/10 bg-[#0f1420] px-4 py-3 text-sm tracking-[0.18em] text-slate-100 outline-none transition-all duration-200 ease-in-out placeholder:text-slate-500 focus:border-accent/30 focus:bg-[#121826]"
                  />
                  <button
                    type="button"
                    onClick={() => void handleLinkDevice()}
                    disabled={linkingCode}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-slate-100 transition-all duration-200 ease-in-out hover:border-white/20 hover:bg-white/[0.08] disabled:opacity-60"
                  >
                    {linkingCode ? "Linking..." : "Link this device"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {notice && <div className="rounded-[18px] border border-accent/20 bg-accent/10 px-3 py-2 text-sm text-emerald-200">{notice}</div>}
          {error && <div className="rounded-[18px] border border-rose-400/20 bg-rose-400/10 px-3 py-2 text-sm text-rose-200">{error}</div>}
        </div>
      </div>
    </section>
  );
}
