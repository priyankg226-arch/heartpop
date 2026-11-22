import { useEffect } from "react";

// Blocks that fade/slide in one by one as they scroll into view.
const TARGETS = [
  "#main section > *:not(.experience-grid):not(.steps):not(.experience-groups)",
  "#main .group-heading",
  "#main .experience-grid > *",
  "#main .steps > *",
  "#main main > *:not(.experience-groups)",
  "footer > *",
].join(",");

export function useScrollReveal(key: string) {
  useEffect(() => {
    if (
      typeof IntersectionObserver === "undefined" ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      return;

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const el = entry.target as HTMLElement;
          el.classList.add("revealed");
          io.unobserve(el);
          // Hand transitions back to the element (e.g. card hover effects).
          window.setTimeout(() => {
            el.classList.remove("reveal", "revealed");
            el.style.removeProperty("--reveal-delay");
          }, 1300);
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.12 },
    );

    const scan = () => {
      document.querySelectorAll<HTMLElement>(TARGETS).forEach((el) => {
        if (el.dataset.reveal) return;
        el.dataset.reveal = "1";
        // Skip blocks nested inside another revealing block.
        if (el.parentElement?.closest(".reveal")) return;
        const siblings = el.parentElement
          ? Array.from(el.parentElement.children)
          : [];
        el.style.setProperty(
          "--reveal-delay",
          `${Math.min(siblings.indexOf(el), 5) * 80}ms`,
        );
        el.classList.add("reveal");
        io.observe(el);
      });
    };

    scan();
    // Lazy routes and dynamic content mount after the first paint.
    const mo = new MutationObserver(scan);
    mo.observe(document.body, { childList: true, subtree: true });
    return () => {
      mo.disconnect();
      io.disconnect();
      // Un-hide anything this run hid but never revealed, so a re-run
      // (StrictMode, route change) can pick it up again — never leave it blank.
      document
        .querySelectorAll<HTMLElement>(".reveal:not(.revealed)")
        .forEach((el) => {
          el.classList.remove("reveal");
          el.style.removeProperty("--reveal-delay");
          delete el.dataset.reveal;
        });
    };
  }, [key]);
}
