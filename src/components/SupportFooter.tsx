interface Props {
  className?: string;
}

export default function SupportFooter({ className = "" }: Props) {
  return (
    <footer className={`rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(15,20,32,0.82),rgba(8,11,20,0.88))] px-5 py-4 text-xs text-slate-400 shadow-[0_18px_40px_rgba(0,0,0,0.22)] ${className}`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="leading-6">
          Need help with billing or account access? Contact{" "}
          <a href="mailto:support@roleprep.in" className="text-accent transition hover:text-accent-dim">
            support@roleprep.in
          </a>
        </p>

        <div className="flex flex-wrap items-center gap-3">
          <a href="/privacy/" className="transition hover:text-slate-200">
            Privacy Policy
          </a>
          <a href="/refund-policy/" className="transition hover:text-slate-200">
            Refund Policy
          </a>
          <a href="/terms/" className="transition hover:text-slate-200">
            Terms
          </a>
        </div>
      </div>
    </footer>
  );
}
