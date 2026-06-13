import { test, expect } from "@playwright/test";
import { mockGQL } from "./helpers/gql";
import { authenticate } from "./helpers/auth";

const SAMPLE_ACTION = {
  id: "a1",
  title: "Write tests",
  tbd: null,
  done: false,
  priority: "P",
  project: null,
  goal: null,
  milestone: null,
  estimatedTimeMinutes: null,
  startTimeOfDay: null,
};

// ── Simple: page renders ──────────────────────────────────────────────────────

test("actions list shows heading and Add action button", async ({ page }) => {
  await authenticate(page);
  await mockGQL(page, { GetActions: { actions: [] } });
  await page.goto("/activities/actions");

  await expect(page.getByRole("heading", { name: "Actions" })).toBeVisible();
  await expect(page.getByRole("button", { name: /Add action/i })).toBeVisible();
});

test("actions list shows empty state when no actions", async ({ page }) => {
  await authenticate(page);
  await mockGQL(page, { GetActions: { actions: [] } });
  await page.goto("/activities/actions");

  await expect(page.getByText("No actions match current filters.")).toBeVisible();
});

test("actions list renders action title from API", async ({ page }) => {
  await authenticate(page);
  await mockGQL(page, { GetActions: { actions: [SAMPLE_ACTION] } });
  await page.goto("/activities/actions");

  await expect(page.getByText("Write tests")).toBeVisible();
});

// ── Complex: interactions ──────────────────────────────────────────────────────

test("click Add action button navigates to action form", async ({ page }) => {
  await authenticate(page);
  await mockGQL(page, { GetActions: { actions: [] } });
  await page.goto("/activities/actions");

  await page.getByRole("button", { name: /Add action/i }).click();
  await expect(page).toHaveURL(/\/activities\/action$/);
});

test("delete action: confirm dialog → DeleteAction called → item removed", async ({ page }) => {
  const deletedIds: string[] = [];

  await authenticate(page);
  await mockGQL(page, {
    GetActions: { actions: [SAMPLE_ACTION] },
    DeleteAction: (body: any) => {
      deletedIds.push(body.variables?.id);
      return { deleteAction: { id: body.variables?.id } };
    },
  });

  await page.goto("/activities/actions");
  await expect(page.getByText("Write tests")).toBeVisible();

  // Click the trash/delete button (sr-only text "Delete")
  await page.getByRole("button", { name: "Delete" }).click();

  // Confirm dialog appears — click the confirm button
  await page.getByRole("button", { name: /^Delete$/ }).last().click();

  await expect.poll(() => deletedIds).toContain("a1");
  await expect(page.getByText("Write tests")).not.toBeVisible();
});
