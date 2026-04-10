import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import PaywallModal from "./PaywallModal";
import { createPaymentLink, type PlanType } from "../services/api";
import { useStore } from "../store";
import { track } from "../utils/track";

const PLANS: Array<{ planType: PlanType; label: string; price: string; blurb: string }> = [
  { planType: "session_10", label: "₹10", price: "1 session", blurb: "Unlock one interview round." },
  { planType: "session_29", label: "₹29", price: "5 sessions", blurb: "Practice repeatedly without friction." },
  { planType: "premium", label: "₹99", price: "Premium", blurb: "Unlimited access while premium is active." },
];

export default function GlobalPaywall() {
  const navigate = useNavigate();
  const authToken = useStore((state) => state.authToken);
  const linkedAccountUserId = useStore((state) => state.linkedAccountUserId);
  const isPaywallOpen = useStore((state) => state.isPaywallOpen);
  const activeUserId = useStore((state) => state.activeUserId);
  const closePaywall = useStore((state) => state.closePaywall);
  const openAccountAccess = useStore((state) => state.openAccountAccess);
  const setPendingStartInterview = useStore((state) => state.setPendingStartInterview);
  const [activeCheckoutPlan, setActiveCheckoutPlan] = useState<PlanType | null>(null);
  const hasAccountAccess = Boolean(authToken || linkedAccountUserId);

  useEffect(() => {
    if (isPaywallOpen) {
      track("paywall_shown");
    }
  }, [isPaywallOpen]);

  if (!isPaywallOpen) {
    return null;
  }

  const handleCheckout = async (planType: PlanType) => {
    if (!hasAccountAccess) {
      closePaywall();
      setPendingStartInterview(true);
      openAccountAccess(true);
      return;
    }

    setActiveCheckoutPlan(planType);
    track("payment_initiated");

    try {
      const { paymentLink } = await createPaymentLink(activeUserId, planType);
      if (!paymentLink) {
        throw new Error("Unable to open checkout right now.");
      }

      window.location.href = paymentLink;
    } finally {
      setActiveCheckoutPlan(null);
    }
  };

  const handleFreeSession = () => {
    if (!hasAccountAccess) {
      closePaywall();
      setPendingStartInterview(true);
      openAccountAccess(true);
      return;
    }

    closePaywall();
    navigate("/interview");
  };

  const handleBackHome = () => {
    closePaywall();
    navigate("/");
  };

  return (
    <div>
      <div>
        <PaywallModal
          plans={PLANS}
          activeCheckoutPlan={activeCheckoutPlan}
          onCheckout={(planType) => void handleCheckout(planType)}
          onFreeSession={handleFreeSession}
          onBackHome={handleBackHome}
          fixed
        />
      </div>
    </div>
  );
}
