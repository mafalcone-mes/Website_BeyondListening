/** Every limit in one place (shared by forms and server validation). */
export const LIMITS = {
  storyText: 5000,
  transcript: 15000,
  title: 120,
  pseudonym: 60,
  placeNote: 200,
  maxTags: 3,
  audioSeconds: 300,
  audioBytes: 20 * 1024 * 1024,
  verificationHours: 72,
  submissionsPerDayPerVisitor: 5,
  submissionsPerDayPerEmail: 3,
} as const;
