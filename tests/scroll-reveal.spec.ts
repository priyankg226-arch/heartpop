import { test, expect } from "@playwright/test";
test("scroll reveal never leaves content hidden", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".hero > *").first()).toHaveCSS("opacity", "1");
  const steps = page.locator(".steps > *").last();
  await steps.scrollIntoViewIfNeeded();
  await expect(steps).toHaveCSS("opacity", "1");
  await page.goto("/#/about");
  await expect(page.locator("#main main > *").first()).toHaveCSS("opacity", "1");
});
