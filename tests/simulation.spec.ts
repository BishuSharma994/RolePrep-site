import { expect, test } from "@playwright/test";

const USER_ID = "playwright-user";
const ROLE = "Senior Frontend Engineer";
const JD_TEXT = "Build polished React products with strong frontend architecture and UX quality.";

function sessionPayload({
  sessionCredits,
  questionCount,
  scores,
  currentQuestion,
}: {
  sessionCredits: number;
  questionCount: number;
  scores: number[];
  currentQuestion?: string;
}) {
  return {
    sessions: [
      {
        user_id: USER_ID,
        session_id: "session-1",
        role: ROLE,
        jd_text: JD_TEXT,
        current_question:
          currentQuestion ?? "Tell me about a time you had to recover a project that was already slipping.",
        current_stage: "core",
        question_count: questionCount,
        history: [],
        scores,
        active_session: true,
        active_session_plan: sessionCredits > 0 ? "session_29" : "free",
        session_credits: sessionCredits,
        subscription_expiry: 0,
        selected_plan: sessionCredits > 0 ? "session_29" : "free",
        session_started_at: Date.now(),
        last_session_activity_at: Date.now(),
        updated_at: Date.now(),
      },
    ],
  };
}

async function seedLocalState(page: Parameters<typeof test>[0]["page"]) {
  await page.addInitScript(
    ({ userId, role, jdText }) => {
      window.localStorage.setItem("roleprep_web_user_id", userId);
      window.localStorage.setItem("roleprep_role", role);
      window.localStorage.setItem("roleprep_jd_text", jdText);
      window.localStorage.setItem("roleprep_resume_notes", "");
    },
    { userId: USER_ID, role: ROLE, jdText: JD_TEXT },
  );
}

test("runs landing to interview to dashboard simulation", async ({ page }) => {
  await seedLocalState(page);

  let analysisCompleted = false;

  await page.route("**/api/sessions**", async (route) => {
    const request = route.request();

    if (request.method() === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(
          analysisCompleted
            ? sessionPayload({
                sessionCredits: 4,
                questionCount: 5,
                scores: [7.2, 7.8, 8.1],
                currentQuestion: "What would you improve in this answer if asked again?",
              })
            : sessionPayload({
                sessionCredits: 5,
                questionCount: 4,
                scores: [7.2, 7.8],
              }),
        ),
      });
      return;
    }

    if (request.method() === "POST") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          session: sessionPayload({
            sessionCredits: 5,
            questionCount: 4,
            scores: [7.2, 7.8],
          }).sessions[0],
        }),
      });
      return;
    }

    await route.fallback();
  });

  await page.route("**/api/analyze-audio", async (route) => {
    analysisCompleted = true;
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        transcript: "I reset the roadmap, protected the deadline, and brought the launch back on track.",
        analysis: {
          content: {
            overall_score_100: 82,
            feedback_summary: "Sharper proof points lifted the answer.",
            strengths: ["Clear recovery narrative", "Strong ownership under pressure"],
            issues: ["Add one measurable outcome", "Tighten the closing impact statement"],
            followup: {
              question: "What metric proved the recovery plan was working?",
            },
            scores: {
              clarity: { score: 21, reason: "Clear verbal structure" },
              relevance: { score: 20, reason: "Stayed aligned to the role" },
              delivery: { score: 22, reason: "Confident under pressure" },
              structure: { score: 19, reason: "Crisp answer flow" },
              specificity: { score: 18, reason: "Needed one stronger metric" },
            },
          },
          voice: {
            filler_count: 2,
            speech_rate: 2.2,
          },
        },
        audio_metrics: {
          pause_count: 2,
        },
      }),
    });
  });

  await page.goto("/");
  await page.waitForResponse((response) => response.url().includes("/api/sessions") && response.request().method() === "GET");
  await page.waitForTimeout(500);

  await expect(page.getByText("Practice Real Interviews Under Pressure")).toBeVisible();
  const previewTimer = page.locator("text=/00:\\d{2}/").first();
  await expect(previewTimer).toBeVisible();
  await expect(previewTimer).toBeInViewport();
  await expect(page.getByText("Listening")).toBeVisible({ timeout: 7000 });
  await expect(page.getByText("78 / 100")).toBeVisible({ timeout: 12000 });

  await page.locator("section").first().getByRole("button", { name: "Start Interview" }).click();
  await expect(page).toHaveURL(/\/interview$/);

  await expect(page.getByText("Q 5/5")).toBeVisible();
  await expect(page.getByText("1:30")).toBeVisible();

  await page.getByRole("button", { name: /Start Interview/i }).last().click();
  await expect(page.getByRole("button", { name: /Listening/i })).toBeVisible();
  await expect(page.getByText("Listening...")).toBeVisible();

  await page.waitForTimeout(1500);
  await expect(page.getByText("1:28")).toBeVisible();

  await page.getByRole("button", { name: /Listening/i }).click();
  await expect(page.getByText("Analyzing your response...")).toBeVisible();
  await expect(page.getByRole("button", { name: /Analyzing your response/i })).toBeDisabled();
  await page.waitForTimeout(1100);

  await expect(page.getByText("82/100")).toBeVisible({ timeout: 10000 });
  await expect(page.getByText("Clear recovery narrative")).toBeVisible();
  await expect(page.getByText("Strong ownership under pressure")).toBeVisible();
  await expect(page.getByText("Add one measurable outcome")).toBeVisible();
  await expect(page.getByText("Tighten the closing impact statement")).toBeVisible();

  await expect(page).toHaveURL(/\/dashboard$/, { timeout: 10000 });
  await expect(page.getByText("Your improvement curve")).toBeVisible();
  await expect(page.getByText("Your improvement curve")).toBeInViewport();
  await expect(page.getByText("Weak areas")).toBeVisible();
  await expect(page.getByText("Current question")).toBeVisible();
  await expect(page.getByRole("button", { name: /Start Interview/i }).first()).toBeVisible();
});

test("shows a full-screen paywall when credits are exhausted", async ({ page }) => {
  await seedLocalState(page);

  await page.route("**/api/sessions**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(sessionPayload({ sessionCredits: 0, questionCount: 0, scores: [] })),
    });
  });

  await page.goto("/");

  await page.getByRole("button", { name: "Start Interview" }).first().click();

  await expect(page.getByText("No sessions left")).toBeVisible();
  await expect(page.getByText("₹10")).toBeVisible();
  await expect(page.getByText("₹29")).toBeVisible();
  await expect(page.getByText("₹99")).toBeVisible();

  await page.mouse.click(20, 20);
  await expect(page.getByText("No sessions left")).toBeVisible();
  await expect(page).toHaveURL(/\/$/);
});
