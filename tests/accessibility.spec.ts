import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
test("key pages have no automated WCAG A/AA violations", async ({
  page,
}, info) => {
  // Measure contrast at rest, not mid scroll-reveal fade-in.
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const route of [
    "/",
    "/#/create/envelope",
    "/#/create/scratch",
    "/#/roulette",
    "/#/create/quiz",
    "/#/privacy",
  ]) {
    await page.goto(route);
    await page.locator("h1").waitFor();
    await page.evaluate(() => document.fonts.ready);
    const result = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
      .analyze();
    expect(
      result.violations.map((v) => ({
        id: v.id,
        nodes: v.nodes.map((n) => ({
          target: n.target,
          summary: n.failureSummary,
        })),
      })),
    ).toEqual([]);
    if (route === "/")
      await page.screenshot({
        path: `test-results/home-${info.project.name}.png`,
        fullPage: true,
      });
  }
});
