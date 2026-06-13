import { test, expect } from "@playwright/test";
import { mockGQL } from "./helpers/gql";
import { authenticate } from "./helpers/auth";

// ── Fixtures ──────────────────────────────────────────────────────────────────

const SAMPLE_JOURNAL = {
  id: "j1",
  title: "Work Log",
  description: "Daily work notes",
  isArchived: false,
  isDefault: true,
  linkedGoalId: null,
  linkedProjectId: null,
  linkedGoal: null,
  linkedProject: null,
  entryCount: 3,
  accessList: [{ id: 1, userEmail: "me@example.com" }],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const SAMPLE_JOURNAL_DETAIL = {
  ...SAMPLE_JOURNAL,
  accessList: [{ id: 1, userEmail: "me@example.com", addedAt: new Date().toISOString() }],
};

const SAMPLE_ENTRY = {
  id: "e1",
  body: "Fixed the auth bug",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  isArchived: false,
  timestampOverridden: false,
};

/**
 * Overlay suppressors — include in every test that needs to interact with the page:
 * - GetOnboardingProgress: prevents the full-screen OnboardingSlideshow
 * - GetModuleIntroViewed: prevents the ModuleIntroOverlay on the journals list page
 */
const SUPPRESS_OVERLAYS = {
  GetOnboardingProgress: { onboardingProgress: { completedAt: "2026-01-01T00:00:00Z" } },
  GetModuleIntroViewed: { moduleIntroViewed: true },
};

function journalListMocks(overrides: Record<string, object> = {}) {
  return {
    ...SUPPRESS_OVERLAYS,
    GetJournals: { journals: [] },
    ...overrides,
  };
}

function journalDetailMocks(overrides: Record<string, object> = {}) {
  return {
    ...SUPPRESS_OVERLAYS,
    GetJournal: { journal: SAMPLE_JOURNAL_DETAIL },
    GetJournalEntries: { journalEntries: [] },
    ...overrides,
  };
}

function todayMocks(overrides: Record<string, object> = {}) {
  return {
    ...SUPPRESS_OVERLAYS,
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

// ── Simple: list page renders ─────────────────────────────────────────────────

test("journals list shows heading and New journal button", async ({ page }) => {
  await authenticate(page);
  await mockGQL(page, journalListMocks());
  await page.goto("/tools/journals");

  await expect(page.getByRole("heading", { name: "Journals" })).toBeVisible();
  await expect(page.getByRole("button", { name: /New journal/i })).toBeVisible();
});

test("journals list shows empty state when no journals", async ({ page }) => {
  await authenticate(page);
  await mockGQL(page, journalListMocks());
  await page.goto("/tools/journals");

  await expect(page.getByText("No journals yet.")).toBeVisible();
  await expect(page.getByRole("button", { name: /Create your first journal/i })).toBeVisible();
});

test("journals list renders journal title and entry count from API", async ({ page }) => {
  await authenticate(page);
  await mockGQL(page, journalListMocks({ GetJournals: { journals: [SAMPLE_JOURNAL] } }));
  await page.goto("/tools/journals");

  await expect(page.getByText("Work Log")).toBeVisible();
  await expect(page.getByText("3 entries")).toBeVisible();
});

test("journals list shows journal description", async ({ page }) => {
  await authenticate(page);
  await mockGQL(page, journalListMocks({ GetJournals: { journals: [SAMPLE_JOURNAL] } }));
  await page.goto("/tools/journals");

  await expect(page.getByText("Daily work notes")).toBeVisible();
});

test("non-default journal shows set-as-default button, default journal does not", async ({ page }) => {
  const nonDefault = { ...SAMPLE_JOURNAL, id: "j2", title: "Personal", isDefault: false };
  await authenticate(page);
  await mockGQL(page, journalListMocks({ GetJournals: { journals: [SAMPLE_JOURNAL, nonDefault] } }));
  await page.goto("/tools/journals");

  await expect(page.getByText("Work Log")).toBeVisible();
  await expect(page.getByTitle("Set as default")).toHaveCount(1);
});

// ── Complex: list page interactions ──────────────────────────────────────────

test("clicking New journal button reveals create form", async ({ page }) => {
  await authenticate(page);
  await mockGQL(page, journalListMocks());
  await page.goto("/tools/journals");

  await page.getByRole("button", { name: /New journal/i }).click();

  await expect(page.getByPlaceholder("Journal title")).toBeVisible();
  await expect(page.getByPlaceholder("Description (optional)")).toBeVisible();
  await expect(page.getByRole("button", { name: "Create", exact: true })).toBeVisible();
});

test("creating a journal fires CreateJournal mutation and navigates to detail", async ({ page }) => {
  const mutations: string[] = [];

  await authenticate(page);
  await mockGQL(page, {
    ...journalListMocks(),
    ...journalDetailMocks({ GetJournal: { journal: { ...SAMPLE_JOURNAL_DETAIL, id: "j-new", title: "My New Journal" } } }),
    CreateJournal: (body: any) => {
      mutations.push(body.variables?.title);
      return { createJournal: { id: "j-new", title: "My New Journal", isDefault: true } };
    },
  });

  await page.goto("/tools/journals");
  await page.getByRole("button", { name: /New journal/i }).click();
  await page.getByPlaceholder("Journal title").fill("My New Journal");
  await page.getByRole("button", { name: "Create", exact: true }).click();

  await expect.poll(() => mutations).toContain("My New Journal");
  await expect(page).toHaveURL(/\/tools\/journals\/j-new/, { timeout: 5000 });
});

test("cancel on create form hides the form", async ({ page }) => {
  await authenticate(page);
  await mockGQL(page, journalListMocks());
  await page.goto("/tools/journals");

  await page.getByRole("button", { name: /New journal/i }).click();
  await expect(page.getByPlaceholder("Journal title")).toBeVisible();

  await page.getByRole("button", { name: "Cancel" }).click();
  await expect(page.getByPlaceholder("Journal title")).not.toBeVisible();
});

test("archive button on journal card fires ArchiveJournal mutation", async ({ page }) => {
  const mutations: string[] = [];
  const nonDefault = { ...SAMPLE_JOURNAL, id: "j1", isDefault: false };

  await authenticate(page);
  await mockGQL(page, {
    ...journalListMocks({ GetJournals: { journals: [nonDefault] } }),
    ArchiveJournal: (body: any) => {
      mutations.push(body.variables?.id);
      return { archiveJournal: { id: body.variables?.id, isArchived: true } };
    },
  });

  await page.goto("/tools/journals");
  await expect(page.getByText("Work Log")).toBeVisible();

  // The archive button is inside the card's action area (stopPropagation wrapper)
  // It's a ghost button with an Archive svg icon. Use aria-label or position.
  // Since both the set-default (star) and archive buttons are in the card, archive is last.
  const cardActions = page.locator('li').filter({ hasText: "Work Log" });
  await cardActions.getByRole("button").last().click();

  await expect.poll(() => mutations).toContain("j1");
});

test("set default button fires SetDefaultJournal mutation", async ({ page }) => {
  const mutations: string[] = [];
  const nonDefault = { ...SAMPLE_JOURNAL, id: "j2", title: "Side Notes", isDefault: false };

  await authenticate(page);
  await mockGQL(page, {
    ...journalListMocks({ GetJournals: { journals: [SAMPLE_JOURNAL, nonDefault] } }),
    SetDefaultJournal: (body: any) => {
      mutations.push(body.variables?.journalId);
      return { setDefaultJournal: { id: body.variables?.journalId, isDefault: true } };
    },
  });

  await page.goto("/tools/journals");
  await page.getByTitle("Set as default").click();

  await expect.poll(() => mutations).toContain("j2");
});

test("clicking journal card navigates to detail page", async ({ page }) => {
  await authenticate(page);
  await mockGQL(page, {
    ...journalListMocks({ GetJournals: { journals: [SAMPLE_JOURNAL] } }),
    ...journalDetailMocks(),
  });

  await page.goto("/tools/journals");
  await expect(page.getByText("Work Log")).toBeVisible();
  // Click the card title text (the span inside the li)
  await page.locator("li").filter({ hasText: "Work Log" }).click();

  await expect(page).toHaveURL(/\/tools\/journals\/j1/, { timeout: 5000 });
});

// ── Simple: detail page renders ───────────────────────────────────────────────

test("journal detail page shows journal title and entry composer", async ({ page }) => {
  await authenticate(page);
  await mockGQL(page, journalDetailMocks());
  await page.goto("/tools/journals/j1");

  await expect(page.getByText("Work Log")).toBeVisible();
  await expect(page.getByPlaceholder(/Write an entry/)).toBeVisible();
  await expect(page.getByRole("button", { name: "Add entry" })).toBeVisible();
});

test("journal detail shows empty entry state when no entries", async ({ page }) => {
  await authenticate(page);
  await mockGQL(page, journalDetailMocks());
  await page.goto("/tools/journals/j1");

  await expect(page.getByText("No entries yet. Write the first one below.")).toBeVisible();
});

test("journal detail renders existing entries", async ({ page }) => {
  await authenticate(page);
  await mockGQL(page, journalDetailMocks({ GetJournalEntries: { journalEntries: [SAMPLE_ENTRY] } }));
  await page.goto("/tools/journals/j1");

  await expect(page.getByText("Fixed the auth bug")).toBeVisible();
});

test("archived journal shows archived notice and hides composer", async ({ page }) => {
  const archivedJournal = { ...SAMPLE_JOURNAL_DETAIL, isArchived: true };

  await authenticate(page);
  await mockGQL(page, journalDetailMocks({ GetJournal: { journal: archivedJournal } }));
  await page.goto("/tools/journals/j1");

  await expect(page.getByText("This journal is archived.")).toBeVisible();
  await expect(page.getByPlaceholder(/Write an entry/)).not.toBeVisible();
});

// ── Complex: detail page interactions ────────────────────────────────────────

test("submitting the composer fires CreateEntry mutation", async ({ page }) => {
  const mutations: string[] = [];

  await authenticate(page);
  await mockGQL(page, {
    ...journalDetailMocks(),
    CreateEntry: (body: any) => {
      mutations.push(body.variables?.body);
      return {
        createEntry: {
          id: "e-new",
          body: body.variables?.body,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          isArchived: false,
          timestampOverridden: false,
        },
      };
    },
  });

  await page.goto("/tools/journals/j1");
  await page.getByPlaceholder(/Write an entry/).fill("Today I fixed the login bug.");
  await page.getByRole("button", { name: "Add entry" }).click();

  await expect.poll(() => mutations).toContain("Today I fixed the login bug.");
});

test("pressing Enter in composer submits the entry", async ({ page }) => {
  const mutations: string[] = [];

  await authenticate(page);
  await mockGQL(page, {
    ...journalDetailMocks(),
    CreateEntry: (body: any) => {
      mutations.push(body.variables?.body);
      return {
        createEntry: {
          id: "e2",
          body: body.variables?.body,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          isArchived: false,
          timestampOverridden: false,
        },
      };
    },
  });

  await page.goto("/tools/journals/j1");
  await page.getByPlaceholder(/Write an entry/).fill("Quick thought");
  await page.getByPlaceholder(/Write an entry/).press("Enter");

  await expect.poll(() => mutations).toContain("Quick thought");
});

test("settings panel opens and shows access list when settings button clicked", async ({ page }) => {
  await authenticate(page);
  await mockGQL(page, journalDetailMocks());
  await page.goto("/tools/journals/j1");

  await expect(page.getByText("Journal settings")).not.toBeVisible();

  // Settings button has aria-label="Journal settings" (icon-only, needs explicit label)
  await page.getByRole("button", { name: "Journal settings" }).click();

  await expect(page.getByText("Journal settings")).toBeVisible();
  await expect(page.getByText("Access list")).toBeVisible();
  await expect(page.getByText("me@example.com")).toBeVisible();
});

test("adding an email in settings panel fires AddJournalAccess mutation", async ({ page }) => {
  const mutations: string[] = [];

  await authenticate(page);
  await mockGQL(page, {
    ...journalDetailMocks(),
    AddJournalAccess: (body: any) => {
      mutations.push(body.variables?.email);
      return {
        addJournalAccess: {
          id: "j1",
          accessList: [
            { id: 1, userEmail: "me@example.com" },
            { id: 2, userEmail: body.variables?.email },
          ],
        },
      };
    },
  });

  await page.goto("/tools/journals/j1");
  await page.getByRole("button", { name: "Journal settings" }).click();
  await expect(page.getByPlaceholder("Add by email...")).toBeVisible();
  await page.getByPlaceholder("Add by email...").fill("colleague@example.com");
  await page.getByPlaceholder("Add by email...").press("Enter");

  await expect.poll(() => mutations).toContain("colleague@example.com");
});

test("access error message appears when AddJournalAccess fails", async ({ page }) => {
  await authenticate(page);
  // Use a custom route handler for the error case — mockGQL doesn't support error responses
  await page.route("http://localhost:4000/graphql", async (route, request) => {
    const body = JSON.parse(request.postData() || "{}");
    const op = body.query?.match(/(?:query|mutation)\s+(\w+)/)?.[1];
    const handlers: Record<string, object> = {
      ...journalDetailMocks(),
    };
    if (op === "AddJournalAccess") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ errors: [{ message: "No user found" }] }),
      });
    } else if (op && handlers[op]) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ data: handlers[op] }),
      });
    } else {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ data: {} }),
      });
    }
  });

  await page.goto("/tools/journals/j1");
  await page.getByRole("button", { name: "Journal settings" }).click();
  await page.getByPlaceholder("Add by email...").fill("ghost@example.com");
  await page.getByPlaceholder("Add by email...").press("Enter");

  await expect(page.getByText(/No user found/i)).toBeVisible({ timeout: 5000 });
});

test("archive journal button in settings panel fires ArchiveJournal mutation", async ({ page }) => {
  const mutations: string[] = [];

  await authenticate(page);
  await mockGQL(page, {
    ...journalDetailMocks(),
    ArchiveJournal: (body: any) => {
      mutations.push(body.variables?.id);
      return { archiveJournal: { id: body.variables?.id, isArchived: true } };
    },
  });

  await page.goto("/tools/journals/j1");
  await page.getByRole("button", { name: "Journal settings" }).click();
  await expect(page.getByRole("button", { name: "Archive journal" })).toBeVisible();
  await page.getByRole("button", { name: "Archive journal" }).click();

  await expect.poll(() => mutations).toContain("j1");
});

// ── Today: journal quick-add ─────────────────────────────────────────────────

test("today page shows journal quick-add section when journals exist", async ({ page }) => {
  await authenticate(page);
  await mockGQL(page, todayMocks({
    GetJournals: { journals: [{ id: "j1", title: "Work Log", isDefault: true, isArchived: false }] },
  }));

  await page.goto("/today");

  await expect(page.getByText("Journal")).toBeVisible();
  await expect(page.getByPlaceholder("Quick journal entry...")).toBeVisible();
});

test("today page hides journal quick-add when no journals", async ({ page }) => {
  await authenticate(page);
  await mockGQL(page, todayMocks({ GetJournals: { journals: [] } }));

  await page.goto("/today");

  await expect(page.getByPlaceholder("Quick journal entry...")).not.toBeVisible();
});

test("quick-add entry fires AddQuickEntry mutation with default journal", async ({ page }) => {
  const mutations: { body: string; journalId: string }[] = [];

  await authenticate(page);
  await mockGQL(page, {
    ...todayMocks({
      GetJournals: { journals: [{ id: "j1", title: "Work Log", isDefault: true, isArchived: false }] },
    }),
    AddQuickEntry: (body: any) => {
      mutations.push({ body: body.variables?.body, journalId: body.variables?.journalId });
      return {
        addQuickEntry: { id: "e-new", body: body.variables?.body, createdAt: new Date().toISOString() },
      };
    },
  });

  await page.goto("/today");
  await expect(page.getByPlaceholder("Quick journal entry...")).toBeVisible();
  await page.getByPlaceholder("Quick journal entry...").fill("Shipped the feature");
  await page.getByPlaceholder("Quick journal entry...").press("Enter");

  await expect.poll(() => mutations.map((m) => m.body)).toContain("Shipped the feature");
  await expect.poll(() => mutations.find((m) => m.body === "Shipped the feature")?.journalId).toBe("j1");
});

test("journal picker on today page lets user switch target journal", async ({ page }) => {
  const mutations: { journalId: string }[] = [];

  await authenticate(page);
  await mockGQL(page, {
    ...todayMocks({
      GetJournals: {
        journals: [
          { id: "j1", title: "Work Log", isDefault: true, isArchived: false },
          { id: "j2", title: "Personal", isDefault: false, isArchived: false },
        ],
      },
    }),
    AddQuickEntry: (body: any) => {
      mutations.push({ journalId: body.variables?.journalId });
      return {
        addQuickEntry: { id: "e-new", body: body.variables?.body, createdAt: new Date().toISOString() },
      };
    },
  });

  await page.goto("/today");
  await expect(page.getByText("Work Log")).toBeVisible();

  // Open the picker dropdown — click the journal label/button
  await page.getByText("Work Log").click();
  await expect(page.getByText("Personal")).toBeVisible();

  // Select Personal
  await page.getByText("Personal").click();

  // Submit an entry — it should go to j2
  await page.getByPlaceholder("Quick journal entry...").fill("Personal note");
  await page.getByPlaceholder("Quick journal entry...").press("Enter");

  await expect.poll(() => mutations.map((m) => m.journalId)).toContain("j2");
});
