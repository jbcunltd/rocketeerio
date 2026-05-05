"use client";

import { useEffect } from "react";

/**
 * Mounts an IntersectionObserver that adds `.reveal-in` to any element with the
 * `.reveal` class once it scrolls into view. Render once at the layout root.
 */
export function RevealOnScroll() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      // Make all reveal elements visible immediately for reduced motion.
      document
        .querySelectorAll<HTMLElement>(".reveal")
        .forEach((el) => el.classList.add("reveal-in"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("reveal-in");
            observer.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -10% 0px" },
    );

    const apply = () => {
      document
        .querySelectorAll<HTMLElement>(".reveal:not(.reveal-in)")
        .forEach((el) => observer.observe(el));
    };

    apply();
    // Re-scan on route changes (when DOM is replaced)
    const mo = new MutationObserver(apply);
    mo.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      mo.disconnect();
    };
  }, []);

  return null;
}
