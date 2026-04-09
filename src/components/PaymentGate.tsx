import { Loader2, Lock, Sparkles } from "lucide-react";
import { type PlanType } from "../services/api";

interface PaymentPlan {
  planType: PlanType;
  label: string;
  price: string;
  blurb: string;
}

interface Props {
  plans: PaymentPlan[];
  activeCheckoutPlan: PlanType | null;
  onCheckout: (planType: PlanType) => void;
}

export default function PaymentGate({ plans, activeCheckoutPlan, onCheckout }: Props) {
  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center rounded-[28px] bg-[rgba(4,8,16,0.82)] p-4 backdrop-blur-md">
      <div className="w-full max-w-xl rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(18,24,38,0.98),rgba(8,11,20,0.98))] p-5 shadow-[0_26px_80px_rgba(0,0,0,0.42)] sm:p-6">
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-amber-300/20 bg-amber-300/10 text-amber-200">
            <Lock size={18} />
          </div>
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-amber-200">No sessions left</p>
            <h3 className="mt-2 font-display text-3xl leading-none tracking-[0.06em] text-slate-50">Unlock your next interview round</h3>
            <p className="mt-3 text-sm leading-7 text-slate-300">
              Choose a credit pack or go premium to continue the simulation instantly.
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          {plans.map((plan) => (
            <button
              key={plan.planType}
              type="button"
              onClick={() => onCheckout(plan.planType)}
              disabled={activeCheckoutPlan !== null}
              className="group rounded-[24px] border border-white/10 bg-white/[0.04] p-4 text-left transition-all duration-200 ease-in-out hover:-translate-y-1 hover:border-accent/25 hover:bg-white/[0.06]"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-slate-50">{plan.label}</p>
                  <p className="mt-2 text-sm uppercase tracking-[0.16em] text-accent">{plan.price}</p>
                </div>
                <Sparkles size={16} className="text-amber-200 transition-transform duration-200 ease-in-out group-hover:rotate-12" />
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-400">{plan.blurb}</p>
              <div className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-slate-100">
                {activeCheckoutPlan === plan.planType ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Opening checkout
                  </>
                ) : (
                  "Buy access"
                )}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
