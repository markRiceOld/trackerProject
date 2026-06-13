import { test, expect } from "@playwright/test";
import { mockGQL } from "./helpers/gql";
import { authenticate } from "./helpers/auth";

function baseMocks(overrides: Record<string, object> = {}) {
  return {
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
    ...overrides,
  };
}

const LINKED_ACTION = {
  id: "a1",
  title: "Fix the bug",
  tbd: new Date().toISOString(),
  done: false,
  priority: "P",
  estimatedTimeMinutes: 30,
  startTimeOfDay: "09:00",
  project: { id: "p1", title: "Backend" },
  sourceType: null,
  sourceId: null,
  forDate: null,
  isGathered: false,
  actionFate: null,
};

// ── Simple: page renders ──────────────────────────────────────────────────────

test("today page shows heading and Organize/Review buttons", async ({ page }) => {
  await authenticate(page);
  await mockGQL(page, baseMocks());
  await page.goto("/today");

  await expect(page.getByRole("heading", { name: "Today" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Organize" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Review" })).toBeVisible();
});

test("today page shows empty state when no actions returned", async ({ page }) => {
  await authenticate(page);
  await mockGQL(page, baseMocks());
  await page.goto("/today");

  await expect(page.getByText("No linked actions for today.")).toBeVisible();
  await expect(page.getByText("No standalone actions for today.")).toBeVisible();
});

test("today page shows linked action card from API", async ({ page }) => {
  await authenticate(page);
  await mockGQL(page, baseMocks({
    GetTodayActions: { todayActions: [LINKED_ACTION] },
  }));
  await page.goto("/today");

  await expect(page.getByText("Fix the bug")).toBeVisible();
});

// ── Complex: interactions ──────────────────────────────────────────────────────

test("toggle action checkbox fires ToggleAction mutation", async ({ page }) => {
  const mutations: string[] = [];

  await authenticate(page);
  await mockGQL(page, {
    ...baseMocks({ GetTodayActions: { todayActions: [LINKED_ACTION] } }),
    ToggleAction: (body: any) => {
      mutations.push(body.variables?.id);
      return { toggleAction: { id: "a1", done: true } };
    },
  });

  await page.goto("/today");
  await expect(page.getByText("Fix the bug")).toBeVisible();

  // Click the checkbox for the action
  const checkbox = page.getByRole("checkbox").first();
  await checkbox.click();

  await expect.poll(() => mutations).toContain("a1");
});

test("add standalone action: title + est + time → AddAction mutation called", async ({ page }) => {
  const mutations: string[] = [];
  const today = new Date().toISOString().slice(0, 10);

  await authenticate(page);
  await mockGQL(page, {
    ...baseMocks(),
    AddAction: (body: any) => {
      mutations.push(body.variables?.title);
      return {
        addAction: {
          id: "a-new",
          title: body.variables?.title,
          tbd: today,
          done: false,
          priority: "P",
          estimatedTimeMinutes: 30,
          startTimeOfDay: "10:00",
        },
      };
    },
  });

  await page.goto("/today");

  // Type in the "Add a new action" input — triggers showAddFields
  await page.getByPlaceholder("Add a new action (title)").fill("Buy groceries");

  // Extra fields appear once the title is non-empty; use ids to target them precisely
  await page.locator("#today-add-estimated").waitFor({ state: "visible" });
  await page.locator("#today-add-estimated").fill("30");
  await page.locator("#today-add-time").fill("10:00");

  // Click the Add button (the icon button next to the title input)
  await page.locator("#today-add-action-title ~ button").click();

  await expect.poll(() => mutations).toContain("Buy groceries");
});
