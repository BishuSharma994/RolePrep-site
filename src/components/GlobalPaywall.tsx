import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import PaywallModal from "./PaywallModal";
import { createPaymentLink, getOrCreateLocalUserId, type PlanType } from "../services/api";
import { useStore } from "../store";
import { track } from "../utils/track";

const PLANS: Array<{ planType: PlanType; label: string; price: string; blurb: string }> = [
  { planType: "session_10", label: "₹10", price: "1 session", blurb: "Unlock one interview round." },
  { planType: "session_29", label: "₹29", price: "5 sessions", blurb: "Practice repeatedly without friction." },
  { planType: "premium", label: "₹99", price: "Premium", blurb: "Unlimited access while premium is active." },
];

export default function GlobalPaywall() {
  const navigate = useNavigate();
  const isPaywallOpen = useStore((state) => state.isPaywallOpen);
  const closePaywall = useStore((state) => state.closePaywall);
  const [activeCheckoutPlan, setActiveCheckoutPlan] = useState<PlanType | null>(null);
  const userId = getOrCreateLocalUserId();

  useEffect(() => {
    if (isPaywallOpen) {
      track("paywall_shown");
    }
  }, [isPaywallOpen]);

  if (!isPaywallOpen) {
    return null;
  }

  const handleCheckout = async (planType: PlanType) => {
    setActiveCheckoutPlan(planType);
    track("payment_initiated");

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

  const handleFreeSession = () => {
    closePaywall();
    navigate("/interview");
  };

  return (
    <div>
      <div>
        <PaywallModal
          plans={PLANS}
          activeCheckoutPlan={activeCheckoutPlan}
          onCheckout={(planType) => void handleCheckout(planType)}
          onFreeSession={handleFreeSession}
          fixed
        />
      </div>
    </div>
  );
}
