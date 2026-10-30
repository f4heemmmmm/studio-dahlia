"use client";

import { startTransition, useActionState, useEffect, useRef, useState, type FormEvent } from "react";
import { sendEnquiry, type EnquiryState } from "@/app/actions/enquire";
import { ENQUIRY_OPTIONS, OCCASIONS } from "@/lib/content";
import { DatePicker } from "./form/DatePicker";
import { Select } from "./form/Select";

const initialState: EnquiryState = { status: "idle" };

export function EnquiryForm() {
  const [state, formAction, pending] = useActionState(sendEnquiry, initialState);
  const [pkg, setPkg] = useState("Not sure yet");
  const [occasion, setOccasion] = useState(OCCASIONS[0]);
  const successRef = useRef<HTMLDivElement>(null);
  const errorRef = useRef<HTMLParagraphElement>(null);

  // Any link marked data-package (package cards, service links) pre-selects it here
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const link = (e.target as Element).closest<HTMLElement>("[data-package]");
      if (link?.dataset.package) setPkg(link.dataset.package);
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  useEffect(() => {
    if (state.status === "success") successRef.current?.focus();
    if (state.status === "error") errorRef.current?.focus();
  }, [state]);

  // Submitting through a transition (rather than <form action>) keeps what the
  // visitor typed if the server sends back a validation error
  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    startTransition(() => formAction(data));
  };

  if (state.status === "success") {
    return (
      <div className="form__done" ref={successRef} tabIndex={-1} role="status">
        <p className="form__done-title">Thank you{state.name ? `, ${state.name}` : ""}</p>
        <p>Your enquiry is on its way. We&rsquo;ll get back to you by email soon, and we&rsquo;ve sent a confirmation to your inbox.</p>
      </div>
    );
  }

  const fieldErrors = state.status === "error" ? (state.fieldErrors ?? {}) : {};

  return (
      <form className="form" onSubmit={onSubmit} noValidate>
        <div className="form__row">
          <div className="field">
            <label htmlFor="f-name">Your name</label>
            <input
              id="f-name"
              name="name"
              type="text"
              autoComplete="name"
              required
              aria-invalid={fieldErrors.name ? true : undefined}
              aria-describedby={fieldErrors.name ? "f-name-error" : undefined}
            />
            {fieldErrors.name ? (
              <p className="field__error" id="f-name-error">
                {fieldErrors.name}
              </p>
            ) : null}
          </div>
          <div className="field">
            <label htmlFor="f-email">Email address</label>
            <input
              id="f-email"
              name="email"
              type="email"
              autoComplete="email"
              inputMode="email"
              required
              aria-invalid={fieldErrors.email ? true : undefined}
              aria-describedby={fieldErrors.email ? "f-email-error" : undefined}
            />
            {fieldErrors.email ? (
              <p className="field__error" id="f-email-error">
                {fieldErrors.email}
              </p>
            ) : null}
          </div>
        </div>
        <div className="form__row">
          <div className="field">
            <label htmlFor="f-phone">
              Phone number <span className="field__opt">(optional)</span>
            </label>
            <input
              id="f-phone"
              name="phone"
              type="tel"
              autoComplete="tel"
              inputMode="tel"
              aria-invalid={fieldErrors.phone ? true : undefined}
              aria-describedby={fieldErrors.phone ? "f-phone-error" : undefined}
            />
            {fieldErrors.phone ? (
              <p className="field__error" id="f-phone-error">
                {fieldErrors.phone}
              </p>
            ) : null}
          </div>
          <DatePicker id="f-date" name="date" label="Event date" optional />
        </div>
        <div className="form__row">
          <Select id="f-type" name="type" label="Occasion" options={OCCASIONS} value={occasion} onChange={setOccasion} />
          <Select id="f-package" name="package" label="Interested in" options={ENQUIRY_OPTIONS} value={pkg} onChange={setPkg} />
        </div>
        <div className="field">
          <label htmlFor="f-venue">
            Venue <span className="field__opt">(optional)</span>
          </label>
          <input id="f-venue" name="venue" type="text" />
        </div>
        <div className="field">
          <label htmlFor="f-notes">
            Anything else <span className="field__opt">(optional)</span>
          </label>
          <textarea id="f-notes" name="notes" rows={3} placeholder="Guest count, theme, colours…" />
        </div>

        {/* Honeypot: hidden from people and screen readers, tempting to bots */}
        <div className="form__hp" aria-hidden="true">
          <label htmlFor="f-company">Company</label>
          <input id="f-company" name="company" type="text" tabIndex={-1} autoComplete="off" />
        </div>

        {state.status === "error" ? (
          <p className="form__alert" role="alert" tabIndex={-1} ref={errorRef}>
            {state.message}
          </p>
        ) : null}

        <div className="form__actions">
          <button className="btn btn--solid" type="submit" disabled={pending} aria-busy={pending}>
            {pending ? "Sending…" : "Send enquiry"}
          </button>
        </div>
      </form>
  );
}
