import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import logo from "@/public/img/logo.webp";
import { Sparkle } from "@/components/Icons";

export const metadata: Metadata = {
  title: "Page not found — Studio Dahlia",
  description: "This page is still a blank sheet on our easel.",
};

/**
 * 404: one of Studio Dahlia's A6 guest cards on a little tabletop easel,
 * lettered "404", with a faceless figure only half painted: pencil sketch,
 * a bloom of watercolour, and an ink line that stops partway.
 */
export default function NotFound() {
  return (
    <main className="nf">
      <header className="nf__top">
        <Link href="/" aria-label="Studio Dahlia home">
          <Image src={logo} alt="" className="nf__logo" sizes="64px" quality={90} preload />
        </Link>
      </header>

      <div className="nf__main">
        <div className="nf__scene" aria-hidden="true">
          <svg className="nf__easel" viewBox="0 0 300 420">
            <g stroke="#B88F66" strokeWidth="7" strokeLinecap="round">
              <path d="M150 30L150 404" stroke="#CDAA84" strokeWidth="6" />
              <path d="M150 18L58 410" />
              <path d="M150 18L242 410" />
            </g>
            <rect x="44" y="296" width="212" height="13" rx="4" fill="#C49A70" />
            <rect x="44" y="296" width="212" height="4" rx="2" fill="#D9B48B" />
            {/* A brush resting on the ledge, its tip still pink */}
            <g transform="rotate(-14 248 292)">
              <rect x="204" y="285" width="78" height="5" rx="2.5" fill="#E7D4BC" />
              <rect x="194" y="284" width="12" height="7" rx="1.5" fill="#C3C7CC" />
              <path d="M194 284.5C186 285.5 179 287 174 287.6C179 288.3 186 289.8 194 290.8Z" fill="#E58DA7" />
            </g>
          </svg>

          <div className="nf__card">
            <svg viewBox="0 0 210 296">
              <defs>
                <filter id="nf-watercolour" x="-20%" y="-20%" width="140%" height="140%">
                  <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="3" seed="7" result="noise" />
                  <feDisplacementMap in="SourceGraphic" in2="noise" scale="12" />
                  <feGaussianBlur stdDeviation="0.9" />
                </filter>
              </defs>

              <text x="16" y="48" className="nf__lettering">
                404
              </text>

              {/* Watercolour washes, blooming in */}
              <g filter="url(#nf-watercolour)">
                <path
                  className="nf__wash"
                  d="M40 214C55 184 95 172 120 180C150 188 178 204 186 238C192 270 170 296 140 296L52 296C34 280 30 238 40 214Z"
                  fill="#F7B6C6"
                  opacity="0.55"
                />
                <path
                  className="nf__wash nf__wash--late"
                  d="M62 240C82 222 120 224 150 238C170 250 172 280 150 296L72 296C58 282 52 256 62 240Z"
                  fill="#FFD9C2"
                  opacity="0.6"
                />
                <ellipse className="nf__wash" cx="105" cy="118" rx="22" ry="27" fill="#EBC6AE" opacity="0.55" />
                <circle className="nf__wash nf__wash--late" cx="150" cy="96" r="14" fill="#E8DEF6" opacity="0.8" />
              </g>

              {/* Pencil sketch */}
              <g fill="none" stroke="#9B9196" strokeWidth="0.8" strokeLinecap="round" opacity="0.75">
                <ellipse cx="105" cy="118" rx="23" ry="29" strokeDasharray="2 3" />
                <path d="M82 112C80 84 128 78 132 108C134 120 130 132 126 140" />
                <path d="M96 146L95 161M114 146L116 161" />
                <path d="M48 296C50 232 70 198 95 161M116 161C140 194 160 232 162 296" />
                <path d="M70 232C72 262 76 282 80 296M142 232C140 262 136 282 132 296" />
              </g>

              {/* Ink outline, drawn in and left unfinished */}
              <path
                className="nf__ink"
                pathLength={1}
                d="M86 100C80 122 86 144 105 147C118 147 127 139 128 124C129 112 126 102 120 95"
                fill="none"
                stroke="#2F292B"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
            <Image src={logo} alt="" className="nf__stamp" sizes="40px" quality={90} />
          </div>

          <Sparkle className="nf__sparkle nf__sparkle--1" />
          <Sparkle className="nf__sparkle nf__sparkle--2" />
          <Sparkle className="nf__sparkle nf__sparkle--3" />
        </div>

        <div className="nf__copy">
          <p className="eyebrow">Page not found</p>
          <h1 className="script-title">This page is still a blank sheet</h1>
          <p className="nf__text">
            The page you&rsquo;re looking for may have moved, or perhaps it&rsquo;s still waiting on our easel.
            Let&rsquo;s take you somewhere that&rsquo;s already been painted.
          </p>
          <div className="nf__actions">
            <Link className="btn btn--solid" href="/">
              Back to the studio
            </Link>
            <Link className="btn btn--ghost" href="/#portfolio">
              View the portfolio
            </Link>
          </div>
        </div>
      </div>

      <div className="nf__lace" aria-hidden="true" />
    </main>
  );
}
