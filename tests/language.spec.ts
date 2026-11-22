import { test, expect, type Page } from "@playwright/test";
async function pickLanguage(page: Page, value: string) {
  await page.locator(".language-trigger").click();
  await page.locator(`.language-menu [data-value="${value}"]`).click();
  await expect(page.locator(".language-menu")).toHaveCount(0);
}
async function currentLanguage(page: Page) {
  await page.locator(".language-trigger").click();
  const value = await page
    .locator('.language-menu [aria-selected="true"]')
    .getAttribute("data-value");
  await page.keyboard.press("Escape");
  return value;
}
test("all five languages switch navigation, cards, and persist without overflow", async ({
  page,
}, info) => {
  await page.goto("/");
  for (const [value, heading, card] of [
    ["hi", "आज किसी की", "तब खोलना जब…"],
    ["gu", "આજે કોઈના ચહેરા પર", "ત્યારે ખોલજે જ્યારે…"],
    ["hinglish", "Aaj kisi ki", "Tab kholna jab…"],
    ["roman-gu", "Aaje koina chehra par", "Tyare kholje jyare…"],
    ["en", "Make someone", "Open When…"],
  ]) {
    await pickLanguage(page, value);
    await expect(page.locator("h1")).toContainText(heading);
    await expect(page.locator(".experience-card").first()).toContainText(card);
    await page.evaluate(() => document.fonts.ready);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    if (value === "gu")
      await page.screenshot({
        path: `test-results/gujarati-${info.project.name}.png`,
        fullPage: true,
      });
    await page.reload();
    expect(await currentLanguage(page)).toBe(value);
    await expect(page.locator("h1")).toContainText(heading);
  }
});
test("editor translates templates and category choices but preserves personal writing", async ({
  page,
}) => {
  await page.goto("/#/create/message");
  await pickLanguage(page, "hi");
  await expect(page.getByLabel("आपका संदेश")).toHaveValue(/तुम्हारे/);
  await page.getByLabel("श्रेणी चुनें").selectOption("Birthday");
  await expect(page.getByLabel("आपका संदेश")).toHaveValue(/जन्मदिन/);
  await pickLanguage(page, "gu");
  await expect(page.getByLabel("તમારો સંદેશ")).toHaveValue(/જન્મદિવસ/);
  await page.getByLabel("તમારો સંદેશ").fill("My personal message 💗");
  await page.getByPlaceholder("તેમનું નામ").fill("પ્રિયા");
  await pickLanguage(page, "hinglish");
  await expect(page.getByLabel("Aapka message")).toHaveValue(
    "My personal message 💗",
  );
  await expect(page.getByPlaceholder("Unka naam")).toHaveValue("પ્રિયા");
  await expect(page.locator(".preview-card")).toContainText(
    "My personal message 💗",
  );
});
