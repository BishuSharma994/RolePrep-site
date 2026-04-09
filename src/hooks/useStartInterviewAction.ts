import { useNavigate } from "react-router-dom";
import { useStore } from "../store";

export function useStartInterviewAction() {
  const navigate = useNavigate();

  return () => {
    const {
      entitlementHydrated,
    } = useStore.getState();

    if (!entitlementHydrated) {
      navigate("/interview");
      return;
    }

    navigate("/interview");
  };
}
