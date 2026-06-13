import { test, expect } from "@playwright/test";
import { mockGQL } from "./helpers/gql";
import { authenticate } from "./helpers/auth";

test("new action form renders title input and Create Action button", async ({ page }) => {
  await authenticate(page);
  await mockGQL(page, { GetProjects: { projects: [] } });
  await page.goto("/activities/action");

  await expect(page.getByPlaceholder("Action title")).toBeVisible();
  await expect(page.getByRole("button", { name: "Create Action" })).toBeVisible();
});

test("back link on new action form returns to actions list", async ({ page }) => {
  await authenticate(page);
  await mockGQL(page, { GetProjects: { projects: [] } });
  await page.goto("/activities/action");

  await page.getByText("← Back to Actions").click();
  await expect(page).toHaveURL(/\/activities\/actions/);
});
