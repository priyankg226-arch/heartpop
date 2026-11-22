import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { AnimatedEnvelope } from "./Interactive";
Object.defineProperty(window, "matchMedia", {
  value: vi.fn(() => ({
    matches: true,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  })),
});
it("opens personalized letters safely and replays", () => {
  render(<AnimatedEnvelope to="Mira" from="Jay" message="<b>You matter</b>" />);
  fireEvent.click(screen.getByRole("button", { name: "Open your envelope" }));
  expect(screen.getByText("<b>You matter</b>")).toBeInTheDocument();
  expect(screen.getByText("With love, Jay ♡")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Read it again" }));
  expect(
    screen.getByRole("button", { name: "Open your envelope" }),
  ).toBeInTheDocument();
});
