import { z } from "zod";
import {
  DISPLAY_NAME_PATTERN,
  sanitizePasswordInput,
  sanitizeTextInput,
} from "./sanitize";

const emailField = z
  .string()
  .max(254)
  .transform(sanitizeTextInput)
  .pipe(z.string().min(1).email());

const loginPasswordField = z
  .string()
  .max(128)
  .transform(sanitizePasswordInput)
  .pipe(z.string().min(1));

const signupPasswordField = z
  .string()
  .max(128)
  .transform(sanitizePasswordInput)
  .pipe(
    z
      .string()
      .min(8, "invalid")
      .max(128, "invalid")
      .regex(/[A-Za-z]/, "invalid")
      .regex(/[0-9]/, "invalid"),
  );

const usernameField = z
  .string()
  .max(50)
  .transform(sanitizeTextInput)
  .pipe(
    z
      .string()
      .min(2, "invalid")
      .max(50, "invalid")
      .regex(DISPLAY_NAME_PATTERN, "invalid"),
  );

const displayNameField = z
  .string()
  .max(80)
  .transform(sanitizeTextInput)
  .pipe(
    z
      .string()
      .min(2, "invalid")
      .max(80, "invalid")
      .regex(DISPLAY_NAME_PATTERN, "invalid"),
  );

const registrationRoleField = z.enum(["usa_client", "end_client"]);

export const loginBodySchema = z.object({
  email: emailField,
  password: loginPasswordField,
});

export const signupBodySchema = z
  .object({
    email: emailField,
    password: signupPasswordField,
    confirmPassword: z.string().max(128).transform(sanitizePasswordInput),
    username: usernameField,
    displayName: displayNameField.optional(),
    role: registrationRoleField,
  })
  .superRefine((data, ctx) => {
    if (data.password !== data.confirmPassword) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "invalid" });
    }
  });

export type LoginBody = z.infer<typeof loginBodySchema>;
export type SignupBody = z.infer<typeof signupBodySchema>;

export function parseLoginBody(body: unknown) {
  return loginBodySchema.safeParse(body);
}

export function parseSignupBody(body: unknown) {
  return signupBodySchema.safeParse(body);
}

/** Resolved display name for profile metadata (displayName or username). */
export function resolveDisplayName(data: SignupBody): string {
  return data.displayName?.trim() || data.username;
}
