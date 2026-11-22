import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const GAMES = [
  "Guess My Feelings",
  "Love Memory Match",
  "You vs Me",
  "Our Dream Date",
  "Love Truth or Dare",
  "Fix Our Heart",
  "Send Me a Hug",
  "Find My Love",
];

test("hub lists every game, has no axe violations and no horizontal overflow", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/#/couple-games");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Two Hearts");
  for (const name of GAMES) await expect(page.getByRole("link", { name: `Play ${name}` }).first()).toBeVisible();
  const result = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
  expect(result.violations.map((v) => v.id)).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

for (const name of GAMES)
  test(`${name} opens from the hub and returns to it`, async ({ page }) => {
    await page.goto("/#/couple-games");
    await page.getByRole("link", { name: `Play ${name}` }).first().click();
    await expect(page.getByRole("heading", { level: 1 })).toContainText(name);
    await page.getByRole("link", { name: "All couple games" }).click();
    await expect(page).toHaveURL(/#\/couple-games$/);
  });

test("a hug link opens in a fresh browser and the hug can be completed", async ({ page, browser }) => {
  await page.goto("/#/couple-games/send-me-a-hug");
  await page.getByRole("button", { name: "Create a hug" }).click();
  await page.getByLabel("For", { exact: true }).fill("Mira");
  await page.getByLabel("From (optional)", { exact: true }).fill("Jay");
  await page.getByRole("button", { name: "Preview the hug" }).click();
  await page.getByRole("button", { name: "Looks perfect — get the link" }).click();
  const link = await page.getByLabel("Link to share").inputValue();
  expect(link).toContain("#/couple-games/send-me-a-hug/open/");
  const friend = await browser.newContext();
  const recipient = await friend.newPage();
  await recipient.goto(link);
  await expect(recipient.getByRole("heading", { level: 1 })).toContainText("Jay sent Mira a hug");
  await recipient.getByRole("button", { name: "Bring them together" }).click();
  await expect(recipient.getByText("Here’s a big warm hug, just for you.")).toBeVisible();
  await friend.close();
});

test("a treasure hunt can be created, shared and solved", async ({ page, browser }) => {
  await page.goto("/#/couple-games/find-my-love");
  await page.getByRole("button", { name: "Create a treasure hunt" }).click();
  await page.getByLabel("For", { exact: true }).fill("Mira");
  for (let i = 0; i < 3; i++) await page.getByLabel("Accepted answers").nth(i).fill(`answer${i}, alt${i}`);
  await page.getByLabel("Final surprise message").fill("Dinner on Friday ♡");
  await page.getByRole("button", { name: "Get the share link" }).click();
  const link = await page.getByLabel("Link to share").inputValue();
  const friend = await browser.newContext();
  const p = await friend.newPage();
  await p.goto(link);
  await p.getByLabel("Your answer").fill("  ANSWER0 ");
  await p.getByRole("button", { name: "Unlock" }).click();
  await p.getByLabel("Your answer").fill("ALT1");
  await p.getByRole("button", { name: "Unlock" }).click();
  await p.getByRole("button", { name: "Reveal answer & continue" }).click();
  await p.getByRole("button", { name: "Open the treasure chest" }).click();
  await expect(p.getByText("Dinner on Friday ♡")).toBeVisible();
  await friend.close();
});

test("invalid challenge links fail gracefully", async ({ page }) => {
  await page.goto("/#/couple-games/you-vs-me/open/jbroken");
  await expect(page.getByRole("heading", { name: "We couldn’t open this challenge." })).toBeVisible();
  await page.goto("/#/couple-games/not-a-game");
  await expect(page.getByRole("heading", { name: "We couldn’t find that game." })).toBeVisible();
});

test("Fix Our Heart can be completed with the keyboard alternative", async ({ page }) => {
  await page.goto("/#/couple-games/fix-our-heart");
  await page.getByRole("button", { name: "Start the puzzle" }).click();
  for (let p = 1; p <= 4; p++) {
    await page.getByRole("button", { name: `Puzzle piece ${p}`, exact: true }).click();
    const r = Math.floor((p - 1) / 2) + 1;
    const c = ((p - 1) % 2) + 1;
    await page.getByRole("button", { name: `Place in row ${r}, column ${c}` }).click();
  }
  await expect(page.getByRole("heading", { name: /Heart fixed/ })).toBeVisible();
});

test("Memory Match progress survives a reload", async ({ page }) => {
  await page.goto("/#/couple-games/love-memory-match");
  await page.getByRole("button", { name: /Let’s play/ }).click();
  await page.getByRole("button", { name: "Card 1, face down" }).click();
  await page.getByRole("button", { name: "Card 2, face down" }).click();
  await page.waitForTimeout(600);
  await page.goto("/#/couple-games/love-memory-match");
  await page.reload();
  await expect(page.getByRole("button", { name: "Continue where we left off" })).toBeVisible();
  await page.getByRole("button", { name: "Continue where we left off" }).click();
  await expect(page.getByText("Attempts")).toBeVisible();
});

test("clearing data uses an in-app confirmation modal, not a browser alert", async ({ page }) => {
  let nativeDialog = false;
  page.on("dialog", (d) => {
    nativeDialog = true;
    void d.dismiss();
  });
  await page.goto("/#/couple-games");
  await page.getByRole("button", { name: "Add Fix Our Heart to favourites" }).first().click();
  await expect(page.getByRole("heading", { name: "Your favourites" })).toBeVisible();
  await page.getByRole("button", { name: "Clear couple-game data on this device" }).click();
  const modal = page.getByRole("dialog", { name: "Clear all couple-game data?" });
  await expect(modal).toBeVisible();
  await expect(modal.getByRole("button", { name: "Keep my data" })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(modal).toBeHidden();
  await expect(page.getByRole("heading", { name: "Your favourites" })).toBeVisible();
  await page.getByRole("button", { name: "Clear couple-game data on this device" }).click();
  await modal.getByRole("button", { name: "Yes, clear it" }).click();
  await expect(page.getByText("Couple-game data cleared from this device.")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Your favourites" })).toBeHidden();
  expect(nativeDialog).toBe(false);
});
