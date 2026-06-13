import type { Page } from "@playwright/test";

const GQL_URL = "http://localhost:4000/graphql";

/**
 * Parse the GraphQL operation name from a raw query string.
 * e.g. "query GetGoals { ... }" → "GetGoals"
 */
function parseOperationName(query: string): string | null {
  const match = query.match(/(?:query|mutation)\s+(\w+)/);
  return match?.[1] ?? null;
}

/**
 * Mock GraphQL responses by operation name.
 *
 * Usage:
 *   await mockGQL(page, {
 *     GetGoals: { goals: [] },
 *     Login: { login: { token: "tok" } },
 *   });
 *
 * Any unmatched operation returns { data: {} } by default.
 * Pass a handler fn to compute responses dynamically:
 *   await mockGQL(page, { Login: (body) => ({ login: { token: "t" } }) });
 */
export async function mockGQL(
  page: Page,
  handlers: Record<string, object | ((body: any) => object)>
) {
  await page.route(GQL_URL, async (route, request) => {
    const body = JSON.parse(request.postData() || "{}");
    const opName = parseOperationName(body.query ?? "");
    const handler = opName ? handlers[opName] : undefined;

    const responseData =
      typeof handler === "function"
        ? handler(body)
        : handler ?? {};

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ data: responseData }),
    });
  });
}

/**
 * Make a single GraphQL call return an error response.
 */
export async function mockGQLError(page: Page, operationName: string, message: string) {
  await page.route(GQL_URL, async (route, request) => {
    const body = JSON.parse(request.postData() || "{}");
    const opName = parseOperationName(body.query ?? "");

    if (opName === operationName) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ errors: [{ message }] }),
      });
    } else {
      await route.continue();
    }
  });
}
