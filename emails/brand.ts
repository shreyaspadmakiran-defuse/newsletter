/**
 * Brand tokens. Change these values and every email and the subscribe page
 * follow. Colors and logo come from docs.near-intents.org (Mintlify).
 */
export const brand = {
  name: "NEAR Intents",

  // Logo from the docs CDN. This is an SVG, which renders in browser previews
  // but not in Gmail or Outlook. Swap in a hosted PNG before real sends.
  logoUrl:
    "https://mintcdn.com/defuselabsltd/H7BXykL_JPKw4xWb/images/logo/light.svg?fit=max&auto=format&n=H7BXykL_JPKw4xWb&q=85&s=e31b086fb76c5f6228ea4020afc8db58",
  logoWidth: 150,

  siteUrl: "https://near-intents.org",
  docsUrl: "https://docs.near-intents.org",

  colors: {
    bg: "#f4f4f5", // page background behind the email card
    card: "#ffffff", // email body card
    text: "#18181b", // primary text
    muted: "#71717a", // secondary text
    border: "#e7e5e4",
    brand: "#fb4d01", // primary accent / buttons (NEAR Intents orange)
    brandText: "#ffffff", // text on top of the brand color
    tintBg: "#fff4ef", // soft orange tint for the highlights card
    tintBorder: "#ffd9c7",
  },

  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",

  footer: {
    company: "NEAR Intents",
  },
} as const;

export type Brand = typeof brand;
