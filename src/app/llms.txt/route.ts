import { listCategories } from "@/server/catalog";
import { getSettings } from "@/server/settings";
import { hoursFor, to12h } from "@/lib/hours";
import { SITE_URL } from "@/lib/seo";

const STAGING_HOST = /\.(up\.railway\.app|railway\.app|vercel\.app)$/i;

/**
 * /llms.txt: a plain-text summary of the store for AI search and answer engines (GEO).
 * Built from the live store settings and catalog, so it never goes out of date.
 */
export async function GET() {
  const [{ store, commerce }, cats] = await Promise.all([getSettings(["store", "commerce"]), listCategories()]);
  const address = [store.streetAddress, `${store.city}, ${store.state} ${store.zip}`.trim()].filter(Boolean).join(", ");
  const hours = hoursFor(store.hours)
    .map((d) => (d.open && d.close ? `${d.day}: ${to12h(d.open, true)} to ${to12h(d.close, true)}` : `${d.day}: closed`))
    .join("\n- ");

  const body = `# ${store.name}

> ${store.name} is a family-run hair and beauty supply store in ${store.city}, ${store.state}. We sell wigs, bundles, braiding hair, hair care and beauty essentials online with shipping across the United States, and in store${commerce.pickupEnabled ? " with free in-store pickup" : ""}.

## Store facts
- Address: ${address}${store.directionsNote ? ` (${store.directionsNote})` : ""}
- Phone: ${store.phone}
- Email: ${store.email}
- Website: ${SITE_URL}
- Currency: USD
- Shipping: all 50 U.S. states and DC
- Returns: unopened products in original packaging within ${commerce.returnsWindowDays} days; opened wigs, bundles and cosmetics cannot be resold
- Opening hours (Eastern Time):
- ${hours}

## Main pages
- [Shop all products](${SITE_URL}/shop): the full catalog with live stock
- [Visit the store](${SITE_URL}/visit): address, hours, map and directions
- [3D store tour](${SITE_URL}/tour): walk through the shop online
- [Shipping policy](${SITE_URL}/policies/shipping)
- [Returns policy](${SITE_URL}/policies/returns)
- [Privacy policy](${SITE_URL}/policies/privacy)
- [Terms](${SITE_URL}/policies/terms)

## Shop by category
${cats.map((c) => `- [${c.name}](${SITE_URL}/${c.slug})${c.description ? `: ${c.description}` : ""}`).join("\n")}
`;

  const headers: Record<string, string> = {
    "Content-Type": "text/plain; charset=utf-8",
    "Cache-Control": "public, max-age=3600",
  };
  if (STAGING_HOST.test(new URL(SITE_URL).hostname)) headers["X-Robots-Tag"] = "noindex, nofollow";
  return new Response(body, { headers });
}
