// useSectionSpy.ts
import { MutableRefObject, useLayoutEffect, useMemo, useState } from 'react';

type Options = IntersectionObserverInit & { rootMargin?: string };

export default function useSectionSpy(
  refs: Array<MutableRefObject<HTMLElement | null>>,
  options?: Options
) {
  const [active, setActive] = useState(0);

  // Track the actual elements so the effect re-runs when they mount
  const elements = useMemo(() => refs.map((r) => r.current), [refs]);

  useLayoutEffect(() => {
    const targets = elements.filter(Boolean) as HTMLElement[];
    if (!targets.length) return;

    const obs = new IntersectionObserver(
      (entries) => {
        // Pick the most visible intersecting section
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => (b.intersectionRatio || 0) - (a.intersectionRatio || 0));

        if (visible[0]) {
          const idx = targets.indexOf(visible[0].target as HTMLElement);
          if (idx !== -1) setActive(idx);
        }
      },
      {
        root: options?.root ?? null,
        rootMargin: options?.rootMargin ?? '0px',
        // Slightly denser thresholds to make switching snappier
        threshold: [0, 0.25, 0.5, 0.75, 1],
      }
    );

    targets.forEach((t) => obs.observe(t));
    return () => obs.disconnect();
  }, [elements, options?.root, options?.rootMargin]);

  return active;
}
