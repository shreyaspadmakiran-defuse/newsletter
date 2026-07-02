import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";
import { brand } from "./brand";
import type { Announcement } from "../content/types";

/**
 * The one branded email template. Resend injects the unsubscribe link into
 * broadcasts automatically, so we don't render one here.
 */
export function AnnouncementEmail({ announcement }: { announcement: Announcement }) {
  const { colors, fontFamily } = brand;
  const cta = announcement.cta ?? "Read the full changelog";

  return (
    <Html>
      <Head />
      <Preview>{announcement.preview}</Preview>
      <Body style={{ backgroundColor: colors.bg, fontFamily, margin: 0, padding: "24px 0" }}>
        <Container
          style={{
            backgroundColor: colors.card,
            border: `1px solid ${colors.border}`,
            borderRadius: 12,
            maxWidth: 560,
            margin: "0 auto",
            overflow: "hidden",
          }}
        >
          {/* Header */}
          <Section style={{ padding: "28px 32px 8px" }}>
            <Link href={brand.siteUrl}>
              <Img
                src={brand.logoUrl}
                width={brand.logoWidth}
                alt={brand.name}
                style={{ display: "block" }}
              />
            </Link>
          </Section>

          {/* Body */}
          <Section style={{ padding: "8px 32px 4px" }}>
            <Heading
              as="h1"
              style={{ color: colors.text, fontSize: 24, lineHeight: 1.25, margin: "16px 0 8px" }}
            >
              {announcement.title}
            </Heading>

            {announcement.summary
              .filter((p) => p.trim().length > 0)
              .map((paragraph, i) => (
                <Text
                  key={i}
                  style={{ color: colors.text, fontSize: 16, lineHeight: 1.6, margin: "0 0 14px" }}
                >
                  {paragraph}
                </Text>
              ))}

            {announcement.highlights && announcement.highlights.length > 0 && (
              <ul style={{ margin: "4px 0 18px", paddingLeft: 20 }}>
                {announcement.highlights.map((h, i) => (
                  <li
                    key={i}
                    style={{ color: colors.text, fontSize: 16, lineHeight: 1.6, marginBottom: 6 }}
                  >
                    {h}
                  </li>
                ))}
              </ul>
            )}
          </Section>

          {/* CTA */}
          <Section style={{ padding: "4px 32px 28px" }}>
            <Link
              href={announcement.changelogUrl}
              style={{
                backgroundColor: colors.brand,
                borderRadius: 8,
                color: colors.brandText,
                display: "inline-block",
                fontSize: 15,
                fontWeight: 600,
                padding: "12px 22px",
                textDecoration: "none",
              }}
            >
              {cta} →
            </Link>
          </Section>

          <Hr style={{ borderColor: colors.border, margin: 0 }} />

          {/* Footer */}
          <Section style={{ padding: "20px 32px 28px" }}>
            <Text style={{ color: colors.muted, fontSize: 12, lineHeight: 1.6, margin: 0 }}>
              You’re receiving this because you subscribed to {brand.footer.company} product
              updates.
              {brand.footer.address ? ` ${brand.footer.address}.` : ""}
            </Text>
            <Text style={{ color: colors.muted, fontSize: 12, lineHeight: 1.6, margin: "8px 0 0" }}>
              <Link href={brand.siteUrl} style={{ color: colors.muted }}>
                {brand.siteUrl.replace(/^https?:\/\//, "")}
              </Link>
              {"  •  "}
              {/* Resend replaces {{{RESEND_UNSUBSCRIBE_URL}}} in broadcasts. */}
              <Link href="{{{RESEND_UNSUBSCRIBE_URL}}}" style={{ color: colors.muted }}>
                Unsubscribe
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export default AnnouncementEmail;
