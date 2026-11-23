import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

const STAGING_HOST = /\.(up\.railway\.app|railway\.app|vercel\.app)$/i;

export default function robots(): MetadataRoute.Robots {
  // Temporary platform domain: keep the whole site out of search until the real domain is live.
  if (STAGING_HOST.test(new URL(SITE_URL).hostname)) {
    return { rules: [{ userAgent: "*", disallow: "/" }] };
  }
  const disallow = ["/admin", "/api/", "/cart", "/checkout", "/account", "/orders/", "/track", "/shop?q=", "/*?*q="];
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow },
      // AI search and answer engines (GEO): explicitly welcome so the store can be cited in AI answers.
      {
        userAgent: [
          "GPTBot",
          "OAI-SearchBot",
          "ChatGPT-User",
          "ClaudeBot",
          "Claude-SearchBot",
          "Claude-User",
          "PerplexityBot",
          "Perplexity-User",
          "Google-Extended",
          "Applebot-Extended",
          "Bingbot",
          "CCBot",
        ],
        allow: "/",
        disallow,
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
