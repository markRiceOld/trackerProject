import { test, expect } from "@playwright/test";
import { mockGQL } from "./helpers/gql";
import { authenticate } from "./helpers/auth";

const SAMPLE_PROJECT = {
  id: "p1",
  title: "Redesign homepage",
  dod: null,
  type: null,
  priority: "P",
  startDate: null,
  endDate: null,
  actions: [],
  goal: null,
  milestone: null,
};

test("projects list shows heading and Add project button", async ({ page }) => {
  await authenticate(page);
  await mockGQL(page, { GetProjects: { projects: [] } });
  await page.goto("/activities/projects");

  await expect(page.getByRole("heading", { name: "Projects" })).toBeVisible();
  await expect(page.getByRole("button", { name: /Add project/i })).toBeVisible();
});

test("projects list shows empty state when no projects", async ({ page }) => {
  await authenticate(page);
  await mockGQL(page, { GetProjects: { projects: [] } });
  await page.goto("/activities/projects");

  await expect(page.getByText("No projects")).toBeVisible();
});

test("projects list renders project title from API", async ({ page }) => {
  await authenticate(page);
  await mockGQL(page, { GetProjects: { projects: [SAMPLE_PROJECT] } });
  await page.goto("/activities/projects");

  await expect(page.getByText("Redesign homepage")).toBeVisible();
});
