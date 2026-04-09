import { useNavigate } from "react-router-dom";
import { useStore } from "../store";

export function useStartInterviewAction() {
  const navigate = useNavigate();
  const credits = useStore((state) => state.credits);
  const premiumActive = useStore((state) => state.premiumActive);
  const openPaywall = useStore((state) => state.openPaywall);

  return () => {
    if (!premiumActive && credits <= 0) {
      openPaywall();
      return;
    }

    navigate("/interview");
  };
}
