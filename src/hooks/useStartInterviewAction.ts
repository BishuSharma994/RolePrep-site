import type { NavigateFunction } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { getAuthConfig, getSessions } from "../services/api";
import { useStore } from "../store";

function hasInterviewAccess() {
  const { credits, premiumActive } = useStore.getState();

  return premiumActive || credits > 0;
}

async function hydrateAuthConfigIfNeeded() {
  const { authConfigHydrated, setAuthConfig } = useStore.getState();
  if (authConfigHydrated) {
    return useStore.getState();
  }

  try {
    const config = await getAuthConfig();
    setAuthConfig(config);
  } catch {
    setAuthConfig({
      authRequired: false,
      anonymousModeAllowed: true,
      otpLoginEnabled: true,
      accountSyncEnabled: true,
    });
  }

  return useStore.getState();
}

export async function continueStartInterviewFlow(navigate: NavigateFunction) {
  const {
    activeUserId,
    authToken,
    linkedAccountUserId,
    openPaywall,
    closePaywall,
    setCurrentSession,
    setSessions,
  } = useStore.getState();

  if (!authToken && !linkedAccountUserId) {
    closePaywall();
    return;
  }

  try {
    const sessions = await getSessions(activeUserId);
    setSessions(sessions);
    setCurrentSession(sessions[0] ?? null);
  } catch {
    // Fall back to current in-memory entitlement state if refresh fails.
  }

  if (!hasInterviewAccess()) {
    openPaywall();
    return;
  }

  closePaywall();
  navigate("/interview");
}

export function useStartInterviewAction() {
  const navigate = useNavigate();

  return async () => {
    const stateAfterConfig = await hydrateAuthConfigIfNeeded();
    const {
      authToken,
      linkedAccountUserId,
      openAccountAccess,
      closePaywall,
      setPendingStartInterview,
    } = stateAfterConfig;

    if (!authToken && !linkedAccountUserId) {
      closePaywall();
      setPendingStartInterview(true);
      openAccountAccess(true);
      return;
    }

    await continueStartInterviewFlow(navigate);
  };
}
