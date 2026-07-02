/**
 * Brand tokens — the single place to drop in your brand assets.
 * Swap these values (colors, logo URL, fonts, footer text) and every email
 * + the subscribe page update to match. No other file needs to change.
 */
export const brand = {
  name: "NEAR Intents",
  // Absolute URL to a hosted logo (emails can't use local/relative paths).
  // Drop your logo somewhere public (or /public in this app) and point here.
  logoUrl: "https://near-intents.org/logo.png",
  logoWidth: 140,

  // Link the logo + footer back to your site.
  siteUrl: "https://near-intents.org",

  colors: {
    bg: "#f4f4f5", // page background behind the email card
    card: "#ffffff", // email body card
    text: "#18181b", // primary text
    muted: "#71717a", // secondary text
    border: "#e4e4e7",
    brand: "#00ec97", // primary accent / buttons (NEAR green — replace as needed)
    brandText: "#0b3b2e", // text that sits on top of the brand color
  },

  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",

  // Shown in the footer of every email.
  footer: {
    company: "NEAR Intents",
    address: "", // physical mailing address — recommended for deliverability/CAN-SPAM
  },
} as const;

export type Brand = typeof brand;
