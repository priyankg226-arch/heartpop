import { test, expect } from "@playwright/test";

test("roulette challenge can be shared and the link opens the same category", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/#/roulette");
  await page.getByRole("button", { name: "Funny" }).click();
  await page.getByRole("button", { name: "Spin the wheel" }).click();
  await expect(
    page.getByRole("button", { name: "Challenge complete" }),
  ).toBeVisible();
  const share = page.getByRole("group", { name: "Challenge your friends" });
  const href = await share.getByRole("link", { name: /WhatsApp/ }).getAttribute("href");
  expect(decodeURIComponent(href!)).toContain("My HeartPop challenge:");
  const link = await share.getByLabel("Link to share").inputValue();
  expect(link).toContain("#/roulette?category=Funny");
  await page.goto(link);
  await expect(page.getByRole("button", { name: "Funny" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
});

for (const kind of ["stars", "hearts", "future", "bingo"])
  test(`${kind} game can be shared with a friend and opened from the link`, async ({
    page,
    browser,
  }) => {
    await page.goto(`/#/create/${kind}`);
    await page.getByLabel("For someone special").fill("Mira");
    await page.getByLabel("From you").fill("Jay");
    await page.getByRole("button", { name: "Preview my surprise" }).click();
    await page.getByRole("link", { name: "Create & share surprise" }).click();
    await expect(page.getByRole("link", { name: "WhatsApp" })).toBeVisible();
    const link = await page.getByLabel("Your surprise link").inputValue();
    const friend = await browser.newContext();
    const recipient = await friend.newPage();
    await recipient.goto(link);
    await expect(recipient.getByRole("heading", { level: 1 })).toContainText(
      "Mira",
    );
    await friend.close();
  });
