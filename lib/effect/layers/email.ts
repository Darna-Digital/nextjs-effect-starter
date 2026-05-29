import { Context, Effect, Layer } from "effect";
import { sendEmail, type SendEmailInput } from "@/lib/auth/email";

/**
 * The single, app-wide service for sending transactional email — inject it
 * anywhere and call `send({ to, subject, text })`. Keeping delivery behind one
 * service (rather than calling a provider inline) means domain code depends on
 * an interface, not a concrete mailer, so it stays unit-testable.
 *
 * Implementations: {@link EmailConsole} (the dev mock, below) — swap in a real
 * provider layer later without touching callers.
 */
export interface EmailApi {
  readonly send: (input: SendEmailInput) => Effect.Effect<void>;
}

export class Email extends Context.Service<Email, EmailApi>()("Email") {}

/** Console-logging mock for now: prints the email instead of delivering it. */
export const EmailConsole = Layer.succeed(Email, {
  send: (input) => Effect.sync(() => sendEmail(input)),
});
