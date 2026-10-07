/**
 * Email wording. Plain, short, transactional. Each template returns a subject,
 * a plain-text body and a simple HTML body (styled inline, no images, no tracking).
 */

export type EmailTemplate =
  | { template: "verify-story"; data: { name: string; songTitle: string; link: string } }
  | { template: "story-published"; data: { name: string; songTitle: string; storyLink: string; manageLink: string } }
  | { template: "story-rejected"; data: { name: string; songTitle: string; reason: string | null } }
  | { template: "manage-links"; data: { links: { songTitle: string; manageLink: string }[] } }
  | { template: "story-removed"; data: { songTitle: string } }
  | { template: "admin-new-stories"; data: { count: number; adminLink: string } }
  | { template: "admin-new-report"; data: { songTitle: string; reason: string; adminLink: string; autoHidden: boolean } }
  | { template: "admin-edit-request"; data: { songTitle: string; adminLink: string } };

const SITE = "Beyond Listening";

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

function html(paragraphs: string[], button?: { label: string; href: string }) {
  const body = paragraphs.map((p) => `<p style="margin:0 0 16px">${esc(p)}</p>`).join("");
  const cta = button
    ? `<p style="margin:24px 0"><a href="${esc(button.href)}" style="background:#a8432a;color:#fff;padding:12px 20px;border-radius:999px;text-decoration:none;display:inline-block">${esc(button.label)}</a></p><p style="margin:0 0 16px;font-size:13px;color:#666">Or copy this link: ${esc(button.href)}</p>`
    : "";
  return `<!doctype html><html><body style="font-family:Georgia,serif;font-size:16px;line-height:1.5;color:#2a2420;max-width:560px;margin:0 auto;padding:24px">${body}${cta}<p style="margin-top:32px;font-size:13px;color:#666">${SITE}</p></body></html>`;
}

function text(paragraphs: string[], button?: { label: string; href: string }) {
  return [...paragraphs, ...(button ? [`${button.label}: ${button.href}`] : []), "", SITE].join("\n\n");
}

export function renderEmail(e: EmailTemplate): { subject: string; text: string; html: string } {
  let subject: string;
  let paragraphs: string[];
  let button: { label: string; href: string } | undefined;

  switch (e.template) {
    case "verify-story":
      subject = "Please confirm your story";
      paragraphs = [
        `Hi ${e.data.name},`,
        `Thank you for sharing your story about “${e.data.songTitle}”. Please confirm your email address so we can review it.`,
        "This link works for 72 hours. If you didn't submit a story, you can ignore this email and nothing will be published.",
      ];
      button = { label: "Confirm my story", href: e.data.link };
      break;
    case "story-published":
      subject = "Your story is live";
      paragraphs = [
        `Hi ${e.data.name},`,
        `Your story about “${e.data.songTitle}” is now part of the archive.`,
        `You can edit it or remove it at any time with your private link (keep this email, and don't share the link): ${e.data.manageLink}`,
      ];
      button = { label: "Read your story", href: e.data.storyLink };
      break;
    case "story-rejected":
      subject = "About your story";
      paragraphs = [
        `Hi ${e.data.name},`,
        `Thank you for sharing your story about “${e.data.songTitle}”. We decided not to publish it.`,
        ...(e.data.reason ? [`Our note: ${e.data.reason}`] : []),
        "Your story and your email address will be deleted from our records within 30 days.",
      ];
      break;
    case "manage-links":
      subject = "Your private links";
      paragraphs = [
        "Here are the private links for the stories you shared. Each one lets you edit or remove that story.",
        ...e.data.links.map((l) => `“${l.songTitle}”: ${l.manageLink}`),
        "If you didn't ask for this email, you can ignore it.",
      ];
      break;
    case "story-removed":
      subject = "Your story has been removed";
      paragraphs = [
        `As you asked, your story about “${e.data.songTitle}” and any recording have been permanently deleted.`,
        "Copies in our encrypted backups disappear automatically within 30 days.",
      ];
      break;
    case "admin-new-stories":
      subject = `${e.data.count} ${e.data.count === 1 ? "story is" : "stories are"} waiting for review`;
      paragraphs = ["New stories have been confirmed by their authors and are waiting for you."];
      button = { label: "Open the review queue", href: e.data.adminLink };
      break;
    case "admin-new-report":
      subject = e.data.autoHidden ? "A story was hidden after several reports" : "A story was reported";
      paragraphs = [
        `A visitor reported the story about “${e.data.songTitle}” (reason: ${e.data.reason}).`,
        ...(e.data.autoHidden ? ["It received several reports, so it has been hidden until you review it."] : []),
      ];
      button = { label: "Review reports", href: e.data.adminLink };
      break;
    case "admin-edit-request":
      subject = "A contributor edited their story";
      paragraphs = [`The author of the story about “${e.data.songTitle}” sent an edit. The current version stays online until you approve it.`];
      button = { label: "Review the edit", href: e.data.adminLink };
      break;
  }
  return { subject, text: text(paragraphs, button), html: html(paragraphs, button) };
}
