export const track = (event, data = {}) => {
  fetch("/api/track", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      event,
      data,
      user_id: localStorage.getItem("user_id") || localStorage.getItem("roleprep_web_user_id"),
    }),
  }).catch(() => {});
};
