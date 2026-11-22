import { test, expect } from "@playwright/test";
test("production app caches feature routes for offline use", async ({
  page,
  context,
}) => {
  await page.goto("/");
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.reload();
  await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller));
  await context.setOffline(true);
  await page.goto("/#/roulette");
  await expect(
    page.getByRole("button", { name: "Spin the wheel" }),
  ).toBeVisible();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.getByRole("button", { name: "Spin the wheel" }).click();
  await expect(
    page.getByRole("button", { name: "Challenge complete" }),
  ).toBeVisible();
  await page.goto("/#/create/message");
  await expect(page.getByLabel("Your message")).not.toBeEmpty();
  await context.setOffline(false);
});
