import { test, expect } from "@playwright/test";
import {
  mockAllDatasets,
  mockFeedbackTaskDataset,
  newDatasetsMocked,
} from "../common";

const languages = [
  ["french", "French", "Le livre est sur la table."],
  ["darija_arabic", "Darija Arabic", "الكتاب فوق الطبلة."],
  ["darija_latin", "Darija Latin", "Lktab foq tabla."],
  ["english", "English", "The book is on the table."],
];
const dataset = newDatasetsMocked[0];
const userId = "3e760b76-e19a-480a-b436-a85812b98843";
const timestamp = "2026-11-02T12:00:00";

async function openReview(page) {
  // Every API request stays in the fixture, including writes.
  await page.route("**/api/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    let json: any = { items: [] };
    if (path.endsWith("/settings")) json = {};
    if (path.endsWith("/token"))
      json = { access_token: "fixture-token", token_type: "bearer" };
    if (path.endsWith("/me"))
      json = {
        id: userId,
        username: "reviewer",
        first_name: "Reviewer",
        last_name: "",
        role: "admin",
        workspaces: [],
      };
    if (path.endsWith("/fields"))
      json = {
        items: languages.map(([name, title]) => ({
          id: `field-${name}`,
          name,
          title,
          required: true,
          settings: { type: "text", use_markdown: false },
        })),
      };
    if (path.endsWith("/questions"))
      json = {
        items: [
          ...languages.map(([name, title]) => ({
            id: `q-${name}`,
            name: `final_${name}`,
            title,
            required: true,
            description: "",
            settings: { type: "text", use_markdown: false },
          })),
          ...[
            "transliteration",
            "english_translation",
            "french_translation",
          ].map((name) => ({
            id: `q-${name}`,
            name,
            title: {
              transliteration:
                "Final Arabic and Latin Darija represent the same words?",
              english_translation:
                "Final English and both Darija texts preserve the same meaning?",
              french_translation:
                "Final French and both Darija texts preserve the same meaning?",
            }[name],
            required: true,
            description: "",
            settings: {
              type: "label_selection",
              options: ["accept", "reject", "needs_edit"].map((value) => ({
                value,
                text: value,
              })),
              visible_options: 3,
            },
          })),
        ],
      };
    if (path.endsWith("/records/search"))
      json = {
        total: 2,
        items: [1, 2].map((number) => ({
          query_score: null,
          record: {
            id: `record-${number}`,
            fields: Object.fromEntries(
              languages.map(([name]) => [name, `Original ${name}`])
            ),
            metadata: {},
            responses: [],
            inserted_at: timestamp,
            updated_at: timestamp,
            suggestions: languages.map(([name, , value]) => ({
              id: `s-${name}`,
              question_id: `q-${name}`,
              value: number === 1 ? value : `${value} 2`,
              agent: "gemini",
              score: null,
            })),
          },
        })),
      };
    if (path.endsWith("/metrics"))
      json = {
        records: { count: 2 },
        responses: { count: 0, submitted: 0, discarded: 0, draft: 0 },
      };
    if (path.endsWith("/responses") && route.request().method() === "POST")
      json = {
        id: "saved-response",
        ...route.request().postDataJSON(),
        user_id: userId,
        inserted_at: timestamp,
        updated_at: timestamp,
      };
    await route.fulfill({ json });
  });
  await mockAllDatasets(page);
  await mockFeedbackTaskDataset(page, {
    datasetId: dataset.id,
    workspaceId: dataset.workspace_id,
  });
  await page.goto("/sign-in");
  await page.route("**/api/v1/me/workspaces", (route) =>
    route.fulfill({
      json: { items: [{ id: dataset.workspace_id, name: "Review" }] },
    })
  );
  const currentDataset = {
    ...dataset,
    distribution: { strategy: "overlap", min_submitted: 1 },
    metadata: {},
    allow_extra_metadata: true,
  };
  await page.route("**/api/v1/me/datasets", (route) =>
    route.fulfill({ json: { items: [currentDataset] } })
  );
  await page.route(`**/api/v1/datasets/${dataset.id}`, (route) =>
    route.fulfill({ json: currentDataset })
  );
  await page.locator('input[type="text"]').fill("fixture");
  await page.locator('input[type="password"]').fill("fixture");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await page.goto(`/dataset/${dataset.id}/annotation-mode`);
  await expect(page.locator(".translation-review")).toBeVisible();
}

for (const viewport of [
  { width: 1440, height: 900 },
  { width: 390, height: 844 },
  { width: 360, height: 800 },
]) {
  test(`read, edit and submit four translations at ${viewport.width}px`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await openReview(page);
    const cards = page.locator(".translation-review__cards");
    await expect(cards.locator("[contenteditable]")).toHaveCount(4);
    await expect(cards.locator("[contenteditable]").first()).toHaveText(
      languages[0][2]
    );
    await page.screenshot({
      path: `test-results/before-${viewport.width}.png`,
      fullPage: true,
    });
    const buttons = page.locator(".translation-review .button--submit");
    await expect(buttons).toBeDisabled();
    const before = await cards.locator("[contenteditable]").allTextContents();
    await page
      .getByRole("combobox", { name: "Review text size", exact: true })
      .selectOption("22");
    await expect(cards.locator(".content__text").first()).toHaveCSS(
      "font-size",
      "22px"
    );
    expect(await cards.locator("[contenteditable]").allTextContents()).toEqual(
      before
    );
    await page
      .getByRole("combobox", { name: "Review text size", exact: true })
      .selectOption("20");
    const cardBounds = await cards.boundingBox();
    expect(cardBounds!.y + cardBounds!.height).toBeLessThan(viewport.height);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth
      )
    ).toBe(true);
    await cards
      .locator("[contenteditable]")
      .first()
      .fill("Le livre est posé sur la table.");
    for (const name of [
      "transliteration",
      "english_translation",
      "french_translation",
    ]) {
      await page
        .getByLabel(`Question: ${name}`, { exact: true })
        .getByText("accept", { exact: true })
        .click();
    }
    await expect(buttons).toBeEnabled();
    const submitBounds = await buttons.boundingBox();
    expect(submitBounds!.y + submitBounds!.height).toBeLessThanOrEqual(
      viewport.height
    );
    const request = page.waitForRequest(
      (req) =>
        req.url().endsWith("/records/record-1/responses") &&
        req.method() === "POST"
    );
    await buttons.click();
    const payload = (await request).postDataJSON();
    expect(payload.status).toBe("submitted");
    expect(payload.values.final_french.value).toBe(
      "Le livre est posé sur la table."
    );
    await expect(page.getByLabel("Current Record")).toHaveText("2");
    await expect
      .poll(() =>
        page
          .locator(".translation-review__body")
          .evaluate((element) => element.scrollTop)
      )
      .toBe(0);
    await page.screenshot({
      path: `test-results/translation-review-${viewport.width}.png`,
      fullPage: true,
    });
  });
}
