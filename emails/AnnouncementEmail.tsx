import {
  Body,
  Column,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Row,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";
import { brand } from "./brand";
import type { Announcement } from "../content/types";

/**
 * The branded email template. `unsubscribeUrl` is set per recipient at send
 * time (see src/lib/send.ts); it defaults to "#" for previews.
 */
export function AnnouncementEmail({
  announcement,
  unsubscribeUrl = "#",
}: {
  announcement: Announcement;
  unsubscribeUrl?: string;
}) {
  const { colors, fontFamily } = brand;
  const cta = announcement.cta ?? "Read the full changelog";
  const highlights = announcement.highlights ?? [];

  return (
    <Html>
      <Head />
      <Preview>{announcement.preview}</Preview>
      <Body style={main}>
        <Container style={outer}>
          {/* Logo */}
          <Section style={{ padding: "4px 0 24px" }}>
            <Link href={brand.siteUrl}>
              <Img src={brand.logoUrl} width={brand.logoWidth} alt={brand.name} style={{ display: "block" }} />
            </Link>
          </Section>

          {/* Card */}
          <Section style={card}>
            {/* Accent bar */}
            <Section style={{ backgroundColor: colors.brand, height: 4, lineHeight: "4px" }}>&nbsp;</Section>

            <Section style={{ padding: "32px 32px 28px" }}>
              {announcement.label ? (
                <Text style={eyebrow}>{announcement.label.toUpperCase()}</Text>
              ) : null}

              <Heading as="h1" style={h1}>
                {announcement.title}
              </Heading>

              {announcement.summary
                .filter((p) => p.trim().length > 0)
                .map((paragraph, i) => (
                  <Text key={i} style={paragraphStyle}>
                    {paragraph}
                  </Text>
                ))}

              {highlights.length > 0 ? (
                <Section style={highlightCard}>
                  {highlights.map((h, i) => (
                    <Row key={i} style={{ marginBottom: i === highlights.length - 1 ? 0 : 10 }}>
                      <Column style={{ width: 22, verticalAlign: "top" }}>
                        <Text style={check}>✓</Text>
                      </Column>
                      <Column>
                        <Text style={highlightText}>{h}</Text>
                      </Column>
                    </Row>
                  ))}
                </Section>
              ) : null}

              {/* CTA */}
              <Section style={{ paddingTop: 26 }}>
                <Link href={announcement.changelogUrl} style={button}>
                  {cta}&nbsp;→
                </Link>
              </Section>
            </Section>
          </Section>

          {/* Footer */}
          <Section style={{ padding: "22px 8px 8px" }}>
            <Hr style={{ borderColor: colors.border, margin: "0 0 16px" }} />
            <Text style={footerText}>
              <Link href={brand.siteUrl} style={footerLink}>
                near-intents.org
              </Link>
              &nbsp;&nbsp;·&nbsp;&nbsp;
              <Link href={brand.docsUrl} style={footerLink}>
                Docs
              </Link>
              &nbsp;&nbsp;·&nbsp;&nbsp;
              {/* Per-recipient unsubscribe URL, injected by our backend at send time. */}
              <Link href={unsubscribeUrl} style={footerLink}>
                Unsubscribe
              </Link>
            </Text>
            <Text style={{ ...footerText, marginTop: 8 }}>© {brand.footer.company}</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export default AnnouncementEmail;

const { colors, fontFamily } = brand;

const main: React.CSSProperties = {
  backgroundColor: colors.bg,
  fontFamily,
  margin: 0,
  padding: "32px 0",
};

const outer: React.CSSProperties = {
  maxWidth: 560,
  margin: "0 auto",
  padding: "0 16px",
};

const card: React.CSSProperties = {
  backgroundColor: colors.card,
  border: `1px solid ${colors.border}`,
  borderRadius: 14,
  overflow: "hidden",
};

const eyebrow: React.CSSProperties = {
  color: colors.brand,
  fontSize: 12,
  fontWeight: 700,
  letterSpacing: "0.08em",
  margin: "0 0 10px",
};

const h1: React.CSSProperties = {
  color: colors.text,
  fontSize: 26,
  fontWeight: 700,
  lineHeight: 1.2,
  margin: "0 0 16px",
};

const paragraphStyle: React.CSSProperties = {
  color: colors.text,
  fontSize: 16,
  lineHeight: 1.65,
  margin: "0 0 14px",
};

const highlightCard: React.CSSProperties = {
  backgroundColor: colors.tintBg,
  border: `1px solid ${colors.tintBorder}`,
  borderRadius: 10,
  padding: "18px 20px",
  marginTop: 8,
};

const check: React.CSSProperties = {
  color: colors.brand,
  fontSize: 15,
  fontWeight: 700,
  lineHeight: "24px",
  margin: 0,
};

const highlightText: React.CSSProperties = {
  color: colors.text,
  fontSize: 15,
  lineHeight: 1.5,
  margin: 0,
};

const button: React.CSSProperties = {
  backgroundColor: colors.brand,
  borderRadius: 8,
  color: colors.brandText,
  display: "inline-block",
  fontSize: 15,
  fontWeight: 600,
  padding: "13px 24px",
  textDecoration: "none",
};

const footerText: React.CSSProperties = {
  color: colors.muted,
  fontSize: 12,
  lineHeight: 1.6,
  margin: 0,
  textAlign: "center" as const,
};

const footerLink: React.CSSProperties = {
  color: colors.muted,
  textDecoration: "underline",
};
