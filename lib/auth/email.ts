/**
 * Outgoing-email seam. This dev implementation just logs the message (and any
 * action link) to the server console — swap the body for a real transport
 * (Resend, SMTP, …) without touching the call sites in {@link ../auth/auth}.
 */
export type SendEmailInput = {
  to: string;
  subject: string;
  text: string;
};

export const sendEmail = ({ to, subject, text }: SendEmailInput): void => {
  console.log(
    [
      "",
      "──────────────────────────── 📧 email (dev) ────────────────────────────",
      `to:      ${to}`,
      `subject: ${subject}`,
      "",
      text,
      "─────────────────────────────────────────────────────────────────────────",
      "",
    ].join("\n"),
  );
};
