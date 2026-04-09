import { useState } from "react";
import PaywallModal from "./PaywallModal";
import { createPaymentLink, getOrCreateLocalUserId, type PlanType } from "../services/api";
import { useStore } from "../store";

const PLANS: Array<{ planType: PlanType; label: string; price: string; blurb: string }> = [
  { planType: "session_10", label: "₹10", price: "1 session", blurb: "Unlock one interview round." },
  { planType: "session_29", label: "₹29", price: "5 sessions", blurb: "Practice repeatedly without friction." },
  { planType: "premium", label: "₹99", price: "Premium", blurb: "Unlimited access while premium is active." },
];

export default function GlobalPaywall() {
  const isPaywallOpen = useStore((state) => state.isPaywallOpen);
  const [activeCheckoutPlan, setActiveCheckoutPlan] = useState<PlanType | null>(null);
  const userId = getOrCreateLocalUserId();

  if (!isPaywallOpen) {
    return null;
  }

  const handleCheckout = async (planType: PlanType) => {
    setActiveCheckoutPlan(planType);

    try {
      const { paymentLink } = await createPaymentLink(userId, planType);
      if (!paymentLink) {
        throw new Error("Unable to open checkout right now.");
      }

      window.location.href = paymentLink;
    } finally {
      setActiveCheckoutPlan(null);
    }
  };

  return (
    <div>
      <div>
        <PaywallModal plans={PLANS} activeCheckoutPlan={activeCheckoutPlan} onCheckout={(planType) => void handleCheckout(planType)} fixed />
      </div>
    </div>
  );
}
