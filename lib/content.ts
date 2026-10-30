import type { StaticImageData } from "next/image";

import liveCards from "@/public/img/live-cards.webp";
import isaacZakirah from "@/public/img/isaac-zakirah.webp";
import mAndA from "@/public/img/m-and-a.webp";
import cheongsam from "@/public/img/cheongsam.webp";
import oosPattern from "@/public/img/oos-pattern.webp";
import oosMenu from "@/public/img/oos-menu.webp";
import lehenga from "@/public/img/lehenga.webp";
import friends from "@/public/img/friends.webp";
import kebayaCouple from "@/public/img/kebaya-couple.webp";

// Same handle on both platforms
export const SOCIAL_HANDLE = "@_studio.dahlia_";
export const INSTAGRAM_URL = "https://www.instagram.com/_studio.dahlia_";
export const TIKTOK_URL = "https://www.tiktok.com/@_studio.dahlia_";

export const NAV_LINKS = [
  { href: "#studio", label: "The Studio" },
  { href: "#services", label: "Services" },
  { href: "#packages", label: "Packages" },
  { href: "#portfolio", label: "Portfolio" },
] as const;

export type Service = {
  title: string;
  body: string;
  cta: { label: string; href: string; package?: string };
  image: StaticImageData;
  alt: string;
  position?: string;
};

export const SERVICES: Service[] = [
  {
    title: "Live Illustration",
    body: "Your guests, painted one by one during your wedding or event, to take home on the night.",
    cta: { label: "See packages", href: "#packages" },
    image: liveCards,
    alt: "Guest illustrations from a live event, each card lettered with a name.",
  },
  {
    title: "Personal Commission",
    body: "A portrait of the two of you, your family or your friends, painted from your favourite photo.",
    cta: { label: "Request a commission", href: "#enquire", package: "Personal commission" },
    image: kebayaCouple,
    alt: "Commissioned illustration of a couple in a green batik shirt and a pink kebaya.",
    position: "50% 78%",
  },
  {
    title: "Brand Illustration",
    body: "Illustrated menus, patterns and collateral for brands that want something made by hand.",
    cta: { label: "Start a collaboration", href: "#enquire", package: "Brand collaboration" },
    image: oosMenu,
    alt: "Hand-lettered illustrated menu for the café OOS, with painted bakes and drinks.",
    position: "50% 0%",
  },
];

export type Package = {
  name: string;
  hours: number;
  price: string;
  value: string;
  bonus?: string;
  featured?: boolean;
};

export const PACKAGE_INCLUDES = ["Live guest illustrations", "Hand-painted on premium A6 watercolour paper"];

export const PACKAGES: Package[] = [
  { name: "Classic", hours: 2, price: "$700", value: "Classic (2 hours)" },
  { name: "Signature", hours: 4, price: "$1,400", value: "Signature (4 hours)" },
  {
    name: "Premium",
    hours: 7,
    price: "$2,000",
    value: "Premium (7 hours)",
    bonus: "Complimentary wedding couple illustration",
    featured: true,
  },
];

export const ENQUIRY_OPTIONS = [
  ...PACKAGES.map((p) => p.value),
  "Personal commission",
  "Brand collaboration",
  "Not sure yet",
];

export const OCCASIONS = ["Wedding", "Engagement", "Birthday or private party", "Corporate event", "Other"];

export type GalleryCategory = "couples" | "guests" | "brand";

export type GalleryItem = {
  title: string;
  kind: string;
  category: GalleryCategory;
  image: StaticImageData;
  alt: string;
};

export const GALLERY_FILTERS: { value: GalleryCategory | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "couples", label: "Couples" },
  { value: "guests", label: "Guests" },
  { value: "brand", label: "Brand" },
];

export const GALLERY: GalleryItem[] = [
  {
    title: "Isaac & Zakirah",
    kind: "Wedding keepsake",
    category: "couples",
    image: isaacZakirah,
    alt: "Isaac and Zakirah: a bride in a white gown and hijab and a groom in white, framed by painted lilies and vines.",
  },
  {
    title: "Blue Cheongsam",
    kind: "Live guest illustration",
    category: "guests",
    image: cheongsam,
    alt: "A guest in a shimmering blue cheongsam, holding a beaded bag.",
  },
  {
    title: "Studio Dahlia × OOS",
    kind: "Illustrated menu",
    category: "brand",
    image: oosMenu,
    alt: "Hand-lettered menu for OOS listing bakes and guava drinks, each with a small painting.",
  },
  {
    title: "Batik & Kebaya",
    kind: "Personal commission",
    category: "couples",
    image: kebayaCouple,
    alt: "A couple holding hands, in a green floral batik shirt and a pink kebaya with a green batik sarong.",
  },
  {
    title: "Saffron Lehenga",
    kind: "Live guest illustration",
    category: "guests",
    image: lehenga,
    alt: "A guest in an orange lehenga with a gold-netted dupatta and statement earrings.",
  },
  {
    title: "M & A",
    kind: "Personal commission",
    category: "couples",
    image: mAndA,
    alt: "M and A: a couple sitting close, his head resting on hers, under their initials and a glitter heart.",
  },
  {
    title: "OOS Pattern",
    kind: "Brand illustration",
    category: "brand",
    image: oosPattern,
    alt: "A repeating pattern of painted brownies, cheesecake slices and drinks for OOS.",
  },
  {
    title: "Three Friends",
    kind: "Event illustration",
    category: "guests",
    image: friends,
    alt: "Three friends leaning in together, one holding a matcha drink and another a slice of cake.",
  },
];

export const STEPS = [
  { num: "I", title: "Say hello", body: "Send a message with your date, venue and the package you have in mind." },
  { num: "II", title: "Reserve your date", body: "We confirm availability and the details of your celebration together." },
  { num: "III", title: "Painted on the day", body: "Your guests are illustrated live, and take their portrait home that night." },
];
