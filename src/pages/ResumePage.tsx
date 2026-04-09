import { useEffect, useMemo, useState } from "react";
import { Download, FileLock2, FileText, Loader2, RefreshCw, Sparkles, Wand2 } from "lucide-react";
import SupportFooter from "../components/SupportFooter";
import { generateResume, getResume, improveResume } from "../services/api";
import { useStore } from "../store";
import type { ResumeResponse } from "../types/resume";

type ResumeSource = "raw_text" | "session";

const JD_STORAGE_KEY = "roleprep_resume_workspace_jd";
const RAW_TEXT_STORAGE_KEY = "roleprep_resume_workspace_raw_text";
const SOURCE_STORAGE_KEY = "roleprep_resume_workspace_source";
const PAID_SESSION_PLANS = new Set(["session_10", "session_29", "premium"]);

function getErrorDetail(error: unknown) {
  if (
    error &&
    typeof error === "object" &&
    "response" in error &&
    error.response &&
    typeof error.response === "object" &&
    "data" in error.response
  ) {
    const data = error.response.data as {
      detail?: string | { code?: string; reason?: string; message?: string };
    };

    if (data?.detail && typeof data.detail === "object") {
      return data.detail;
    }
  }

  return null;
}

function isResumePlanRequiredError(error: unknown) {
  const detail = getErrorDetail(error);
  return detail?.code === "RESUME_PLAN_REQUIRED";
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

function downloadPdfFromBase64(base64: string, filename: string, contentType: string) {
  const sanitized = base64.includes(",") ? base64.split(",").pop() ?? "" : base64;
  const binary = window.atob(sanitized);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  const blob = new Blob([bytes], { type: contentType || "application/pdf" });
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename || "roleprep_resume.pdf";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.URL.revokeObjectURL(url);
}

function PreviewSection({ label, items }: { label: string; items: { title: string; bullets: string[] }[] }) {
  if (!items.length) {
    return null;
  }

  return (
    <div className="rounded-[22px] border border-white/10 bg-white/[0.03] p-4">
      <p className="text-sm uppercase tracking-[0.18em] text-slate-400">{label}</p>
      <div className="mt-4 space-y-4">
        {items.map((section, index) => (
          <div key={`${section.title}-${index}`}>
            <h3 className="text-lg text-slate-100">{section.title || `${label} ${index + 1}`}</h3>
            <ul className="mt-3 space-y-2 text-sm leading-7 text-slate-300 sm:text-base">
              {section.bullets.map((bullet, bulletIndex) => (
                <li key={`${section.title}-${bulletIndex}`}>- {bullet}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ResumePage() {
  const activeUserId = useStore((state) => state.activeUserId);
  const authenticatedEmail = useStore((state) => state.authenticatedEmail);
  const currentSession = useStore((state) => state.currentSession);
  const credits = useStore((state) => state.credits);
  const premiumActive = useStore((state) => state.premiumActive);
  const openPaywall = useStore((state) => state.openPaywall);
  const [jdText, setJdText] = useState(() => window.localStorage.getItem(JD_STORAGE_KEY) ?? "");
  const [rawText, setRawText] = useState(() => window.localStorage.getItem(RAW_TEXT_STORAGE_KEY) ?? "");
  const [source, setSource] = useState<ResumeSource>(() => {
    const stored = window.localStorage.getItem(SOURCE_STORAGE_KEY);
    return stored === "session" ? "session" : "raw_text";
  });
  const [resumeResponse, setResumeResponse] = useState<ResumeResponse | null>(null);
  const [loadingAction, setLoadingAction] = useState<"generate" | "improve" | "latest" | null>(null);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const hasSessionSource = Boolean(currentSession?.sessionId);
  const effectiveSource = source === "session" && hasSessionSource ? "session" : "raw_text";
  const preview = resumeResponse?.resumeJson ?? null;
  const hasPaidSessionEntitlement = credits > 0
    || PAID_SESSION_PLANS.has(currentSession?.selectedPlan ?? "")
    || PAID_SESSION_PLANS.has(currentSession?.activeSessionPlan ?? "");
  const hasResumeAccess = premiumActive || hasPaidSessionEntitlement;
  const createdAtLabel = useMemo(
    () => (resumeResponse?.createdAt ? new Date(resumeResponse.createdAt).toLocaleString() : ""),
    [resumeResponse?.createdAt],
  );

  useEffect(() => {
    window.localStorage.setItem(JD_STORAGE_KEY, jdText);
  }, [jdText]);

  useEffect(() => {
    window.localStorage.setItem(RAW_TEXT_STORAGE_KEY, rawText);
  }, [rawText]);

  useEffect(() => {
    window.localStorage.setItem(SOURCE_STORAGE_KEY, effectiveSource);
  }, [effectiveSource]);

  useEffect(() => {
    if (!jdText.trim() && currentSession?.jdText) {
      setJdText(currentSession.jdText);
    }
  }, [currentSession?.jdText, jdText]);

  useEffect(() => {
    if (!hasResumeAccess) {
      setResumeResponse(null);
    }
  }, [hasResumeAccess]);

  const openResumeUpgrade = (message = "Resume Intelligence is available on paid plans only.") => {
    setError(message);
    setNotice("");
    openPaywall();
  };

  const runGenerate = async () => {
    if (!hasResumeAccess) {
      openResumeUpgrade();
      return;
    }

    if (!jdText.trim()) {
      setError("Paste the job description before generating the resume.");
      return;
    }

    if (effectiveSource === "raw_text" && !rawText.trim()) {
      setError("Add raw resume text or switch to the active session source.");
      return;
    }

    if (effectiveSource === "session" && !currentSession?.sessionId) {
      setError("No active session is available yet. Start an interview session first or use raw text.");
      return;
    }

    setLoadingAction("generate");
    setError("");
    setNotice("");

    try {
      const response = await generateResume({
        userId: activeUserId || null,
        jdText: jdText.trim(),
        rawText: effectiveSource === "raw_text" ? rawText.trim() : null,
        sessionId: effectiveSource === "session" ? currentSession?.sessionId ?? null : null,
      });
      setResumeResponse(response);
      setNotice(`Resume generated for ${response.userId}.`);
    } catch (resumeError) {
      if (isResumePlanRequiredError(resumeError)) {
        openResumeUpgrade(errorText(resumeError));
        return;
      }

      setError(errorText(resumeError));
    } finally {
      setLoadingAction(null);
    }
  };

  const runImprove = async () => {
    if (!hasResumeAccess) {
      openResumeUpgrade();
      return;
    }

    if (!jdText.trim()) {
      setError("Paste the job description before improving the resume.");
      return;
    }

    if (!resumeResponse && effectiveSource === "raw_text" && !rawText.trim()) {
      setError("Add raw resume text, fetch the latest resume, or generate one first.");
      return;
    }

    if (!resumeResponse && effectiveSource === "session" && !currentSession?.sessionId) {
      setError("No active session is available yet. Start an interview session first or use raw text.");
      return;
    }

    setLoadingAction("improve");
    setError("");
    setNotice("");

    try {
      const response = await improveResume({
        userId: activeUserId || null,
        jdText: jdText.trim(),
        resumeJson: resumeResponse?.resumeJson ?? null,
        rawText: !resumeResponse && effectiveSource === "raw_text" ? rawText.trim() : null,
        sessionId: !resumeResponse && effectiveSource === "session" ? currentSession?.sessionId ?? null : null,
      });
      setResumeResponse(response);
      setNotice("Resume improved with the latest backend recommendations.");
    } catch (resumeError) {
      if (isResumePlanRequiredError(resumeError)) {
        openResumeUpgrade(errorText(resumeError));
        return;
      }

      setError(errorText(resumeError));
    } finally {
      setLoadingAction(null);
    }
  };

  const runFetchLatest = async () => {
    if (!hasResumeAccess) {
      openResumeUpgrade();
      return;
    }

    setLoadingAction("latest");
    setError("");
    setNotice("");

    try {
      const response = await getResume(activeUserId);
      setResumeResponse(response);
      if (!jdText.trim() && response.jdText) {
        setJdText(response.jdText);
      }
      setNotice("Latest resume loaded from the backend.");
    } catch (resumeError) {
      if (isResumePlanRequiredError(resumeError)) {
        openResumeUpgrade(errorText(resumeError));
        return;
      }

      setError(errorText(resumeError));
    } finally {
      setLoadingAction(null);
    }
  };

  const handleDownload = () => {
    if (!hasResumeAccess) {
      openResumeUpgrade();
      return;
    }

    if (!resumeResponse?.pdfBase64) {
      setError("Generate, improve, or fetch a resume before downloading the PDF.");
      return;
    }

    setError("");
    setNotice(`Downloading ${resumeResponse.pdfFilename}.`);
    downloadPdfFromBase64(resumeResponse.pdfBase64, resumeResponse.pdfFilename, resumeResponse.contentType);
  };

  return (
    <div className="min-h-dvh bg-[#070b14] noise-overlay">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-[360px] bg-[radial-gradient(circle_at_top,_rgba(244,180,76,0.16),_transparent_38%),radial-gradient(circle_at_20%_20%,_rgba(0,255,136,0.12),_transparent_30%),radial-gradient(circle_at_80%_20%,_rgba(74,144,226,0.12),_transparent_30%)]" />
      </div>

      <div className="relative mx-auto max-w-7xl space-y-5 px-4 py-5 sm:px-6 sm:py-6">
        <section className="rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(18,24,38,0.96),rgba(8,11,20,0.95))] p-4 shadow-[0_30px_80px_rgba(0,0,0,0.35)] sm:rounded-[30px] sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-accent">Resume intelligence</p>
              <h1 className="mt-3 font-display text-3xl leading-[0.92] tracking-[0.05em] text-slate-50 sm:text-5xl">Generate a role-shaped resume from your interview context.</h1>
              <p className="mt-4 max-w-3xl text-base leading-8 text-slate-300">Resume Intelligence is an extra paid service. Session-plan and premium users can generate, improve, fetch, and download resumes here. Free users can view the workspace, but resume actions stay locked until they upgrade.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-xs uppercase tracking-[0.18em] text-slate-300">
                {authenticatedEmail ? authenticatedEmail : "Anonymous mode"}
              </span>
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-xs uppercase tracking-[0.18em] text-slate-400">
                User {activeUserId}
              </span>
              {hasSessionSource && (
                <span className="rounded-full border border-accent/20 bg-accent/10 px-3 py-2 text-xs uppercase tracking-[0.18em] text-accent">
                  Session {currentSession?.sessionId}
                </span>
              )}
              <span className={`rounded-full border px-3 py-2 text-xs uppercase tracking-[0.18em] ${hasResumeAccess ? "border-accent/20 bg-accent/10 text-accent" : "border-amber-300/20 bg-amber-300/10 text-amber-200"}`}>
                {hasResumeAccess ? "Paid access active" : "Paid plan required"}
              </span>
            </div>
          </div>
        </section>

        <section className="grid gap-5 xl:grid-cols-[0.92fr_1.08fr]">
          <aside className="space-y-5">
            <div className="rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(18,24,38,0.96),rgba(8,11,20,0.94))] p-4 shadow-[0_24px_60px_rgba(0,0,0,0.28)] sm:rounded-[28px] sm:p-6">
              <div className="flex items-center gap-2">
                <FileText size={16} className="text-accent" />
                <p className="text-sm uppercase tracking-[0.18em] text-slate-400">Resume source</p>
              </div>

              <div className="mt-5 grid gap-4">
                {!hasResumeAccess && (
                  <div className="rounded-[22px] border border-amber-300/20 bg-amber-300/10 p-4">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-amber-300/20 bg-amber-300/10 text-amber-200">
                        <FileLock2 size={16} />
                      </div>
                      <div>
                        <p className="text-sm uppercase tracking-[0.18em] text-amber-200">Paid only</p>
                        <p className="mt-2 text-base text-slate-100">Resume Intelligence is available on paid plans only.</p>
                        <p className="mt-2 text-sm leading-6 text-slate-300">Upgrade to a session pack or premium to generate, improve, fetch, and download resumes from this workspace.</p>
                        <button
                          type="button"
                          onClick={() => openResumeUpgrade()}
                          className="mt-4 inline-flex items-center justify-center rounded-full bg-[linear-gradient(90deg,#00ff88,#f4b44c)] px-4 py-2.5 text-sm font-medium text-[#07110c] transition-transform duration-200 ease-in-out hover:scale-[1.01]"
                        >
                          Unlock Resume Intelligence
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                <label className="block space-y-2">
                  <span className="text-sm uppercase tracking-[0.18em] text-slate-400">Job description</span>
                  <textarea
                    value={jdText}
                    onChange={(event) => setJdText(event.target.value)}
                    rows={7}
                    placeholder="Paste the target JD so resume bullets are tailored to the role."
                    className="w-full rounded-[22px] border border-white/10 bg-[#0f1420] px-4 py-3 text-base leading-7 text-slate-100 outline-none transition-all duration-200 ease-in-out placeholder:text-slate-500 focus:border-accent/30 focus:bg-[#121826]"
                  />
                </label>

                <div className="rounded-[22px] border border-white/10 bg-white/[0.03] p-4">
                  <p className="text-sm uppercase tracking-[0.18em] text-slate-400">Choose source</p>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => setSource("raw_text")}
                      className={`rounded-[18px] border px-4 py-3 text-left transition-all duration-200 ease-in-out ${
                        effectiveSource === "raw_text"
                          ? "border-accent/30 bg-accent/10 text-slate-50"
                          : "border-white/10 bg-[#0f1420] text-slate-300 hover:border-white/20 hover:bg-[#121826]"
                      }`}
                    >
                      <p className="text-sm uppercase tracking-[0.18em]">Raw text</p>
                      <p className="mt-2 text-sm leading-6 text-slate-400">Paste an existing resume draft, notes, or profile summary.</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => hasSessionSource && setSource("session")}
                      disabled={!hasSessionSource}
                      className={`rounded-[18px] border px-4 py-3 text-left transition-all duration-200 ease-in-out ${
                        effectiveSource === "session"
                          ? "border-accent/30 bg-accent/10 text-slate-50"
                          : "border-white/10 bg-[#0f1420] text-slate-300 hover:border-white/20 hover:bg-[#121826]"
                      } ${!hasSessionSource ? "cursor-not-allowed opacity-55" : ""}`}
                    >
                      <p className="text-sm uppercase tracking-[0.18em]">Active session</p>
                      <p className="mt-2 text-sm leading-6 text-slate-400">
                        {hasSessionSource ? "Use the current interview session context and backend session_id." : "No active session found yet."}
                      </p>
                    </button>
                  </div>
                </div>

                <label className="block space-y-2">
                  <span className="text-sm uppercase tracking-[0.18em] text-slate-400">Raw resume text</span>
                  <textarea
                    value={rawText}
                    onChange={(event) => setRawText(event.target.value)}
                    rows={10}
                    disabled={effectiveSource !== "raw_text"}
                    placeholder="Paste your current resume text, experience notes, achievements, tools, and impact here."
                    className="w-full rounded-[22px] border border-white/10 bg-[#0f1420] px-4 py-3 text-base leading-7 text-slate-100 outline-none transition-all duration-200 ease-in-out placeholder:text-slate-500 focus:border-accent/30 focus:bg-[#121826] disabled:cursor-not-allowed disabled:opacity-60"
                  />
                </label>
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => void runGenerate()}
                  disabled={loadingAction !== null || !hasResumeAccess}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-[linear-gradient(90deg,#00ff88,#f4b44c)] px-5 py-3 text-sm font-medium text-[#07110c] transition-transform duration-200 ease-in-out hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-45"
                >
                  {loadingAction === "generate" ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                  Generate Resume
                </button>
                <button
                  type="button"
                  onClick={() => void runImprove()}
                  disabled={loadingAction !== null || !hasResumeAccess}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-5 py-3 text-sm text-slate-100 transition-all duration-200 ease-in-out hover:border-white/20 hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-45"
                >
                  {loadingAction === "improve" ? <Loader2 size={16} className="animate-spin" /> : <Wand2 size={16} />}
                  Improve Resume
                </button>
                <button
                  type="button"
                  onClick={() => void runFetchLatest()}
                  disabled={loadingAction !== null || !hasResumeAccess}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-5 py-3 text-sm text-slate-100 transition-all duration-200 ease-in-out hover:border-white/20 hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-45"
                >
                  {loadingAction === "latest" ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                  Fetch Latest
                </button>
                <button
                  type="button"
                  onClick={handleDownload}
                  disabled={!resumeResponse?.pdfBase64 || !hasResumeAccess}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-5 py-3 text-sm text-slate-100 transition-all duration-200 ease-in-out hover:border-white/20 hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-45"
                >
                  <Download size={16} />
                  Download PDF
                </button>
              </div>

              {notice && <div className="mt-4 rounded-[18px] border border-accent/20 bg-accent/10 px-3 py-2 text-sm text-emerald-200">{notice}</div>}
              {error && <div className="mt-4 rounded-[18px] border border-rose-400/20 bg-rose-400/10 px-3 py-2 text-sm text-rose-200">{error}</div>}
            </div>
          </aside>

          <section className="space-y-5">
            <div className="rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(17,22,36,0.96),rgba(8,11,20,0.96))] p-4 shadow-[0_26px_70px_rgba(0,0,0,0.3)] sm:rounded-[28px] sm:p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.18em] text-accent">Resume preview</p>
                  <h2 className="mt-2 font-display text-3xl leading-none tracking-[0.05em] text-slate-50 sm:text-4xl">
                    {preview ? "Backend-generated draft" : "No resume loaded yet"}
                  </h2>
                  <p className="mt-3 text-sm leading-7 text-slate-300 sm:text-base">
                    {preview
                      ? "Review the generated structure here before downloading the PDF."
                      : hasResumeAccess
                        ? "Generate, improve, or fetch the latest resume to preview the summary, skills, experience, and projects."
                        : "Free users cannot generate, fetch, or download resumes here. Upgrade to a paid plan to unlock the full resume workflow."}
                  </p>
                </div>
                {resumeResponse && (
                  <div className="rounded-[20px] border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-slate-300">
                    <p>{resumeResponse.pdfFilename}</p>
                    {createdAtLabel && <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-500">{createdAtLabel}</p>}
                  </div>
                )}
              </div>

              {preview ? (
                <div className="mt-6 space-y-4">
                  <div className="rounded-[22px] border border-white/10 bg-white/[0.03] p-4">
                    <p className="text-sm uppercase tracking-[0.18em] text-slate-400">Summary</p>
                    <p className="mt-4 text-base leading-8 text-slate-100">{preview.summary || "No summary returned yet."}</p>
                  </div>

                  <div className="rounded-[22px] border border-white/10 bg-white/[0.03] p-4">
                    <p className="text-sm uppercase tracking-[0.18em] text-slate-400">Skills</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {preview.skills.length ? preview.skills.map((skill) => (
                        <span key={skill} className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-2 text-sm text-slate-100">
                          {skill}
                        </span>
                      )) : <p className="text-sm text-slate-400">No skills returned yet.</p>}
                    </div>
                  </div>

                  <PreviewSection label="Experience" items={preview.experience} />
                  <PreviewSection label="Projects" items={preview.projects} />
                </div>
              ) : (
                <div className="mt-6 rounded-[22px] border border-dashed border-white/10 bg-white/[0.02] px-4 py-10 text-center text-sm leading-7 text-slate-400 sm:px-6 sm:text-base">
                  The preview stays here after the backend returns `resume_json` and `pdf_base64`.
                </div>
              )}
            </div>

            <SupportFooter />
          </section>
        </section>
      </div>
    </div>
  );
}
