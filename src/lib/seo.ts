import type { CommerceSettings, StoreInfo } from "@/server/settings";
import { hoursFor, to12h } from "./hours";
import { storeMap } from "./maps";

export const SITE_URL = (process.env.APP_URL ?? "http://localhost:3000").replace(/\/$/, "");

export function abs(path: string) {
  if (/^https?:\/\//.test(path)) return path;
  return `${SITE_URL}${path.startsWith("/") ? "" : "/"}${path}`;
}

const DAY_MAP: Record<string, string> = {
  Monday: "Mo",
  Tuesday: "Tu",
  Wednesday: "We",
  Thursday: "Th",
  Friday: "Fr",
  Saturday: "Sa",
  Sunday: "Su",
};

export function localBusinessJsonLd(store: StoreInfo) {
  const sameAs = [store.facebook, store.instagram, store.youtube, store.tiktok, store.googleBusinessUrl].filter(Boolean);
  return {
    "@context": "https://schema.org",
    "@type": "Store",
    "@id": `${SITE_URL}/#store`,
    name: store.name,
    legalName: store.legalName,
    slogan: store.tagline,
    url: SITE_URL,
    logo: abs("/brand/icon-512.png"),
    image: abs("/brand/icon-512.png"),
    telephone: `+1-${store.phone.replace(/\D/g, "").replace(/(\d{3})(\d{3})(\d{4})/, "$1-$2-$3")}`,
    email: store.email,
    address: {
      "@type": "PostalAddress",
      ...(store.streetAddress ? { streetAddress: store.streetAddress } : {}),
      addressLocality: store.city,
      addressRegion: store.state,
      ...(store.zip ? { postalCode: store.zip } : {}),
      addressCountry: "US",
    },
    ...(store.hours.some((h) => h.open && h.close)
      ? {
          // the hours in force this season (Friday closes later in summer)
          openingHours: hoursFor(store.hours)
            .filter((h) => h.open && h.close)
            .map((h) => `${DAY_MAP[h.day] ?? h.day} ${h.open}-${h.close}`),
        }
      : {}),
    ...(sameAs.length ? { sameAs } : {}),
    hasMap: storeMap(store).directionsHref,
    areaServed: [
      { "@type": "City", name: store.city },
      { "@type": "AdministrativeArea", name: "Wake County, NC" },
      { "@type": "Country", name: "United States" },
    ],
    currenciesAccepted: "USD",
    paymentAccepted: "Credit Card, Debit Card",
  };
}

export function websiteJsonLd(store: StoreInfo) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    url: SITE_URL,
    name: store.name,
    inLanguage: "en-US",
    publisher: { "@id": `${SITE_URL}/#store` },
    potentialAction: {
      "@type": "SearchAction",
      target: { "@type": "EntryPoint", urlTemplate: `${SITE_URL}/shop?q={search_term_string}` },
      "query-input": "required name=search_term_string",
    },
  };
}

/** Return window shown in Product offers (matches Admin → Settings → returns window). */
export function returnPolicyJsonLd(commerce: Pick<CommerceSettings, "returnsWindowDays">) {
  return {
    "@type": "MerchantReturnPolicy",
    applicableCountry: "US",
    returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
    merchantReturnDays: commerce.returnsWindowDays,
    returnMethod: "https://schema.org/ReturnByMail",
    merchantReturnLink: abs("/policies/returns"),
  };
}

/** Plain-language answers about visiting the store, built only from the store's own settings. */
export function visitFaqs(store: StoreInfo, commerce: CommerceSettings): { q: string; a: string }[] {
  const address = [store.streetAddress, `${store.city}, ${store.state} ${store.zip}`.trim()].filter(Boolean).join(", ");
  const week = hoursFor(store.hours);
  const hoursText = week
    .map((d) => (d.open && d.close ? `${d.day} ${to12h(d.open, true)} to ${to12h(d.close, true)}` : `${d.day} closed`))
    .join("; ");
  const faqs = [
    {
      q: `Where is ${store.name} located?`,
      a: `${store.name} is at ${address}.${store.directionsNote ? ` ${store.directionsNote}.` : ""}`,
    },
    { q: `What are the opening hours of ${store.name}?`, a: `Our opening hours are: ${hoursText}. Times are Eastern Time.` },
    { q: `What is the phone number of ${store.name}?`, a: `You can call the store at ${store.phone} or email ${store.email}.` },
  ];
  if (commerce.pickupEnabled) {
    faqs.push({
      q: "Can I pick up an online order in the store?",
      a: `Yes. Choose in-store pickup at checkout and pick your order up in ${store.city}, ${store.state}. ${commerce.pickupInstructions}`,
    });
  }
  faqs.push({
    q: `Does ${store.name} ship across the United States?`,
    a: "Yes. We ship to all 50 U.S. states and DC. Delivery options and estimates are shown at checkout before you pay.",
  });
  return faqs;
}

export function faqJsonLd(faqs: { q: string; a: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };
}

export function organizationJsonLd(store: StoreInfo) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${SITE_URL}/#org`,
    name: store.name,
    url: SITE_URL,
    logo: abs("/brand/icon-512.png"),
    contactPoint: {
      "@type": "ContactPoint",
      telephone: `+1-${store.phone.replace(/\D/g, "")}`,
      contactType: "customer service",
      areaServed: "US",
      availableLanguage: "English",
    },
  };
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: abs(it.path),
    })),
  };
}
