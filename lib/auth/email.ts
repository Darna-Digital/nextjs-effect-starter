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
