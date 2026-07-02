import { render } from "@react-email/render";
import { createElement } from "react";
import { AnnouncementEmail } from "../../emails/AnnouncementEmail";
import type { Announcement } from "../../content/types";

/** Render an announcement to an HTML string. `unsubscribeUrl` defaults to "#". */
export function renderAnnouncementHtml(
  announcement: Announcement,
  unsubscribeUrl = "#",
): Promise<string> {
  return render(createElement(AnnouncementEmail, { announcement, unsubscribeUrl }));
}

export function renderAnnouncementText(announcement: Announcement): Promise<string> {
  return render(createElement(AnnouncementEmail, { announcement }), { plainText: true });
}
