import { Loader2, Lock } from "lucide-react";
import type { PlanType } from "../services/api";

interface Plan {
  planType: PlanType;
  label: string;
  price: string;
  blurb: string;
}

interface Props {
  plans: Plan[];
  activeCheckoutPlan: PlanType | null;
  onCheckout: (planType: PlanType) => void;
  onFreeSession?: () => void;
  fixed?: boolean;
}

export default function PaywallModal({ plans, activeCheckoutPlan, onCheckout, onFreeSession, fixed = false }: Props) {
  const accessOptions = onFreeSession
    ? [
        {
          key: "free",
          label: "Free",
          eyebrow: "Starter pass",
          price: "Start now",
          blurb: "Skip checkout and jump straight into the interview.",
          actionLabel: "Go to interview",
          onClick: onFreeSession,
          isLoading: false,
        },
        ...plans.map((plan) => ({
          key: plan.planType,
          label: plan.label,
          eyebrow: plan.price,
          price: plan.price,
          blurb: plan.blurb,
          actionLabel: activeCheckoutPlan === plan.planType ? "Opening checkout" : "Continue",
          onClick: () => onCheckout(plan.planType),
          isLoading: activeCheckoutPlan === plan.planType,
        })),
      ]
    : plans.map((plan) => ({
        key: plan.planType,
        label: plan.label,
        eyebrow: plan.price,
        price: plan.price,
        blurb: plan.blurb,
        actionLabel: activeCheckoutPlan === plan.planType ? "Opening checkout" : "Continue",
        onClick: () => onCheckout(plan.planType),
        isLoading: activeCheckoutPlan === plan.planType,
      }));

  return (
    <div className={`${fixed ? "fixed" : "absolute"} inset-0 z-[70] flex items-center justify-center bg-[rgba(4,8,16,0.9)] p-3 backdrop-blur-md sm:p-4`}>
      <div className="w-full max-w-5xl max-h-[calc(100dvh-1.5rem)] overflow-y-auto rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(18,24,38,0.99),rgba(8,11,20,0.99))] p-4 shadow-[0_26px_80px_rgba(0,0,0,0.42)] sm:max-h-[calc(100dvh-2rem)] sm:rounded-[28px] sm:p-6">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-amber-300/20 bg-amber-300/10 text-amber-200 sm:h-12 sm:w-12">
            <Lock size={18} />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-[0.24em] text-amber-200 sm:text-sm sm:tracking-[0.2em]">No sessions left</p>
            <h3 className="mt-2 font-display text-[2rem] leading-none tracking-[0.05em] text-slate-50 sm:text-3xl sm:tracking-[0.06em]">Unlock the next round</h3>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base sm:leading-7">Pick the access level that fits this round. Free gets you in quickly, while paid plans reopen the full practice loop.</p>
          </div>
        </div>

        <div className="mt-5 grid gap-3 min-[480px]:grid-cols-2 lg:grid-cols-4">
          {accessOptions.map((option) => (
            <button
              key={option.key}
              type="button"
              onClick={option.onClick}
              disabled={activeCheckoutPlan !== null}
              className={`flex min-h-[188px] flex-col justify-between rounded-[22px] border p-4 text-left transition-all duration-200 ease-in-out hover:-translate-y-1 sm:min-h-[210px] sm:rounded-[24px] ${
                option.key === "free"
                  ? "border-accent/30 bg-[linear-gradient(180deg,rgba(0,255,136,0.12),rgba(0,255,136,0.07))] hover:border-accent/45 hover:bg-[linear-gradient(180deg,rgba(0,255,136,0.16),rgba(0,255,136,0.09))]"
                  : "border-white/10 bg-white/[0.04] hover:border-accent/25 hover:bg-white/[0.06]"
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-lg font-medium text-slate-50">{option.label}</p>
                    <p className="mt-2 text-xs uppercase tracking-[0.22em] text-accent">{option.eyebrow}</p>
                  </div>
                  {option.key === "free" && (
                    <span className="rounded-full border border-accent/30 bg-accent/10 px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] text-accent">
                      Fastest
                    </span>
                  )}
                </div>

                <p className={`mt-4 text-sm leading-6 ${option.key === "free" ? "text-slate-200" : "text-slate-400"}`}>{option.blurb}</p>
              </div>

              <div className="mt-5 flex items-center justify-between gap-3 border-t border-white/8 pt-3 text-sm text-slate-100">
                {option.isLoading ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 size={16} className="animate-spin" />
                    {option.actionLabel}
                  </span>
                ) : (
                  <span>{option.actionLabel}</span>
                )}
                <span className={`text-xs uppercase tracking-[0.18em] ${option.key === "free" ? "text-accent" : "text-slate-500"}`}>
                  {option.price}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
