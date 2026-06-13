import type { Page } from "@playwright/test";
import { mockGQL } from "./gql";

const FAKE_TOKEN = "e2e-test-token";

/**
 * Inject a JWT token into localStorage before the page initialises,
 * so the AuthContext sees the user as authenticated on first render.
 */
export async function authenticate(page: Page, token = FAKE_TOKEN) {
  await page.addInitScript((t) => {
    window.localStorage.setItem("token", t);
  }, token);
}

/**
 * Simulate a full login flow through the UI.
 * Mocks the Login mutation, fills the form, and waits for navigation.
 */
export async function loginViaUI(
  page: Page,
  email = "user@example.com",
  password = "password123"
) {
  await mockGQL(page, {
    Login: { login: { token: FAKE_TOKEN } },
    // Today page will fire these after redirect
    GetTodayActions: { todayActions: [] },
    GetPreDayStatus: { preDayStatus: { afterDayRequired: false } },
    RunActionGathering: { runActionGathering: true },
  });

  await page.goto("/login");
  await page.getByPlaceholder(/email/i).fill(email);
  await page.getByPlaceholder(/password/i).fill(password);
  await page.getByRole("button", { name: /log in|sign in|login/i }).click();

  // After login, the app redirects to /today (or wherever)
  await page.waitForURL(/\/(today|$)/);
}
