import { getOrCreateLocalUserId, getSessions } from "../services/api";
import { useNavigate } from "react-router-dom";
import { useStore } from "../store";

function hasInterviewAccess() {
  const { currentSession, credits, premiumActive } = useStore.getState();

  return premiumActive || credits > 0 || Boolean(currentSession?.activeSession);
}

export function useStartInterviewAction() {
  const navigate = useNavigate();

  return async () => {
    const {
      entitlementHydrated,
      openPaywall,
      closePaywall,
      setCurrentSession,
      setSessions,
    } = useStore.getState();

    if (!entitlementHydrated) {
      try {
        const sessions = await getSessions(getOrCreateLocalUserId());
        setSessions(sessions);
        setCurrentSession(sessions[0] ?? null);
      } catch {
        // If the entitlement refresh fails, fall back to the current in-memory state.
      }
    }

    if (!hasInterviewAccess()) {
      openPaywall();
      return;
    }

    closePaywall();
    navigate("/interview");
  };
}
