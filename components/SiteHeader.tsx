"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import logoMark from "@/public/img/logo.webp";
import { NAV_LINKS } from "@/lib/content";

export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpen(false);
      toggleRef.current?.focus();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const close = () => setOpen(false);

  return (
    <header className={`site-header${scrolled ? " is-scrolled" : ""}`}>
      <div className="site-header__inner">
        <a className="brand" href="#top" aria-label="Studio Dahlia, back to top">
          <Image quality={90} src={logoMark} alt="" className="brand__mark" sizes="(max-width: 820px) 48px, 76px" preload />
          <span className="brand__name">Studio Dahlia</span>
        </a>
        <button
          ref={toggleRef}
          className="nav-toggle"
          type="button"
          aria-expanded={open}
          aria-controls="site-nav"
          onClick={() => setOpen((o) => !o)}
        >
          <span className="nav-toggle__bars" aria-hidden="true" />
          <span className="visually-hidden">Menu</span>
        </button>
        <nav className={`site-nav${open ? " is-open" : ""}`} id="site-nav" aria-label="Main">
          <ul>
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <a href={link.href} onClick={close}>
                  {link.label}
                </a>
              </li>
            ))}
            <li>
              <a className="site-nav__cta" href="#enquire" onClick={close}>
                Enquire
              </a>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}
