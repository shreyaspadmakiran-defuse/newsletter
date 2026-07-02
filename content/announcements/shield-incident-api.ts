import { defineAnnouncement } from "../types";

export default defineAnnouncement({
  slug: "shield-incident-api",
  label: "New · Security",
  title: "The SHIELD Incident API is live",
  preview: "See ongoing incidents in real time, and report your own.",
  summary: [
    "The SHIELD Incident API is now available. It reports any ongoing incident in real time, pulling directly from our internal circuit breakers and SHIELD.",
    "A GET request returns either `operational` or the current list of active incidents, each scoped to an affected chain, bridge, token, or address. You can also POST an incident from your own systems. While an incident is active, SHIELD halts evaluation for the matching scope.",
    "Requests authenticate with a JWT from the SHIELD partner portal. The same information is available in the partner console if you would rather not integrate the API.",
  ],
  highlights: [
    "Pull active incidents in real time from one endpoint",
    "Report incidents from your own systems, scoped to a chain, bridge, token, or address",
    "Backed by our circuit breakers and SHIELD: active incidents halt evaluation for the affected scope",
    "JWT authentication with separate read and write permissions",
  ],
  changelogUrl: "https://docs.near-intents.org/security-compliance/shield-incident-api",
  cta: "Read the docs",
});
