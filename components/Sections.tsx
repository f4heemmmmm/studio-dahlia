import Image from "next/image";
import couple from "@/public/img/couple.webp";
import artistAtWork from "@/public/img/artist-at-work.webp";
import liveCards from "@/public/img/live-cards.webp";
import logoMark from "@/public/img/logo.webp";
import {
  INSTAGRAM_URL,
  SOCIAL_HANDLE,
  TIKTOK_URL,
  PACKAGE_INCLUDES,
  PACKAGES,
  SERVICES,
  STEPS,
} from "@/lib/content";
import { EnquiryForm } from "./EnquiryForm";
import { Gallery } from "./Gallery";
import { Instagram, Sparkle, Tiara, TikTok } from "./Icons";

function SectionHead({ eyebrow, title, id }: { eyebrow: string; title: string; id: string }) {
  return (
    <header className="section-head reveal">
      <p className="eyebrow">{eyebrow}</p>
      <h2 className="script-title" id={id}>
        {title}
      </h2>
    </header>
  );
}

/* Hero: blush band + lace, as in the original Canva slide */
export function Hero() {
  return (
    <section className="hero" id="top" aria-labelledby="hero-title">
      <div className="hero__lace" aria-hidden="true" />
      <h1 className="hero__title" id="hero-title">
        <span className="hero__word hero__word--left">Studio</span>
        <span className="hero__word hero__word--right">Dahlia</span>
      </h1>
      <div className="hero__figure">
        {/* Served as-is: the lossless cut-out is smaller than any resized copy
            and re-encoding smears the glitter */}
        <Image
          className="hero__couple"
          src={couple}
          preload
          unoptimized
          alt="Hand-painted illustration of a bride in a shimmering white gown and hijab holding a bouquet, beside a groom in an embroidered baju melayu."
        />
        <Sparkle className="sparkle s1" />
        <Sparkle className="sparkle s2" />
        <Sparkle className="sparkle s3" />
        <Sparkle className="sparkle s4" />
      </div>
    </section>
  );
}

export function Intro() {
  return (
    <section className="intro">
      <p className="eyebrow">Live Wedding &amp; Event Illustration &middot; Singapore</p>
      <p className="intro__lede">
        Hand-painted portraits of your guests, created live at your celebration&thinsp;&mdash;&thinsp;a keepsake for
        everyone who came to celebrate with you.
      </p>
      <div className="intro__actions">
        <a className="btn btn--solid" href="#enquire">
          Check your date
        </a>
        <a className="btn btn--ghost" href="#portfolio">
          View the portfolio
        </a>
      </div>
    </section>
  );
}

export function Studio() {
  return (
    <section className="studio section" id="studio" aria-labelledby="studio-title">
      <div className="studio__media reveal">
        <figure className="studio__photo">
          <Image
            quality={90}
            src={artistAtWork}
            placeholder="blur"
            sizes="(max-width: 960px) 80vw, 420px"
            alt="The illustrator painting a guest portrait at her table during a wedding reception, with finished cards displayed on small easels."
          />
        </figure>
        <figure className="studio__card">
          <Image
            quality={90}
            src={liveCards}
            placeholder="blur"
            sizes="220px"
            alt="Seven finished guest illustrations on watercolour cards, each lettered with the guest's name."
          />
        </figure>
      </div>
      <div className="studio__copy reveal">
        <p className="eyebrow">The Studio</p>
        <h2 className="script-title" id="studio-title">
          Little keepsakes, painted live
        </h2>
        <p>
          Studio Dahlia is a live wedding and event fashion illustrator based in Singapore. While your celebration
          unfolds, each guest is painted by hand&thinsp;&mdash;&thinsp;their outfit, their colours, the little
          details&thinsp;&mdash;&thinsp;on premium A6 watercolour paper, finished with a touch of shimmer.
        </p>
        <p>
          It becomes a quiet corner of the evening where guests gather to watch, and leave holding something
          they&rsquo;ll keep long after the flowers fade.
        </p>
        <ul className="studio__notes">
          <li>
            <span>By hand</span> watercolour &amp; ink
          </li>
          <li>
            <span>A6</span> premium watercolour paper
          </li>
          <li>
            <span>Live</span> at your venue
          </li>
        </ul>
      </div>
    </section>
  );
}

export function Services() {
  return (
    <section className="services section" id="services" aria-labelledby="services-title">
      <SectionHead eyebrow="What we paint" title="Services" id="services-title" />
      <div className="services__grid">
        {SERVICES.map((service) => (
          <article className="service reveal" key={service.title}>
            <figure className="service__photo">
              <Image
                quality={90}
                src={service.image}
                alt={service.alt}
                placeholder="blur"
                sizes="(max-width: 960px) 320px, 30vw"
                style={service.position ? { objectPosition: service.position } : undefined}
              />
            </figure>
            <h3 className="service__title">{service.title}</h3>
            <p>{service.body}</p>
            <a className="text-link" href={service.cta.href} data-package={service.cta.package}>
              {service.cta.label}
            </a>
          </article>
        ))}
      </div>
    </section>
  );
}

export function Packages() {
  return (
    <section className="packages section" id="packages" aria-labelledby="packages-title">
      <div className="packages__bg" aria-hidden="true" />
      <SectionHead eyebrow="Packages" title="Live Illustration" id="packages-title" />
      <div className="packages__grid">
        {PACKAGES.map((pkg, i) => (
          <article className={`package package--tier-${i + 1} reveal${pkg.featured ? " package--premium" : ""}`} key={pkg.name}>
            {pkg.featured ? <Tiara className="package__tiara" /> : null}
            <h3 className="package__name">{pkg.name}</h3>
            <p className="package__hours">
              <span>{pkg.hours}</span> hours
            </p>
            <ul className="package__list">
              {PACKAGE_INCLUDES.map((line) => (
                <li key={line}>{line}</li>
              ))}
              {pkg.bonus ? <li className="package__bonus">{pkg.bonus}</li> : null}
            </ul>
            <p className="package__price">{pkg.price}</p>
            <a className={`btn ${pkg.featured ? "btn--solid" : "btn--ghost"}`} href="#enquire" data-package={pkg.value}>
              Enquire
            </a>
          </article>
        ))}
      </div>
      <p className="packages__note reveal">Personal commissions and brand collaborations are quoted individually.</p>
    </section>
  );
}

export function Portfolio() {
  return (
    <section className="portfolio section" id="portfolio" aria-labelledby="portfolio-title">
      <SectionHead eyebrow="Portfolio" title="From the studio" id="portfolio-title" />
      <Gallery />
    </section>
  );
}

export function Process() {
  return (
    <section className="process section" id="process" aria-labelledby="process-title">
      <SectionHead eyebrow="How it works" title="From hello to keepsake" id="process-title" />
      <ol className="process__steps">
        {STEPS.map((step) => (
          <li className="reveal" key={step.num}>
            <span className="process__num">{step.num}</span>
            <h3>{step.title}</h3>
            <p>{step.body}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

export function Enquire() {
  return (
    <section className="enquire" id="enquire" aria-labelledby="enquire-title">
      <div className="enquire__card reveal">
        <p className="eyebrow">Enquire</p>
        <h2 className="script-title" id="enquire-title">
          Let&rsquo;s paint your day
        </h2>
        <p className="enquire__intro">
          Leave your email address and a few details about your celebration, and we&rsquo;ll get back to you.
        </p>
        <EnquiryForm />
      </div>
    </section>
  );
}

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <Image quality={90} src={logoMark} alt="" className="site-footer__mark" sizes="140px" />
      <p className="site-footer__name">Studio Dahlia</p>
      <p className="site-footer__tag">Live wedding &amp; event illustration &middot; Singapore</p>
      <p className="site-footer__social">
        <a href={INSTAGRAM_URL} target="_blank" rel="noopener" aria-label={`Instagram ${SOCIAL_HANDLE}`}>
          <Instagram />
          {SOCIAL_HANDLE}
        </a>
        <span className="site-footer__divider" aria-hidden="true">
          |
        </span>
        <a href={TIKTOK_URL} target="_blank" rel="noopener" aria-label={`TikTok ${SOCIAL_HANDLE}`}>
          <TikTok />
          {SOCIAL_HANDLE}
        </a>
      </p>
      <p className="site-footer__legal">
        &copy; {new Date().getFullYear()} Studio Dahlia. All illustrations hand-painted.
      </p>
    </footer>
  );
}
