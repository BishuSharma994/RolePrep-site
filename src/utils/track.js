export const track = (event, data = {}) => {
  const rawAuthSession = localStorage.getItem("roleprep_auth_session");
  let authToken = "";
  let authUserId = "";

  if (rawAuthSession) {
    try {
      const parsed = JSON.parse(rawAuthSession);
      authToken = parsed?.authToken || "";
      authUserId = parsed?.userId || "";
    } catch {
      // Ignore malformed local auth state.
    }
  }

  fetch("/api/track", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    },
    body: JSON.stringify({
      event,
      data,
      user_id: authUserId || localStorage.getItem("roleprep_web_user_id") || localStorage.getItem("user_id"),
    }),
  }).catch(() => {});
};
