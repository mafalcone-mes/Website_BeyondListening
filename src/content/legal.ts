/**
 * Legal texts — DRAFTS for the local prototype.
 * Structure adapted from open templates (Automattic "legalmattic", CC BY-SA 4.0;
 * Basecamp policies, CC BY 4.0). Must be completed (controller name, contact
 * address, processors) and ideally reviewed before the site goes online.
 * Changing a text? Bump its version: contributors' consent records store it.
 */

export interface LegalDoc {
  title: string;
  version: string;
  updated: string;
  intro: string;
  sections: { heading: string; paragraphs: string[] }[];
  attribution?: string;
}

export const CONSENT_VERSION = "2026-10-01";

export const consentTexts = {
  publication: "I agree that my story, my pseudonym and the song I chose will be published publicly on Beyond Listening.",
  license:
    "I keep all rights to my story. I grant Beyond Listening a non-exclusive, worldwide, royalty-free, revocable licence to host, store, reproduce, display, transcribe and play my story on its website, for as long as it is published there.",
  voice: "I agree that my voice recording will be published and playable by anyone. I understand my voice may be recognisable.",
  promotion: "Optional: Beyond Listening may also feature my story in its own social media posts and newsletter.",
  age: "I am 16 or older.",
  privacy: "I have read the Privacy Policy.",
  others: "My story doesn't include private details about other people without their permission.",
};

const ATTRIBUTION =
  "Parts of this text are adapted from Automattic's legal documents (CC BY-SA 4.0) and Basecamp's policies (CC BY 4.0).";

export const privacy: LegalDoc = {
  title: "Privacy Policy",
  version: CONSENT_VERSION,
  updated: "1 October 2026",
  intro:
    "Beyond Listening collects as little personal data as possible. This page explains what we collect, why, and what you can do about it. [DRAFT: complete the controller details before going online.]",
  sections: [
    {
      heading: "Who is responsible",
      paragraphs: [
        "The data controller is [OWNER NAME], [CITY], Italy. Contact: [CONTACT EMAIL].",
        "You can complain to the Italian data protection authority (Garante per la protezione dei dati personali, garanteprivacy.it).",
      ],
    },
    {
      heading: "What we collect when you share a story",
      paragraphs: [
        "Your story (text and/or voice recording, and its transcript), the song, your pseudonym, optional theme tags and a short 'where/when' note. These are published if you agree and we approve the story.",
        "Your email address. It is never published. We use it only to confirm your submission, tell you when your story is published, and send you your private link to edit or remove it.",
        "A record of your consent (which boxes you ticked, when, and which version of these texts you saw).",
        "Legal basis: your consent (GDPR art. 6(1)(a)). You can withdraw it at any time with your private link.",
      ],
    },
    {
      heading: "Voice recordings",
      paragraphs: [
        "If you record your story, your voice may be recognisable to people who know you. Recordings are stored privately and played only through short-lived links. We don't use recordings to identify anyone.",
        "Speech-to-text runs inside your own browser: your recording is not sent to any transcription service.",
      ],
    },
    {
      heading: "What we collect when you visit",
      paragraphs: [
        "We don't use analytics, advertising or tracking cookies.",
        "To prevent abuse (spam, fake reactions), we store a one-way, salted hash of your IP address for up to 30 days. The salt changes every day and is deleted after two days, so the hash cannot be linked back to you. Legal basis: legitimate interest (art. 6(1)(f)).",
        "Your browser stores which reaction you chose (local storage), so you can change it. Admin login uses a strictly necessary cookie. No consent banner is needed for these.",
      ],
    },
    {
      heading: "Services that see some data",
      paragraphs: [
        "Song search and 30-second previews come from Deezer and Apple (iTunes). When you search or play a preview, your browser or our server contacts them, as with any website that embeds media.",
        "Speech-to-text model files are downloaded once from Hugging Face.",
        "[DRAFT: when going online, list the hosting, database and email providers here, with their locations and safeguards.]",
      ],
    },
    {
      heading: "How long we keep data",
      paragraphs: [
        "Unconfirmed submissions: 72 hours. Rejected stories: 30 days. Published stories: until you remove them. Your email: until you remove your story or delete your email with your private link. IP hashes: 30 days. Backups: 30 days.",
      ],
    },
    {
      heading: "Your rights",
      paragraphs: [
        "You can access, correct, export or delete your data. The quickest way is your private link (Manage my story). For anything else, write to [CONTACT EMAIL]. We answer within 30 days.",
      ],
    },
  ],
  attribution: ATTRIBUTION,
};

export const terms: LegalDoc = {
  title: "Terms of Use",
  version: CONSENT_VERSION,
  updated: "1 October 2026",
  intro: "Beyond Listening is a small, independent archive of personal stories about songs. By using it you agree to these terms. [DRAFT]",
  sections: [
    {
      heading: "Sharing a story",
      paragraphs: [
        "Share only your own story, in your own words. You must be 16 or older.",
        "Don't include private details about other people (full names, addresses, health information…) without their permission.",
        "Quoting a line or two of lyrics is fine; don't paste whole songs.",
        "No hate, harassment, threats, spam or advertising.",
      ],
    },
    {
      heading: "Moderation",
      paragraphs: [
        "Every story is reviewed before it's published. We may decline, shorten tags, or remove a story at any time, especially after a report. We'll tell you if we remove your story.",
      ],
    },
    {
      heading: "Music",
      paragraphs: [
        "We don't host songs. Previews are provided by Deezer and Apple Music; links lead to the full songs on their platforms. All music belongs to its rights holders.",
      ],
    },
    {
      heading: "No warranty",
      paragraphs: [
        "The archive is provided as is, by volunteers. We do our best to keep it online and safe, but can't guarantee it. These terms are governed by Italian law; nothing here limits your rights as a consumer.",
      ],
    },
  ],
  attribution: ATTRIBUTION,
};

export const license: LegalDoc = {
  title: "Story licence",
  version: CONSENT_VERSION,
  updated: "1 October 2026",
  intro: "Your story stays yours. Here is exactly what you allow us to do with it.",
  sections: [
    {
      heading: "You keep your rights",
      paragraphs: [
        "All rights in your story (text, recording and transcript) remain yours. Stories on this site are not free to reuse: please don't copy them elsewhere without asking their authors.",
      ],
    },
    {
      heading: "What you allow us to do",
      paragraphs: [
        "You grant Beyond Listening a non-exclusive, worldwide, royalty-free, revocable licence to host, store, reproduce, display, transcribe and play your story on the Beyond Listening website, for as long as it is published there.",
        "Only if you ticked the optional box: we may also feature your story in Beyond Listening's own social media posts and newsletter.",
      ],
    },
    {
      heading: "Taking it back",
      paragraphs: [
        "You can withdraw this licence at any time with your private link. We then delete your story and recording from the site immediately, and from our backups within 30 days. We can't recall copies other people may have made outside our site.",
      ],
    },
  ],
};
