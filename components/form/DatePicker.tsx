"use client";

import { useEffect, useId, useRef, useState, type FocusEvent, type KeyboardEvent } from "react";
import { PickerSurface } from "./PickerSurface";
import { useIsSheet, usePopover } from "./usePopover";

type Props = {
  id: string;
  name: string;
  label: string;
  optional?: boolean;
};

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const POPOVER_WIDTH = 336;

// All dates are local calendar days; the form value is YYYY-MM-DD
const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const addMonths = (d: Date, n: number) => {
  const target = new Date(d.getFullYear(), d.getMonth() + n, 1);
  const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  return new Date(target.getFullYear(), target.getMonth(), Math.min(d.getDate(), lastDay));
};
const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
const toValue = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const longDate = (d: Date) => d.toLocaleDateString("en-SG", { day: "numeric", month: "long", year: "numeric" });
const monthTitle = (d: Date) => d.toLocaleDateString("en-SG", { month: "long", year: "numeric" });
const dayLabel = (d: Date) =>
  d.toLocaleDateString("en-SG", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

/** Weeks (Monday first) for the month containing `d`; days outside the month are null. */
function monthMatrix(d: Date) {
  const first = new Date(d.getFullYear(), d.getMonth(), 1);
  const daysInMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  const lead = (first.getDay() + 6) % 7;
  const cells: (Date | null)[] = [
    ...Array.from({ length: lead }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => new Date(d.getFullYear(), d.getMonth(), i + 1)),
  ];
  while (cells.length % 7) cells.push(null);
  return Array.from({ length: cells.length / 7 }, (_, w) => cells.slice(w * 7, w * 7 + 7));
}

/**
 * Date picker following the WAI-ARIA APG date picker dialog pattern: a button
 * opens a dialog holding a calendar grid with one roving tab stop. Past dates
 * are disabled because the picker is for upcoming events.
 */
export function DatePicker({ id, name, label, optional }: Props) {
  const uid = useId();
  const labelId = `${id}-label`;
  const valueId = `${id}-value`;
  const titleId = `${uid}-title`;

  const [today, setToday] = useState(() => startOfDay(new Date()));
  const [value, setValue] = useState<Date | null>(null);
  const [open, setOpen] = useState(false);
  const [focusDate, setFocusDate] = useState(today);

  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLTableElement>(null);

  const sheet = useIsSheet();
  const style = usePopover({
    open,
    sheet,
    anchorRef: triggerRef,
    popoverRef,
    onClose: () => setOpen(false),
    width: POPOVER_WIDTH,
  });

  const clampToToday = (d: Date) => (d < today ? today : d);

  const openPicker = () => {
    const now = startOfDay(new Date());
    setToday(now);
    setFocusDate(value && value >= now ? value : now);
    setOpen(true);
  };
  const closePicker = (returnFocus = true) => {
    setOpen(false);
    if (returnFocus) triggerRef.current?.focus();
  };
  const choose = (d: Date) => {
    if (d < today) return;
    setValue(d);
    closePicker();
  };

  // Keep keyboard focus on the focused day as it moves (and when the dialog opens)
  useEffect(() => {
    if (!open) return;
    const btn = gridRef.current?.querySelector<HTMLButtonElement>(`[data-date="${toValue(focusDate)}"]`);
    btn?.focus({ preventScroll: true });
  }, [open, focusDate]);

  const onGridKeyDown = (e: KeyboardEvent) => {
    const moves: Record<string, () => Date> = {
      ArrowLeft: () => addDays(focusDate, -1),
      ArrowRight: () => addDays(focusDate, 1),
      ArrowUp: () => addDays(focusDate, -7),
      ArrowDown: () => addDays(focusDate, 7),
      Home: () => addDays(focusDate, -((focusDate.getDay() + 6) % 7)),
      End: () => addDays(focusDate, 6 - ((focusDate.getDay() + 6) % 7)),
      PageUp: () => addMonths(focusDate, e.shiftKey ? -12 : -1),
      PageDown: () => addMonths(focusDate, e.shiftKey ? 12 : 1),
    };
    if (e.key in moves) {
      e.preventDefault();
      setFocusDate(clampToToday(moves[e.key]()));
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      choose(focusDate);
    }
  };

  const onDialogKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      closePicker();
    }
  };

  // Keep Tab inside the dialog (APG date picker pattern). The popover is portalled
  // to the end of <body>, so without this Tab would leave the page entirely.
  useEffect(() => {
    if (!open) return;
    const el = popoverRef.current;
    if (!el) return;
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const stops = [...el.querySelectorAll<HTMLButtonElement>("button:not(:disabled)")].filter((b) => b.tabIndex >= 0);
      if (!stops.length) return;
      const first = stops[0];
      const last = stops[stops.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    el.addEventListener("keydown", onKey);
    return () => el.removeEventListener("keydown", onKey);
  }, [open, sheet]);

  // If focus is moved elsewhere on the page (not via Tab), close the anchored popover
  const onDialogBlur = (e: FocusEvent) => {
    if (sheet) return;
    const next = e.relatedTarget as Node | null;
    if (next && (popoverRef.current?.contains(next) || triggerRef.current?.contains(next))) return;
    if (next) closePicker(false);
  };

  const viewMonth = new Date(focusDate.getFullYear(), focusDate.getMonth(), 1);
  const canGoBack = viewMonth > new Date(today.getFullYear(), today.getMonth(), 1);

  return (
    <div className="field">
      <span className="field__label" id={labelId}>
        {label} {optional ? <span className="field__opt">(optional)</span> : null}
      </span>
      <button
        ref={triggerRef}
        id={id}
        type="button"
        className="picker-trigger"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-labelledby={`${labelId} ${valueId}`}
        onClick={() => (open ? closePicker() : openPicker())}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            openPicker();
          }
        }}
      >
        <span className={`picker-trigger__value${value ? "" : " picker-trigger__placeholder"}`} id={valueId}>
          {value ? longDate(value) : "Select a date"}
        </span>
        <svg className="picker-trigger__icon" viewBox="0 0 24 24" aria-hidden="true">
          <g fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <rect x="3.5" y="5" width="17" height="15.5" rx="2.5" />
            <path d="M3.5 9.5h17M8 3v4M16 3v4" />
          </g>
        </svg>
      </button>
      <input type="hidden" name={name} value={value ? toValue(value) : ""} />

      <PickerSurface open={open} sheet={sheet} title={label} style={style} popoverRef={popoverRef} onClose={() => closePicker()}>
        <div
          className="calendar"
          role="dialog"
          aria-modal={sheet}
          aria-label={`Choose ${label.toLowerCase()}`}
          onKeyDown={onDialogKeyDown}
          onBlur={onDialogBlur}
        >
          <div className="calendar__head">
            <button
              type="button"
              className="calendar__nav"
              aria-label="Previous month"
              disabled={!canGoBack}
              onClick={() => setFocusDate(clampToToday(addMonths(focusDate, -1)))}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M15 6l-6 6 6 6" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <p className="calendar__title" id={titleId} aria-live="polite">
              {monthTitle(viewMonth)}
            </p>
            <button
              type="button"
              className="calendar__nav"
              aria-label="Next month"
              onClick={() => setFocusDate(addMonths(focusDate, 1))}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M9 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>

          <table ref={gridRef} className="calendar__grid" role="grid" aria-labelledby={titleId} onKeyDown={onGridKeyDown}>
            <thead>
              <tr>
                {WEEKDAYS.map((d) => (
                  <th key={d} scope="col" abbr={d}>
                    {d.slice(0, 2)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {monthMatrix(viewMonth).map((week, w) => (
                <tr key={w}>
                  {week.map((day, i) =>
                    day ? (
                      <td key={i} role="gridcell" aria-selected={value ? sameDay(day, value) : false}>
                        <button
                          type="button"
                          className="calendar__day"
                          data-date={toValue(day)}
                          tabIndex={sameDay(day, focusDate) ? 0 : -1}
                          aria-label={dayLabel(day)}
                          aria-current={sameDay(day, today) ? "date" : undefined}
                          disabled={day < today}
                          onClick={() => choose(day)}
                        >
                          {day.getDate()}
                        </button>
                      </td>
                    ) : (
                      <td key={i} aria-hidden="true" />
                    ),
                  )}
                </tr>
              ))}
            </tbody>
          </table>

          <div className="calendar__foot">
            <button
              type="button"
              className="calendar__action"
              disabled={!value}
              onClick={() => {
                setValue(null);
                closePicker();
              }}
            >
              Clear
            </button>
            <button
              type="button"
              className="calendar__action"
              onClick={() => {
                setFocusDate(today);
                choose(today);
              }}
            >
              Today
            </button>
          </div>
        </div>
      </PickerSurface>
    </div>
  );
}
