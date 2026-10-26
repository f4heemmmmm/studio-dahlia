"use client";

import { startTransition, useActionState, useEffect, useRef, useState, type FormEvent } from "react";
import { sendEnquiry, type EnquiryState } from "@/app/actions/enquire";
import { ENQUIRY_OPTIONS, INSTAGRAM_HANDLE, INSTAGRAM_URL, OCCASIONS } from "@/lib/content";
import { Instagram } from "./Icons";

const initialState: EnquiryState = { status: "idle" };

export function EnquiryForm() {
  const [state, formAction, pending] = useActionState(sendEnquiry, initialState);
  const [pkg, setPkg] = useState("Not sure yet");
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
    <>
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
            <label htmlFor="f-type">Occasion</label>
            <select id="f-type" name="type" defaultValue={OCCASIONS[0]}>
              {OCCASIONS.map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="f-date">
              Event date <span className="field__opt">(optional)</span>
            </label>
            <input id="f-date" name="date" type="date" />
          </div>
        </div>
        <div className="form__row">
          <div className="field">
            <label htmlFor="f-package">Interested in</label>
            <select id="f-package" name="package" value={pkg} onChange={(e) => setPkg(e.target.value)}>
              {ENQUIRY_OPTIONS.map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="f-venue">
              Venue <span className="field__opt">(optional)</span>
            </label>
            <input id="f-venue" name="venue" type="text" />
          </div>
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

      <p className="form__alt">
        Prefer Instagram?{" "}
        <a href={INSTAGRAM_URL} target="_blank" rel="noopener">
          <Instagram className="form__alt-icon" />
          Message {INSTAGRAM_HANDLE}
        </a>
      </p>
    </>
  );
}
