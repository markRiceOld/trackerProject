import { test, expect } from "@playwright/test";
import { mockGQL } from "./helpers/gql";
import { authenticate } from "./helpers/auth";

const todayMocks = {
  GetTodayActions: { todayActions: [] },
  GetPreDayStatus: {
    preDayStatus: {
      afterDayRequired: false,
      canAccessToday: true,
      actionsWithoutTime: [],
      todayActionsWithOverlap: [],
    },
  },
  RunActionGathering: { runActionGathering: { dateKeysProcessed: [], actionsCreated: 0 } },
};

test("navigate from Today to Goals via sidebar", async ({ page }) => {
  await authenticate(page);
  await mockGQL(page, {
    ...todayMocks,
    GetGoals: { goals: [] },
  });

  await page.goto("/today");
  await expect(page.getByRole("heading", { name: "Today" })).toBeVisible();

  // Click the Activities nav item, then navigate to goals
  await page.getByRole("link", { name: /Activities/i }).click();
  await expect(page).toHaveURL(/\/activities/);
});

test("logout: settings → Log out → redirected to /login", async ({ page }) => {
  await authenticate(page);
  await mockGQL(page, todayMocks);

  await page.goto("/settings");
  await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();

  await page.getByRole("button", { name: "Log out" }).click();
  await expect(page).toHaveURL(/\/login/);
});

test("unauthenticated access → /login → login → original destination", async ({ page }) => {
  // First, intercept Login and set up today mocks
  await mockGQL(page, {
    Login: {
      login: { token: "e2e-test-token", user: { id: "u1", email: "user@example.com" } },
    },
    ...todayMocks,
  });

  // Try to visit /today without auth — should redirect to /login
  await page.goto("/today");
  await expect(page).toHaveURL(/\/login/);

  // Login
  await page.getByPlaceholder("Email").fill("user@example.com");
  await page.getByPlaceholder("Password").fill("password123");
  await page.getByRole("button", { name: "Login" }).click();

  // Should be sent to /today (the original destination)
  await expect(page).toHaveURL(/\/today/, { timeout: 5000 });
});
