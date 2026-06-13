import { test, expect } from "@playwright/test";
import { mockGQL } from "./helpers/gql";
import { authenticate } from "./helpers/auth";

// Baseline mocks for the today page that the app redirects to after login
const todayMocks = {
  GetTodayActions: { todayActions: [] },
  GetPreDayStatus: { preDayStatus: { afterDayRequired: false, canAccessToday: true, actionsWithoutTime: [], todayActionsWithOverlap: [] } },
  RunActionGathering: { runActionGathering: { dateKeysProcessed: [], actionsCreated: 0 } },
};

// ── Simple: page renders ──────────────────────────────────────────────────────

test("login page renders email, password fields and submit button", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByPlaceholder("Email")).toBeVisible();
  await expect(page.getByPlaceholder("Password")).toBeVisible();
  await expect(page.getByRole("button", { name: "Login" })).toBeVisible();
});

test("register page renders email, password and confirm password fields", async ({ page }) => {
  await page.goto("/register");
  await expect(page.getByPlaceholder("Email")).toBeVisible();
  await expect(page.getByPlaceholder("Password", { exact: true })).toBeVisible();
  await expect(page.getByPlaceholder("Confirm Password")).toBeVisible();
  await expect(page.getByRole("button", { name: /Register/i })).toBeVisible();
});

test("unauthenticated visit to /today redirects to /login", async ({ page }) => {
  await page.goto("/today");
  await expect(page).toHaveURL(/\/login/);
});

// ── Complex: flows ─────────────────────────────────────────────────────────────

test("login flow: valid credentials → redirect to /today", async ({ page }) => {
  await mockGQL(page, {
    Login: { login: { token: "e2e-test-token", user: { id: "u1", email: "user@example.com" } } },
    ...todayMocks,
  });

  await page.goto("/login");
  await page.getByPlaceholder("Email").fill("user@example.com");
  await page.getByPlaceholder("Password").fill("password123");
  await page.getByRole("button", { name: "Login" }).click();

  await expect(page).toHaveURL(/\/today/, { timeout: 5000 });
  await expect(page.getByRole("heading", { name: "Today" })).toBeVisible();
});

test("login wrong credentials: error message shown", async ({ page }) => {
  await mockGQL(page, {
    Login: { login: null },
  });

  await page.goto("/login");
  await page.getByPlaceholder("Email").fill("wrong@example.com");
  await page.getByPlaceholder("Password").fill("bad");
  await page.getByRole("button", { name: "Login" }).click();

  // The page should stay on /login and show an error
  await expect(page).toHaveURL(/\/login/);
  await expect(page.locator(".text-red-500")).toBeVisible();
});

test("register flow: valid details → redirect to /today", async ({ page }) => {
  await mockGQL(page, {
    Register: { register: { token: "e2e-test-token", user: { id: "u1", email: "new@example.com" } } },
    ...todayMocks,
  });

  await page.goto("/register");
  await page.getByPlaceholder("Email").fill("new@example.com");
  // Register page has two password fields; use exact match to avoid hitting "Confirm Password"
  await page.getByPlaceholder("Password", { exact: true }).fill("password123");
  await page.getByPlaceholder("Confirm Password").fill("password123");
  await page.getByRole("button", { name: /Register/i }).click();

  await expect(page).toHaveURL(/\/today/, { timeout: 5000 });
});

test("register passwords mismatch: client-side error shown without API call", async ({ page }) => {
  const calls: string[] = [];
  await page.route("**/graphql", (route) => {
    calls.push("called");
    route.continue();
  });

  await page.goto("/register");
  await page.getByPlaceholder("Email").fill("user@example.com");
  await page.getByPlaceholder("Password", { exact: true }).fill("abc");
  await page.getByPlaceholder("Confirm Password").fill("xyz");
  await page.getByRole("button", { name: /Register/i }).click();

  await expect(page.locator(".text-red-500")).toContainText("Passwords do not match");
  expect(calls).toHaveLength(0);
});
