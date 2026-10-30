"use client";

import { createPortal } from "react-dom";
import type { CSSProperties, ReactNode, RefObject } from "react";

type Props = {
  open: boolean;
  sheet: boolean;
  title: string;
  style: CSSProperties;
  popoverRef: RefObject<HTMLDivElement | null>;
  onClose: () => void;
  children: ReactNode;
};

/**
 * Where a picker's content lives: an anchored popover on larger screens, a
 * bottom sheet on phones. Portalled to <body> so no parent can clip it.
 */
export function PickerSurface({ open, sheet, title, style, popoverRef, onClose, children }: Props) {
  if (!open) return null;

  return createPortal(
    sheet ? (
      // Tapping the dimmed backdrop counts as an outside click (handled by usePopover)
      <div className="picker-sheet">
        <div ref={popoverRef} className="picker-sheet__panel">
          <div className="picker-sheet__head">
            <span className="picker-sheet__title">{title}</span>
            <button type="button" className="picker-sheet__close" aria-label={`Close ${title}`} onClick={onClose}>
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </button>
          </div>
          {children}
        </div>
      </div>
    ) : (
      <div ref={popoverRef} className="picker-pop" style={style}>
        {children}
      </div>
    ),
    document.body,
  );
}
