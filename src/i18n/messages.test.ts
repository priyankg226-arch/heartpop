import { expect, it } from "vitest";
import { categories, languages, template, type Language } from "./index";
import { encodePayload, decodePayload, type Payload } from "../lib/share";
it("all five languages supply category-specific shareable templates", () => {
  for (const language of Object.keys(languages) as Language[]) {
    const outputs = categories.message.map((category) =>
      template(language, category, "Heartfelt"),
    );
    expect(new Set(outputs).size).toBe(categories.message.length);
    for (const message of outputs) {
      const p: Payload = {
        v: 1,
        kind: "message",
        to: "Friend",
        from: "",
        category: "Birthday",
        tone: "Heartfelt",
        theme: "pink",
        language,
        message,
      };
      expect(decodePayload(encodePayload(p)).message).toBe(message);
    }
  }
});
