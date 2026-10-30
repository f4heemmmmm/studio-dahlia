"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { PickerSurface } from "./PickerSurface";
import { revealInPopover, useIsSheet, usePopover } from "./usePopover";

type Props = {
  id: string;
  name: string;
  label: string;
  options: readonly string[];
  value: string;
  onChange: (value: string) => void;
};

/**
 * Select-only combobox (WAI-ARIA APG pattern). The trigger is a button; the
 * options are a listbox with aria-activedescendant, so focus stays on the list
 * while the arrow keys move the highlight. A hidden input carries the value
 * into the form.
 */
export function Select({ id, name, label, options, value, onChange }: Props) {
  const uid = useId();
  const labelId = `${id}-label`;
  const valueId = `${id}-value`;
  const listId = `${uid}-listbox`;
  const optionId = (i: number) => `${uid}-option-${i}`;

  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const typeahead = useRef({ text: "", timer: 0 });

  const sheet = useIsSheet();
  const selectedIndex = Math.max(0, options.indexOf(value));
  const style = usePopover({ open, sheet, anchorRef: triggerRef, popoverRef, onClose: () => setOpen(false) });

  const openList = (index = selectedIndex) => {
    setActive(index);
    setOpen(true);
  };
  const closeList = (returnFocus = true) => {
    setOpen(false);
    if (returnFocus) triggerRef.current?.focus();
  };
  const choose = (index: number) => {
    onChange(options[index]);
    closeList();
  };

  // Move focus into the list once it is on screen
  useEffect(() => {
    if (open) listRef.current?.focus({ preventScroll: true });
  }, [open]);

  // Keep the highlighted option visible inside a scrolling list
  useEffect(() => {
    if (open) revealInPopover(document.getElementById(optionId(active)), popoverRef.current);
  }, [open, active]);

  // Type a letter to jump to the first option starting with what you've typed
  const findByTyping = (key: string) => {
    const t = typeahead.current;
    window.clearTimeout(t.timer);
    t.text += key.toLowerCase();
    t.timer = window.setTimeout(() => (t.text = ""), 600);
    const start = open ? active : selectedIndex;
    const order = [...options.keys()].map((k) => (start + 1 + k) % options.length);
    return order.find((i) => options[i].toLowerCase().startsWith(t.text)) ?? -1;
  };

  const onTriggerKeyDown = (e: KeyboardEvent) => {
    if (["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) {
      e.preventDefault();
      openList(e.key === "ArrowUp" ? Math.max(0, selectedIndex - 1) : selectedIndex);
    } else if (e.key.length === 1 && /\S/.test(e.key)) {
      const i = findByTyping(e.key);
      if (i >= 0) onChange(options[i]);
    }
  };

  const onListKeyDown = (e: KeyboardEvent) => {
    const last = options.length - 1;
    const moves: Record<string, number> = {
      ArrowDown: Math.min(last, active + 1),
      ArrowUp: Math.max(0, active - 1),
      Home: 0,
      End: last,
      PageDown: Math.min(last, active + 5),
      PageUp: Math.max(0, active - 5),
    };
    if (e.key in moves) {
      e.preventDefault();
      setActive(moves[e.key]);
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      choose(active);
    } else if (e.key === "Escape") {
      e.preventDefault();
      closeList();
    } else if (e.key === "Tab") {
      closeList(false);
    } else if (e.key.length === 1 && /\S/.test(e.key)) {
      const i = findByTyping(e.key);
      if (i >= 0) setActive(i);
    }
  };

  return (
    <div className="field">
      <span className="field__label" id={labelId}>
        {label}
      </span>
      <button
        ref={triggerRef}
        id={id}
        type="button"
        className="picker-trigger"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-labelledby={`${labelId} ${valueId}`}
        onClick={() => (open ? closeList() : openList())}
        onKeyDown={onTriggerKeyDown}
      >
        <span className="picker-trigger__value" id={valueId}>
          {value}
        </span>
        <svg className="picker-trigger__icon picker-trigger__icon--chevron" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <input type="hidden" name={name} value={value} />

      <PickerSurface open={open} sheet={sheet} title={label} style={style} popoverRef={popoverRef} onClose={() => closeList()}>
        <ul
          ref={listRef}
          id={listId}
          className="listbox"
          role="listbox"
          tabIndex={-1}
          aria-labelledby={labelId}
          aria-activedescendant={optionId(active)}
          onKeyDown={onListKeyDown}
        >
          {options.map((option, i) => {
            const selected = option === value;
            return (
              <li
                key={option}
                id={optionId(i)}
                role="option"
                aria-selected={selected}
                className={`listbox__option${i === active ? " is-active" : ""}`}
                onPointerMove={() => setActive(i)}
                onClick={() => choose(i)}
              >
                <span>{option}</span>
                {selected ? (
                  <svg className="listbox__check" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : null}
              </li>
            );
          })}
        </ul>
      </PickerSurface>
    </div>
  );
}
