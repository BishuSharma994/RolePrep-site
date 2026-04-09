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
  fixed?: boolean;
}

export default function PaywallModal({ plans, activeCheckoutPlan, onCheckout, fixed = false }: Props) {
  return (
    <div className={`${fixed ? "fixed" : "absolute"} inset-0 z-[70] flex items-center justify-center bg-[rgba(4,8,16,0.9)] p-4 backdrop-blur-md`}>
      <div className="w-full max-w-xl rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(18,24,38,0.99),rgba(8,11,20,0.99))] p-5 shadow-[0_26px_80px_rgba(0,0,0,0.42)] sm:p-6">
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-amber-300/20 bg-amber-300/10 text-amber-200">
            <Lock size={18} />
          </div>
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-amber-200">No sessions left</p>
            <h3 className="mt-2 font-display text-3xl leading-none tracking-[0.06em] text-slate-50">Unlock the next round</h3>
            <p className="mt-3 text-base leading-7 text-slate-300">Pick a pack to continue the interview loop. Background actions stay locked until access is restored.</p>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          {plans.map((plan) => (
            <button
              key={plan.planType}
              type="button"
              onClick={() => onCheckout(plan.planType)}
              disabled={activeCheckoutPlan !== null}
              className="rounded-[24px] border border-white/10 bg-white/[0.04] p-4 text-left transition-all duration-200 ease-in-out hover:-translate-y-1 hover:border-accent/25 hover:bg-white/[0.06]"
            >
              <p className="text-sm font-medium text-slate-50">{plan.label}</p>
              <p className="mt-2 text-sm uppercase tracking-[0.16em] text-accent">{plan.price}</p>
              <p className="mt-3 text-sm leading-6 text-slate-400">{plan.blurb}</p>
              <div className="mt-4 text-sm text-slate-100">
                {activeCheckoutPlan === plan.planType ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 size={16} className="animate-spin" />
                    Opening checkout
                  </span>
                ) : (
                  "Continue"
                )}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
