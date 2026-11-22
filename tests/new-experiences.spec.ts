import { test, expect, type Page } from "@playwright/test";

async function createAndOpen(page: Page, kind: string) {
  await page.goto(`/#/create/${kind}`);
  await page.getByLabel("For someone special").fill("Mira");
  await page.getByLabel("From you").fill("Jay");
  await page.getByLabel("Your message").fill("You are my favorite person.");
  await page.getByRole("button", { name: "Preview my surprise" }).click();
  await page.getByRole("link", { name: "Create & share surprise" }).click();
  const link = await page.getByLabel("Your surprise link").inputValue();
  await page.goto(link);
}

test("message in the stars reveals every note, then the letter", async ({
  page,
}) => {
  await createAndOpen(page, "stars");
  const stars = page.locator(".star-sky .star");
  await expect(stars).toHaveCount(5);
  await stars.first().click();
  await expect(page.locator(".star-note")).toContainText(
    "You make me laugh like no one else.",
  );
  for (let i = 1; i < 5; i++) await stars.nth(i).click();
  await expect(page.getByText("You are my favorite person.")).toBeVisible();
});

test("couple bingo wins on three in a row", async ({ page }) => {
  await createAndOpen(page, "bingo");
  const cells = page.locator(".bingo-cell");
  await expect(cells).toHaveCount(9);
  await cells.nth(0).click();
  await cells.nth(4).click();
  await expect(page.getByText("You are my favorite person.")).toHaveCount(0);
  await cells.nth(8).click();
  await expect(page.getByText("BINGO! ♡")).toBeVisible();
  await expect(page.getByText("You are my favorite person.")).toBeVisible();
});

test("catch my heart runs a timed game and can be revealed", async ({
  page,
}) => {
  await createAndOpen(page, "hearts");
  await page.getByRole("button", { name: "Start game" }).click();
  await expect(page.locator(".basket")).toBeVisible();
  await expect(page.locator(".falling-heart").first()).toBeVisible();
  await page.keyboard.press("ArrowLeft");
  await expect(page.getByText(/1[0-9]s left/)).toBeVisible();
  await page.reload();
  await page.getByRole("button", { name: "Reveal without playing" }).click();
  await expect(page.getByText("You are my favorite person.")).toBeVisible();
});

test("future letter stays locked until its date for the recipient", async ({
  page,
}) => {
  await createAndOpen(page, "future");
  await expect(
    page.getByText("A letter from the future is waiting for you."),
  ).toBeVisible();
  await expect(page.getByRole("timer")).toBeVisible();
  await expect(page.getByText("You are my favorite person.")).toHaveCount(0);
  // Once the date has passed, the same link opens.
  await page.clock.install({ time: new Date("2099-01-01T10:00:00") });
  await page.reload();
  await page.getByRole("button", { name: "Open your envelope" }).click();
  await expect(page.getByText("You are my favorite person.")).toBeVisible();
});

test("future letter can be kept on this device", async ({ page }) => {
  await page.goto("/#/create/future");
  await page.getByLabel("For someone special").fill("Mira");
  await page.getByRole("button", { name: "Preview my surprise" }).click();
  await page.getByRole("link", { name: "Create & share surprise" }).click();
  await page.getByRole("button", { name: "Save on this device" }).click();
  await page.goto("/#/create/future");
  await expect(page.getByText("Letters saved on this device")).toBeVisible();
  await expect(page.getByRole("link", { name: /For Mira/ })).toBeVisible();
});

test("explore lists all nine experiences", async ({ page }) => {
  await page.goto("/#/explore");
  await expect(page.locator(".experience-card")).toHaveCount(9);
});
