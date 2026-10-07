export const REASONS = ["personal_info", "hateful", "spam", "copyright", "other"] as const;
export const REASON_LABELS: Record<(typeof REASONS)[number], string> = {
  personal_info: "It shares private information about someone",
  hateful: "It's hateful, abusive or harassing",
  spam: "It's spam or advertising",
  copyright: "It copies someone else's work",
  other: "Something else",
};
