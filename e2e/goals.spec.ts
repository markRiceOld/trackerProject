import { test, expect } from "@playwright/test";
import { mockGQL } from "./helpers/gql";
import { authenticate } from "./helpers/auth";

const SAMPLE_GOAL = {
  id: "g1",
  title: "Ship v2",
  dod: null,
  isGoalGroup: false,
  startDate: null,
  endDate: null,
  createdAt: new Date().toISOString(),
  parentGoalId: null,
  parentMilestoneId: null,
  dodClarityStatus: null,
  dodFlaggedDimensions: [],
  milestones: [],
  projects: [],
};

// Mock for the manage-goal page (GET_GOAL query)
const MANAGE_GOAL_MOCK = {
  goal: {
    id: "g1",
    title: "Ship v2",
    dod: null,
    isGoalGroup: false,
    startDate: null,
    endDate: null,
    dodClarityStatus: null,
    dodFlaggedDimensions: [],
    parentGoalId: null,
    parentMilestoneId: null,
    milestones: [],
    projects: [],
    childGoals: [],
    linkedIntervals: [],
  },
};

// ── Simple ────────────────────────────────────────────────────────────────────

test("goals list shows heading and Add goal button", async ({ page }) => {
  await authenticate(page);
  await mockGQL(page, { GetGoals: { goals: [] } });
  await page.goto("/activities/goals");

  await expect(page.getByRole("heading", { name: "Goals" })).toBeVisible();
  await expect(page.getByRole("button", { name: /Add goal/i })).toBeVisible();
});

test("goals list shows empty state when no goals", async ({ page }) => {
  await authenticate(page);
  await mockGQL(page, { GetGoals: { goals: [] } });
  await page.goto("/activities/goals");

  await expect(page.getByText("No goals")).toBeVisible();
});

test("goals list renders goal title from API", async ({ page }) => {
  await authenticate(page);
  await mockGQL(page, { GetGoals: { goals: [SAMPLE_GOAL] } });
  await page.goto("/activities/goals");

  await expect(page.getByText("Ship v2")).toBeVisible();
});

// ── Complex ───────────────────────────────────────────────────────────────────

test("click goal card navigates to manage goal page", async ({ page }) => {
  await authenticate(page);
  await mockGQL(page, {
    GetGoals: { goals: [SAMPLE_GOAL] },
    GetGoal: MANAGE_GOAL_MOCK,
  });

  await page.goto("/activities/goals");
  await expect(page.getByText("Ship v2")).toBeVisible();

  // Click the Manage (settings) button on the goal card
  await page.getByRole("button", { name: /Manage/i }).click();

  await expect(page).toHaveURL(/\/activities\/goal\/g1/);
});
