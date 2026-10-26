import { PageEffects } from "@/components/PageEffects";
import { SiteHeader } from "@/components/SiteHeader";
import {
  Enquire,
  Hero,
  Intro,
  Packages,
  Portfolio,
  Process,
  Services,
  SiteFooter,
  Studio,
} from "@/components/Sections";

export default function Home() {
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <SiteHeader />
      <main id="main">
        <Hero />
        <Intro />
        <Studio />
        <Services />
        <Packages />
        <Portfolio />
        <Process />
        <Enquire />
      </main>
      <SiteFooter />
      <PageEffects />
    </>
  );
}
