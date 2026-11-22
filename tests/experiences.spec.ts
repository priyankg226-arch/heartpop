import { test, expect } from "@playwright/test";
test("create, share, and open a letter in a fresh context", async ({
  page,
  browser,
}) => {
  await page.goto("/#/create/envelope");
  await page.getByLabel("For someone special").fill("Mira");
  await page.getByLabel("From you").fill("Jay");
  await page.getByLabel("Your message").fill("You make ordinary days magical.");
  await page.getByRole("button", { name: "Preview my surprise" }).click();
  await page.getByRole("link", { name: "Create & share surprise" }).click();
  const link = await page.getByLabel("Your surprise link").inputValue();
  const context = await browser.newContext();
  const recipient = await context.newPage();
  await recipient.goto(link);
  await recipient.getByRole("button", { name: "Open your envelope" }).click();
  await expect(
    recipient.getByText("You make ordinary days magical."),
  ).toBeVisible();
  await context.close();
});
test("scratch gesture updates progress and accessible reveal works", async ({
  page,
}) => {
  await page.goto("/#/create/scratch");
  const canvas = page.locator("canvas");
  await canvas.scrollIntoViewIfNeeded();
  const box = (await canvas.boundingBox())!;
  await page.mouse.move(box.x + 20, box.y + 20);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width - 20, box.y + 20, { steps: 12 });
  await page.mouse.up();
  await expect(page.getByText(/% scratched/)).not.toHaveText(
    "0% scratched · reveals at 60%",
  );
  await page.getByRole("button", { name: "Reveal without scratching" }).click();
  await expect(canvas).toHaveCount(0);
  await page.getByRole("button", { name: "Play again" }).click();
  await expect(canvas).toBeVisible();
  await canvas.scrollIntoViewIfNeeded();
  const replayBox = (await canvas.boundingBox())!;
  await page.mouse.move(replayBox.x + 5, replayBox.y + 5);
  await page.mouse.down();
  for (let row = 0; row < 11; row++) {
    const y = replayBox.y + 5 + row * 23;
    await page.mouse.move(
      replayBox.x + (row % 2 ? 5 : replayBox.width - 5),
      y,
      { steps: 8 },
    );
  }
  await page.mouse.up();
  await expect(canvas).toHaveCount(0);
});
test("quiz can be edited, completed and scored", async ({ page }) => {
  await page.goto("/#/create/quiz");
  await page.getByLabel("For someone special").fill("Mira");
  await page.getByLabel("From you").fill("Jay");
  await page.getByRole("button", { name: "Preview my surprise" }).click();
  await page.getByRole("link", { name: "Create & share surprise" }).click();
  await page
    .getByRole("link", { name: "Open the recipient experience" })
    .click();
  for (const answer of [
    "Pizza",
    "Mountains",
    "Inside jokes",
    "A cozy movie",
    "Talking it out",
  ])
    await page.getByRole("button", { name: answer, exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "You know the little things!" }),
  ).toBeVisible();
  await expect(page.locator(".score")).toHaveText("5 / 5");
});
test("roulette respects reduced motion and completes challenge", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/#/roulette");
  await page.getByRole("button", { name: "Spin the wheel" }).click();
  await expect(
    page.getByRole("button", { name: "Challenge complete" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Challenge complete" }).click();
  await expect(
    page.getByRole("button", { name: "A memory made ♡" }),
  ).toBeDisabled();
});
test("message editing, malformed links, mobile layout and keyboard navigation", async ({
  page,
}) => {
  await page.goto("/#/create/message");
  await page.getByLabel("Your message").fill("A tiny custom hello");
  await expect(page.locator(".preview-card")).toContainText(
    "A tiny custom hello",
  );
  await page.goto("/#/surprise/INVALID!");
  await expect(page.getByRole("alert")).toContainText("invalid");
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: /Make someone/ }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("link", { name: "Skip to content" }),
  ).toBeFocused();
});
