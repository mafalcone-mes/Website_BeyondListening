import { z } from "zod";
import { LIMITS } from "@/config/limits";

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => (v ? v : null));

/** Shared by the submission form (client) and the server action. */
export const submissionSchema = z
  .object({
    songId: z.uuid(),
    format: z.enum(["text", "audio", "text_audio"]),
    bodyText: optionalText(LIMITS.storyText),
    transcript: optionalText(LIMITS.transcript),
    transcriptReviewed: z.boolean().default(false),
    audio: z
      .object({
        mime: z.string().max(60),
        bytes: z.number().int().positive().max(LIMITS.audioBytes),
        durationS: z.number().int().min(1).max(LIMITS.audioSeconds + 10),
        peaks: z.array(z.number().min(0).max(1)).max(400),
      })
      .nullable(),
    title: optionalText(LIMITS.title),
    pseudonym: z.string().trim().min(1, "Please choose a name or pseudonym.").max(LIMITS.pseudonym),
    email: z.email("Please enter a valid email address.").max(254),
    placeNote: optionalText(LIMITS.placeNote),
    tagIds: z.array(z.uuid()).max(LIMITS.maxTags),
    consents: z.object({
      publication: z.literal(true),
      license: z.literal(true),
      privacy: z.literal(true),
      age: z.literal(true),
      others: z.literal(true),
      voice: z.boolean(),
      promotion: z.boolean(),
    }),
    altcha: z.string().min(1),
    website: z.string().max(0).optional(),
  })
  .superRefine((v, ctx) => {
    if (v.format !== "audio" && !v.bodyText) {
      ctx.addIssue({ code: "custom", path: ["bodyText"], message: "Please write your story." });
    }
    if (v.format !== "text" && !v.audio) {
      ctx.addIssue({ code: "custom", path: ["audio"], message: "Please record or upload your story." });
    }
    if (v.format !== "text" && !v.consents.voice) {
      ctx.addIssue({ code: "custom", path: ["consents", "voice"], message: "Please agree to publishing your voice." });
    }
  });

export type SubmissionInput = z.input<typeof submissionSchema>;
