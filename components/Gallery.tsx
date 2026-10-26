"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { GALLERY, GALLERY_FILTERS, type GalleryCategory } from "@/lib/content";

export function Gallery() {
  const [filter, setFilter] = useState<GalleryCategory | "all">("all");
  const [current, setCurrent] = useState<number | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const visible = GALLERY.flatMap((item, index) =>
    filter === "all" || item.category === filter ? [index] : [],
  );
  const active = current === null ? null : GALLERY[current];

  const open = (index: number) => {
    setCurrent(index);
    dialogRef.current?.showModal();
  };

  const step = (dir: 1 | -1) => {
    if (current === null) return;
    const pos = visible.indexOf(current);
    setCurrent(visible[(pos + dir + visible.length) % visible.length]);
  };

  // Return focus to the card that was last shown when the viewer closes
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const onClose = () => {
      setCurrent((index) => {
        if (index !== null) buttonRefs.current[index]?.focus();
        return null;
      });
    };
    dialog.addEventListener("close", onClose);
    return () => dialog.removeEventListener("close", onClose);
  }, []);

  return (
    <>
      <div className="filters reveal" role="group" aria-label="Filter portfolio">
        {GALLERY_FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            className="filter"
            aria-pressed={filter === f.value}
            onClick={() => setFilter(f.value)}
          >
            {f.label}
          </button>
        ))}
      </div>

      <ul className="gallery">
        {GALLERY.map((item, index) => (
          <li key={item.title} className={`gallery__item${visible.includes(index) ? "" : " is-hidden"}`}>
            <button
              ref={(el) => {
                buttonRefs.current[index] = el;
              }}
              type="button"
              className="gallery__btn"
              onClick={() => open(index)}
            >
              <Image
                quality={90}
                src={item.image}
                alt={item.alt}
                placeholder="blur"
                sizes="(max-width: 640px) 50vw, (max-width: 1180px) 33vw, 380px"
              />
            </button>
            <p className="gallery__cap">
              {item.title} <span>{item.kind}</span>
            </p>
          </li>
        ))}
      </ul>

      <dialog
        ref={dialogRef}
        className="lightbox"
        aria-label="Illustration viewer"
        onClick={(e) => {
          if (e.target === e.currentTarget) dialogRef.current?.close();
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowLeft") step(-1);
          if (e.key === "ArrowRight") step(1);
        }}
      >
        {active ? (
          <figure className="lightbox__figure">
            <Image quality={90} src={active.image} alt={active.alt} placeholder="blur" sizes="90vw" />
            <figcaption>
              {active.title} <span>{active.kind}</span>
            </figcaption>
          </figure>
        ) : null}
        <button
          type="button"
          className="lightbox__btn lightbox__close"
          aria-label="Close"
          onClick={() => dialogRef.current?.close()}
        >
          &times;
        </button>
        <button type="button" className="lightbox__btn lightbox__prev" aria-label="Previous illustration" onClick={() => step(-1)}>
          &#8249;
        </button>
        <button type="button" className="lightbox__btn lightbox__next" aria-label="Next illustration" onClick={() => step(1)}>
          &#8250;
        </button>
      </dialog>
    </>
  );
}
