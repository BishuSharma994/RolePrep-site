import { useNavigate } from "react-router-dom";
import { useStore } from "../store";

export function useStartInterviewAction() {
  const navigate = useNavigate();

  return () => {
    const {
      credits,
      premiumActive,
      entitlementHydrated,
      openPaywall,
    } = useStore.getState();

    if (!entitlementHydrated) {
      navigate("/interview");
      return;
    }

    if (!premiumActive && credits <= 0) {
      openPaywall();
      return;
    }

    navigate("/interview");
  };
}
