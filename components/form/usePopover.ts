"use client";

import {
  useEffect,
  useEffectEvent,
  useLayoutEffect,
  useState,
  type CSSProperties,
  type RefObject,
} from "react";

/** Below this width, pickers open as a bottom sheet instead of an anchored popover. */
const SHEET_QUERY = "(max-width: 640px)";
const GAP = 6; // between the field and the popover
const EDGE = 8; // minimum distance from any screen edge
const MIN_HEIGHT = 160; // never squeeze a popover shorter than this

export function useIsSheet() {
  const [sheet, setSheet] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(SHEET_QUERY);
    const sync = () => setSheet(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);
  return sheet;
}

/**
 * Scrolls `el` into view inside the popover's own scroll area only.
 * (Element.scrollIntoView would also scroll the page behind the popover.)
 */
export function revealInPopover(el: Element | null, container: HTMLElement | null) {
  if (!el || !container) return;
  const sticky = container.querySelector<HTMLElement>(".picker-sheet__head")?.offsetHeight ?? 0;
  const box = container.getBoundingClientRect();
  const item = el.getBoundingClientRect();
  if (item.top < box.top + sticky) container.scrollTop -= box.top + sticky - item.top + 4;
  else if (item.bottom > box.bottom) container.scrollTop += item.bottom - box.bottom + 4;
}

type Options = {
  open: boolean;
  sheet: boolean;
  anchorRef: RefObject<HTMLElement | null>;
  popoverRef: RefObject<HTMLElement | null>;
  onClose: () => void;
  /** "anchor" matches the field's width; a number sets a fixed width. Both are clamped to the screen. */
  width?: "anchor" | number;
};

/**
 * Positions a portalled popover next to its field so it is never clipped:
 * opens below, flips above when there is more room there, shifts sideways to
 * stay on screen, caps its height to the space available, and follows the field
 * on scroll and resize. Also handles outside clicks and, for bottom sheets,
 * locks page scroll.
 */
// Before it is measured the popover is transparent rather than hidden, so it can
// still take keyboard focus in the same commit that opens it
const UNPLACED: CSSProperties = { position: "fixed", top: 0, left: 0, opacity: 0 };

export function usePopover({ open, sheet, anchorRef, popoverRef, onClose, width = "anchor" }: Options) {
  const [style, setStyle] = useState<CSSProperties>(UNPLACED);
  const close = useEffectEvent(onClose);

  const place = useEffectEvent(() => {
    const anchor = anchorRef.current;
    const pop = popoverRef.current;
    if (!anchor || !pop) return;
    if (sheet) {
      setStyle({});
      return;
    }

    const vw = document.documentElement.clientWidth;
    const vh = window.innerHeight;
    const r = anchor.getBoundingClientRect();

    // Field scrolled fully out of view: nothing sensible to point at
    if (r.bottom < 0 || r.top > vh) {
      close();
      return;
    }

    const w = Math.min(width === "anchor" ? Math.max(r.width, 240) : width, vw - EDGE * 2);
    const natural = pop.scrollHeight;
    const below = vh - r.bottom - GAP - EDGE;
    const above = r.top - GAP - EDGE;
    const left = Math.min(Math.max(r.left, EDGE), vw - w - EDGE);
    const screen = vh - EDGE * 2;

    // 1. Below the field if it all fits, else above if it all fits
    if (natural <= below || natural <= above) {
      const placeBelow = natural <= below;
      setStyle({ position: "fixed", top: placeBelow ? r.bottom + GAP : r.top - GAP - natural, left, width: w, maxHeight: natural });
      return;
    }
    // 2. Fits on screen but not beside the field: slide it until it is fully
    //    visible (it may overlap the field a little) rather than clip it
    if (natural <= screen) {
      const top = Math.min(Math.max(r.bottom + GAP, EDGE), vh - EDGE - natural);
      setStyle({ position: "fixed", top, left, width: w, maxHeight: natural });
      return;
    }
    // 3. Taller than the screen: take the roomier side and scroll inside
    const placeBelow = below >= above;
    const maxHeight = Math.max(MIN_HEIGHT, placeBelow ? below : above);
    setStyle({ position: "fixed", top: placeBelow ? r.bottom + GAP : r.top - GAP - maxHeight, left, width: w, maxHeight });
  });

  // Measure before paint so the popover never flashes in the wrong place
  useLayoutEffect(() => {
    if (open) place();
    else setStyle(UNPLACED);
  }, [open, sheet]);

  useEffect(() => {
    if (!open || sheet) return;
    const onMove = () => place();
    window.addEventListener("resize", onMove);
    window.addEventListener("scroll", onMove, true);
    return () => {
      window.removeEventListener("resize", onMove);
      window.removeEventListener("scroll", onMove, true);
    };
  }, [open, sheet]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Node;
      if (anchorRef.current?.contains(target) || popoverRef.current?.contains(target)) return;
      close();
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open, anchorRef, popoverRef]);

  // A bottom sheet covers the page; keep the page behind it from scrolling
  useEffect(() => {
    if (!open || !sheet) return;
    const root = document.documentElement;
    const previous = root.style.overflow;
    root.style.overflow = "hidden";
    return () => {
      root.style.overflow = previous;
    };
  }, [open, sheet]);

  return style;
}
