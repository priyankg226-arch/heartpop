import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { ShareButtons } from "./ShareButtons";

it("offers WhatsApp and copy sharing with the message and link", async () => {
  const writeText = vi.fn().mockResolvedValue(undefined);
  Object.defineProperty(navigator, "clipboard", {
    value: { writeText },
    configurable: true,
  });
  render(<ShareButtons url="https://x.test/#/roulette" text="Spin with me!" />);
  const whatsapp = screen.getByRole("link", { name: /WhatsApp/ });
  expect(whatsapp.getAttribute("href")).toBe(
    `https://wa.me/?text=${encodeURIComponent("Spin with me! https://x.test/#/roulette")}`,
  );
  fireEvent.click(screen.getByRole("button", { name: /Copy link/ }));
  expect(writeText).toHaveBeenCalledWith("Spin with me! https://x.test/#/roulette");
  expect(
    await screen.findByText("Link copied. Send it to your friends!"),
  ).toBeInTheDocument();
});
